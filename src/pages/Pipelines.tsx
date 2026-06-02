import React, { useEffect, useState } from 'react';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '../components/AppSidebar';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { GitBranch, Play, Plus, CheckCircle2, XCircle, Loader2, Trash2, Workflow, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Step { name: string; command: string; status?: string; log?: string }
interface Pipeline { id: string; name: string; repo_full_name: string | null; steps: Step[]; created_at: string }
interface Run { id: string; pipeline_id: string; status: string; logs: string; steps: Step[]; created_at: string; finished_at: string | null }

const DEFAULT_STEPS = `install: npm install
test: npm test --silent
build: npm run build`;

const Pipelines: React.FC = () => {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [repo, setRepo] = useState('');
  const [stepsText, setStepsText] = useState(DEFAULT_STEPS);
  const [running, setRunning] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<Run | null>(null);
  const { toast } = useToast();

  const load = async () => {
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from('pipelines').select('*').order('created_at', { ascending: false }),
      supabase.from('pipeline_runs').select('*').order('created_at', { ascending: false }).limit(40),
    ]);
    setPipelines((p as any) || []);
    setRuns((r as any) || []);
  };
  useEffect(() => { load(); }, []);

  const parseSteps = (text: string): Step[] =>
    text.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
      const idx = line.indexOf(':');
      if (idx === -1) return { name: 'step', command: line };
      return { name: line.slice(0, idx).trim(), command: line.slice(idx + 1).trim() };
    });

  const create = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast({ title: 'Sign in required', variant: 'destructive' }); return; }
    const steps = parseSteps(stepsText);
    if (!name.trim() || steps.length === 0) { toast({ title: 'Add a name and at least one step', variant: 'destructive' }); return; }
    const { error } = await supabase.from('pipelines').insert([{ user_id: user.id, name: name.trim(), repo_full_name: repo.trim() || null, steps: steps as any }]);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    setCreating(false); setName(''); setRepo(''); setStepsText(DEFAULT_STEPS); load();
  };

  const triggerRun = async (id: string) => {
    setRunning(id);
    try {
      const { data, error } = await supabase.functions.invoke('pipeline-run', { body: { pipeline_id: id } });
      if (error) throw error;
      toast({ title: data?.ok ? 'Pipeline succeeded' : 'Pipeline failed', variant: data?.ok ? 'default' : 'destructive' });
      load();
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setRunning(null); }
  };

  const remove = async (id: string) => {
    await supabase.from('pipelines').delete().eq('id', id);
    load();
  };

  const runsByPipeline = (id: string) => runs.filter(r => r.pipeline_id === id).slice(0, 3);

  const statusBadge = (s: string) => {
    if (s === 'success') return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1"><CheckCircle2 className="h-3 w-3" />success</Badge>;
    if (s === 'failed') return <Badge className="bg-destructive/15 text-destructive border-destructive/30 gap-1"><XCircle className="h-3 w-3" />failed</Badge>;
    if (s === 'running') return <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/30 gap-1"><Loader2 className="h-3 w-3 animate-spin" />running</Badge>;
    return <Badge variant="outline">{s}</Badge>;
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar activeSection="" onSectionChange={() => {}} />
      <SidebarInset className="flex-1 flex flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-lg sm:text-xl font-semibold ml-auto">CI / CD Pipelines</h1>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <div className="inline-flex p-2 bg-primary/10 rounded-full mb-2"><Workflow className="w-6 h-6 text-primary" /></div>
                <h2 className="text-2xl font-bold">Pipelines</h2>
                <p className="text-sm text-muted-foreground">Define build/test/deploy steps. AI runner executes them and records logs — CircleCI-style.</p>
              </div>
              <Button onClick={() => setCreating(true)} className="gap-2"><Plus className="h-4 w-4" />New pipeline</Button>
            </div>

            {pipelines.length === 0 ? (
              <Card className="p-12 text-center text-muted-foreground">
                <Workflow className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>No pipelines yet. Create one to get started.</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pipelines.map(p => (
                  <Card key={p.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2"><GitBranch className="h-4 w-4 text-primary" />{p.name}</CardTitle>
                          <CardDescription>{p.repo_full_name || 'no repo linked'} · {p.steps.length} steps</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => triggerRun(p.id)} disabled={running === p.id} className="gap-2">
                            {running === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Run
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {p.steps.map((s, i) => (
                          <Badge key={i} variant="secondary" className="font-mono text-[11px]">{s.name}: {s.command}</Badge>
                        ))}
                      </div>
                      {runsByPipeline(p.id).length > 0 && (
                        <div className="border-t pt-3 space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Recent runs</p>
                          {runsByPipeline(p.id).map(r => (
                            <button key={r.id} onClick={() => setSelectedRun(r)} className="w-full flex items-center justify-between gap-2 text-xs px-2 py-1.5 rounded hover:bg-accent">
                              <div className="flex items-center gap-2">{statusBadge(r.status)}<Clock className="h-3 w-3 opacity-50" /><span className="text-muted-foreground">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span></div>
                              <span className="text-muted-foreground underline">View logs</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
        <Footer />

        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle>New pipeline</DialogTitle>
              <DialogDescription>Define steps as <code>name: command</code> on each line.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Input placeholder="Pipeline name (e.g. CI – main)" value={name} onChange={e => setName(e.target.value)} />
              <Input placeholder="GitHub repo (optional, owner/name)" value={repo} onChange={e => setRepo(e.target.value)} />
              <Textarea rows={8} className="font-mono text-xs" value={stepsText} onChange={e => setStepsText(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
              <Button onClick={create}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!selectedRun} onOpenChange={(o) => !o && setSelectedRun(null)}>
          <DialogContent className="sm:max-w-[760px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">Run logs {selectedRun && statusBadge(selectedRun.status)}</DialogTitle>
            </DialogHeader>
            <pre className="bg-[#0a0a0a] text-emerald-300 text-[11px] font-mono p-4 rounded max-h-[500px] overflow-auto whitespace-pre-wrap">{selectedRun?.logs || '(no logs)'}</pre>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </div>
  );
};

export default Pipelines;
