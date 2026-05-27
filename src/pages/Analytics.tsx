import React, { useEffect, useMemo, useState } from 'react';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '../components/AppSidebar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Plus, Copy, Trash2, Eye, Globe, Activity, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import Editor from '@monaco-editor/react';

interface Site { id: string; tracking_id: string; name: string; domain: string; created_at: string; }
interface Event { id: string; path: string | null; referrer: string | null; user_agent: string | null; created_at: string; }

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const Analytics: React.FC = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [selected, setSelected] = useState<Site | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const { toast } = useToast();

  const loadSites = async () => {
    const { data } = await supabase.from('analytics_sites').select('*').order('created_at', { ascending: false });
    if (data) {
      setSites(data as any);
      if (data.length && !selected) setSelected(data[0] as any);
    }
  };

  const loadEvents = async (siteId: string) => {
    const { data } = await supabase.from('analytics_events').select('*').eq('site_id', siteId).order('created_at', { ascending: false }).limit(500);
    if (data) setEvents(data as any);
  };

  useEffect(() => { loadSites(); }, []);
  useEffect(() => { if (selected) loadEvents(selected.id); }, [selected?.id]);

  const addSite = async () => {
    if (!name.trim() || !domain.trim()) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { toast({ title: 'Sign in required', variant: 'destructive' }); return; }
    const { data, error } = await supabase.from('analytics_sites').insert({ user_id: u.user.id, name: name.trim(), domain: domain.trim() }).select().single();
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Site added' });
    setName(''); setDomain(''); setShowAdd(false);
    setSelected(data as any);
    loadSites();
  };

  const deleteSite = async (id: string) => {
    await supabase.from('analytics_sites').delete().eq('id', id);
    if (selected?.id === id) setSelected(null);
    loadSites();
  };

  const snippet = useMemo(() => {
    if (!selected) return '';
    return `<!-- Vibium Analytics -->
<script>
(function(){
  var t='${selected.tracking_id}';
  var u='${SUPABASE_URL}/functions/v1/analytics-ingest';
  var s=sessionStorage.getItem('_vbm_s')||(Math.random().toString(36).slice(2)+Date.now());
  sessionStorage.setItem('_vbm_s',s);
  function send(){
    fetch(u,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      tracking_id:t,event_type:'pageview',path:location.pathname+location.search,
      referrer:document.referrer,screen:screen.width+'x'+screen.height,session_id:s
    })}).catch(function(){});
  }
  send();
  var p=history.pushState;history.pushState=function(){p.apply(this,arguments);send();};
  window.addEventListener('popstate',send);
})();
</script>`;
  }, [selected]);

  const stats = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayEvents = events.filter(e => new Date(e.created_at) >= today);
    const sessions = new Set(events.map(e => (e as any).session_id).filter(Boolean));
    const topPaths = events.reduce((acc: Record<string, number>, e) => { if (e.path) acc[e.path] = (acc[e.path] || 0) + 1; return acc; }, {});
    const topRefs = events.reduce((acc: Record<string, number>, e) => { if (e.referrer) { try { const h = new URL(e.referrer).hostname; acc[h] = (acc[h] || 0) + 1; } catch {} } return acc; }, {});
    return {
      total: events.length,
      today: todayEvents.length,
      sessions: sessions.size,
      topPaths: Object.entries(topPaths).sort((a, b) => b[1] - a[1]).slice(0, 5),
      topRefs: Object.entries(topRefs).sort((a, b) => b[1] - a[1]).slice(0, 5),
    };
  }, [events]);

  return (
    <div className="min-h-screen flex w-full bg-background dark:sunrise-gradient">
      <AppSidebar activeSection="analytics" onSectionChange={() => {}} />
      <SidebarInset className="flex-1 flex flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-2 sm:px-4 bg-background/80 dark:bg-background/20 backdrop-blur-sm">
          <SidebarTrigger className="-ml-1" />
          <div className="ml-auto"><h1 className="text-lg sm:text-xl font-semibold">Analytics</h1></div>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold">Website Analytics</h2>
                <p className="text-sm text-muted-foreground">Add your sites and paste the tracking snippet to view live data.</p>
              </div>
              <Button onClick={() => setShowAdd(true)} className="gap-2"><Plus className="h-4 w-4" />Add site</Button>
            </div>

            {sites.length === 0 ? (
              <Card><CardContent className="p-12 text-center">
                <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">No sites yet. Add one to get your tracking snippet.</p>
              </CardContent></Card>
            ) : (
              <>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {sites.map(s => (
                    <button key={s.id} onClick={() => setSelected(s)}
                      className={`group flex items-center gap-2 px-3 py-2 rounded-lg border text-sm whitespace-nowrap ${selected?.id === s.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/30'}`}>
                      <Globe className="h-3.5 w-3.5" /> {s.name}
                      <Trash2 onClick={(e) => { e.stopPropagation(); deleteSite(s.id); }}
                        className="h-3 w-3 opacity-0 group-hover:opacity-100 hover:text-destructive" />
                    </button>
                  ))}
                </div>

                {selected && (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Total events', value: stats.total, icon: Activity },
                        { label: 'Today', value: stats.today, icon: BarChart3 },
                        { label: 'Sessions', value: stats.sessions, icon: Users },
                        { label: 'Tracking ID', value: selected.tracking_id.slice(0, 12) + '…', icon: Eye },
                      ].map((s, i) => {
                        const Icon = s.icon;
                        return (
                          <Card key={i}><CardContent className="p-4">
                            <Icon className="h-4 w-4 text-muted-foreground mb-2" />
                            <p className="text-xl font-bold truncate">{s.value}</p>
                            <p className="text-[10px] text-muted-foreground">{s.label}</p>
                          </CardContent></Card>
                        );
                      })}
                    </div>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Tracking Snippet</CardTitle>
                        <Button size="sm" variant="outline" className="gap-2" onClick={() => { navigator.clipboard.writeText(snippet); toast({ title: 'Copied!' }); }}>
                          <Copy className="h-3.5 w-3.5" />Copy
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground mb-3">Paste this just before <code className="bg-muted px-1 rounded">&lt;/body&gt;</code> on every page of <strong>{selected.domain}</strong>.</p>
                        <div className="border rounded-lg overflow-hidden" style={{ height: 260 }}>
                          <Editor
                            height="260px"
                            defaultLanguage="html"
                            value={snippet}
                            options={{
                              readOnly: true,
                              minimap: { enabled: false },
                              scrollBeyondLastLine: false,
                              wordWrap: 'on',
                              fontSize: 12,
                              lineNumbers: 'on',
                              folding: false,
                              renderLineHighlight: 'none',
                              overviewRulerLanes: 0,
                              hideCursorInOverviewRuler: true,
                              scrollbar: { vertical: 'auto', horizontal: 'auto' },
                            }}
                            theme="vs-dark"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card><CardHeader><CardTitle className="text-base">Top Pages</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                          {stats.topPaths.length === 0 && <p className="text-xs text-muted-foreground">No data yet.</p>}
                          {stats.topPaths.map(([p, c]) => (
                            <div key={p} className="flex justify-between text-sm"><span className="truncate font-mono text-xs">{p}</span><Badge variant="secondary">{c}</Badge></div>
                          ))}
                        </CardContent>
                      </Card>
                      <Card><CardHeader><CardTitle className="text-base">Top Referrers</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                          {stats.topRefs.length === 0 && <p className="text-xs text-muted-foreground">No data yet.</p>}
                          {stats.topRefs.map(([h, c]) => (
                            <div key={h} className="flex justify-between text-sm"><span className="truncate">{h}</span><Badge variant="secondary">{c}</Badge></div>
                          ))}
                        </CardContent>
                      </Card>
                    </div>

                    <Card><CardHeader><CardTitle className="text-base">Recent Events</CardTitle></CardHeader>
                      <CardContent>
                        <div className="space-y-1 max-h-80 overflow-auto">
                          {events.length === 0 && <p className="text-xs text-muted-foreground">Waiting for first event…</p>}
                          {events.slice(0, 50).map(e => (
                            <div key={e.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border/50 last:border-0">
                              <span className="font-mono truncate">{e.path || '/'}</span>
                              <span className="text-muted-foreground shrink-0 ml-2">{new Date(e.created_at).toLocaleTimeString()}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </>
            )}
          </div>
        </div>
        <Footer />

        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader><DialogTitle>Add a site</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <Input placeholder="Site name (e.g. My Blog)" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="example.com" value={domain} onChange={(e) => setDomain(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={addSite} disabled={!name.trim() || !domain.trim()}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </div>
  );
};

export default Analytics;
