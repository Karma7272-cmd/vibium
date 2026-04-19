import React from 'react';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '../components/AppSidebar';
import Footer from '../components/Footer';
import { Share2, Puzzle, Database, Globe, Cloud, Code } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Connectors: React.FC = () => {
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
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">Connectors & Integrations</h1>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-transparent">
          <div className="max-w-4xl mx-auto p-6 sm:p-8">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <Share2 className="w-16 h-16 text-primary mx-auto mb-6" />
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-foreground mb-6">
                Connect Your Workflow
              </h1>
              <p className="text-xl text-gray-600 dark:text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Vibium Network integrates seamlessly with your existing development tools
                and CI/CD pipelines. Connect once, test everywhere.
              </p>
            </div>

            {/* Integration Categories */}
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <Card className="bg-white dark:bg-card/40 dark:backdrop-blur-sm border-gray-200 dark:border-border">
                <CardHeader>
                  <Code className="w-8 h-8 text-primary mb-2" />
                  <CardTitle>CI/CD Pipelines</CardTitle>
                </CardHeader>
                <CardContent className="text-gray-600 dark:text-muted-foreground">
                  Automate tests with GitHub Actions, GitLab CI, or Jenkins. Trigger global
                  performance checks on every pull request.
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-card/40 dark:backdrop-blur-sm border-gray-200 dark:border-border">
                <CardHeader>
                  <Database className="w-8 h-8 text-accent mb-2" />
                  <CardTitle>Data Export</CardTitle>
                </CardHeader>
                <CardContent className="text-gray-600 dark:text-muted-foreground">
                  Stream your testing data to Prometheus, Grafana, or Datadog for deep
                  observability and custom alerting.
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-card/40 dark:backdrop-blur-sm border-gray-200 dark:border-border">
                <CardHeader>
                  <Globe className="w-8 h-8 text-primary mb-2" />
                  <CardTitle>Webhooks</CardTitle>
                </CardHeader>
                <CardContent className="text-gray-600 dark:text-muted-foreground">
                  Receive real-time notifications via webhooks to Slack, Discord, or
                  your own custom API endpoints.
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-card/40 dark:backdrop-blur-sm border-gray-200 dark:border-border">
                <CardHeader>
                  <Cloud className="w-8 h-8 text-accent mb-2" />
                  <CardTitle>Cloud Providers</CardTitle>
                </CardHeader>
                <CardContent className="text-gray-600 dark:text-muted-foreground">
                  Native integrations with AWS, Azure, and Google Cloud for managed
                  infrastructure testing.
                </CardContent>
              </Card>
            </div>

            {/* Popular Connectors */}
            <div className="bg-white dark:bg-card/40 dark:backdrop-blur-sm p-8 rounded-lg border border-gray-200 dark:border-border mb-12 text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-foreground mb-8">Popular Connectors</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 grayscale opacity-70">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center font-bold">GH</div>
                  <span className="text-xs font-medium">GitHub</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center font-bold">SL</div>
                  <span className="text-xs font-medium">Slack</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center font-bold">DD</div>
                  <span className="text-xs font-medium">Datadog</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center font-bold">VS</div>
                  <span className="text-xs font-medium">VS Code</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <Puzzle className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-foreground mb-4">Ready to Integrate?</h2>
              <p className="text-gray-600 dark:text-muted-foreground mb-8 max-w-2xl mx-auto">
                Our SDKs and API documentation make it easy to build your own connectors
                if we don't already support your tool.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                  Browse SDKs
                </button>
                <button className="bg-gray-200 hover:bg-gray-300 dark:bg-muted dark:hover:bg-muted/80 text-gray-900 dark:text-foreground px-8 py-3 rounded-lg font-semibold transition-colors">
                  API Docs
                </button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </SidebarInset>
    </div>
  );
};

export default Connectors;
