import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '../components/AppSidebar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { FolderOpen, Trash2, Github, ExternalLink, FileCode, KeyRound, Plus, X, ArrowLeft, Upload, GitPullRequest, CheckCircle2, Lock, Database, Users, Save, Eye } from 'lucide-react';
import { LoadingState } from '@/components/ui/LoadingState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import {
  setGitHubToken, createRepo, commitAndPush, createBranch, createPullRequest,
} from '@/services/githubService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import Editor from '@monaco-editor/react';
import { useTheme } from '@/components/ThemeProvider';
import { WebContainerRunner } from '@/components/generate/WebContainerRunner';
import { DatabasePanel } from '@/components/generate/DatabasePanel';
import { useCollaboration } from '@/hooks/useCollaboration';

interface ProjectFile { path: string; content: string; }
interface EnvVar { name: string; description?: string; example?: string; required?: boolean; }
interface GenProject {
  id: string;
  user_id: string;
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
  const { id: routeId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState<GenProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<GenProject | null>(null);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [envs, setEnvs] = useState<ProjEnv[]>([]);
  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');
  const [pushing, setPushing] = useState(false);
  const [repoName, setRepoName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [showPushForm, setShowPushForm] = useState(false);
  const [showDb, setShowDb] = useState(false);
  const [dirtyFiles, setDirtyFiles] = useState<Record<string, string>>({});
  const [savingFiles, setSavingFiles] = useState(false);

  const { roleForOwner, canEdit, canDelete } = useCollaboration();
  const activeRole = active ? roleForOwner(active.user_id) : null;
  const activeCanEdit = active ? canEdit(active.user_id) : false;
  const activeCanDelete = active ? canDelete(active.user_id) : false;

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

  // Auto-open project from route param /:id or ?open=<id> (e.g. from History/Home).
  useEffect(() => {
    const projectId = routeId || searchParams.get('open');
    if (!projectId || active || projects.length === 0) return;
    const target = projects.find(p => p.id === projectId);
    if (target) {
      openProject(target);
      // If we opened via legacy query param, replace with the clean direct URL.
      if (searchParams.get('open')) {
        searchParams.delete('open');
        navigate(`/projects/${projectId}`, { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, routeId, searchParams]);

  // Realtime — covers own and shared projects (RLS decides what we can see)
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel('gen-projects')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'generated_projects' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, [user?.id]);

  const openProject = async (p: GenProject) => {
    setActive(p);
    setSelectedFile(p.files?.[0] || null);
    setDirtyFiles({});
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

  const saveFiles = async () => {
    if (!active || !activeCanEdit || Object.keys(dirtyFiles).length === 0) return;
    const merged = (active.files || []).map(f =>
      dirtyFiles[f.path] !== undefined ? { ...f, content: dirtyFiles[f.path] } : f,
    );
    setSavingFiles(true);
    const { error } = await supabase
      .from('generated_projects' as any)
      .update({ files: merged } as any)
      .eq('id', active.id);
    setSavingFiles(false);
    if (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
      return;
    }
    setActive({ ...active, files: merged });
    setSelectedFile(prev => prev ? merged.find(f => f.path === prev.path) || prev : prev);
    setDirtyFiles({});
    toast({ title: 'Saved', description: 'Changes saved for the whole team.' });
    load();
  };

  const removeProject = async (id: string) => {
    if (!activeCanDelete) {
      toast({ title: 'Not allowed', description: 'Only the project owner can delete this project.', variant: 'destructive' });
      return;
    }
    if (!confirm('Delete this project?')) return;
    await supabase.from('generated_projects' as any).delete().eq('id', id);
    setActive(null);
    load();
  };


  const saveEnv = async (key: string, value: string) => {
    if (!active || !user || !activeCanEdit) return;
    const existing = envs.find(e => e.key === key && e.id);
    if (existing) {
      await supabase.from('project_envs' as any).update({ value }).eq('id', existing.id);
    } else {
      const { data } = await supabase.from('project_envs' as any).insert({
        project_id: active.id, user_id: active.user_id, key, value,
      } as any).select('id').single();
      setEnvs(prev => prev.some(e => e.key === key)
        ? prev.map(e => e.key === key ? { ...e, id: (data as any)?.id || '', value } : e)
        : [...prev, { id: (data as any)?.id || '', key, value }]);
      return;
    }
    setEnvs(prev => prev.map(e => e.key === key ? { ...e, value } : e));
  };

  const addEnv = async () => {
    if (!newKey.trim() || !active || !user || !activeCanEdit) return;
    const { data, error } = await supabase.from('project_envs' as any).insert({
      project_id: active.id, user_id: active.user_id, key: newKey.trim(), value: newVal,
    } as any).select('id,key,value').single();
    if (error) { toast({ title: 'Failed', description: error.message, variant: 'destructive' }); return; }
    setEnvs(prev => [...prev, data as any]);
    setNewKey(''); setNewVal('');
  };

  const removeEnv = async (e: ProjEnv) => {
    if (!activeCanEdit) return;
    if (e.id) await supabase.from('project_envs' as any).delete().eq('id', e.id);
    setEnvs(prev => prev.filter(x => x.key !== e.key));
  };


  const handlePushToNewRepo = async () => {
    if (!active || !repoName.trim()) return;
    const token = localStorage.getItem('github_access_token');
    if (!token) {
      toast({ title: 'GitHub not connected', description: 'Sign in with GitHub first.', variant: 'destructive' });
      return;
    }
    setGitHubToken(token);
    try {
      setPushing(true);
      const repo = await createRepo(repoName.trim(), active.description || '', isPrivate);
      await commitAndPush(
        repo.owner, repo.name, repo.default_branch,
        (active.files || []).map(f => ({ path: f.path, content: f.content })),
        `Initial commit via nuvic ai AI`,
      );
      await supabase.from('generated_projects' as any).update({
        repo_full_name: `${repo.owner}/${repo.name}`,
      } as any).eq('id', active.id);
      setActive({ ...active, repo_full_name: `${repo.owner}/${repo.name}` });
      setShowPushForm(false);
      toast({ title: 'Repository created', description: `Pushed ${(active.files || []).length} files to ${repo.owner}/${repo.name}` });
      window.open(repo.html_url, '_blank');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Push failed';
      toast({ title: 'Push failed', description: msg, variant: 'destructive' });
    } finally {
      setPushing(false);
    }
  };

  const handlePushToExistingRepo = async () => {
    if (!active?.repo_full_name) return;
    const token = localStorage.getItem('github_access_token');
    if (!token) {
      toast({ title: 'GitHub not connected', description: 'Sign in with GitHub first.', variant: 'destructive' });
      return;
    }
    setGitHubToken(token);
    const [owner, repo] = active.repo_full_name.split('/');
    try {
      setPushing(true);
      const repoResp = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' },
      });
      const repoJson = await repoResp.json();
      const branch = repoJson.default_branch || 'main';
      await commitAndPush(
        owner, repo, branch,
        (active.files || []).map(f => ({ path: f.path, content: f.content })),
        `Update via nuvic ai AI`,
      );
      toast({ title: 'Pushed', description: `${(active.files || []).length} file(s) pushed to ${active.repo_full_name}` });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Push failed';
      toast({ title: 'Push failed', description: msg, variant: 'destructive' });
    } finally {
      setPushing(false);
    }
  };

  const handleCreatePR = async () => {
    if (!active?.repo_full_name) return;
    const token = localStorage.getItem('github_access_token');
    if (!token) {
      toast({ title: 'GitHub not connected', description: 'Sign in with GitHub first.', variant: 'destructive' });
      return;
    }
    setGitHubToken(token);
    const [owner, repo] = active.repo_full_name.split('/');
    try {
      setPushing(true);
      const repoResp = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' },
      });
      const repoJson = await repoResp.json();
      const baseBranch = repoJson.default_branch || 'main';
      const branchName = `nuvic ai-ai-${Date.now()}`;
      await createBranch(owner, repo, branchName, baseBranch);
      await commitAndPush(
        owner, repo, branchName,
        (active.files || []).map(f => ({ path: f.path, content: f.content })),
        `AI updates via nuvic ai`,
      );
      const pr = await createPullRequest(
        owner, repo,
        `AI updates to ${active.name}`,
        active.description || 'Generated by nuvic ai AI',
        branchName, baseBranch,
      );
      await supabase.from('generated_projects' as any).update({
        pr_url: pr.html_url,
      } as any).eq('id', active.id);
      setActive({ ...active, pr_url: pr.html_url });
      toast({ title: 'PR created', description: `#${pr.number}` });
      window.open(pr.html_url, '_blank');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'PR creation failed';
      toast({ title: 'PR failed', description: msg, variant: 'destructive' });
    } finally {
      setPushing(false);
    }
  };

  if (active) {
    return (
      <div className="min-h-screen flex w-full bg-background dark:sunrise-gradient">
        <AppSidebar activeSection="projects" onSectionChange={() => {}} />
        <SidebarInset className="flex-1 flex flex-col">
          <header className="flex h-auto min-h-[48px] shrink-0 items-center gap-2 border-b border-border px-3 py-2 flex-wrap">
            <SidebarTrigger className="-ml-1" />
            <Button variant="ghost" size="sm" onClick={() => {
              if (routeId) navigate('/projects');
              else { setActive(null); setShowPushForm(false); }
            }} className="gap-1">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <span className="font-semibold truncate">{active.name}</span>
            {activeRole && activeRole !== 'owner' && (
              <Badge variant="outline" className="gap-1 text-[10px]">
                <Users className="h-3 w-3" /> Shared · {activeRole}
              </Badge>
            )}
            {!activeCanEdit && (
              <Badge variant="secondary" className="gap-1 text-[10px]"><Eye className="h-3 w-3" /> Read only</Badge>
            )}
            <div className="ml-auto flex items-center gap-2 flex-wrap">
              {activeCanEdit && Object.keys(dirtyFiles).length > 0 && (
                <Button size="sm" onClick={saveFiles} disabled={savingFiles} className="gap-1.5 h-8">
                  {savingFiles ? <LoadingState variant="bars" size="sm" /> : <Save className="h-3.5 w-3.5" />}
                  <span className="text-xs">Save {Object.keys(dirtyFiles).length}</span>
                </Button>
              )}
              {active.pr_url ? (
                <Button size="sm" className="gap-1.5 h-8 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => window.open(active.pr_url!, '_blank')}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="text-xs">View PR</span>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              ) : active.repo_full_name ? (
                <>
                  <Button size="sm" onClick={handlePushToExistingRepo} disabled={pushing || !activeCanEdit} className="gap-1.5 h-8">
                    {pushing ? <LoadingState variant="bars" size="sm" /> : <Upload className="h-3.5 w-3.5" />}
                    <span className="text-xs">Push</span>
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCreatePR} disabled={pushing || !activeCanEdit} className="gap-1.5 h-8">
                    <GitPullRequest className="h-3.5 w-3.5" />
                    <span className="text-xs">Open PR</span>
                  </Button>
                </>
              ) : (
                <Button size="sm" disabled={!activeCanEdit} onClick={() => { setShowPushForm(s => !s); setRepoName(active.name); }} className="gap-1.5 h-8">
                  <Github className="h-3.5 w-3.5" />
                  <span className="text-xs">Push to GitHub</span>
                </Button>
              )}
              <Button
                size="sm"
                variant={showDb ? 'default' : 'outline'}
                onClick={() => setShowDb(s => !s)}
                className="gap-1.5 h-8"
              >
                <Database className="h-3.5 w-3.5" />
                <span className="text-xs">Database</span>
              </Button>
              {activeCanDelete && (
                <Button variant="ghost" size="icon" onClick={() => removeProject(active.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </header>
          {showPushForm && !active.repo_full_name && (
            <div className="border-b border-border bg-muted/30 px-4 py-3 flex items-center gap-3 flex-wrap">
              <Input
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                placeholder="Repository name"
                className="h-8 text-xs w-48"
              />
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                <Switch checked={isPrivate} onCheckedChange={setIsPrivate} className="h-4 w-7" />
                <Lock className="h-3 w-3" />
                <span>Private</span>
              </label>
              <Button size="sm" onClick={handlePushToNewRepo} disabled={pushing || !repoName.trim()} className="gap-1.5 h-8">
                {pushing ? <LoadingState variant="bars" size="sm" /> : <Upload className="h-3.5 w-3.5" />}
                <span className="text-xs">Create & Push</span>
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowPushForm(false)} className="h-8">
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
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
            <main className="col-span-9 overflow-hidden flex flex-col">
              <div className="flex-1 min-h-0">
                {showDb ? (
                  <DatabasePanel
                    files={active.files || []}
                    envValues={Object.fromEntries(envs.map(e => [e.key, e.value]))}
                    onSaveEnv={saveEnv}
                  />
                ) : selectedFile ? (
                  <Editor
                    height="100%"
                    path={selectedFile.path}
                    language={langFromPath(selectedFile.path)}
                    value={dirtyFiles[selectedFile.path] ?? selectedFile.content}
                    onChange={(val) => {
                      if (!activeCanEdit || !selectedFile) return;
                      const original = (active.files || []).find(f => f.path === selectedFile.path)?.content ?? '';
                      setDirtyFiles(prev => {
                        const next = { ...prev };
                        if ((val ?? '') === original) delete next[selectedFile.path];
                        else next[selectedFile.path] = val ?? '';
                        return next;
                      });
                    }}
                    theme={actualTheme === 'dark' ? 'vs-dark' : 'vs-light'}
                    options={{ readOnly: !activeCanEdit, minimap: { enabled: false }, fontSize: 13 }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Select a file</div>
                )}
              </div>
              <div className="h-80 border-t border-border shrink-0">
                <WebContainerRunner
                  files={(active.files || []).map(f => ({ name: f.path, content: f.content, language: langFromPath(f.path) }))}
                  projectName={active.name}
                />
              </div>
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
              <div className="flex justify-center py-16"><LoadingState variant="bars" size="md" /></div>
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
