import React, { useEffect, useState } from 'react';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '../components/AppSidebar';
import Footer from '../components/Footer';
import { Share2, Cloud, Zap, Triangle, Flame, Book, Mail, ListTodo, UserCheck, Server, CheckCircle2, Loader2, KeyRound, Trash2, Play } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Quick actions per connector — proxied server-side via `connector-invoke`.
const ACTIONS: Record<string, Array<{ id: string; label: string; needs?: Array<{ key: string; placeholder: string }> }>> = {
  openai: [{ id: 'list_models', label: 'List models' }, { id: 'chat', label: 'Chat', needs: [{ key: 'prompt', placeholder: 'Prompt' }] }],
  gemini: [{ id: 'list_models', label: 'List models' }, { id: 'generate', label: 'Generate', needs: [{ key: 'prompt', placeholder: 'Prompt' }] }],
  anthropic: [{ id: 'list_models', label: 'List models' }],
  xai: [{ id: 'list_models', label: 'List models' }, { id: 'chat', label: 'Chat', needs: [{ key: 'prompt', placeholder: 'Prompt' }] }],
  mistral: [{ id: 'list_models', label: 'List models' }, { id: 'chat', label: 'Chat', needs: [{ key: 'prompt', placeholder: 'Prompt' }] }],
  github: [{ id: 'me', label: 'Whoami' }, { id: 'list_repos', label: 'List repos' }],
  stripe: [{ id: 'balance', label: 'Balance' }, { id: 'list_customers', label: 'Customers' }],
  resend: [{ id: 'list_domains', label: 'Domains' }, { id: 'send_email', label: 'Send email', needs: [{ key: 'to', placeholder: 'to@example.com' }, { key: 'subject', placeholder: 'Subject' }] }],
  notion: [{ id: 'me', label: 'Whoami' }, { id: 'search', label: 'Search', needs: [{ key: 'query', placeholder: 'Query' }] }],
  slack: [{ id: 'auth_test', label: 'Auth test' }, { id: 'post_message', label: 'Post message', needs: [{ key: 'channel', placeholder: '#channel-id' }, { key: 'text', placeholder: 'Message' }] }],
  firecrawl: [{ id: 'credit', label: 'Credits' }, { id: 'scrape', label: 'Scrape URL', needs: [{ key: 'url', placeholder: 'https://…' }] }],
  elevenlabs: [{ id: 'voices', label: 'Voices' }],
  netlify: [{ id: 'sites', label: 'Sites' }],
  vercel: [{ id: 'projects', label: 'Projects' }],
};

const CONNECTORS = [
  { id: 'openai', name: 'OpenAI', description: 'GPT models, embeddings, and DALL·E.', icon: Zap, category: 'AI', help: 'platform.openai.com/api-keys' },
  { id: 'gemini', name: 'Google Gemini', description: 'Google Generative AI models.', icon: Zap, category: 'AI', help: 'aistudio.google.com/apikey' },
  { id: 'anthropic', name: 'Anthropic', description: 'Claude models for reasoning.', icon: Zap, category: 'AI', help: 'console.anthropic.com' },
  { id: 'xai', name: 'xAI Grok', description: 'Grok models from xAI.', icon: Zap, category: 'AI', help: 'console.x.ai' },
  { id: 'mistral', name: 'Mistral AI', description: 'Open & premier Mistral models.', icon: Zap, category: 'AI', help: 'console.mistral.ai/api-keys' },
  { id: 'firecrawl', name: 'Firecrawl', description: 'AI-powered web scraping.', icon: Flame, category: 'Data', help: 'firecrawl.dev' },
  { id: 'resend', name: 'Resend', description: 'Email API for developers.', icon: Mail, category: 'Email', help: 'resend.com/api-keys' },
  { id: 'github', name: 'GitHub', description: 'Repos, issues, and pull requests.', icon: UserCheck, category: 'DevOps', help: 'github.com/settings/tokens' },
  { id: 'stripe', name: 'Stripe', description: 'Payments and subscriptions.', icon: Cloud, category: 'Payments', help: 'dashboard.stripe.com/apikeys' },
  { id: 'notion', name: 'Notion', description: 'Workspace and database access.', icon: Book, category: 'Productivity', help: 'notion.so/my-integrations' },
  { id: 'slack', name: 'Slack', description: 'Send messages, manage channels.', icon: ListTodo, category: 'Comms', help: 'api.slack.com/apps' },
  { id: 'elevenlabs', name: 'ElevenLabs', description: 'AI voice generation.', icon: Server, category: 'AI', help: 'elevenlabs.io' },
  { id: 'netlify', name: 'Netlify', description: 'Static site deployments.', icon: Triangle, category: 'Deployment', help: 'app.netlify.com/user/applications' },
  { id: 'vercel', name: 'Vercel', description: 'Serverless app deployments.', icon: Triangle, category: 'Deployment', help: 'vercel.com/account/tokens' },
];

