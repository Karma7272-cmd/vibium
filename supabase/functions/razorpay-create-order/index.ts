import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const USD_TO_INR = 83;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const body = await req.json();
    const { plan, amount_usd, credits = 0, storage_gb = 0 } = body ?? {};
    const usd = Number(amount_usd);
    if (!plan || !Number.isFinite(usd) || usd <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid amount or plan' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const amountInrPaise = Math.round(usd * USD_TO_INR * 100);

    const keyId = Deno.env.get('RAZORPAY_KEY_ID')!;
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;
    const auth = 'Basic ' + btoa(`${keyId}:${keySecret}`);

    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: amountInrPaise,
        currency: 'INR',
        receipt: `rcpt_${Date.now()}_${user.id.slice(0, 8)}`,
        notes: { plan, user_id: user.id, credits: String(credits), storage_gb: String(storage_gb), amount_usd: String(usd) },
      }),
    });
    const order = await rzpRes.json();
    if (!rzpRes.ok) {
      return new Response(JSON.stringify({ error: order?.error?.description ?? 'Razorpay error', details: order }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    await service.from('payments').insert({
      user_id: user.id, plan, amount_usd: usd, amount_inr_paise: amountInrPaise,
      currency: 'INR', credits, storage_gb, razorpay_order_id: order.id, status: 'created',
    });

    return new Response(JSON.stringify({ order_id: order.id, amount: order.amount, currency: order.currency, key_id: keyId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
