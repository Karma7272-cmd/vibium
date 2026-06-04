import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Unauthorized" }, 401);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: u } = await supabase.auth.getUser(auth.replace("Bearer ", ""));
    if (!u?.user) return json({ error: "Unauthorized" }, 401);

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return json({ error: "AI not configured" }, 500);

    const body = await req.json();
    const mode = body.mode as "generate" | "analyze";

    const call = async (system: string, user: string) => {
      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "system", content: system }, { role: "user", content: user }],
        }),
      });
      if (r.status === 429) throw new Error("Rate limit exceeded. Try again shortly.");
      if (r.status === 402) throw new Error("AI credits exhausted. Add credits to continue.");
      const j = await r.json();
      return j.choices?.[0]?.message?.content || "";
    };

    if (mode === "generate") {
      const { goal, repo, stack } = body;
      const out = await call(
        "You design CI/CD pipelines. Output ONLY pipeline steps, one per line, format `name: shell command`. 3-7 steps max. No prose, no fences, no numbering.",
        `Goal: ${goal}\nRepo: ${repo || "n/a"}\nStack: ${stack || "auto-detect"}\nProduce build/test/deploy steps that match.`,
      );
      const steps = out.split("\n").map((l: string) => l.trim()).filter((l: string) => l && l.includes(":"))
        .map((line: string) => {
          const i = line.indexOf(":");
          return { name: line.slice(0, i).trim().replace(/^[-*\d.\s]+/, ""), command: line.slice(i + 1).trim() };
        });
      return json({ steps });
    }

    if (mode === "analyze") {
      const { run_id } = body;
      const { data: run } = await supabase.from("pipeline_runs").select("*").eq("id", run_id).eq("user_id", u.user.id).maybeSingle();
      if (!run) return json({ error: "Run not found" }, 404);
      const analysis = await call(
        "You are a senior DevOps engineer. Analyze CI logs. Reply in short markdown: **Root cause**, **Fix** (concrete commands or code), **Prevention**. Max 180 words.",
        `Status: ${run.status}\nSteps: ${JSON.stringify(run.steps)}\n\nLogs:\n${(run.logs || "").slice(-4000)}`,
      );
      return json({ analysis });
    }

    return json({ error: "Unknown mode" }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
