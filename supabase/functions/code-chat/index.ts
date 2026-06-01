import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Provider = "gemini" | "openai" | "anthropic";

async function getUserKey(supabase: any, userId: string, connectorId: string): Promise<string | null> {
  const { data } = await supabase
    .from("connector_credentials")
    .select("api_key")
    .eq("user_id", userId)
    .eq("connector_id", connectorId)
    .maybeSingle();
  return data?.api_key ?? null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, files, scope, connectors, provider: requestedProvider, model: requestedModel } = await req.json();
    const provider: Provider = (requestedProvider === "openai" || requestedProvider === "anthropic") ? requestedProvider : "gemini";

    // Resolve user (optional - we still allow fallback to platform key)
    const auth = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    let userId: string | null = null;
    if (auth) {
      const { data } = await supabase.auth.getUser(auth.replace("Bearer ", ""));
      userId = data?.user?.id ?? null;
    }

    // Resolve API key based on provider: prefer user's stored connector key, fall back to platform GEMINI_API_KEY
    let apiKey: string | null = null;
    if (userId) apiKey = await getUserKey(supabase, userId, provider);
    if (!apiKey && provider === "gemini") apiKey = Deno.env.get("GEMINI_API_KEY") ?? null;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: `No ${provider} API key found. Connect ${provider} in /connectors.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const effectiveScope: "project" | "file" = scope === "file" ? "file" : "project";

    let filesContext = "";
    if (files?.length) {
      const label = effectiveScope === "file"
        ? `Selected File (single-file scope)`
        : `Project Files (${files.length} total)`;
      filesContext = `\n\n${label}:\n\n`;
      for (const f of files) {
        filesContext += `--- ${f.name} ---\n\`\`\`${f.language || ""}\n${f.content}\n\`\`\`\n\n`;
      }
    }

    const scopeRule = effectiveScope === "file"
      ? `SCOPE: SINGLE FILE. You MUST only modify the one file shown above. Do NOT propose changes to any other file. Always reference it as "File: <its exact path>".`
      : `SCOPE: WHOLE PROJECT. You may edit/create across multiple files. For each changed file, output a separate code block prefixed with "File: <path>".`;

    const connectorContext = (connectors && connectors.length)
      ? `\n\nUser has authorized these connectors with stored API keys: ${connectors.join(", ")}. When relevant, generate integration code that reads keys from environment variables (e.g. process.env.OPENAI_API_KEY) and uses these services.`
      : "";

    const systemPrompt = `You are an expert code assistant.
${scopeRule}${connectorContext}
${filesContext || "No files provided yet."}

Guidelines:
- When suggesting code changes, specify the file name like: "File: filename.ts"
- Return COMPLETE fixed code in fenced code blocks
- Be concise but thorough`;

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // === Provider routing ===
    if (provider === "gemini") {
      const model = requestedModel || "gemini-2.5-flash";
      const contents = (messages || []).map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
      const upstream = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
        }),
      });
      if (!upstream.ok || !upstream.body) {
        const t = await upstream.text().catch(() => "");
        return new Response(JSON.stringify({ error: `Gemini API error ${upstream.status}: ${t.slice(0, 300)}` }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const reader = upstream.body.getReader();
      const stream = new ReadableStream({
        async start(controller) {
          let buf = "";
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buf += decoder.decode(value, { stream: true });
              let idx: number;
              while ((idx = buf.indexOf("\n")) !== -1) {
                const line = buf.slice(0, idx).trim();
                buf = buf.slice(idx + 1);
                if (!line.startsWith("data:")) continue;
                const json = line.slice(5).trim();
                if (!json) continue;
                try {
                  const parsed = JSON.parse(json);
                  const text = parsed.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") || "";
                  if (text) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`));
                } catch { /* partial */ }
              }
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          } finally { controller.close(); }
        },
      });
      return new Response(stream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
    }

    if (provider === "openai") {
      const model = requestedModel || "gpt-4o-mini";
      const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          stream: true,
          messages: [{ role: "system", content: systemPrompt }, ...(messages || [])],
        }),
      });
      if (!upstream.ok || !upstream.body) {
        const t = await upstream.text().catch(() => "");
        return new Response(JSON.stringify({ error: `OpenAI API error ${upstream.status}: ${t.slice(0, 300)}` }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Already OpenAI SSE; pass through
      return new Response(upstream.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
    }

    if (provider === "anthropic") {
      const model = requestedModel || "claude-3-5-sonnet-20241022";
      const anthMessages = (messages || []).map((m: any) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      }));
      const upstream = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          system: systemPrompt,
          stream: true,
          messages: anthMessages,
        }),
      });
      if (!upstream.ok || !upstream.body) {
        const t = await upstream.text().catch(() => "");
        return new Response(JSON.stringify({ error: `Anthropic API error ${upstream.status}: ${t.slice(0, 300)}` }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const reader = upstream.body.getReader();
      const stream = new ReadableStream({
        async start(controller) {
          let buf = "";
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buf += decoder.decode(value, { stream: true });
              let idx: number;
              while ((idx = buf.indexOf("\n")) !== -1) {
                const line = buf.slice(0, idx).trim();
                buf = buf.slice(idx + 1);
                if (!line.startsWith("data:")) continue;
                const json = line.slice(5).trim();
                if (!json || json === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(json);
                  if (parsed.type === "content_block_delta") {
                    const text = parsed.delta?.text || "";
                    if (text) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`));
                  }
                } catch { /* partial */ }
              }
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          } finally { controller.close(); }
        },
      });
      return new Response(stream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
    }

    return new Response(JSON.stringify({ error: "Unsupported provider" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("code-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
