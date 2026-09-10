import React, { useState } from 'react';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '../components/AppSidebar';
import Footer from '../components/Footer';
import { Check, Zap, Star, Sparkles } from 'lucide-react';
import { LoadingState } from '@/components/ui/LoadingState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { payWithRazorpay } from '@/lib/razorpay';
import { toast } from 'sonner';

const PLANS = [
  {
    name: 'Starter',
    price: 9,
    credits: 300,
    icon: Zap,
    description: 'For trying things out',
    popular: false,
    features: ['300 credits / month', 'AI code generation', '3 projects', 'Community support'],
  },
  {
    name: 'Pro',
    price: 25,
    credits: 1200,
    icon: Star,
    description: 'For solo builders & small teams',
    popular: true,
    features: ['1,200 credits / month', 'Unlimited projects', 'GitHub push & pull requests', 'Email & Slack support'],
  },
  {
    name: 'Business',
    price: 49,
    credits: 3000,
    icon: Sparkles,
    description: 'For scaling teams',
    popular: false,
    features: ['3,000 credits / month', 'Team collaboration & roles', 'Priority generation queue', 'Dedicated support'],
  },
];

const Pricing: React.FC = () => {
  const [payingPlan, setPayingPlan] = useState<string | null>(null);

  const handlePay = async (plan: string, amountUsd: number, credits: number) => {
    setPayingPlan(plan);
    try {
      const res = await payWithRazorpay({ plan, amountUsd, credits, description: `${plan} · ${credits} credits` });
      if (res.success) toast.success(`Payment successful — ${plan} plan activated`);
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

        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-transparent">
          <div className="max-w-5xl mx-auto p-6 sm:p-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-gray-900 dark:text-foreground">Simple, flat pricing</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Three plans, credit-based usage. No hidden add-ons.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {PLANS.map((plan) => {
                const Icon = plan.icon;
                return (
                  <Card
                    key={plan.name}
                    className={`flex flex-col bg-white dark:bg-card/40 dark:backdrop-blur-sm relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        Most Popular
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon className={`w-5 h-5 ${plan.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                        {plan.name}
                      </CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      <div className="mt-4">
                        <span className="text-4xl font-bold">${plan.price}</span>
                        <span className="text-muted-foreground ml-1">/mo</span>
                      </div>
                      <p className="text-xs text-primary font-medium mt-1">{plan.credits.toLocaleString()} credits</p>
                    </CardHeader>
                    <CardContent className="flex-1 text-sm space-y-2">
                      {plan.features.map((f) => (
                        <p key={f} className="flex gap-2"><Check className="w-4 h-4 text-primary shrink-0" />{f}</p>
                      ))}
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full"
                        variant={plan.popular ? 'default' : 'outline'}
                        disabled={payingPlan === plan.name}
                        onClick={() => handlePay(plan.name, plan.price, plan.credits)}
                      >
                        {payingPlan === plan.name
                          ? <><LoadingState variant="bars" size="sm" className="mr-2" />Opening…</>
                          : `Get ${plan.name} · $${plan.price}`}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>

            <p className="text-center text-xs text-muted-foreground mt-8">
              All plans billed monthly. Cancel anytime.
            </p>
          </div>
        </div>
        <Footer />
      </SidebarInset>
    </div>
  );
};

export default Pricing;
