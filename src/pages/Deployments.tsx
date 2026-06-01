import React, { useEffect, useState } from 'react';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '../components/AppSidebar';
import Footer from '../components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ExternalLink, RefreshCw, Rocket, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

type Provider = 'netlify' | 'vercel';

const Deployments: React.FC = () => {
  const [provider, setProvider] = useState<Provider>('netlify');
  const [sites, setSites] = useState<any[]>([]);
  const [deploys, setDeploys] = useState<any[]>([]);
  const [logs, setLogs] = useState<any>(null);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState<{ netlify: boolean; vercel: boolean }>({ netlify: false, vercel: false });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from('connector_credentials').select('connector_id').then(({ data }) => {
      if (!data) return;
      setConnected({
        netlify: data.some((d: any) => d.connector_id === 'netlify'),
        vercel: data.some((d: any) => d.connector_id === 'vercel'),
      });
    });
  }, []);

  const call = async (action: string, extra: Record<string, any> = {}) => {
    const { data, error } = await supabase.functions.invoke('deploy-info', {
      body: { provider, action, ...extra },
    });
    if (error) throw new Error(error.message);
    if (!data?.ok) throw new Error(data?.data?.error?.message || data?.data?.message || `HTTP ${data?.status}`);
    return data.data;
  };

  const loadSites = async () => {
    setLoading(true); setLogs(null); setDeploys([]); setSelectedSite('');
    try {
      const d = await call('sites');
      const list = provider === 'netlify' ? d : (d.projects || d);
      setSites(Array.isArray(list) ? list : []);
    } catch (e: any) {
      toast({ title: 'Failed to load sites', description: e.message, variant: 'destructive' });
      setSites([]);
    } finally { setLoading(false); }
  };

  const loadDeploys = async (siteId: string) => {
    setLoading(true); setLogs(null); setSelectedSite(siteId);
    try {
      const d = await call('deploys', { site_id: siteId });
      const list = provider === 'netlify' ? d : (d.deployments || []);
      setDeploys(Array.isArray(list) ? list : []);
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const loadLogs = async (deployId: string) => {
    setLoading(true);
    try {
      const d = await call('logs', { deploy_id: deployId });
      setLogs(d);
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  useEffect(() => { if (connected[provider]) loadSites(); else { setSites([]); setDeploys([]); setLogs(null); } /* eslint-disable-next-line */ }, [provider, connected]);

  const isConnected = connected[provider];

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar activeSection="" onSectionChange={() => {}} />
      <SidebarInset className="flex-1 flex flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-lg sm:text-xl font-semibold ml-auto">Deployments</h1>
        </header>
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex p-2 bg-primary/10 rounded-full mb-3"><Rocket className="w-6 h-6 text-primary" /></div>
              <h1 className="text-3xl font-bold mb-2">Deploy & monitor</h1>
              <p className="text-muted-foreground">List sites, view deploys and read build logs from Netlify or Vercel.</p>
            </div>

            <Tabs value={provider} onValueChange={(v) => setProvider(v as Provider)}>
              <TabsList className="grid grid-cols-2 max-w-sm mx-auto">
                <TabsTrigger value="netlify">Netlify {connected.netlify && <Badge variant="outline" className="ml-2 text-[10px]">on</Badge>}</TabsTrigger>
                <TabsTrigger value="vercel">Vercel {connected.vercel && <Badge variant="outline" className="ml-2 text-[10px]">on</Badge>}</TabsTrigger>
              </TabsList>

              <TabsContent value={provider} className="mt-6">
                {!isConnected ? (
                  <Card className="p-10 text-center">
                    <p className="text-sm text-muted-foreground mb-3">No {provider} API key found.</p>
                    <Button onClick={() => navigate('/connectors')}>Connect {provider}</Button>
                  </Card>
                ) : (
                  <div className="grid lg:grid-cols-3 gap-4">
                    {/* Sites */}
                    <Card className="lg:col-span-1">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm">Sites</CardTitle>
                        <Button size="icon" variant="ghost" onClick={loadSites} disabled={loading}>
                          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-1.5 max-h-[460px] overflow-auto">
                        {sites.length === 0 && !loading && <p className="text-xs text-muted-foreground">No sites.</p>}
                        {sites.map((s: any) => {
                          const id = s.id || s.site_id;
                          const name = s.name || s.url || id;
                          return (
                            <button
                              key={id}
                              onClick={() => loadDeploys(id)}
                              className={`w-full text-left p-2 rounded-md text-xs hover:bg-muted ${selectedSite === id ? 'bg-muted border border-primary/30' : ''}`}
                            >
                              <div className="font-medium truncate">{name}</div>
                              <div className="text-[10px] text-muted-foreground truncate">{s.url || s.ssl_url || s.framework || ''}</div>
                            </button>
                          );
                        })}
                      </CardContent>
                    </Card>

                    {/* Deploys */}
                    <Card className="lg:col-span-1">
                      <CardHeader><CardTitle className="text-sm">Recent deploys</CardTitle></CardHeader>
                      <CardContent className="space-y-1.5 max-h-[460px] overflow-auto">
                        {deploys.length === 0 && <p className="text-xs text-muted-foreground">Select a site.</p>}
                        {deploys.map((d: any) => {
                          const id = d.id || d.uid;
                          const state = d.state || d.readyState || 'unknown';
                          const url = d.deploy_ssl_url || d.url;
                          return (
                            <div key={id} className="p-2 rounded-md border border-border space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <Badge variant="outline" className={`text-[10px] ${state === 'ready' || state === 'READY' ? 'border-emerald-500/40 text-emerald-600' : ''}`}>{state}</Badge>
                                {url && <a href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noreferrer" className="text-[10px] text-primary inline-flex items-center gap-0.5"><ExternalLink className="h-2.5 w-2.5" />open</a>}
                              </div>
                              <div className="text-[10px] text-muted-foreground truncate">{d.commit_ref || d.meta?.githubCommitMessage || d.title || id}</div>
                              <Button size="sm" variant="outline" className="w-full h-6 text-[10px]" onClick={() => loadLogs(id)}>
                                <FileText className="h-3 w-3 mr-1" /> Logs
                              </Button>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>

                    {/* Logs */}
                    <Card className="lg:col-span-1">
                      <CardHeader><CardTitle className="text-sm">Logs / details</CardTitle></CardHeader>
                      <CardContent>
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {!logs && !loading && <p className="text-xs text-muted-foreground">Pick a deploy.</p>}
                        {logs && (
                          <pre className="text-[10px] bg-muted/40 p-2 rounded max-h-[420px] overflow-auto whitespace-pre-wrap break-words">
                            {typeof logs === 'string' ? logs : JSON.stringify(logs, null, 2)}
                          </pre>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
        <Footer />
      </SidebarInset>
    </div>
  );
};

export default Deployments;
