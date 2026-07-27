import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window { Razorpay?: any }
}

function loadScript(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) { existing.addEventListener('load', () => resolve(true)); return; }
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export interface CheckoutInput {
  plan: string;
  amountUsd: number;
  credits?: number;
  storageGb?: number;
  description?: string;
}

export async function payWithRazorpay(input: CheckoutInput): Promise<{ success: boolean; error?: string }> {
  const scriptOk = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
  if (!scriptOk) return { success: false, error: 'Failed to load Razorpay' };

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return { success: false, error: 'Please sign in first' };

  const { data, error } = await supabase.functions.invoke('razorpay-create-order', {
    body: { plan: input.plan, amount_usd: input.amountUsd, credits: input.credits ?? 0, storage_gb: input.storageGb ?? 0 },
  });
  if (error || !data?.order_id) return { success: false, error: error?.message || data?.error || 'Order failed' };

  const user = sessionData.session.user;

  return new Promise((resolve) => {
    const rzp = new window.Razorpay({
      key: data.key_id,
      amount: data.amount,
      currency: data.currency,
      order_id: data.order_id,
      name: 'nuvic ai',
      description: input.description ?? `${input.plan} plan`,
      prefill: { email: user.email ?? '', name: user.user_metadata?.full_name ?? '' },
      theme: { color: '#6366f1' },
      handler: async (resp: any) => {
        const { data: v, error: ve } = await supabase.functions.invoke('razorpay-verify', {
          body: {
            razorpay_order_id: resp.razorpay_order_id,
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_signature: resp.razorpay_signature,
          },
        });
        if (ve || !v?.success) resolve({ success: false, error: ve?.message || v?.error || 'Verification failed' });
        else resolve({ success: true });
      },
      modal: { ondismiss: () => resolve({ success: false, error: 'Payment cancelled' }) },
    });
    rzp.open();
  });
}
