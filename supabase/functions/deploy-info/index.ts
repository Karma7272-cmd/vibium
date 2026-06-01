import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// action: "sites" | "deploys" | "logs"
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) throw new Error("Unauthorized");
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: u } = await supabase.auth.getUser(auth.replace("Bearer ", ""));
    if (!u?.user) throw new Error("Unauthorized");

    const { provider, action, site_id, deploy_id } = await req.json();
    if (!["netlify", "vercel"].includes(provider)) throw new Error("Invalid provider");

    const { data: cred } = await supabase
      .from("connector_credentials")
      .select("api_key")
      .eq("user_id", u.user.id)
      .eq("connector_id", provider)
      .maybeSingle();
    if (!cred?.api_key) throw new Error(`Connect ${provider} first in /connectors.`);

    const headers = { Authorization: `Bearer ${cred.api_key}`, "Content-Type": "application/json" };
    let url = "";

    if (provider === "netlify") {
      if (action === "sites") url = "https://api.netlify.com/api/v1/sites?per_page=20";
      else if (action === "deploys" && site_id) url = `https://api.netlify.com/api/v1/sites/${site_id}/deploys?per_page=10`;
      else if (action === "logs" && deploy_id) url = `https://api.netlify.com/api/v1/deploys/${deploy_id}`;
      else throw new Error("Invalid action");
    } else {
      if (action === "sites") url = "https://api.vercel.com/v9/projects?limit=20";
      else if (action === "deploys") url = `https://api.vercel.com/v6/deployments?limit=10${site_id ? `&projectId=${site_id}` : ""}`;
      else if (action === "logs" && deploy_id) url = `https://api.vercel.com/v3/deployments/${deploy_id}/events`;
      else throw new Error("Invalid action");
    }

    const r = await fetch(url, { headers });
    const text = await r.text();
    let body: any; try { body = JSON.parse(text); } catch { body = { raw: text }; }
    return new Response(JSON.stringify({ ok: r.ok, status: r.status, data: body }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e instanceof Error ? e.message : e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
