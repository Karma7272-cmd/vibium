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

const MAX_FILES = 50;
const MAX_FILE_CONTENT = 100_000;
const MAX_TOTAL_CONTENT = 400_000;
const MAX_MESSAGES = 100;
const MAX_MESSAGE_LENGTH = 50_000;

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // ---- Authentication: require a valid signed-in user ----
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Unauthorized" }, 401);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !userData?.user) return jsonResponse({ error: "Unauthorized" }, 401);

    // ---- Input validation ----
    let payload: any;
    try {
      payload = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const { messages, files, scope, connectors, aiProvider } = payload ?? {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return jsonResponse({ error: "messages must be a non-empty array" }, 400);
    }
    if (messages.length > MAX_MESSAGES) {
      return jsonResponse({ error: `messages cannot exceed ${MAX_MESSAGES} entries` }, 400);
    }
    for (const m of messages) {
      if (!m || typeof m.content !== "string" || typeof m.role !== "string") {
        return jsonResponse({ error: "each message needs a string role and content" }, 400);
      }
      if (!["user", "assistant", "system"].includes(m.role)) {
        return jsonResponse({ error: "invalid message role" }, 400);
      }
      if (m.content.length > MAX_MESSAGE_LENGTH) {
        return jsonResponse({ error: "a message exceeds the maximum allowed length" }, 400);
      }
    }

    if (files !== undefined && !Array.isArray(files)) {
      return jsonResponse({ error: "files must be an array" }, 400);
    }
    if (Array.isArray(files)) {
      if (files.length > MAX_FILES) {
        return jsonResponse({ error: `files cannot exceed ${MAX_FILES} entries` }, 400);
      }
      let total = 0;
      for (const f of files) {
        if (!f || typeof f.name !== "string" || typeof f.content !== "string") {
          return jsonResponse({ error: "each file needs a string name and content" }, 400);
        }
        if (f.name.length > 300 || f.content.length > MAX_FILE_CONTENT) {
          return jsonResponse({ error: "a file exceeds the maximum allowed size" }, 400);
        }
        total += f.content.length;
      }
      if (total > MAX_TOTAL_CONTENT) {
        return jsonResponse({ error: "total file content exceeds the maximum allowed size" }, 400);
      }
    }

    if (connectors !== undefined && (!Array.isArray(connectors) || connectors.some((c: unknown) => typeof c !== "string"))) {
      return jsonResponse({ error: "connectors must be an array of strings" }, 400);
    }
    if (aiProvider !== undefined && typeof aiProvider !== "string") {
      return jsonResponse({ error: "aiProvider must be a string" }, 400);
    }

    const effectiveScope: 'project' | 'file' = scope === 'file' ? 'file' : 'project';

    // Fetch authorized connector credentials for the calling user
    let authorizedConnectors: Array<{ id: string; envVar: string; hint: string; hasConfig: boolean }> = [];
    let userProviderKey: string | null = null;


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

    const systemPrompt = `You are a principal engineer and senior product designer who writes, edits, and fixes production-grade code.
${scopeRule}${connectorContext}
${filesContext || "No files provided yet."}

Guidelines:
- When suggesting code changes, specify the file name like: "File: filename.ts"
- Return COMPLETE runnable code in fenced code blocks — never snippets with "..." or "rest unchanged"
- Never leave TODOs, placeholder copy, lorem ipsum, or stub functions
- For UI work: modern, polished, mobile-first responsive layouts; use design tokens (CSS variables / Tailwind theme) instead of hardcoded colors; include hover/focus states, transitions, accessible semantics, and real content
- Keep the existing file's stack, conventions, and design language; split large files into focused components
- Be concise in prose, thorough in code`;


    // ---- Resolve provider + key ----
    // If user picked a provider with their key, use that. Else default to built-in Gemini.
    const provider: 'openai' | 'anthropic' | 'gemini' =
      (aiProvider === 'openai' || aiProvider === 'anthropic' || aiProvider === 'gemini') && userProviderKey
        ? aiProvider
        : 'gemini';
    const apiKey = userProviderKey || Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "No AI key available. Connect a provider on the Connectors page." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let upstream: Response;
    let upstreamKind: 'gemini' | 'openai' | 'anthropic';

    if (provider === 'gemini') {
      upstreamKind = 'gemini';
      const contents = (messages || []).map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`;
      upstream = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
        }),
      });
    } else if (provider === 'openai') {
      upstreamKind = 'openai';
      const msgs = [
        { role: 'system', content: systemPrompt },
        ...(messages || []).map((m: any) => ({ role: m.role, content: m.content })),
      ];
      upstream = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: msgs,
          stream: true,
        }),
      });
    } else {
      // anthropic
      upstreamKind = 'anthropic';
      const msgs = (messages || []).map((m: any) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));
      upstream = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-latest',
          max_tokens: 4096,
          system: systemPrompt,
          messages: msgs,
          stream: true,
        }),
      });
    }

    if (!upstream.ok || !upstream.body) {
      const t = await upstream.text().catch(() => "");
      console.error(`${provider} stream error:`, upstream.status, t);
      if (upstream.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: `${provider} API error: ${upstream.status}` }), {
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
              if (!json || json === '[DONE]') continue;
              try {
                const parsed = JSON.parse(json);
                let text = "";
                if (upstreamKind === 'gemini') {
                  text = parsed.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") || "";
                } else if (upstreamKind === 'openai') {
                  text = parsed.choices?.[0]?.delta?.content || "";
                } else {
                  // anthropic SSE: content_block_delta with delta.text
                  if (parsed.type === 'content_block_delta') {
                    text = parsed.delta?.text || "";
                  }
                }
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
