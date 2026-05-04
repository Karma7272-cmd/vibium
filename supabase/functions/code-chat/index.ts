import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, files, scope } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const effectiveScope: 'project' | 'file' = scope === 'file' ? 'file' : 'project';

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

    const systemPrompt = `You are an expert code assistant.
${scopeRule}
${filesContext || "No files provided yet."}

Guidelines:
- When suggesting code changes, specify the file name like: "File: filename.ts"
- Return COMPLETE fixed code in fenced code blocks
- Be concise but thorough`;

    // Convert OpenAI-style messages to Gemini contents
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

    // Re-emit as OpenAI-style SSE so the existing frontend parser keeps working
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
