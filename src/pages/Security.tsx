import React, { useEffect, useState } from 'react';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '../components/AppSidebar';
import Footer from '../components/Footer';
import { Shield, Globe, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';
import { LoadingState } from '@/components/ui/LoadingState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';

interface Scan {
  id: string;
  url: string;
  score: number | null;
  grade: string | null;
  summary: string | null;
  headers: Record<string, string> | null;
  ssl: { https?: boolean } | null;
  findings: Array<{ severity: string; title: string; description: string }> | null;
  ai_analysis: string | null;
  created_at: string;
}

const sevColor: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-600 border-red-500/30',
  high: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  low: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  info: 'bg-muted text-muted-foreground border-border',
};

const gradeColor = (g: string | null) => {
  if (!g) return 'text-muted-foreground';
  if (g === 'A') return 'text-emerald-500';
  if (g === 'B') return 'text-lime-500';
  if (g === 'C') return 'text-yellow-500';
  if (g === 'D') return 'text-orange-500';
  return 'text-red-500';
};

const Security: React.FC = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState<Scan | null>(null);
  const [history, setHistory] = useState<Scan[]>([]);
  const { toast } = useToast();

  const loadHistory = async () => {
    const { data } = await supabase.from('security_scans').select('*').order('created_at', { ascending: false }).limit(20);
    if (data) setHistory(data as any);
  };

  useEffect(() => { loadHistory(); }, []);

  const runScan = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('security-scan', { body: { url: url.trim() } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setCurrent(data.scan);
      toast({ title: 'Scan complete', description: `Grade ${data.scan.grade} (${data.scan.score}/100)` });
      loadHistory();
    } catch (e: any) {
      toast({ title: 'Scan failed', description: e.message || String(e), variant: 'destructive' });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex w-full bg-background dark:sunrise-gradient">
      <AppSidebar activeSection="" onSectionChange={() => {}} />
      <SidebarInset className="flex-1 flex flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-2 sm:px-4 bg-background/80 dark:bg-background/20 backdrop-blur-sm">
          <SidebarTrigger className="-ml-1" />
          <div className="ml-auto"><h1 className="text-lg sm:text-xl font-semibold">Website Security</h1></div>
        </header>

        <div className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="text-center mb-2">
              <Shield className="w-12 h-12 text-primary mx-auto mb-3" />
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">AI Website Security Scanner</h2>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                Enter a URL to run a comprehensive security check — headers, SSL, exposed info, and AI-powered analysis.
              </p>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="example.com"
                      className="pl-9"
                      onKeyDown={(e) => e.key === 'Enter' && runScan()}
                    />
                  </div>
                  <Button onClick={runScan} disabled={loading || !url.trim()} className="gap-2">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {loading ? 'Scanning…' : 'Scan website'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {current && (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <CardTitle className="text-lg break-all">{current.url}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">{current.summary}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-5xl font-bold ${gradeColor(current.grade)}`}>{current.grade}</div>
                      <div className="text-xs text-muted-foreground">{current.score}/100</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold mb-2 flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Findings ({current.findings?.length || 0})</h3>
                    <div className="space-y-2">
                      {current.findings?.length === 0 && (
                        <div className="flex items-center gap-2 text-emerald-600 text-sm"><CheckCircle2 className="h-4 w-4" /> No issues detected.</div>
                      )}
                      {current.findings?.map((f, i) => (
                        <div key={i} className={`p-3 rounded-lg border ${sevColor[f.severity] || sevColor.info}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-[10px] uppercase">{f.severity}</Badge>
                            <span className="text-sm font-semibold">{f.title}</span>
                          </div>
                          <p className="text-xs opacity-80">{f.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {current.ai_analysis && (
                    <div>
                      <h3 className="text-sm font-bold mb-2 flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />AI Analysis</h3>
                      <div className="prose prose-sm dark:prose-invert max-w-none p-4 rounded-lg bg-muted/30 border">
                        <ReactMarkdown>{current.ai_analysis}</ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {current.headers && (
                    <details className="text-xs">
                      <summary className="cursor-pointer font-bold mb-2">Response Headers</summary>
                      <pre className="mt-2 p-3 bg-muted/30 border rounded-lg overflow-auto max-h-60 font-mono">{JSON.stringify(current.headers, null, 2)}</pre>
                    </details>
                  )}
                </CardContent>
              </Card>
            )}

            {history.length > 0 && (
              <div>
                <h3 className="text-sm font-bold mb-3 text-muted-foreground uppercase tracking-wider">Recent Scans</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {history.map((s) => (
                    <button key={s.id} onClick={() => setCurrent(s)} className="text-left">
                      <Card className="hover:border-primary/40 transition-colors">
                        <CardContent className="p-3 flex items-center justify-between">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{s.url}</p>
                            <p className="text-[10px] text-muted-foreground">{new Date(s.created_at).toLocaleString()}</p>
                          </div>
                          <div className={`text-xl font-bold ${gradeColor(s.grade)}`}>{s.grade}</div>
                        </CardContent>
                      </Card>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Footer />
        </div>
      </SidebarInset>
    </div>
  );
};

export default Security;
