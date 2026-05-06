import React, { useEffect, useState } from 'react';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '../components/AppSidebar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { FolderOpen, Loader2, Trash2, Github, ExternalLink, FileCode, KeyRound, Plus, X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import Editor from '@monaco-editor/react';
import { useTheme } from '@/components/ThemeProvider';

interface ProjectFile { path: string; content: string; }
interface EnvVar { name: string; description?: string; example?: string; required?: boolean; }
interface GenProject {
  id: string;
  name: string;
  description: string | null;
  stack: string | null;
  files: ProjectFile[];
  env_vars: EnvVar[];
  repo_full_name: string | null;
  pr_url: string | null;
  created_at: string;
}
interface ProjEnv { id: string; key: string; value: string; }

const langFromPath = (p: string) => {
  const ext = p.split('.').pop()?.toLowerCase();
  const m: Record<string, string> = { js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript', py: 'python', go: 'go', rs: 'rust', html: 'html', css: 'css', json: 'json', md: 'markdown', sql: 'sql', sh: 'shell', yml: 'yaml', yaml: 'yaml' };
  return m[ext || ''] || 'plaintext';
};

const Projects: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { actualTheme } = useTheme();
  const [projects, setProjects] = useState<GenProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<GenProject | null>(null);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [envs, setEnvs] = useState<ProjEnv[]>([]);
  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');

  const load = async () => {
    if (!user) { setLoading(false); return; }
    const { data, error } = await supabase
      .from('generated_projects' as any)
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast({ title: 'Failed to load', description: error.message, variant: 'destructive' });
    else setProjects((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel('gen-projects')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'generated_projects', filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, [user?.id]);

  const openProject = async (p: GenProject) => {
    setActive(p);
    setSelectedFile(p.files?.[0] || null);
    const { data } = await supabase.from('project_envs' as any).select('id,key,value').eq('project_id', p.id);
    const existing: ProjEnv[] = (data as any) ?? [];
    // Seed missing required envs from definitions
    const seeded = [...existing];
    for (const ev of (p.env_vars || [])) {
      if (!seeded.find(e => e.key === ev.name)) {
        seeded.push({ id: '', key: ev.name, value: '' });
      }
    }
    setEnvs(seeded);
  };

  const removeProject = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    await supabase.from('generated_projects' as any).delete().eq('id', id);
    setActive(null);
    load();
  };

  const saveEnv = async (key: string, value: string) => {
    if (!active || !user) return;
    const existing = envs.find(e => e.key === key && e.id);
    if (existing) {
      await supabase.from('project_envs' as any).update({ value }).eq('id', existing.id);
    } else {
      const { data } = await supabase.from('project_envs' as any).insert({
        project_id: active.id, user_id: user.id, key, value,
      } as any).select('id').single();
      setEnvs(prev => prev.map(e => e.key === key ? { ...e, id: (data as any)?.id || '', value } : e));
      return;
    }
    setEnvs(prev => prev.map(e => e.key === key ? { ...e, value } : e));
  };

  const addEnv = async () => {
    if (!newKey.trim() || !active || !user) return;
    const { data, error } = await supabase.from('project_envs' as any).insert({
      project_id: active.id, user_id: user.id, key: newKey.trim(), value: newVal,
    } as any).select('id,key,value').single();
    if (error) { toast({ title: 'Failed', description: error.message, variant: 'destructive' }); return; }
    setEnvs(prev => [...prev, data as any]);
    setNewKey(''); setNewVal('');
  };

  const removeEnv = async (e: ProjEnv) => {
    if (e.id) await supabase.from('project_envs' as any).delete().eq('id', e.id);
    setEnvs(prev => prev.filter(x => x.key !== e.key));
  };

  if (active) {
    return (
      <div className="min-h-screen flex w-full bg-background dark:sunrise-gradient">
        <AppSidebar activeSection="projects" onSectionChange={() => {}} />
        <SidebarInset className="flex-1 flex flex-col">
          <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-3">
            <SidebarTrigger className="-ml-1" />
            <Button variant="ghost" size="sm" onClick={() => setActive(null)} className="gap-1">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <span className="font-semibold truncate">{active.name}</span>
            <div className="ml-auto flex items-center gap-2">
              {active.pr_url && (
                <a href={active.pr_url} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-1 text-primary">
                  <Github className="h-3.5 w-3.5" /> View PR <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <Button variant="ghost" size="icon" onClick={() => removeProject(active.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </header>
          <div className="flex-1 grid grid-cols-12 overflow-hidden">
            <aside className="col-span-3 border-r border-border overflow-y-auto bg-muted/20">
              <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase">Files</div>
              {(active.files || []).map(f => (
                <button
                  key={f.path}
                  onClick={() => setSelectedFile(f)}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted truncate flex items-center gap-1.5 ${selectedFile?.path === f.path ? 'bg-primary/10 text-primary' : ''}`}
                >
                  <FileCode className="h-3 w-3 shrink-0" />
                  {f.path}
                </button>
              ))}
              <div className="px-3 py-2 mt-3 text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <KeyRound className="h-3 w-3" /> Env Variables
              </div>
              <div className="px-3 space-y-1.5 pb-4">
                {envs.map(e => (
                  <div key={e.key} className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-muted-foreground truncate">{e.key}</span>
                      <button onClick={() => removeEnv(e)} className="opacity-50 hover:opacity-100">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <Input
                      type="password"
                      value={e.value}
                      onChange={(ev) => setEnvs(prev => prev.map(x => x.key === e.key ? { ...x, value: ev.target.value } : x))}
                      onBlur={(ev) => saveEnv(e.key, ev.target.value)}
                      className="h-7 text-xs"
                      placeholder="value"
                    />
                  </div>
                ))}
                <div className="pt-2 border-t border-border space-y-1">
                  <Input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="KEY" className="h-7 text-xs font-mono" />
                  <Input value={newVal} onChange={(e) => setNewVal(e.target.value)} placeholder="value" className="h-7 text-xs" />
                  <Button size="sm" className="w-full h-7 text-xs gap-1" onClick={addEnv} disabled={!newKey.trim()}>
                    <Plus className="h-3 w-3" /> Add env
                  </Button>
                </div>
              </div>
            </aside>
            <main className="col-span-9 overflow-hidden">
              {selectedFile ? (
                <Editor
                  height="100%"
                  language={langFromPath(selectedFile.path)}
                  value={selectedFile.content}
                  theme={actualTheme === 'dark' ? 'vs-dark' : 'vs-light'}
                  options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13 }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Select a file</div>
              )}
            </main>
          </div>
          <Footer />
        </SidebarInset>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full bg-background dark:sunrise-gradient">
      <AppSidebar activeSection="projects" onSectionChange={() => {}} />
      <SidebarInset className="flex-1 flex flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-2 sm:px-4 bg-background/80 dark:bg-background/20 backdrop-blur-sm">
          <SidebarTrigger className="-ml-1" />
          <div className="ml-auto"><h1 className="text-lg sm:text-xl font-semibold">Projects</h1></div>
        </header>
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-1">Generated Projects</h2>
              <p className="text-sm text-muted-foreground">AI-generated scaffolds from prompts and scheduled tasks.</p>
            </div>

            {!user ? (
              <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Sign in to view projects.</CardContent></Card>
            ) : loading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : projects.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
                No projects yet. Generate from the home page or schedule a generation task.
              </CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((p) => (
                  <Card key={p.id} onClick={() => openProject(p)} className="dark:bg-card/40 hover:border-primary/40 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <FolderOpen className="h-5 w-5 text-primary" />
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <h3 className="font-semibold text-sm mb-1 line-clamp-1">{p.name}</h3>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2 min-h-[32px]">{p.description || p.stack || 'No description'}</p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary" className="text-[10px]">{(p.files || []).length} files</Badge>
                        {p.stack && <Badge variant="outline" className="text-[10px]">{p.stack}</Badge>}
                        {p.repo_full_name && <Badge variant="outline" className="text-[10px] gap-1"><Github className="h-2.5 w-2.5" />{p.repo_full_name.split('/')[1]}</Badge>}
                        {p.pr_url && <Badge className="text-[10px]">PR</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
        <Footer />
      </SidebarInset>
    </div>
  );
};

export default Projects;
