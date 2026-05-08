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
  const systemPrompt = `You are an expert full-stack engineer. Given a user request, generate a COMPLETE working project scaffold.

Rules:
- Infer the most appropriate language/framework from the user's prompt.
- Produce both frontend AND backend when applicable.
- Include README.md, package manifest, and .gitignore.
- Each file's content must be complete and runnable — no placeholders.
- Keep total files reasonable (5-20).
- If persistence is needed, design a relational schema, emit database_schema and include a SQL migration file.
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
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: SCHEMA,
            temperature: 0.4,
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
