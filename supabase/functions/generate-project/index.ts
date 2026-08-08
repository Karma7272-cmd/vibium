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
  required: ["project_name", "description", "stack", "files", "database_schema", "env_vars"],
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
- Always emit env_vars listing every env var used and include a .env.example file.
- If no DB needed, return database_schema as { "tables": [] }.
- Respond ONLY with a single JSON object matching the required schema. No prose, no markdown fences.`;


  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

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
            maxOutputTokens: 65536,
          },

        }),
      });

      if (!response.ok) {
        const t = await response.text();
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

      const data = await response.json();

      const candidate = data.candidates?.[0];
      if (!candidate) {
        const blockReason = data.promptFeedback?.blockReason;
        if (blockReason) {
          lastError = `Request was blocked by safety filters (${blockReason}). Try rephrasing your prompt.`;
          break;
        }
        lastError = "No response generated. Try rephrasing your prompt.";
        continue;
      }

      const finishReason = candidate.finishReason;
      if (finishReason === "SAFETY") {
        lastError = "Response was blocked by safety filters. Try rephrasing your prompt.";
        break;
      }
      if (finishReason === "RECITATION") {
        lastError = "Response was blocked due to recitation policy. Try a different prompt.";
        break;
      }

      const text = candidate.content?.parts?.[0]?.text;
      if (!text || text.trim().length === 0) {
        lastError = "Empty response from AI. Retrying…";
        continue;
      }

      try {
        return JSON.parse(text) as Record<string, unknown>;
      } catch {
        console.error("JSON parse failed, raw text:", text.slice(0, 500));
        lastError = "AI returned malformed output. Retrying…";
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

  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "prompt required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const result = await callGemini(prompt, GEMINI_API_KEY);

    if (!result.files || !Array.isArray(result.files) || result.files.length === 0) {
      throw new Error("AI did not generate any files. Try a more specific prompt.");
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-project error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
