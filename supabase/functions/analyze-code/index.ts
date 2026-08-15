import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_ACTIONS = ['analyze', 'fix', 'explain', 'optimize'] as const;
const MAX_CODE_LENGTH = 100_000;
const MAX_FILENAME_LENGTH = 300;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ---- Authentication: require a valid signed-in user ----
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData?.user) return json({ error: 'Unauthorized' }, 401);

    // ---- Input validation ----
    let payload: any;
    try {
      payload = await req.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }

    const { code, action, fileName } = payload ?? {};

    if (typeof action !== 'string' || !ALLOWED_ACTIONS.includes(action as any)) {
      return json({ error: `action must be one of: ${ALLOWED_ACTIONS.join(', ')}` }, 400);
    }
    if (typeof code !== 'string' || code.length === 0) {
      return json({ error: 'code must be a non-empty string' }, 400);
    }
    if (code.length > MAX_CODE_LENGTH) {
      return json({ error: 'code exceeds the maximum allowed size (100KB)' }, 400);
    }
    if (fileName !== undefined && (typeof fileName !== 'string' || fileName.length > MAX_FILENAME_LENGTH)) {
      return json({ error: 'fileName must be a string under 300 characters' }, 400);
    }
    const safeFileName = (fileName as string | undefined) ?? 'file';

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Analyzing code for action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';


    if (action === 'analyze') {
      systemPrompt = 'You are an expert code analyzer. Analyze the provided code and identify bugs, security vulnerabilities, performance issues, and best practice violations. Provide clear, actionable feedback.';
      userPrompt = `Analyze this ${safeFileName} file and identify any issues:\n\n${code}`;
    } else if (action === 'fix') {
      systemPrompt = 'You are an expert code fixer. Fix bugs, security vulnerabilities, and improve code quality while maintaining the original functionality. Return ONLY the fixed code without explanations.';
      userPrompt = `Fix all issues in this ${safeFileName} file:\n\n${code}`;
    } else if (action === 'explain') {
      systemPrompt = 'You are an expert code explainer. Explain what the code does in clear, simple terms that both beginners and experts can understand.';
      userPrompt = `Explain what this ${safeFileName} file does:\n\n${code}`;
    } else if (action === 'optimize') {
      systemPrompt = 'You are an expert code optimizer. Optimize the code for better performance, readability, and maintainability. Return ONLY the optimized code without explanations.';
      userPrompt = `Optimize this ${safeFileName} file:\n\n${code}`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add more credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway returned ${response.status}`);
    }

    const data = await response.json();
    const result = data.choices[0].message.content;

    console.log(`Analysis complete`);

    return new Response(
      JSON.stringify({ result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-code function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
