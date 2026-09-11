import React, { useState } from 'react';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Link } from 'react-router-dom';
import AppSidebar from '../components/AppSidebar';
import Footer from '../components/Footer';
import { Check, X, KeyRound } from 'lucide-react';
import { LoadingState } from '@/components/ui/LoadingState';
import { payWithRazorpay } from '@/lib/razorpay';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { usePlan, PLAN_DEFS, PLAN_ORDER, PlanId, FEATURE_LABELS, FeatureKey } from '@/hooks/usePlan';

const ALL_FEATURES: FeatureKey[] = ['github', 'schedule', 'security', 'team', 'pipelines', 'priority'];

const CAPACITY = (id: PlanId) => {
  const d = PLAN_DEFS[id];
  return [
    `${d.projects === null ? 'Unlimited' : d.projects} projects`,
    `${d.storageMb >= 1024 ? `${d.storageMb / 1024} GB` : `${d.storageMb} MB`} project storage`,
    `${d.seats === 1 ? '1 seat' : `${d.seats} team seats`}`,
    'Unlimited AI usage on your own API keys',
  ];
};

const PAID: PlanId[] = ['starter', 'pro', 'business'];

const Pricing: React.FC = () => {
  const [payingPlan, setPayingPlan] = useState<string | null>(null);
  const [annual, setAnnual] = useState(true);
  const { plan: currentPlan, periodEnd, refresh } = usePlan();

  const handlePay = async (id: PlanId, amountUsd: number) => {
    const d = PLAN_DEFS[id];
    setPayingPlan(id);
    try {
      const res = await payWithRazorpay({
        plan: d.name,
        planId: id,
        billingPeriod: annual ? 'annual' : 'monthly',
        amountUsd,
        description: `${d.name} · ${annual ? 'Annual' : 'Monthly'} · bring your own API keys`,
      });
      if (res.success) {
        toast.success(`${d.name} plan activated`);
        refresh();
      } else toast.error(res.error ?? 'Payment failed');
    } finally {
      setPayingPlan(null);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-background dark:sunrise-gradient">
      <AppSidebar activeSection="" onSectionChange={() => {}} />
      <SidebarInset className="flex-1 flex flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-2 sm:px-4 bg-background/80 dark:bg-background/20 backdrop-blur-sm">
          <SidebarTrigger className="-ml-1" />
          <div className="ml-auto"><h1 className="text-lg sm:text-xl font-semibold text-foreground">Pricing Plans</h1></div>
        </header>

        <div className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
            {/* Heading + billing toggle */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">Pricing</h1>
                <p className="mt-2 text-sm text-muted-foreground max-w-md">
                  You are on the <span className="font-semibold text-foreground">{PLAN_DEFS[currentPlan].name}</span> plan
                  {periodEnd && currentPlan !== 'free' ? ` · renews ${new Date(periodEnd).toLocaleDateString()}` : ''}.
                </p>
              </div>
              <div className="flex items-center rounded-full border border-border bg-card p-1 shadow-sm">
                <button
                  onClick={() => setAnnual(true)}
                  className={cn('px-4 py-1.5 text-xs font-semibold rounded-full transition-colors',
                    annual ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground')}
                >
                  Annual
                </button>
                <button
                  onClick={() => setAnnual(false)}
                  className={cn('px-4 py-1.5 text-xs font-semibold rounded-full transition-colors',
                    !annual ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground')}
                >
                  Monthly
                </button>
              </div>
            </div>

            {/* BYOK notice */}
            <div className="mb-8 flex items-start gap-3 rounded-2xl border border-border bg-card/70 p-4">
              <KeyRound className="w-4 h-4 mt-0.5 text-primary shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">Bring your own keys.</span> nuvic ai never sells AI credits —
                every generation, review and chat runs on your own OpenAI, Claude, Gemini, Grok or Mistral key, billed by that
                provider. Plans only unlock platform capacity and team features.{' '}
                <Link to="/connectors" className="underline font-medium text-foreground">Connect a key</Link>
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 items-start">
              {PAID.map((id) => {
                const d = PLAN_DEFS[id];
                const dark = id === 'pro';
                const monthlyPrice = annual ? Math.round(d.monthly * 0.8) : d.monthly;
                const yearlyTotal = monthlyPrice * 12;
                const isCurrent = currentPlan === id;
                return (
                  <div
                    key={id}
                    className={cn('relative rounded-3xl p-6 sm:p-7 flex flex-col shadow-xl border',
                      dark ? 'bg-zinc-900 text-zinc-100 border-zinc-800'
                           : 'bg-[#fbf8ef] dark:bg-card text-foreground border-border/60',
                      isCurrent && 'ring-2 ring-primary')}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold">{d.name}</h2>
                      <div className="flex items-center gap-2">
                        {isCurrent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                            Current
                          </span>
                        )}
                        {dark && !isCurrent && (
                          <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                            Popular
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                          </span>
                        )}
                        {annual && dark && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-300 text-amber-900">
                            Save 20%
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mb-1 flex items-baseline gap-2 flex-wrap">
                      {annual && (
                        <span className={cn('text-2xl font-semibold line-through', dark ? 'text-zinc-500' : 'text-muted-foreground/60')}>
                          ${d.monthly}
                        </span>
                      )}
                      <span className="text-5xl font-bold tracking-tight">${monthlyPrice}</span>
                      <span className={cn('text-sm', dark ? 'text-zinc-400' : 'text-muted-foreground')}>/ month (USD)</span>
                    </div>
                    {annual && (
                      <p className={cn('text-xs mb-3', dark ? 'text-zinc-400' : 'text-muted-foreground')}>
                        ${yearlyTotal.toLocaleString()} billed yearly
                      </p>
                    )}
                    <p className={cn('text-xs leading-relaxed mb-6', dark ? 'text-zinc-400' : 'text-muted-foreground')}>
                      {d.description}
                    </p>

                    <ul className="space-y-3 mb-8 flex-1">
                      {CAPACITY(id).map((f) => (
                        <li key={f} className="flex items-center gap-2.5 text-sm">
                          <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          </span>
                          {f}
                        </li>
                      ))}
                      {ALL_FEATURES.map((f) => {
                        const on = d.features.includes(f);
                        return (
                          <li
                            key={f}
                            className={cn('flex items-center gap-2.5 text-sm',
                              !on && (dark ? 'text-zinc-500' : 'text-muted-foreground/70'))}
                          >
                            <span className={cn('w-5 h-5 rounded-full flex items-center justify-center shrink-0',
                              on ? 'bg-green-500' : dark ? 'bg-zinc-700' : 'bg-muted')}>
                              {on
                                ? <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                : <X className={cn('w-3 h-3', dark ? 'text-zinc-400' : 'text-muted-foreground')} strokeWidth={3} />}
                            </span>
                            {FEATURE_LABELS[f]}
                          </li>
                        );
                      })}
                    </ul>

                    <button
                      disabled={payingPlan === id || isCurrent}
                      onClick={() => handlePay(id, annual ? yearlyTotal : d.monthly)}
                      className={cn('w-full rounded-full py-3 text-sm font-semibold transition-colors disabled:opacity-60',
                        dark ? 'bg-white text-zinc-900 hover:bg-zinc-200'
                             : 'bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-foreground dark:text-background')}
                    >
                      {payingPlan === id ? (
                        <span className="inline-flex items-center gap-2"><LoadingState variant="bars" size="sm" />Opening…</span>
                      ) : isCurrent ? 'Your current plan' : `Get ${d.name}`}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Free plan strip */}
            <div className="mt-6 rounded-3xl border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Free {currentPlan === 'free' && <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground align-middle">Current</span>}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {PLAN_DEFS.free.projects} projects · {PLAN_DEFS.free.storageMb} MB storage · unlimited AI on your own keys.
                </p>
              </div>
              <span className="text-2xl font-bold text-foreground">$0</span>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-8">
              {annual ? 'Annual billing, cancel anytime.' : 'Monthly billing, cancel anytime.'} Switch plans whenever you like.
            </p>
          </div>
        </div>
        <Footer />
      </SidebarInset>
    </div>
  );
};

export default Pricing;
