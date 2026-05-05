import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function runPromptWithGemini(prompt: string): Promise<string> {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  if (!GEMINI_API_KEY) return "Skipped: GEMINI_API_KEY not configured";

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.5 },
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Gemini ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return text || "Completed (empty response)";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const nowIso = new Date().toISOString();

    const { data: due, error } = await supabase
      .from("tasks")
      .select("id, title, prompt")
      .in("status", ["pending", "scheduled"])
      .lte("scheduled_at", nowIso)
      .not("scheduled_at", "is", null)
      .limit(10);

    if (error) throw error;

    const results: any[] = [];
    for (const t of due ?? []) {
      await supabase.from("tasks").update({ status: "running" }).eq("id", t.id);
      try {
        const promptText = (t.prompt || t.title || "").trim();
        let result: string;
        if (!promptText) {
          result = "Completed (no prompt provided)";
        } else {
          result = await runPromptWithGemini(promptText);
        }
        const truncated = result.length > 4000 ? result.slice(0, 4000) + "…" : result;
        await supabase
          .from("tasks")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            result: truncated,
          })
          .eq("id", t.id);
        results.push({ id: t.id, ok: true });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        await supabase
          .from("tasks")
          .update({
            status: "failed",
            completed_at: new Date().toISOString(),
            result: `Error: ${msg}`,
          })
          .eq("id", t.id);
        results.push({ id: t.id, ok: false, error: msg });
      }
    }

    return new Response(
      JSON.stringify({ processed: results.length, results, checked_at: nowIso }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("run-scheduled-tasks error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
