import React from 'react';
import { Share2, Puzzle, Database, Globe, Cloud, Code } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const ConnectorSettings: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Connect Your Workflow
          </CardTitle>
          <CardDescription>
            Integrate Vibium Network with your existing development tools and CI/CD pipelines.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <Code className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-sm">CI/CD Pipelines</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Automate tests with GitHub Actions, GitLab CI, or Jenkins.
              </p>
            </div>

            <div className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <Database className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-sm">Data Export</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Stream your testing data to Prometheus, Grafana, or Datadog.
              </p>
            </div>

            <div className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <Globe className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-sm">Webhooks</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Receive real-time notifications to Slack, Discord, or custom APIs.
              </p>
            </div>

            <div className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <Cloud className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-sm">Cloud Providers</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Native integrations with AWS, Azure, and Google Cloud.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Popular Connectors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center gap-2 p-4 border rounded-lg bg-muted/20">
              <div className="w-10 h-10 bg-background rounded-full flex items-center justify-center font-bold border">GH</div>
              <span className="text-xs font-medium">GitHub</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 border rounded-lg bg-muted/20">
              <div className="w-10 h-10 bg-background rounded-full flex items-center justify-center font-bold border">SL</div>
              <span className="text-xs font-medium">Slack</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 border rounded-lg bg-muted/20">
              <div className="w-10 h-10 bg-background rounded-full flex items-center justify-center font-bold border">DD</div>
              <span className="text-xs font-medium">Datadog</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 border rounded-lg bg-muted/20">
              <div className="w-10 h-10 bg-background rounded-full flex items-center justify-center font-bold border">VS</div>
              <span className="text-xs font-medium">VS Code</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <Puzzle className="w-10 h-10 text-primary" />
            <h3 className="text-lg font-bold">Ready to Integrate?</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Our SDKs and API documentation make it easy to build your own connectors if we don't already support your tool.
            </p>
            <div className="flex gap-3">
              <Button size="sm">Browse SDKs</Button>
              <Button size="sm" variant="outline">API Docs</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConnectorSettings;
