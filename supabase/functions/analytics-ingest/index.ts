import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const tracking_id = String(body.tracking_id || "").slice(0, 100);
    if (!tracking_id) return new Response(JSON.stringify({ error: "tracking_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: site } = await supabase.from("analytics_sites").select("id").eq("tracking_id", tracking_id).maybeSingle();
    if (!site) return new Response(JSON.stringify({ error: "Unknown tracking_id" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    await supabase.from("analytics_events").insert({
      site_id: site.id,
      tracking_id,
      event_type: String(body.event_type || "pageview").slice(0, 50),
      path: body.path ? String(body.path).slice(0, 500) : null,
      referrer: body.referrer ? String(body.referrer).slice(0, 500) : null,
      user_agent: req.headers.get("user-agent")?.slice(0, 500) || null,
      country: req.headers.get("x-country") || null,
      screen: body.screen ? String(body.screen).slice(0, 50) : null,
      session_id: body.session_id ? String(body.session_id).slice(0, 100) : null,
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
