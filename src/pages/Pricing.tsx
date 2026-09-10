import React, { useState } from 'react';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '../components/AppSidebar';
import Footer from '../components/Footer';
import { Check, X } from 'lucide-react';
import { LoadingState } from '@/components/ui/LoadingState';
import { payWithRazorpay } from '@/lib/razorpay';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Plan = {
  name: string;
  monthly: number;
  credits: number;
  description: string;
  popular?: boolean;
  dark?: boolean;
  included: string[];
  excluded: string[];
};

const PLANS: Plan[] = [
  {
    name: 'Starter',
    monthly: 9,
    credits: 300,
    description: 'Get started with essential AI generation tools, ideal for trying things out and small experiments.',
    included: ['300 credits / month', 'AI code generation', '3 projects', 'Community support'],
    excluded: ['GitHub push & pull requests', 'Team collaboration', 'Priority generation queue', 'Dedicated support'],
  },
  {
    name: 'Pro',
    monthly: 25,
    credits: 1200,
    description: 'A comprehensive solution for solo builders and small teams shipping real products with AI.',
    popular: true,
    dark: true,
    included: ['1,200 credits / month', 'Unlimited projects', 'AI code generation', 'GitHub push & pull requests', 'Email & Slack support'],
    excluded: ['Team collaboration', 'Priority generation queue', 'Dedicated support'],
  },
  {
    name: 'Business',
    monthly: 49,
    credits: 3000,
    description: 'Maximize team performance with premium tools and collaboration options, perfect for larger organizations.',
    included: ['3,000 credits / month', 'Unlimited projects', 'AI code generation', 'GitHub push & pull requests', 'Team collaboration & roles', 'Priority generation queue', 'Dedicated support'],
    excluded: [],
  },
];

const Pricing: React.FC = () => {
  const [payingPlan, setPayingPlan] = useState<string | null>(null);
  const [annual, setAnnual] = useState(true);

  const handlePay = async (plan: Plan, amountUsd: number) => {
    setPayingPlan(plan.name);
    try {
      const res = await payWithRazorpay({
        plan: plan.name,
        amountUsd,
        credits: plan.credits,
        description: `${plan.name} · ${plan.credits} credits · ${annual ? 'Annual' : 'Monthly'}`,
      });
      if (res.success) toast.success(`Payment successful — ${plan.name} plan activated`);
      else toast.error(res.error ?? 'Payment failed');
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
            <div className="flex items-start justify-between gap-4 mb-10">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">Pricing</h1>
              <div className="flex items-center rounded-full border border-border bg-card p-1 shadow-sm">
                <button
                  onClick={() => setAnnual(true)}
                  className={cn(
                    'px-4 py-1.5 text-xs font-semibold rounded-full transition-colors',
                    annual ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Annual
                </button>
                <button
                  onClick={() => setAnnual(false)}
                  className={cn(
                    'px-4 py-1.5 text-xs font-semibold rounded-full transition-colors',
                    !annual ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Monthly
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 items-start">
              {PLANS.map((plan) => {
                const monthlyPrice = annual ? Math.round(plan.monthly * 0.8) : plan.monthly;
                const yearlyTotal = monthlyPrice * 12;
                const dark = plan.dark;
                return (
                  <div
                    key={plan.name}
                    className={cn(
                      'relative rounded-3xl p-6 sm:p-7 flex flex-col shadow-xl border',
                      dark
                        ? 'bg-zinc-900 text-zinc-100 border-zinc-800'
                        : 'bg-[#fbf8ef] dark:bg-card text-foreground border-border/60'
                    )}
                  >
                    {/* Plan name + badges */}
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold">{plan.name}</h2>
                      <div className="flex items-center gap-2">
                        {plan.popular && (
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

                    {/* Price */}
                    <div className="mb-1 flex items-baseline gap-2 flex-wrap">
                      {annual && (
                        <span className={cn('text-2xl font-semibold line-through', dark ? 'text-zinc-500' : 'text-muted-foreground/60')}>
                          ${plan.monthly}
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
                      {plan.description}
                    </p>

                    {/* Features */}
                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.included.map((f) => (
                        <li key={f} className="flex items-center gap-2.5 text-sm">
                          <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          </span>
                          {f}
                        </li>
                      ))}
                      {plan.excluded.map((f) => (
                        <li key={f} className={cn('flex items-center gap-2.5 text-sm', dark ? 'text-zinc-500' : 'text-muted-foreground/70')}>
                          <span className={cn('w-5 h-5 rounded-full flex items-center justify-center shrink-0', dark ? 'bg-zinc-700' : 'bg-muted')}>
                            <X className={cn('w-3 h-3', dark ? 'text-zinc-400' : 'text-muted-foreground')} strokeWidth={3} />
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <button
                      disabled={payingPlan === plan.name}
                      onClick={() => handlePay(plan, annual ? yearlyTotal : plan.monthly)}
                      className={cn(
                        'w-full rounded-full py-3 text-sm font-semibold transition-colors disabled:opacity-60',
                        dark
                          ? 'bg-white text-zinc-900 hover:bg-zinc-200'
                          : 'bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-foreground dark:text-background'
                      )}
                    >
                      {payingPlan === plan.name ? (
                        <span className="inline-flex items-center gap-2"><LoadingState variant="bars" size="sm" />Opening…</span>
                      ) : (
                        `Get ${plan.name}`
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <p className="text-center text-xs text-muted-foreground mt-10">
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
