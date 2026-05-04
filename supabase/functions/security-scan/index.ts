import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface Finding {
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  description: string;
}

function normalizeUrl(input: string): string {
  let u = input.trim();
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  return u;
}

async function checkHeaders(url: string) {
  const findings: Finding[] = [];
  let headersObj: Record<string, string> = {};
  let statusCode = 0;
  try {
    const res = await fetch(url, { method: "GET", redirect: "follow" });
    statusCode = res.status;
    res.headers.forEach((v, k) => (headersObj[k.toLowerCase()] = v));

    const required: { key: string; title: string; severity: Finding["severity"] }[] = [
      { key: "strict-transport-security", title: "Missing HSTS header", severity: "high" },
      { key: "content-security-policy", title: "Missing Content-Security-Policy", severity: "high" },
      { key: "x-frame-options", title: "Missing X-Frame-Options (clickjacking risk)", severity: "medium" },
      { key: "x-content-type-options", title: "Missing X-Content-Type-Options", severity: "medium" },
      { key: "referrer-policy", title: "Missing Referrer-Policy", severity: "low" },
      { key: "permissions-policy", title: "Missing Permissions-Policy", severity: "low" },
    ];
    for (const r of required) {
      if (!headersObj[r.key]) {
        findings.push({ severity: r.severity, title: r.title, description: `The response is missing the \`${r.key}\` header.` });
      }
    }
    if (headersObj["server"]) {
      findings.push({ severity: "info", title: "Server header exposed", description: `Server: ${headersObj["server"]}` });
    }
    if (headersObj["x-powered-by"]) {
      findings.push({ severity: "low", title: "X-Powered-By exposed", description: `Reveals tech stack: ${headersObj["x-powered-by"]}` });
    }
  } catch (e) {
    findings.push({ severity: "critical", title: "Cannot reach site", description: String(e) });
  }
  return { headers: headersObj, statusCode, findings };
}

function checkSSL(url: string) {
  const isHttps = url.startsWith("https://");
  const findings: Finding[] = [];
  if (!isHttps) {
    findings.push({ severity: "critical", title: "Site not served over HTTPS", description: "All traffic should be encrypted via HTTPS." });
  }
  return { ssl: { https: isHttps }, findings };
}

async function firecrawlScrape(url: string) {
  if (!FIRECRAWL_API_KEY) return null;
  try {
    const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: { "Authorization": `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, formats: ["markdown", "links"], onlyMainContent: false }),
    });
    if (!res.ok) return null;
    const j = await res.json();
    return j.data || j;
  } catch { return null; }
}

async function aiAnalyze(url: string, headers: Record<string,string>, findings: Finding[], scraped: any) {
  if (!GEMINI_API_KEY) return null;
  const prompt = `You are a website security auditor. Given the headers, findings, and content snippet, write a concise security analysis (max 250 words, markdown). Focus on actionable risks and 3-5 specific recommendations.

URL: ${url}
Headers: ${JSON.stringify(headers).slice(0, 1500)}
Existing findings: ${JSON.stringify(findings).slice(0, 1000)}
Page content (truncated): ${(scraped?.markdown || "").slice(0, 2000)}
Detected links count: ${scraped?.links?.length || 0}`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    if (!res.ok) return `AI analysis unavailable (${res.status})`;
    const j = await res.json();
    return j.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (e) { return `AI analysis error: ${e}`; }
}

function computeScore(findings: Finding[]): { score: number; grade: string } {
  let score = 100;
  for (const f of findings) {
    if (f.severity === "critical") score -= 25;
    else if (f.severity === "high") score -= 12;
    else if (f.severity === "medium") score -= 6;
    else if (f.severity === "low") score -= 3;
    else score -= 1;
  }
  score = Math.max(0, score);
  const grade = score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F";
  return { score, grade };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json();
    const url = normalizeUrl(String(body.url || ""));
    if (!url || url.length > 2000) return new Response(JSON.stringify({ error: "Invalid URL" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const [headerRes, sslRes, scraped] = await Promise.all([
      checkHeaders(url),
      Promise.resolve(checkSSL(url)),
      firecrawlScrape(url),
    ]);

    const findings: Finding[] = [...sslRes.findings, ...headerRes.findings];
    const { score, grade } = computeScore(findings);
    const ai = await aiAnalyze(url, headerRes.headers, findings, scraped);
    const summary = `Scanned ${url} — ${findings.length} findings. Grade ${grade} (${score}/100).`;

    const { data: inserted, error: insErr } = await supabase.from("security_scans").insert({
      user_id: userData.user.id, url, score, grade, summary,
      headers: headerRes.headers, ssl: sslRes.ssl, findings,
      ai_analysis: ai, status: "complete",
    }).select().single();
    if (insErr) throw insErr;

    return new Response(JSON.stringify({ scan: inserted }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
