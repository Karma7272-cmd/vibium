import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestSpec {
  url: string;
  authHeader?: (key: string) => Record<string, string>;
}

const TESTS: Record<string, TestSpec> = {
  openai: { url: "https://api.openai.com/v1/models", authHeader: (k) => ({ Authorization: `Bearer ${k}` }) },
  anthropic: { url: "https://api.anthropic.com/v1/models", authHeader: (k) => ({ "x-api-key": k, "anthropic-version": "2023-06-01" }) },
  xai: { url: "https://api.x.ai/v1/models", authHeader: (k) => ({ Authorization: `Bearer ${k}` }) },
  mistral: { url: "https://api.mistral.ai/v1/models", authHeader: (k) => ({ Authorization: `Bearer ${k}` }) },
  gemini: { url: "https://generativelanguage.googleapis.com/v1beta/models", authHeader: () => ({}) },
  firecrawl: { url: "https://api.firecrawl.dev/v2/team/credit-usage", authHeader: (k) => ({ Authorization: `Bearer ${k}` }) },
  resend: { url: "https://api.resend.com/domains", authHeader: (k) => ({ Authorization: `Bearer ${k}` }) },
  github: { url: "https://api.github.com/user", authHeader: (k) => ({ Authorization: `Bearer ${k}`, Accept: "application/vnd.github.v3+json" }) },
  stripe: { url: "https://api.stripe.com/v1/balance", authHeader: (k) => ({ Authorization: `Bearer ${k}` }) },
  notion: { url: "https://api.notion.com/v1/users/me", authHeader: (k) => ({ Authorization: `Bearer ${k}`, "Notion-Version": "2022-06-28" }) },
  slack: { url: "https://slack.com/api/auth.test", authHeader: (k) => ({ Authorization: `Bearer ${k}` }) },
  elevenlabs: { url: "https://api.elevenlabs.io/v1/user", authHeader: (k) => ({ "xi-api-key": k }) },
  netlify: { url: "https://api.netlify.com/api/v1/user", authHeader: (k) => ({ Authorization: `Bearer ${k}` }) },
  vercel: { url: "https://api.vercel.com/v2/user", authHeader: (k) => ({ Authorization: `Bearer ${k}` }) },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: u } = await supabase.auth.getUser(auth.replace("Bearer ", ""));
    if (!u?.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { connector_id, api_key } = await req.json();
    if (!connector_id || !api_key) return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const spec = TESTS[connector_id];
    let ok = true; let msg = "Stored. No live test available for this connector.";
    if (spec) {
      try {
        let url = spec.url;
        if (connector_id === "gemini") url += `?key=${api_key}`;
        const r = await fetch(url, { headers: spec.authHeader ? spec.authHeader(api_key) : {} });
        ok = r.ok;
        msg = ok ? `Connection verified (HTTP ${r.status}).` : `Test failed: HTTP ${r.status}`;
      } catch (e) { ok = false; msg = `Test error: ${String(e).slice(0, 200)}`; }
    }

    await supabase.from("connector_credentials").upsert({
      user_id: u.user.id, connector_id, api_key,
      status: ok ? "connected" : "error",
      last_tested_at: new Date().toISOString(),
    }, { onConflict: "user_id,connector_id" });

    return new Response(JSON.stringify({ ok, message: msg }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
