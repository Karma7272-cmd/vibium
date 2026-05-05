import React, { useMemo, useState } from 'react';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '../components/AppSidebar';
import Footer from '../components/Footer';
import { Check, Zap, Star, Building2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';

// Credits formula: rough mapping price -> credits.
// Pro: $5 = 100 credits .. $100 = 3,000 credits
// Business: $100 = 3,500 credits .. $6,000 = 250,000 credits
const proCredits = (p: number) => Math.round(100 + ((p - 5) / 95) * (3000 - 100));
const bizCredits = (p: number) => Math.round(3500 + ((p - 100) / 5900) * (250000 - 3500));

const Pricing: React.FC = () => {
  const [pro, setPro] = useState(20);
  const [biz, setBiz] = useState(500);

  const proC = useMemo(() => proCredits(pro), [pro]);
  const bizC = useMemo(() => bizCredits(biz), [biz]);

  return (
    <div className="min-h-screen flex w-full bg-background dark:sunrise-gradient">
      <AppSidebar activeSection="" onSectionChange={() => {}} />
      <SidebarInset className="flex-1 flex flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-2 sm:px-4 bg-background/80 dark:bg-background/20 backdrop-blur-sm">
          <SidebarTrigger className="-ml-1" />
          <div className="ml-auto"><h1 className="text-lg sm:text-xl font-semibold text-foreground">Pricing Plans</h1></div>
        </header>

        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-transparent">
          <div className="max-w-7xl mx-auto p-6 sm:p-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-gray-900 dark:text-foreground">Pay only for what you use</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Four tiers with credit-based usage. Slide to customize Pro and Business.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Free */}
              <Card className="flex flex-col bg-white dark:bg-card/40 dark:backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Zap className="w-5 h-5 text-muted-foreground" />Free</CardTitle>
                  <CardDescription>For trying things out</CardDescription>
                  <div className="mt-4"><span className="text-4xl font-bold">$0</span><span className="text-muted-foreground ml-1">/mo</span></div>
                  <p className="text-xs text-muted-foreground mt-1">50 credits / month</p>
                </CardHeader>
                <CardContent className="flex-1 text-sm space-y-2">
                  <p className="flex gap-2"><Check className="w-4 h-4 text-primary" />Community support</p>
                  <p className="flex gap-2"><Check className="w-4 h-4 text-primary" />Basic checks & analytics</p>
                  <p className="flex gap-2"><Check className="w-4 h-4 text-primary" />1 project</p>
                </CardContent>
                <CardFooter><Button variant="outline" className="w-full">Get Started</Button></CardFooter>
              </Card>

              {/* Pro */}
              <Card className="flex flex-col border-primary shadow-lg bg-white dark:bg-card/40 dark:backdrop-blur-sm relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Most Popular</div>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Star className="w-5 h-5 text-primary" />Pro</CardTitle>
                  <CardDescription>For solo builders & small teams</CardDescription>
                  <div className="mt-4"><span className="text-4xl font-bold">${pro}</span><span className="text-muted-foreground ml-1">/mo</span></div>
                  <p className="text-xs text-primary font-medium mt-1">{proC.toLocaleString()} credits / month</p>
                </CardHeader>
                <CardContent className="flex-1 text-sm space-y-3">
                  <div>
                    <Slider value={[pro]} min={5} max={100} step={5} onValueChange={(v) => setPro(v[0])} />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>$5</span><span>$100</span></div>
                  </div>
                  <p className="flex gap-2"><Check className="w-4 h-4 text-primary" />Unlimited checks</p>
                  <p className="flex gap-2"><Check className="w-4 h-4 text-primary" />AI Code generation</p>
                  <p className="flex gap-2"><Check className="w-4 h-4 text-primary" />Email & Slack support</p>
                </CardContent>
                <CardFooter><Button className="w-full">Upgrade to Pro</Button></CardFooter>
              </Card>

              {/* Business */}
              <Card className="flex flex-col bg-white dark:bg-card/40 dark:backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-accent" />Business</CardTitle>
                  <CardDescription>For scaling teams</CardDescription>
                  <div className="mt-4"><span className="text-4xl font-bold">${biz.toLocaleString()}</span><span className="text-muted-foreground ml-1">/mo</span></div>
                  <p className="text-xs text-accent font-medium mt-1">{bizC.toLocaleString()} credits / month</p>
                </CardHeader>
                <CardContent className="flex-1 text-sm space-y-3">
                  <div>
                    <Slider value={[biz]} min={100} max={6000} step={100} onValueChange={(v) => setBiz(v[0])} />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>$100</span><span>$6,000</span></div>
                  </div>
                  <p className="flex gap-2"><Check className="w-4 h-4 text-primary" />Priority global nodes</p>
                  <p className="flex gap-2"><Check className="w-4 h-4 text-primary" />SSO & roles</p>
                  <p className="flex gap-2"><Check className="w-4 h-4 text-primary" />Dedicated support</p>
                </CardContent>
                <CardFooter><Button variant="outline" className="w-full">Choose Business</Button></CardFooter>
              </Card>

              {/* Custom */}
              <Card className="flex flex-col bg-white dark:bg-card/40 dark:backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-accent" />Custom</CardTitle>
                  <CardDescription>Enterprise & on-prem</CardDescription>
                  <div className="mt-4"><span className="text-4xl font-bold">Let's talk</span></div>
                  <p className="text-xs text-muted-foreground mt-1">Custom credits & SLA</p>
                </CardHeader>
                <CardContent className="flex-1 text-sm space-y-2">
                  <p className="flex gap-2"><Check className="w-4 h-4 text-primary" />Unlimited credits available</p>
                  <p className="flex gap-2"><Check className="w-4 h-4 text-primary" />Dedicated infrastructure</p>
                  <p className="flex gap-2"><Check className="w-4 h-4 text-primary" />Compliance & on-prem</p>
                  <p className="flex gap-2"><Check className="w-4 h-4 text-primary" />24/7 premium support</p>
                </CardContent>
                <CardFooter><Button variant="outline" className="w-full">Contact Sales</Button></CardFooter>
              </Card>
            </div>
          </div>
        </div>
        <Footer />
      </SidebarInset>
    </div>
  );
};

export default Pricing;
