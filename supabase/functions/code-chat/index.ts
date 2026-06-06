import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Per-connector integration recipes the AI can follow when authorized
const CONNECTOR_RECIPES: Record<string, { env: string; hint: string }> = {
  openai: {
    env: "OPENAI_API_KEY",
    hint: "Use `fetch('https://api.openai.com/v1/chat/completions', { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } })` or the official `openai` npm SDK.",
  },
  anthropic: {
    env: "ANTHROPIC_API_KEY",
    hint: "Call https://api.anthropic.com/v1/messages with header `x-api-key: ${process.env.ANTHROPIC_API_KEY}` and `anthropic-version: 2023-06-01`.",
  },
  gemini: {
    env: "GEMINI_API_KEY",
    hint: "Call https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}.",
  },
  stripe: {
    env: "STRIPE_SECRET_KEY",
    hint: "Use the `stripe` npm SDK: `new Stripe(process.env.STRIPE_SECRET_KEY)`. Never expose this on the client.",
  },
  resend: {
    env: "RESEND_API_KEY",
    hint: "POST to https://api.resend.com/emails with header `Authorization: Bearer ${process.env.RESEND_API_KEY}`.",
  },
  github: {
    env: "GITHUB_TOKEN",
    hint: "Call https://api.github.com with header `Authorization: Bearer ${process.env.GITHUB_TOKEN}`.",
  },
  firecrawl: {
    env: "FIRECRAWL_API_KEY",
    hint: "POST to https://api.firecrawl.dev/v1/scrape with header `Authorization: Bearer ${process.env.FIRECRAWL_API_KEY}`.",
  },
  supabase: {
    env: "SUPABASE_SERVICE_ROLE_KEY",
    hint: "Use `createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)` on the server only.",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, files, scope, connectors, aiProvider } = await req.json();
    const effectiveScope: 'project' | 'file' = scope === 'file' ? 'file' : 'project';

    // Fetch authorized connector credentials for the calling user
    let authorizedConnectors: Array<{ id: string; envVar: string; hint: string; hasConfig: boolean }> = [];
    let userProviderKey: string | null = null;
    const authHeader = req.headers.get("Authorization");

    const supabaseClient = authHeader
      ? createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!,
          { global: { headers: { Authorization: authHeader } } },
        )
      : null;

    if (supabaseClient && Array.isArray(connectors) && connectors.length) {
      try {
        const { data: creds } = await supabaseClient
          .from("connector_credentials")
          .select("connector_id, status, config")
          .in("connector_id", connectors)
          .eq("status", "connected");

        authorizedConnectors = (creds || []).map((c: any) => {
          const recipe = CONNECTOR_RECIPES[c.connector_id] || {
            env: `${c.connector_id.toUpperCase()}_API_KEY`,
            hint: `Read the API key from process.env.${c.connector_id.toUpperCase()}_API_KEY and call the ${c.connector_id} REST API.`,
          };
          return {
            id: c.connector_id,
            envVar: recipe.env,
            hint: recipe.hint,
            hasConfig: c.config && Object.keys(c.config).length > 0,
          };
        });
      } catch (e) {
        console.error("Failed to load connector credentials:", e);
      }
    }

    // If the user picked a model provider with their own key, fetch it
    if (supabaseClient && (aiProvider === 'openai' || aiProvider === 'anthropic' || aiProvider === 'gemini')) {
      const { data: cred } = await supabaseClient
        .from("connector_credentials")
        .select("api_key")
        .eq("connector_id", aiProvider)
        .maybeSingle();
      if (cred?.api_key) userProviderKey = cred.api_key;
    }

    let filesContext = "";
    if (files?.length) {
      const label = effectiveScope === 'file'
        ? `Selected File (single-file scope)`
        : `Project Files (${files.length} total)`;
      filesContext = `\n\n${label}:\n\n`;
      for (const f of files) {
        filesContext += `--- ${f.name} ---\n\`\`\`${f.language || ""}\n${f.content}\n\`\`\`\n\n`;
      }
    }

    const scopeRule = effectiveScope === 'file'
      ? `SCOPE: SINGLE FILE. You MUST only modify the one file shown above. Do NOT propose changes to any other file. Always reference it as "File: <its exact path>".`
      : `SCOPE: WHOLE PROJECT. You may edit/create across multiple files. For each changed file, output a separate code block prefixed with "File: <path>".`;

    let connectorContext = "";
    if (authorizedConnectors.length) {
      connectorContext = `\n\nAUTHORIZED CONNECTORS (the user has stored credentials for these — you MAY write, edit, and fix code that uses them):\n` +
        authorizedConnectors.map(c =>
          `- ${c.id}: read the key from \`process.env.${c.envVar}\` (server-side only). ${c.hint}`
        ).join("\n") +
        `\n\nWhen the user asks you to add/edit/fix integration code for any of these services, generate working code that imports the SDK or calls the REST API using the env var above. Never hardcode keys. Add a short comment noting which connector is used.`;
    }

    const systemPrompt = `You are an expert code assistant that writes, edits, and fixes code.
${scopeRule}${connectorContext}
${filesContext || "No files provided yet."}

Guidelines:
- When suggesting code changes, specify the file name like: "File: filename.ts"
- Return COMPLETE fixed code in fenced code blocks
- Be concise but thorough`;

    const contents = (messages || []).map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;
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
      console.error("Gemini stream error:", upstream.status, t);
      if (upstream.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: `Gemini API error: ${upstream.status}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
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
                const text = parsed.candidates?.[0]?.content?.parts
                  ?.map((p: any) => p.text || "").join("") || "";
                if (text) {
                  const chunk = { choices: [{ delta: { content: text } }] };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                }
              } catch { /* ignore partial */ }
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (e) {
          console.error("stream relay error:", e);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("code-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
