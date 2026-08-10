import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SCHEMA = {
  type: "object",
  properties: {
    project_name: { type: "string" },
    description: { type: "string" },
    stack: { type: "string" },
    files: {
      type: "array",
      items: {
        type: "object",
        properties: { path: { type: "string" }, content: { type: "string" } },
        required: ["path", "content"],
      },
    },
    database_schema: {
      type: "object",
      properties: {
        tables: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              columns: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    type: { type: "string" },
                    constraints: { type: "string" },
                  },
                  required: ["name", "type"],
                },
              },
            },
            required: ["name", "columns"],
          },
        },
      },
      required: ["tables"],
    },
    sql_migration: { type: "string" },
    env_vars: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          example: { type: "string" },
          required: { type: "boolean" },
        },
        required: ["name", "description", "required"],
      },
    },
  },
  required: ["project_name", "description", "stack", "files", "database_schema", "sql_migration", "env_vars"],
};

const MAX_RETRIES = 2;
const RETRY_DELAYS = [2000, 4000];

async function callGemini(prompt: string, apiKey: string): Promise<Record<string, unknown>> {
  const systemPrompt = `You are a principal full-stack engineer and senior product designer. Given a user request, generate a COMPLETE, production-grade, working project scaffold — never toy demos or "hello world" placeholders.

QUALITY BAR (non-negotiable):
- The result must look like a real, modern, launched product: complete pages, real copy, realistic sample content, empty/loading/error states, and responsive layouts.
- NEVER output placeholders like "TODO", "add content here", or stubs. Every file is complete and runnable.
- Depth over brevity: build full screens/sections (landing, hero, features, dashboard, forms, settings, etc.).

DESIGN & ARCHITECTURE SYSTEM:
- Infer the most appropriate stack (TypeScript, React, Node.js, Express, Vite, Tailwind, etc.) from the user's prompt.
- Produce both frontend AND backend when applicable, with real routes/handlers, validation, and error handling.
- ALWAYS include a complete, valid package.json with exact scripts ("dev" or "start"), dependencies, and devDependencies.
- For React/Vite/TypeScript web applications:
  * ALWAYS include root index.html referencing the main entry file (e.g. /src/main.tsx).
  * ALWAYS include vite.config.ts configured with @vitejs/plugin-react.
  * ALWAYS include src/main.tsx, src/App.tsx, index.css, and necessary UI components with clean Tailwind/CSS design.
- For Node.js / Express / TypeScript backend web applications:
  * Include a working server (e.g. src/server.ts or index.js) that starts an HTTP server listening on process.env.PORT || 3000 with CORS enabled.
  * Include "tsx" or "ts-node" in devDependencies and set "dev": "tsx watch src/server.ts" or "start": "node index.js" in package.json.
- Include README.md (setup + run instructions), config files, and .gitignore.
- Aim for 10-25 files for a real application.
- If persistence is needed, design a normalized relational schema, emit database_schema and include a SQL migration file with indexes and constraints.

DATABASE / SQL (required for every full-stack app that stores data):
- Emit "sql_migration": a single complete, runnable Postgres script that works both on Supabase and on any plain Postgres (custom connection string). It MUST contain, in this order:
  1. "create extension if not exists pgcrypto;"
  2. "create table if not exists public.<name> (...)" for every table, with uuid primary keys defaulting to gen_random_uuid(), sensible NOT NULL/defaults, foreign keys, created_at/updated_at timestamptz.
  3. indexes on every foreign key and frequently filtered column.
  4. GRANT statements for each table: "grant select, insert, update, delete on public.<t> to authenticated;" and "grant all on public.<t> to service_role;" (add anon select only for public data).
  5. "alter table public.<t> enable row level security;" plus explicit owner-scoped policies using auth.uid() when the app has users; wrap Supabase-only statements so plain Postgres users can skip them and say so in a SQL comment.
  6. an updated_at trigger function + triggers.
- Also include this exact SQL as a project file at "supabase/migrations/0001_init.sql".
- Include the client wiring for BOTH connection options:
  * Supabase: a client module (e.g. src/lib/supabase.ts) using @supabase/supabase-js with VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (or SUPABASE_URL / SUPABASE_ANON_KEY server-side), and add @supabase/supabase-js to dependencies.
  * Custom Postgres: a db module (e.g. src/lib/db.ts) using "pg" Pool with DATABASE_URL, and add pg to dependencies.
  * README.md must document how to run the SQL: paste into the Supabase SQL editor, or "psql \\$DATABASE_URL -f supabase/migrations/0001_init.sql".
- env_vars must include VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY and DATABASE_URL when a database is used.
- Always emit env_vars listing every env var used and include a .env.example file.
- If no DB is needed, return database_schema as { "tables": [] } and sql_migration as "".
- Respond ONLY with a single JSON object matching the required schema. No prose, no markdown fences.`;


  // Stream from the model so the connection stays alive on long generations,
  // then assemble the full JSON server-side.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`;

  let lastError: string = "Unknown error";

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt - 1]));
      console.log(`Retry attempt ${attempt}/${MAX_RETRIES}`);
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{
            role: "user",
            parts: [{
              text: `${prompt}

Build this as a complete, polished, production-ready product with a distinctive modern design system, multiple fully written pages/sections, real content, and responsive mobile-first layouts. No placeholders, no minimal demo.`,
            }],
          }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: SCHEMA,
            temperature: 0.7,
            topP: 0.95,
            maxOutputTokens: 32768,
          },

        }),
      });

      if (!response.ok || !response.body) {
        const t = await response.text().catch(() => "");
        console.error("Gemini error:", response.status, t);

        if (response.status === 429) {
          lastError = "Rate limit exceeded. Please wait a moment and try again.";
          continue;
        }
        if (response.status === 503 || response.status === 500) {
          lastError = "AI service temporarily unavailable. Retrying…";
          continue;
        }
        lastError = `Gemini API error (${response.status})`;
        break;
      }

      // Consume the SSE stream and rebuild the full JSON payload.
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let text = "";
      let finishReason = "";
      let blockReason = "";

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
            const cand = parsed.candidates?.[0];
            if (cand?.content?.parts) {
              text += cand.content.parts.map((p: any) => p.text || "").join("");
            }
            if (cand?.finishReason) finishReason = cand.finishReason;
            if (parsed.promptFeedback?.blockReason) blockReason = parsed.promptFeedback.blockReason;
          } catch { /* partial chunk */ }
        }
      }

      if (blockReason || finishReason === "SAFETY") {
        lastError = `Request was blocked by safety filters${blockReason ? ` (${blockReason})` : ""}. Try rephrasing your prompt.`;
        break;
      }
      if (finishReason === "RECITATION") {
        lastError = "Response was blocked due to recitation policy. Try a different prompt.";
        break;
      }
      if (finishReason === "MAX_TOKENS") {
        console.error("Generation hit MAX_TOKENS; output truncated");
      }

      if (!text.trim()) {
        lastError = "Empty response from AI. Retrying…";
        continue;
      }

      try {
        return JSON.parse(text) as Record<string, unknown>;
      } catch {
        console.error("JSON parse failed, raw text tail:", text.slice(-500));
        lastError = finishReason === "MAX_TOKENS"
          ? "The project was too large to finish in one pass. Try a more focused prompt."
          : "AI returned malformed output. Retrying…";
        continue;
      }
    } catch (e) {
      console.error("Fetch error:", e);
      lastError = e instanceof Error ? e.message : "Network error contacting AI service";
      if (attempt < MAX_RETRIES) continue;
    }
  }

  throw new Error(lastError);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let prompt: string;
  try {
    ({ prompt } = await req.json());
  } catch {
    return new Response(JSON.stringify({ error: "invalid JSON body" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!prompt || typeof prompt !== "string") {
    return new Response(JSON.stringify({ error: "prompt required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not configured" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Generation can run for several minutes. The platform severs any request that
  // sends no bytes for 150s, so we stream harmless whitespace keepalives while the
  // model works and write the JSON payload last (leading whitespace is valid JSON).
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const keepalive = setInterval(() => {
        try { controller.enqueue(encoder.encode(" ")); } catch { /* closed */ }
      }, 10_000);

      let payload: string;
      try {
        const result = await callGemini(prompt, GEMINI_API_KEY);
        if (!result.files || !Array.isArray(result.files) || result.files.length === 0) {
          throw new Error("AI did not generate any files. Try a more specific prompt.");
        }
        payload = JSON.stringify(result);
      } catch (e) {
        console.error("generate-project error:", e);
        payload = JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" });
      } finally {
        clearInterval(keepalive);
      }

      controller.enqueue(encoder.encode("\n" + payload));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
