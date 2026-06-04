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

async function runSecurityScan(url: string) {
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  const findings: any[] = [];
  let headersObj: Record<string, string> = {};
  try {
    const res = await fetch(url, { method: "GET", redirect: "follow" });
    res.headers.forEach((v, k) => (headersObj[k.toLowerCase()] = v));
    const required = [
      { key: "strict-transport-security", title: "Missing HSTS", severity: "high" },
      { key: "content-security-policy", title: "Missing CSP", severity: "high" },
      { key: "x-frame-options", title: "Missing X-Frame-Options", severity: "medium" },
      { key: "x-content-type-options", title: "Missing X-Content-Type-Options", severity: "medium" },
      { key: "referrer-policy", title: "Missing Referrer-Policy", severity: "low" },
    ];
    for (const r of required) {
      if (!headersObj[r.key]) findings.push({ severity: r.severity, title: r.title, description: `Missing ${r.key}` });
    }
    if (!url.startsWith("https://")) findings.push({ severity: "critical", title: "Not HTTPS", description: "Site not served over HTTPS" });
  } catch (e) {
    findings.push({ severity: "critical", title: "Cannot reach site", description: String(e) });
  }
  let score = 100;
  for (const f of findings) score -= f.severity === "critical" ? 25 : f.severity === "high" ? 12 : f.severity === "medium" ? 6 : 3;
  score = Math.max(0, score);
  const grade = score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F";
  return { url, score, grade, findings, headers: headersObj, summary: `Auto-scan: ${findings.length} findings. Grade ${grade} (${score}/100).` };
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
      .select("id, title, prompt, kind, repo_full_name, user_id, recurrence, target_url, scheduled_at")
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
        } else if (t.kind === "security_scan" && t.target_url) {
          const scan = await runSecurityScan(t.target_url);
          await supabase.from("security_scans").insert({
            user_id: t.user_id,
            url: scan.url,
            score: scan.score,
            grade: scan.grade,
            summary: scan.summary,
            headers: scan.headers,
            ssl: { https: scan.url.startsWith("https://") },
            findings: scan.findings,
            status: "complete",
          });
          resultMsg = scan.summary;
        } else if (promptText) {
          resultMsg = await runPromptWithGemini(promptText);
        }

        const truncated = resultMsg.length > 4000 ? resultMsg.slice(0, 4000) + "…" : resultMsg;

        // Recurrence: reschedule next day; otherwise mark completed.
        if (t.recurrence === "daily") {
          const next = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
          await supabase.from("tasks").update({
            status: "scheduled",
            scheduled_at: next,
            completed_at: new Date().toISOString(),
            result: truncated,
            project_id: projectId,
          }).eq("id", t.id);
        } else {
          await supabase.from("tasks").update({
            status: "completed",
            completed_at: new Date().toISOString(),
            result: truncated,
            project_id: projectId,
          }).eq("id", t.id);
        }
        results.push({ id: t.id, ok: true, project_id: projectId });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        const next = t.recurrence === "daily"
          ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          : null;
        await supabase.from("tasks").update({
          status: next ? "scheduled" : "failed",
          scheduled_at: next ?? t.scheduled_at,
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
