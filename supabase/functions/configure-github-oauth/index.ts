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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const githubClientId = Deno.env.get('GITHUB_CLIENT_ID');
    const githubClientSecret = Deno.env.get('GITHUB_CLIENT_SECRET');

    if (!githubClientId || !githubClientSecret) {
      return new Response(
        JSON.stringify({ error: 'GitHub OAuth credentials not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Configure GitHub as an external OAuth provider using Supabase Management API
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/config`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
      },
      body: JSON.stringify({
        external: {
          github: {
            enabled: true,
            client_id: githubClientId,
            secret: githubClientSecret,
          }
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to configure GitHub OAuth:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to configure GitHub OAuth', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'GitHub OAuth configured successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
