import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Server-side runners. Each returns { ok, status, data|error }.
// Keys are looked up from connector_credentials; never returned to client.
type Runner = (key: string, input: any) => Promise<{ ok: boolean; status: number; data?: any; error?: string }>;

async function jsonFetch(url: string, init: RequestInit) {
  const r = await fetch(url, init);
  const text = await r.text();
  let data: any = text;
  try { data = JSON.parse(text); } catch { /* keep text */ }
  return { ok: r.ok, status: r.status, data: r.ok ? data : undefined, error: r.ok ? undefined : (typeof data === "string" ? data : data?.error?.message || data?.message || JSON.stringify(data)).slice(0, 500) };
}

const RUNNERS: Record<string, Record<string, Runner>> = {
  openai: {
    list_models: (k) => jsonFetch("https://api.openai.com/v1/models", { headers: { Authorization: `Bearer ${k}` } }),
    chat: (k, i) => jsonFetch("https://api.openai.com/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${k}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: i.model || "gpt-4o-mini", messages: [{ role: "user", content: i.prompt || "Say hi" }] }) }),
  },
  gemini: {
    list_models: (k) => jsonFetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${k}`, {}),
    generate: (k, i) => jsonFetch(`https://generativelanguage.googleapis.com/v1beta/models/${i.model || "gemini-2.5-flash"}:generateContent?key=${k}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: i.prompt || "Say hi" }] }] }) }),
  },
  anthropic: {
    list_models: (k) => jsonFetch("https://api.anthropic.com/v1/models", { headers: { "x-api-key": k, "anthropic-version": "2023-06-01" } }),
  },
  github: {
    me: (k) => jsonFetch("https://api.github.com/user", { headers: { Authorization: `Bearer ${k}`, Accept: "application/vnd.github+json" } }),
    list_repos: (k) => jsonFetch("https://api.github.com/user/repos?per_page=10&sort=updated", { headers: { Authorization: `Bearer ${k}`, Accept: "application/vnd.github+json" } }),
  },
  stripe: {
    balance: (k) => jsonFetch("https://api.stripe.com/v1/balance", { headers: { Authorization: `Bearer ${k}` } }),
    list_customers: (k) => jsonFetch("https://api.stripe.com/v1/customers?limit=5", { headers: { Authorization: `Bearer ${k}` } }),
  },
  resend: {
    list_domains: (k) => jsonFetch("https://api.resend.com/domains", { headers: { Authorization: `Bearer ${k}` } }),
    send_email: (k, i) => jsonFetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${k}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: i.from || "onboarding@resend.dev", to: i.to, subject: i.subject || "Vibium test", html: i.html || "<p>Hello from Vibium connector.</p>" }) }),
  },
  notion: {
    me: (k) => jsonFetch("https://api.notion.com/v1/users/me", { headers: { Authorization: `Bearer ${k}`, "Notion-Version": "2022-06-28" } }),
    search: (k, i) => jsonFetch("https://api.notion.com/v1/search", { method: "POST", headers: { Authorization: `Bearer ${k}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" }, body: JSON.stringify({ query: i.query || "" }) }),
  },
  slack: {
    auth_test: (k) => jsonFetch("https://slack.com/api/auth.test", { headers: { Authorization: `Bearer ${k}` } }),
    post_message: (k, i) => jsonFetch("https://slack.com/api/chat.postMessage", { method: "POST", headers: { Authorization: `Bearer ${k}`, "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify({ channel: i.channel, text: i.text || "Hello from Vibium" }) }),
  },
  firecrawl: {
    scrape: (k, i) => jsonFetch("https://api.firecrawl.dev/v2/scrape", { method: "POST", headers: { Authorization: `Bearer ${k}`, "Content-Type": "application/json" }, body: JSON.stringify({ url: i.url, formats: ["markdown"] }) }),
    credit: (k) => jsonFetch("https://api.firecrawl.dev/v2/team/credit-usage", { headers: { Authorization: `Bearer ${k}` } }),
  },
  elevenlabs: {
    voices: (k) => jsonFetch("https://api.elevenlabs.io/v1/voices", { headers: { "xi-api-key": k } }),
  },
  netlify: {
    sites: (k) => jsonFetch("https://api.netlify.com/api/v1/sites?per_page=10", { headers: { Authorization: `Bearer ${k}` } }),
  },
  vercel: {
    projects: (k) => jsonFetch("https://api.vercel.com/v9/projects?limit=10", { headers: { Authorization: `Bearer ${k}` } }),
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (b: any, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Unauthorized" }, 401);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: u } = await supabase.auth.getUser(auth.replace("Bearer ", ""));
    if (!u?.user) return json({ error: "Unauthorized" }, 401);

    const { connector_id, action, input } = await req.json();
    if (!connector_id || !action) return json({ error: "Missing connector_id or action" }, 400);

    const runners = RUNNERS[connector_id];
    if (!runners || !runners[action]) return json({ error: `Unsupported action ${connector_id}/${action}` }, 400);

    const { data: row } = await supabase.from("connector_credentials").select("api_key").eq("user_id", u.user.id).eq("connector_id", connector_id).maybeSingle();
    if (!row?.api_key) return json({ error: "Connector not connected" }, 400);

    const result = await runners[action](row.api_key, input || {});

    await supabase.from("connector_credentials").update({
      status: result.ok ? "connected" : "error",
      last_tested_at: new Date().toISOString(),
    }).eq("user_id", u.user.id).eq("connector_id", connector_id);

    return json(result, 200);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
