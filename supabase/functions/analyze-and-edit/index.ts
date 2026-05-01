import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, files } = await req.json();
    if (!prompt || !Array.isArray(files)) {
      return new Response(JSON.stringify({ error: "prompt and files[] required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build context but cap size
    let context = "";
    let totalChars = 0;
    const MAX_CHARS = 200_000;
    const sent: string[] = [];
    for (const f of files) {
      const block = `\n--- ${f.path || f.name} ---\n${f.content || ""}\n`;
      if (totalChars + block.length > MAX_CHARS) continue;
      context += block;
      totalChars += block.length;
      sent.push(f.path || f.name);
    }

    const systemPrompt = `You are an expert code editor. Given the user's request and an entire repository, decide which files to edit, create, or leave alone.

CRITICAL OUTPUT RULES:
- Only return files that you actually changed or newly created.
- For each changed file include the COMPLETE new content (not a diff, not a snippet).
- For each changed file also include the EXACT original "before" content so the UI can show a before/after diff. For brand-new files, "before" should be an empty string.
- Do NOT include unchanged files.
- Be precise; do not invent file paths.

Repository contents:
${context}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "emit_edits",
            description: "Emit the list of edited or created files.",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "string", description: "Brief summary of what was changed and why." },
                edits: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      path: { type: "string" },
                      action: { type: "string", enum: ["edit", "create"] },
                      before: { type: "string", description: "Exact original content; empty string for new files." },
                      after: { type: "string", description: "Full new file content." },
                      note: { type: "string", description: "One line describing the change." },
                    },
                    required: ["path", "action", "before", "after", "note"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["summary", "edits"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "emit_edits" } },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");
    const args = JSON.parse(toolCall.function.arguments);

    // Reconcile "before" using actual file contents to be safe
    const fileMap = new Map<string, string>();
    for (const f of files) fileMap.set(f.path || f.name, f.content || "");
    args.edits = (args.edits || []).map((e: any) => ({
      ...e,
      before: e.action === "create" ? "" : (fileMap.get(e.path) ?? e.before ?? ""),
    }));

    return new Response(JSON.stringify(args), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-and-edit error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
