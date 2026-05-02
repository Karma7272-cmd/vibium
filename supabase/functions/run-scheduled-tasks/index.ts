import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const nowIso = new Date().toISOString();

    // Pick due tasks
    const { data: due, error } = await supabase
      .from("tasks")
      .select("id, title, prompt")
      .in("status", ["pending", "scheduled"])
      .lte("scheduled_at", nowIso)
      .not("scheduled_at", "is", null)
      .limit(25);

    if (error) throw error;

    let processed = 0;
    for (const t of due ?? []) {
      // Mark running
      await supabase.from("tasks").update({ status: "running" }).eq("id", t.id);

      // Simulate work — in a real setup this could call an AI model with t.prompt
      await supabase
        .from("tasks")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          result: `Auto-completed at ${new Date().toISOString()}`,
        })
        .eq("id", t.id);

      processed++;
    }

    return new Response(JSON.stringify({ processed, checked_at: nowIso }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("run-scheduled-tasks error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