interface Saved { id: string; connector_id: string; status: string; last_tested_at: string | null; }

const Connectors: React.FC = () => {
  const [saved, setSaved] = useState<Saved[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [tryId, setTryId] = useState<string | null>(null);
  const [tryAction, setTryAction] = useState<string>('');
  const [tryInput, setTryInput] = useState<Record<string, string>>({});
  const [tryResult, setTryResult] = useState<any>(null);
  const [tryLoading, setTryLoading] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    const { data } = await supabase.from('connector_credentials').select('id,connector_id,status,last_tested_at');
    if (data) setSaved(data as any);
  };
  useEffect(() => { load(); }, []);

  const isConnected = (id: string) => saved.find(s => s.connector_id === id);
  const active = openId ? CONNECTORS.find(c => c.id === openId) : null;
  const tryConn = tryId ? CONNECTORS.find(c => c.id === tryId) : null;
  const tryActions = tryId ? (ACTIONS[tryId] || []) : [];
  const currentAction = tryActions.find(a => a.id === tryAction);

  const save = async () => {
    if (!openId || !apiKey.trim()) return;
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('connector-test', { body: { connector_id: openId, api_key: apiKey.trim() } });
      if (error) throw error;
      toast({ title: data.ok ? 'Connected' : 'Saved (test failed)', description: data.message, variant: data.ok ? 'default' : 'destructive' });
      setApiKey(''); setOpenId(null); load();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || String(e), variant: 'destructive' });
    } finally { setTesting(false); }
  };

  const disconnect = async (connector_id: string) => {
    await supabase.from('connector_credentials').delete().eq('connector_id', connector_id);
    toast({ title: 'Disconnected' });
    load();
  };

  const retest = async (connector_id: string) => {
    setTesting(true);
    try {
      const { data: row } = await supabase.from('connector_credentials').select('api_key').eq('connector_id', connector_id).maybeSingle();
      if (!row?.api_key) throw new Error('Stored key missing — reconnect.');
      const { data, error } = await supabase.functions.invoke('connector-test', { body: { connector_id, api_key: row.api_key } });
      if (error) throw error;
      toast({ title: data.ok ? 'Test passed' : 'Test failed', description: data.message, variant: data.ok ? 'default' : 'destructive' });
      load();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally { setTesting(false); }
  };

  const openTry = (id: string) => {
    const actions = ACTIONS[id] || [];
    setTryId(id);
    setTryAction(actions[0]?.id || '');
    setTryInput({});
    setTryResult(null);
  };

  const runAction = async () => {
    if (!tryId || !tryAction) return;
    setTryLoading(true); setTryResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('connector-invoke', {
        body: { connector_id: tryId, action: tryAction, input: tryInput },
      });
      if (error) throw error;
      setTryResult(data);
      if (!data.ok) toast({ title: 'Action failed', description: (data.error || `HTTP ${data.status}`).slice(0, 160), variant: 'destructive' });
      else toast({ title: 'Success', description: `HTTP ${data.status}` });
      load();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || String(e), variant: 'destructive' });
    } finally { setTryLoading(false); }
  };

  return (
    <div className="min-h-screen flex w-full bg-background dark:sunrise-gradient">
      <AppSidebar activeSection="" onSectionChange={() => {}} />
      <SidebarInset className="flex-1 flex flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-2 sm:px-4 bg-background/80 dark:bg-background/20 backdrop-blur-sm">
          <SidebarTrigger className="-ml-1" />
          <div className="ml-auto"><h1 className="text-lg sm:text-xl font-semibold">Connectors</h1></div>
        </header>

        <div className="flex-1 overflow-auto bg-gray-50/50 dark:bg-transparent">
          <div className="max-w-6xl mx-auto p-6 sm:p-8">
            <div className="mb-8 text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-3"><Share2 className="w-6 h-6 text-primary" /></div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-3">Integrations Marketplace</h1>
              <p className="text-base text-muted-foreground">Connect your accounts with API keys. Keys are stored securely and verified live.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {CONNECTORS.map((c) => {
                const conn = isConnected(c.id);
                return (
                  <Card key={c.id} className="group hover:shadow-lg transition-all border-border/50 bg-card/50 backdrop-blur-sm flex flex-col">
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <div className="p-2.5 bg-background rounded-xl border shadow-sm"><c.icon className="w-6 h-6 text-primary" /></div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="secondary" className="text-[10px] uppercase">{c.category}</Badge>
                          {conn && <Badge variant="outline" className={`text-[10px] gap-1 ${conn.status === 'connected' ? 'text-emerald-600 border-emerald-500/40' : 'text-orange-600 border-orange-500/40'}`}>
                            <CheckCircle2 className="h-3 w-3" />{conn.status}
                          </Badge>}
                        </div>
                      </div>
                      <CardTitle className="text-lg">{c.name}</CardTitle>
                      <CardDescription className="line-clamp-2 min-h-[40px]">{c.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="mt-auto pt-2 flex flex-wrap gap-2">
                      <Button className="flex-1 min-w-[110px] gap-2" variant={conn ? 'outline' : 'default'} onClick={() => { setOpenId(c.id); setApiKey(''); }}>
                        <KeyRound className="h-3.5 w-3.5" />{conn ? 'Update key' : 'Connect'}
                      </Button>
                      {conn && (
                        <>
                          {ACTIONS[c.id] && (
                            <Button variant="secondary" size="sm" className="gap-1" onClick={() => openTry(c.id)}>
                              <Play className="h-3.5 w-3.5" />Use
                            </Button>
                          )}
                          <Button variant="outline" size="sm" onClick={() => retest(c.id)} disabled={testing}>Test</Button>
                          <Button variant="ghost" size="icon" onClick={() => disconnect(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
        <Footer />

        <Dialog open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
          <DialogContent className="sm:max-w-[460px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">{active && <active.icon className="h-5 w-5 text-primary" />}Connect {active?.name}</DialogTitle>
              <DialogDescription>Paste your API key. We'll verify it with a live call before saving.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Input type="password" placeholder="API key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} autoFocus />
              {active?.help && <p className="text-[11px] text-muted-foreground">Get your key at <a className="underline" href={`https://${active.help}`} target="_blank" rel="noreferrer">{active.help}</a></p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenId(null)}>Cancel</Button>
              <Button onClick={save} disabled={testing || !apiKey.trim()} className="gap-2">
                {testing && <Loader2 className="h-4 w-4 animate-spin" />}{testing ? 'Verifying…' : 'Verify & Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!tryId} onOpenChange={(o) => !o && setTryId(null)}>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">{tryConn && <tryConn.icon className="h-5 w-5 text-primary" />}Use {tryConn?.name}</DialogTitle>
              <DialogDescription>Runs the action server-side using your stored key. The key never leaves the backend.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="flex flex-wrap gap-2">
                {tryActions.map(a => (
                  <Button key={a.id} size="sm" variant={tryAction === a.id ? 'default' : 'outline'} onClick={() => { setTryAction(a.id); setTryInput({}); setTryResult(null); }}>{a.label}</Button>
                ))}
              </div>
              {currentAction?.needs?.map(n => (
                <Input key={n.key} placeholder={n.placeholder} value={tryInput[n.key] || ''} onChange={(e) => setTryInput(v => ({ ...v, [n.key]: e.target.value }))} />
              ))}
              {tryResult && (
                <pre className="text-[11px] bg-muted/50 border rounded-md p-3 max-h-64 overflow-auto">
{JSON.stringify(tryResult, null, 2)}
                </pre>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTryId(null)}>Close</Button>
              <Button onClick={runAction} disabled={tryLoading || !tryAction} className="gap-2">
                {tryLoading && <Loader2 className="h-4 w-4 animate-spin" />}{tryLoading ? 'Running…' : 'Run action'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </div>
  );
};

export default Connectors;
