import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { goal, cwd_files } = await req.json();
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You generate shell commands for a Node.js WebContainer (jsh). Output ONLY a JSON object: {\"commands\":[\"cmd1\",\"cmd2\"],\"explanation\":\"short\"}. No markdown. Each command is a single line runnable in jsh. Prefer npm/node/cat/ls/echo. Never use sudo, apt, brew, curl to external network beyond npm." },
          { role: "user", content: `Files: ${(cwd_files || []).join(", ") || "(empty)"}\nGoal: ${goal}` },
        ],
      }),
    });
    const j = await r.json();
    const raw = j.choices?.[0]?.message?.content || "{}";
    const cleaned = raw.replace(/^```json\n?|\n?```$/g, "").trim();
    let parsed: any = { commands: [], explanation: "" };
    try { parsed = JSON.parse(cleaned); } catch { parsed = { commands: [], explanation: raw.slice(0, 400) }; }
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
