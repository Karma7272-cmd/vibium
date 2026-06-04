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
import { GitBranch, Play, Plus, CheckCircle2, XCircle, Loader2, Trash2, Workflow, Clock, Sparkles, Wand2 } from 'lucide-react';
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
  const [aiGoal, setAiGoal] = useState('');
  const [aiStack, setAiStack] = useState('');
  const [generating, setGenerating] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
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

  const generateWithAI = async () => {
    if (!aiGoal.trim()) { toast({ title: 'Describe your pipeline goal', variant: 'destructive' }); return; }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('pipeline-ai', {
        body: { mode: 'generate', goal: aiGoal, repo, stack: aiStack },
      });
      if (error) throw error;
      const steps = (data?.steps || []) as Step[];
      if (!steps.length) throw new Error('AI returned no steps');
      setStepsText(steps.map(s => `${s.name}: ${s.command}`).join('\n'));
      if (!name) setName(aiGoal.slice(0, 40));
      toast({ title: 'AI generated pipeline steps' });
    } catch (e: any) { toast({ title: 'AI error', description: e.message, variant: 'destructive' }); }
    finally { setGenerating(false); }
  };

  const analyzeRun = async (runId: string) => {
    setAnalyzing(true); setAnalysis('');
    try {
      const { data, error } = await supabase.functions.invoke('pipeline-ai', { body: { mode: 'analyze', run_id: runId } });
      if (error) throw error;
      setAnalysis(data?.analysis || 'No analysis');
    } catch (e: any) { toast({ title: 'AI error', description: e.message, variant: 'destructive' }); }
    finally { setAnalyzing(false); }
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
                <p className="text-sm text-muted-foreground">AI-powered CI/CD. Describe what to ship, AI drafts the pipeline, runs it, and analyzes failures.</p>
              </div>
              <Button onClick={() => setCreating(true)} className="gap-2"><Sparkles className="h-4 w-4" />New AI pipeline</Button>
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

        <Dialog open={creating} onOpenChange={(o) => { setCreating(o); if (!o) { setAiGoal(''); setAiStack(''); } }}>
          <DialogContent className="sm:max-w-[620px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />New AI pipeline</DialogTitle>
              <DialogDescription>Describe what you want to ship — AI drafts the steps. Or write them manually below.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary"><Wand2 className="h-3 w-3" />AI assist</div>
                <Textarea rows={2} placeholder="Ask to write… e.g. Lint, test, build a Vite React app, deploy to Vercel on main" value={aiGoal} onChange={e => setAiGoal(e.target.value)} />
                <div className="flex gap-2">
                  <Input placeholder="Stack hint (optional: node, python, go…)" value={aiStack} onChange={e => setAiStack(e.target.value)} />
                  <Button onClick={generateWithAI} disabled={generating} className="gap-2 shrink-0">
                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Generate
                  </Button>
                </div>
              </div>
              <Input placeholder="Pipeline name (e.g. CI – main)" value={name} onChange={e => setName(e.target.value)} />
              <Input placeholder="GitHub repo (optional, owner/name)" value={repo} onChange={e => setRepo(e.target.value)} />
              <Textarea rows={8} className="font-mono text-xs" value={stepsText} onChange={e => setStepsText(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
              <Button onClick={create}>Create pipeline</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!selectedRun} onOpenChange={(o) => { if (!o) { setSelectedRun(null); setAnalysis(''); } }}>
          <DialogContent className="sm:max-w-[780px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 justify-between">
                <span className="flex items-center gap-2">Run logs {selectedRun && statusBadge(selectedRun.status)}</span>
                {selectedRun && (
                  <Button size="sm" variant="outline" onClick={() => analyzeRun(selectedRun.id)} disabled={analyzing} className="gap-2 mr-6">
                    {analyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} AI analyze
                  </Button>
                )}
              </DialogTitle>
            </DialogHeader>
            {analysis && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs whitespace-pre-wrap mb-2">{analysis}</div>
            )}
            <pre className="bg-[#0a0a0a] text-emerald-300 text-[11px] font-mono p-4 rounded max-h-[460px] overflow-auto whitespace-pre-wrap">{selectedRun?.logs || '(no logs)'}</pre>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </div>
  );
};

export default Pipelines;
