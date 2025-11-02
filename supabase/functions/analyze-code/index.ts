import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, action, fileName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Analyzing code for action: ${action}, file: ${fileName}`);

    let systemPrompt = '';
    let userPrompt = '';

    if (action === 'analyze') {
      systemPrompt = 'You are an expert code analyzer. Analyze the provided code and identify bugs, security vulnerabilities, performance issues, and best practice violations. Provide clear, actionable feedback.';
      userPrompt = `Analyze this ${fileName} file and identify any issues:\n\n${code}`;
    } else if (action === 'fix') {
      systemPrompt = 'You are an expert code fixer. Fix bugs, security vulnerabilities, and improve code quality while maintaining the original functionality. Return ONLY the fixed code without explanations.';
      userPrompt = `Fix all issues in this ${fileName} file:\n\n${code}`;
    } else if (action === 'explain') {
      systemPrompt = 'You are an expert code explainer. Explain what the code does in clear, simple terms that both beginners and experts can understand.';
      userPrompt = `Explain what this ${fileName} file does:\n\n${code}`;
    } else if (action === 'optimize') {
      systemPrompt = 'You are an expert code optimizer. Optimize the code for better performance, readability, and maintainability. Return ONLY the optimized code without explanations.';
      userPrompt = `Optimize this ${fileName} file:\n\n${code}`;
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

    console.log(`Analysis complete for ${fileName}`);

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
