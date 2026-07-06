import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '../components/AppSidebar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, CheckCircle, XCircle, AlertTriangle, Loader2, Sparkles, Shield, Activity, FileCode, FolderOpen, ExternalLink, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { realCheckService } from '@/services/realCheckService';
import { Check } from '@/types/check';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface TaskRow { id: string; title: string; status: string; created_at: string; completed_at: string | null; }
interface ScanRow { id: string; url: string; grade: string | null; score: number | null; status: string; created_at: string; }
interface GenRow { id: string; name: string; description: string | null; stack: string | null; files: unknown; created_at: string; repo_full_name: string | null; }

const History: React.FC = () => {
  const navigate = useNavigate();
  const [checks, setChecks] = useState<Check[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [scans, setScans] = useState<ScanRow[]>([]);
  const [gens, setGens] = useState<GenRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [c, t, s, g] = await Promise.all([
        realCheckService.getChecks(),
        supabase.from('tasks').select('id,title,status,created_at,completed_at').order('created_at', { ascending: false }).limit(100),
        supabase.from('security_scans').select('id,url,grade,score,status,created_at').order('created_at', { ascending: false }).limit(100),
        supabase.from('generated_projects' as any).select('id,name,description,stack,files,created_at,repo_full_name').order('created_at', { ascending: false }).limit(100),
      ]);
      if (cancelled) return;
      setChecks(c);
      setTasks((t.data as any) || []);
      setScans((s.data as any) || []);
      setGens((g.data as any) || []);
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

  const deleteRow = async (table: 'tasks' | 'security_scans' | 'generated_projects', id: string) => {
    if (!confirm('Delete this item?')) return;
    const { error } = await supabase.from(table as any).delete().eq('id', id);
    if (error) return;
    if (table === 'tasks') setTasks(p => p.filter(x => x.id !== id));
    else if (table === 'security_scans') setScans(p => p.filter(x => x.id !== id));
    else setGens(p => p.filter(x => x.id !== id));
  };

  const deleteCheck = async (id: string) => {
    if (!confirm('Delete this check?')) return;
    await supabase.from('checks' as any).delete().eq('id', id);
    setChecks(p => p.filter(x => x.id !== id));
  };


  const fileCount = (files: unknown): number => Array.isArray(files) ? files.length : 0;

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
              <p className="text-sm text-muted-foreground">Home-page generations, checks, tasks and security scans.</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : (
              <Tabs defaultValue="generations">
                <TabsList className="flex-wrap h-auto">
                  <TabsTrigger value="generations" className="gap-1.5"><FolderOpen className="h-3.5 w-3.5" />Generations ({gens.length})</TabsTrigger>
                  <TabsTrigger value="tasks" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" />Tasks ({tasks.length})</TabsTrigger>
                  <TabsTrigger value="checks" className="gap-1.5"><Activity className="h-3.5 w-3.5" />Checks ({checks.length})</TabsTrigger>
                  <TabsTrigger value="scans" className="gap-1.5"><Shield className="h-3.5 w-3.5" />Scans ({scans.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="generations" className="space-y-3 mt-4">
                  {gens.length === 0 ? (
                    <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No generations yet. Type a prompt on the home page to create one.</CardContent></Card>
                  ) : gens.map(g => (
                    <Card key={g.id} className="hover:border-primary/40 transition-colors">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FileCode className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{g.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {formatDistanceToNow(new Date(g.created_at), { addSuffix: true })}
                            {g.stack ? ` · ${g.stack}` : ''}
                            {` · ${fileCount(g.files)} files`}
                          </p>
                        </div>
                        {g.repo_full_name && (
                          <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">{g.repo_full_name}</Badge>
                        )}
                        <Button
                          size="sm"
                          className="gap-1.5 h-8 shrink-0"
                          onClick={() => navigate(`/projects?open=${g.id}`)}
                        >
                          <span className="text-xs">Open</span>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => deleteRow('generated_projects', g.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="tasks" className="space-y-3 mt-4">
                  {tasks.length === 0 ? (
                    <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No scheduled tasks yet.</CardContent></Card>
                  ) : tasks.map(t => (
                    <Card key={t.id}><CardContent className="p-4 flex items-center gap-3">
                      {statusIcon(t.status)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{t.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">{t.status}</Badge>
                      <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => deleteRow('tasks', t.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </CardContent></Card>
                  ))}
                </TabsContent>

                <TabsContent value="checks" className="space-y-3 mt-4">
                  {checks.length === 0 ? (
                    <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No checks yet.</CardContent></Card>
                  ) : checks.map(item => (
                    <Card key={item.id}><CardContent className="p-4 flex items-center gap-3">
                      {statusIcon(item.status)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.url}</p>
                        <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}{item.statusCode ? ` · ${item.statusCode}` : ''}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">{item.status}</Badge>
                      <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => deleteCheck(item.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
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
                      <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => deleteRow('security_scans', s.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
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

