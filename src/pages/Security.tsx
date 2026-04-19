import React from 'react';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '../components/AppSidebar';
import Footer from '../components/Footer';
import { Shield, Lock, EyeOff, Server, HardDrive, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Security: React.FC = () => {
  return (
    <div className="min-h-screen flex w-full bg-background dark:sunrise-gradient">
      <AppSidebar
        activeSection=""
        onSectionChange={() => {}}
      />
      <SidebarInset className="flex-1 flex flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-2 sm:px-4 bg-background/80 dark:bg-background/20 backdrop-blur-sm">
          <SidebarTrigger className="-ml-1" />
          <div className="ml-auto">
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">Website Security</h1>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-transparent">
          <div className="max-w-4xl mx-auto p-6 sm:p-8">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <Shield className="w-16 h-16 text-primary mx-auto mb-6" />
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-foreground mb-6">
                Trust & Security
              </h1>
              <p className="text-xl text-gray-600 dark:text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                We've built Vibium Network with security as our top priority. Our decentralized
                architecture ensures that your tests are private, secure, and reliable.
              </p>
            </div>

            {/* Core Pillars */}
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <Card className="bg-white dark:bg-card/40 dark:backdrop-blur-sm border-gray-200 dark:border-border">
                <CardHeader>
                  <Lock className="w-8 h-8 text-primary mb-2" />
                  <CardTitle>End-to-End Encryption</CardTitle>
                </CardHeader>
                <CardContent className="text-gray-600 dark:text-muted-foreground">
                  All test data, including URLs, payloads, and results, are encrypted at rest and in transit.
                  Only the test initiator can decrypt the final report.
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-card/40 dark:backdrop-blur-sm border-gray-200 dark:border-border">
                <CardHeader>
                  <Server className="w-8 h-8 text-accent mb-2" />
                  <CardTitle>Secure Sandboxing</CardTitle>
                </CardHeader>
                <CardContent className="text-gray-600 dark:text-muted-foreground">
                  Tests run in isolated, ephemeral sandboxes on operator nodes. This prevents cross-contamination
                  and ensures that node operators cannot access sensitive test data.
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-card/40 dark:backdrop-blur-sm border-gray-200 dark:border-border">
                <CardHeader>
                  <ShieldCheck className="w-8 h-8 text-primary mb-2" />
                  <CardTitle>Node Integrity</CardTitle>
                </CardHeader>
                <CardContent className="text-gray-600 dark:text-muted-foreground">
                  We use automated "health checks" and reputation systems to ensure nodes haven't been
                  tampered with. Malicious nodes are instantly slashed and removed from the network.
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-card/40 dark:backdrop-blur-sm border-gray-200 dark:border-border">
                <CardHeader>
                  <EyeOff className="w-8 h-8 text-accent mb-2" />
                  <CardTitle>Privacy by Design</CardTitle>
                </CardHeader>
                <CardContent className="text-gray-600 dark:text-muted-foreground">
                  We don't collect personal information from our users or node operators. Your testing
                  activity remains your own, governed by decentralized identity protocols.
                </CardContent>
              </Card>
            </div>

            {/* Compliance Section */}
            <div className="bg-white dark:bg-card/40 dark:backdrop-blur-sm p-8 rounded-lg border border-gray-200 dark:border-border mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-foreground mb-4 flex items-center gap-2">
                <HardDrive className="w-6 h-6 text-primary" />
                Enterprise-Grade Infrastructure
              </h2>
              <div className="prose prose-lg max-w-none text-gray-700 dark:text-muted-foreground">
                <p>
                  Vibium Network leverages the same security principles used by global financial
                  institutions. Our decentralized consensus mechanism ensures that test results
                  are verifiable and cannot be manipulated by any single entity.
                </p>
                <ul className="mt-4 space-y-2">
                  <li>Regular third-party security audits</li>
                  <li>Open-source core infrastructure for transparency</li>
                  <li>Real-time threat monitoring and mitigation</li>
                  <li>Granular access controls for team accounts</li>
                </ul>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center bg-primary/5 p-8 rounded-2xl border border-primary/10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-foreground mb-4">Have Security Questions?</h2>
              <p className="text-gray-600 dark:text-muted-foreground mb-6">
                Our security team is ready to provide detailed technical documentation or answer
                any specific compliance questions you might have.
              </p>
              <button className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                View Security Documentation
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </SidebarInset>
    </div>
  );
};

export default Security;
