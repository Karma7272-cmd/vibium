import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createHmac } from 'node:crypto';

const VALID_PLANS = ['starter', 'pro', 'business'];

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

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, billing_period } = await req.json();
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const secret = Deno.env.get('RAZORPAY_KEY_SECRET')!;
    const expected = createHmac('sha256', secret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
    const ok = expected === razorpay_signature;

    const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: payment } = await service
      .from('payments')
      .update({ razorpay_payment_id, razorpay_signature, status: ok ? 'paid' : 'signature_failed' })
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('user_id', user.id)
      .select('plan')
      .maybeSingle();

    if (!ok) return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Activate the plan on the user's subscription.
    const planId = String(payment?.plan ?? '').toLowerCase();
    if (VALID_PLANS.includes(planId)) {
      const annual = billing_period === 'annual';
      const start = new Date();
      const end = new Date(start);
      if (annual) end.setFullYear(end.getFullYear() + 1);
      else end.setMonth(end.getMonth() + 1);

      await service.from('subscriptions').upsert({
        user_id: user.id,
        plan: planId,
        billing_period: annual ? 'annual' : 'monthly',
        status: 'active',
        current_period_start: start.toISOString(),
        current_period_end: end.toISOString(),
        razorpay_payment_id,
      }, { onConflict: 'user_id' });
    }

    return new Response(JSON.stringify({ success: true, plan: planId }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
