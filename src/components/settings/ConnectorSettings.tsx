import React from 'react';
import { Share2, ExternalLink, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const ConnectorSettings: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-primary" />
                Integrations & Connectors
              </CardTitle>
              <CardDescription>
                Manage your connections to external platforms and services.
              </CardDescription>
            </div>
            <Button onClick={() => navigate('/connectors')} size="sm" className="gap-2">
              Browse All <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 rounded-xl border bg-background/50 group hover:border-primary/30 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-xs">GH</div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">GitHub</span>
                  <span className="text-[10px] text-green-500 font-medium">Connected</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-8">Configure</Button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border bg-background/50 group hover:border-primary/30 transition-all opacity-60">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center font-bold text-xs text-muted-foreground">NF</div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">Netlify</span>
                  <span className="text-[10px] text-muted-foreground font-medium">Not Connected</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-8">Connect</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Looking for Vercel, Render, or Railway integrations?
          </p>
          <Button variant="outline" onClick={() => navigate('/connectors')} className="gap-2 border-primary/20 hover:bg-primary/10">
            View Platform Connectors <ExternalLink className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConnectorSettings;
