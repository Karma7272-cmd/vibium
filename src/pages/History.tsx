import React, { useEffect, useState } from 'react';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '../components/AppSidebar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, CheckCircle, XCircle, AlertTriangle, Loader2, Sparkles, Shield, Workflow, FolderOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface TaskRow { id: string; title: string; status: string; created_at: string; completed_at: string | null; }
interface ScanRow { id: string; url: string; grade: string | null; score: number | null; status: string; created_at: string; }
interface RunRow { id: string; status: string; created_at: string; finished_at: string | null; pipeline_id: string; }
interface ProjectRow { id: string; name: string; created_at: string; pr_url: string | null; }

const History: React.FC = () => {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [scans, setScans] = useState<ScanRow[]>([]);
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [t, s, r, p] = await Promise.all([
        supabase.from('tasks').select('id,title,status,created_at,completed_at').order('created_at', { ascending: false }).limit(100),
        supabase.from('security_scans').select('id,url,grade,score,status,created_at').order('created_at', { ascending: false }).limit(100),
        supabase.from('pipeline_runs').select('id,status,created_at,finished_at,pipeline_id').order('created_at', { ascending: false }).limit(100),
        supabase.from('generated_projects').select('id,name,created_at,pr_url').order('created_at', { ascending: false }).limit(100),
      ]);
      if (cancelled) return;
      setTasks((t.data as any) || []);
      setScans((s.data as any) || []);
      setRuns((r.data as any) || []);
      setProjects((p.data as any) || []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const statusIcon = (status: string) => {
    switch (status) {
      case 'success':
      case 'completed': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-background dark:sunrise-gradient">
      <AppSidebar activeSection="history" onSectionChange={() => {}} />
      <SidebarInset className="flex-1 flex flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-2 sm:px-4 bg-background/80 dark:bg-background/20 backdrop-blur-sm">
          <SidebarTrigger className="-ml-1" />
          <div className="ml-auto"><h1 className="text-lg sm:text-xl font-semibold">History</h1></div>
        </header>
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-1">Activity History</h2>
              <p className="text-sm text-muted-foreground">Generations, projects, pipeline runs, and security scans.</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : (
              <Tabs defaultValue="generations">
                <TabsList>
                  <TabsTrigger value="generations" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" />Generations ({tasks.length})</TabsTrigger>
                  <TabsTrigger value="projects" className="gap-1.5"><FolderOpen className="h-3.5 w-3.5" />Projects ({projects.length})</TabsTrigger>
                  <TabsTrigger value="pipelines" className="gap-1.5"><Workflow className="h-3.5 w-3.5" />Pipeline Runs ({runs.length})</TabsTrigger>
                  <TabsTrigger value="scans" className="gap-1.5"><Shield className="h-3.5 w-3.5" />Security ({scans.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="generations" className="space-y-3 mt-4">
                  {tasks.length === 0 ? (
                    <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No AI generations yet. Try the Code AI page.</CardContent></Card>
                  ) : tasks.map(t => (
                    <Card key={t.id}><CardContent className="p-4 flex items-center gap-3">
                      {statusIcon(t.status)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{t.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">{t.status}</Badge>
                    </CardContent></Card>
                  ))}
                </TabsContent>

                <TabsContent value="projects" className="space-y-3 mt-4">
                  {projects.length === 0 ? (
                    <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No generated projects yet.</CardContent></Card>
                  ) : projects.map(p => (
                    <Card key={p.id}><CardContent className="p-4 flex items-center gap-3">
                      <FolderOpen className="h-4 w-4 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</p>
                      </div>
                      {p.pr_url && <a href={p.pr_url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">PR</a>}
                    </CardContent></Card>
                  ))}
                </TabsContent>

                <TabsContent value="pipelines" className="space-y-3 mt-4">
                  {runs.length === 0 ? (
                    <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No pipeline runs yet.</CardContent></Card>
                  ) : runs.map(r => (
                    <Card key={r.id}><CardContent className="p-4 flex items-center gap-3">
                      {statusIcon(r.status)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">Run {r.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">{r.status}</Badge>
                    </CardContent></Card>
                  ))}
                </TabsContent>

                <TabsContent value="scans" className="space-y-3 mt-4">
                  {scans.length === 0 ? (
                    <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No security scans yet.</CardContent></Card>
                  ) : scans.map(s => (
                    <Card key={s.id}><CardContent className="p-4 flex items-center gap-3">
                      {statusIcon(s.status)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.url}</p>
                        <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}{s.score != null ? ` · score ${s.score}` : ''}</p>
                      </div>
                      {s.grade && <Badge variant="outline" className="text-xs">Grade {s.grade}</Badge>}
                    </CardContent></Card>
                  ))}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
        <Footer />
      </SidebarInset>
    </div>
  );
};

export default History;
