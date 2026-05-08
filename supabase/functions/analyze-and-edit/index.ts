import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    edits: {
      type: "array",
      items: {
        type: "object",
        properties: {
          path: { type: "string" },
          action: { type: "string", enum: ["edit", "create"] },
          before: { type: "string" },
          after: { type: "string" },
          note: { type: "string" },
        },
        required: ["path", "action", "before", "after", "note"],
      },
    },
  },
  required: ["summary", "edits"],
};

const MAX_RETRIES = 2;
const RETRY_DELAYS = [2000, 4000];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, files } = await req.json();
    if (!prompt || !Array.isArray(files)) {
      return new Response(JSON.stringify({ error: "prompt and files[] required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    let context = "";
    let totalChars = 0;
    const MAX_CHARS = 200_000;
    for (const f of files) {
      const block = `\n--- ${f.path || f.name} ---\n${f.content || ""}\n`;
      if (totalChars + block.length > MAX_CHARS) continue;
      context += block;
      totalChars += block.length;
    }

    const systemPrompt = `You are an expert code editor. Given a user request and a repository, decide which files to edit, create, or leave alone.

Rules:
- Only return files you actually changed or newly created.
- For each changed file include the COMPLETE new content in "after".
- For each changed file include the EXACT original content in "before". Empty string for new files.
- Do NOT include unchanged files.
- Respond ONLY with a single JSON object matching the schema. No prose, no markdown fences.

Repository contents:
${context}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    let lastError = "Unknown error";

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
              temperature: 0.3,
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

        let args: Record<string, unknown>;
        try {
          args = JSON.parse(text);
        } catch {
          console.error("JSON parse failed, raw text:", text.slice(0, 500));
          lastError = "AI returned malformed output. Retrying…";
          continue;
        }

        const fileMap = new Map<string, string>();
        for (const f of files) fileMap.set(f.path || f.name, f.content || "");
        (args as any).edits = ((args as any).edits || []).map((e: any) => ({
          ...e,
          before: e.action === "create" ? "" : (fileMap.get(e.path) ?? e.before ?? ""),
        }));

        return new Response(JSON.stringify(args), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e) {
        console.error("Fetch error:", e);
        lastError = e instanceof Error ? e.message : "Network error contacting AI service";
        if (attempt < MAX_RETRIES) continue;
      }
    }

    throw new Error(lastError);
  } catch (e) {
    console.error("analyze-and-edit error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
