import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

async function runPromptWithGemini(prompt: string): Promise<string> {
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
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "Completed (empty response)";
}

async function generateProject(prompt: string): Promise<any> {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");
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
    required: ["project_name", "description", "stack", "files", "env_vars"],
  };
  const sys = `You are an expert engineer. Generate a complete runnable project (5-15 files) for the user's request. Include README, package manifest, .gitignore, and .env.example. Each file complete, no placeholders. Respond ONLY with JSON matching the schema.`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: sys }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", responseSchema: SCHEMA, temperature: 0.4 },
    }),
  });
  if (!r.ok) throw new Error(`Gemini ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const data = await r.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response");
  return JSON.parse(text);
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
      .select("id, title, prompt, kind, repo_full_name, user_id")
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
        let resultMsg = "Completed";
        let projectId: string | null = null;

        if (t.kind === "generate" && promptText) {
          const proj = await generateProject(promptText);
          const ins = await supabase.from("generated_projects").insert({
            user_id: t.user_id,
            name: proj.project_name || t.title,
            description: proj.description,
            prompt: promptText,
            stack: proj.stack,
            files: proj.files || [],
            env_vars: proj.env_vars || [],
            database_schema: proj.database_schema || null,
            repo_full_name: t.repo_full_name,
            task_id: t.id,
          }).select("id").single();
          if (ins.error) throw ins.error;
          projectId = ins.data.id;
          resultMsg = `Generated ${proj.files?.length || 0} files (${proj.project_name}).`;
        } else if (promptText) {
          resultMsg = await runPromptWithGemini(promptText);
        }

        const truncated = resultMsg.length > 4000 ? resultMsg.slice(0, 4000) + "…" : resultMsg;
        await supabase.from("tasks").update({
          status: "completed",
          completed_at: new Date().toISOString(),
          result: truncated,
          project_id: projectId,
        }).eq("id", t.id);
        results.push({ id: t.id, ok: true, project_id: projectId });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        await supabase.from("tasks").update({
          status: "failed",
          completed_at: new Date().toISOString(),
          result: `Error: ${msg}`,
        }).eq("id", t.id);
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
