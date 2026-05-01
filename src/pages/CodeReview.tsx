import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowLeft, Github, Upload, FileCode, Sparkles, GitPullRequest } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from '@/components/ThemeProvider';
import { DiffEditor, Editor } from '@monaco-editor/react';
import {
  setGitHubToken, createRepo, commitAndPush, getRepoTree, getBlobContent,
  fetchFilesInParallel, getRepoPermissions, createBranch, createPullRequest,
} from '@/services/githubService';

type Mode = 'generate' | 'analyze';

interface GeneratedFile { path: string; content: string }
interface EditFile { path: string; action: 'edit' | 'create'; before: string; after: string; note: string }

interface PendingPayload {
  mode: Mode;
  prompt: string;
  repo?: { owner: string; name: string } | null;
}

const langFromPath = (p: string) => {
  const ext = p.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
    py: 'python', java: 'java', cpp: 'cpp', c: 'c', cs: 'csharp', go: 'go',
    rs: 'rust', php: 'php', rb: 'ruby', swift: 'swift', kt: 'kotlin',
    html: 'html', css: 'css', json: 'json', xml: 'xml', sql: 'sql',
    sh: 'shell', md: 'markdown', yml: 'yaml', yaml: 'yaml', toml: 'ini',
  };
  return map[ext || ''] || 'plaintext';
};

const CodeReview: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { actualTheme } = useTheme();

  const [payload, setPayload] = useState<PendingPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [stageMsg, setStageMsg] = useState('Preparing…');

  // generate mode state
  const [genFiles, setGenFiles] = useState<GeneratedFile[]>([]);
  const [genMeta, setGenMeta] = useState<{ project_name: string; description: string; stack: string } | null>(null);
  const [newRepoName, setNewRepoName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  // analyze mode state
  const [edits, setEdits] = useState<EditFile[]>([]);
  const [editSummary, setEditSummary] = useState('');
  const [repoBranch, setRepoBranch] = useState<string>('main');
  const [canPush, setCanPush] = useState(false);

  const [activePath, setActivePath] = useState<string | null>(null);
  const [pushing, setPushing] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('pendingCodeRequest');
    if (!raw) {
      navigate('/');
      return;
    }
    const data: PendingPayload = JSON.parse(raw);
    setPayload(data);
    if (data.mode === 'generate') {
      runGenerate(data.prompt);
    } else if (data.repo) {
      runAnalyze(data.prompt, data.repo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runGenerate = async (prompt: string) => {
    try {
      setStageMsg('Generating full-stack code…');
      const { data, error } = await supabase.functions.invoke('generate-project', { body: { prompt } });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setGenFiles(data.files);
      setGenMeta({ project_name: data.project_name, description: data.description, stack: data.stack });
      setNewRepoName(data.project_name);
      setActivePath(data.files[0]?.path || null);
    } catch (e: any) {
      toast({ title: 'Generation failed', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const runAnalyze = async (prompt: string, repo: { owner: string; name: string }) => {
    try {
      const token = localStorage.getItem('github_access_token');
      if (!token) throw new Error('GitHub not connected');
      setGitHubToken(token);

      setStageMsg('Fetching repository…');
      const perms = await getRepoPermissions(repo.owner, repo.name).catch(() => ({ push: false, pull: true, admin: false }));
      setCanPush(perms.push);

      // determine default branch via repo lookup
      const repoResp = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.name}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' },
      });
      const repoJson = await repoResp.json();
      const branch = repoJson.default_branch || 'main';
      setRepoBranch(branch);

      const tree = await getRepoTree(repo.owner, repo.name, branch);
      const blobs = tree.filter((t: any) => t.type === 'blob' && (t.size ?? 0) < 200_000);

      setStageMsg(`Reading ${blobs.length} files…`);
      const files = await fetchFilesInParallel(
        blobs,
        async (b: any) => {
          try {
            const content = await getBlobContent(repo.owner, repo.name, b.sha);
            return { path: b.path, content };
          } catch { return null; }
        },
        15,
      );
      const cleaned = files.filter((f: any) => f && f.content !== null);

      setStageMsg('AI is analyzing and editing…');
      const { data, error } = await supabase.functions.invoke('analyze-and-edit', {
        body: { prompt, files: cleaned },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setEdits(data.edits || []);
      setEditSummary(data.summary || '');
      setActivePath(data.edits?.[0]?.path || null);
    } catch (e: any) {
      toast({ title: 'Analysis failed', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handlePushNew = async () => {
    if (!genFiles.length || !newRepoName.trim()) return;
    const token = localStorage.getItem('github_access_token');
    if (!token) {
      toast({ title: 'GitHub not connected', description: 'Connect GitHub first.', variant: 'destructive' });
      return;
    }
    setGitHubToken(token);
    try {
      setPushing(true);
      const repo = await createRepo(newRepoName.trim(), genMeta?.description || '', isPrivate);
      // Filter out README.md if repo was auto-init'd to avoid conflict overwrite – we'll still push it
      await commitAndPush(
        repo.owner, repo.name, repo.default_branch,
        genFiles.map(f => ({ path: f.path, content: f.content })),
        `Initial generated commit via Vibium AI`,
      );
      toast({ title: 'Repo created', description: `Pushed ${genFiles.length} files.` });
      window.open(repo.html_url, '_blank');
      sessionStorage.removeItem('pendingCodeRequest');
      navigate('/');
    } catch (e: any) {
      toast({ title: 'Push failed', description: e.message, variant: 'destructive' });
    } finally {
      setPushing(false);
    }
  };

  const handlePushEdits = async (asPR: boolean) => {
    if (!payload?.repo || !edits.length) return;
    const token = localStorage.getItem('github_access_token');
    if (!token) return;
    setGitHubToken(token);
    try {
      setPushing(true);
      const filesToCommit = edits.map(e => ({ path: e.path, content: e.after }));
      const message = editSummary || `AI edits to ${edits.length} file(s)`;
      if (asPR) {
        const branchName = `vibium-ai-${Date.now()}`;
        await createBranch(payload.repo.owner, payload.repo.name, branchName, repoBranch);
        await commitAndPush(payload.repo.owner, payload.repo.name, branchName, filesToCommit, message);
        const pr = await createPullRequest(
          payload.repo.owner, payload.repo.name,
          message.split('\n')[0].slice(0, 80),
          editSummary,
          branchName, repoBranch,
        );
        toast({ title: 'PR opened', description: `#${pr.number}` });
        window.open(pr.html_url, '_blank');
      } else {
        await commitAndPush(payload.repo.owner, payload.repo.name, repoBranch, filesToCommit, message);
        toast({ title: 'Pushed', description: `${edits.length} file(s) committed to ${repoBranch}` });
      }
      sessionStorage.removeItem('pendingCodeRequest');
    } catch (e: any) {
      toast({ title: 'Push failed', description: e.message, variant: 'destructive' });
    } finally {
      setPushing(false);
    }
  };

  const activeGen = useMemo(() => genFiles.find(f => f.path === activePath), [genFiles, activePath]);
  const activeEdit = useMemo(() => edits.find(e => e.path === activePath), [edits, activePath]);
  const monacoTheme = actualTheme === 'dark' ? 'vs-dark' : 'vs-light';

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden">
      <AppSidebar activeSection="code-analysis" onSectionChange={() => {}} />
      <SidebarInset className="flex flex-col flex-1 overflow-hidden min-w-0 h-full">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-3 md:px-4">
          <div className="flex items-center gap-2 min-w-0">
            <SidebarTrigger className="-ml-1" />
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-1">
              <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="h-4 w-4 text-primary shrink-0" />
              <h1 className="text-sm font-semibold truncate">
                {payload?.mode === 'generate' ? 'Review generated project' : 'Review AI edits'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {payload?.mode === 'generate' && genFiles.length > 0 && (
              <Button size="sm" onClick={handlePushNew} disabled={pushing || !newRepoName.trim()} className="gap-1.5">
                {pushing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Github className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">Create repo & push</span>
                <span className="sm:hidden">Push</span>
              </Button>
            )}
            {payload?.mode === 'analyze' && edits.length > 0 && (
              <>
                {canPush && (
                  <Button size="sm" onClick={() => handlePushEdits(false)} disabled={pushing} className="gap-1.5">
                    {pushing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    <span className="hidden sm:inline">Push</span>
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => handlePushEdits(true)} disabled={pushing} className="gap-1.5">
                  <GitPullRequest className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Open PR</span>
                  <span className="sm:hidden">PR</span>
                </Button>
              </>
            )}
          </div>
        </header>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{stageMsg}</p>
            {payload && (
              <p className="text-xs text-muted-foreground/70 max-w-md truncate">"{payload.prompt}"</p>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar list */}
            <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-border bg-muted/10 flex flex-col">
              {payload?.mode === 'generate' && genMeta && (
                <div className="p-3 border-b border-border space-y-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Stack</p>
                    <p className="text-xs">{genMeta.stack}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Repo name</p>
                    <Input
                      value={newRepoName}
                      onChange={(e) => setNewRepoName(e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                  <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
                    Private repository
                  </label>
                </div>
              )}
              {payload?.mode === 'analyze' && editSummary && (
                <div className="p-3 border-b border-border">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Summary</p>
                  <p className="text-xs leading-relaxed">{editSummary}</p>
                </div>
              )}
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-0.5">
                  {payload?.mode === 'generate' && genFiles.map(f => (
                    <button
                      key={f.path}
                      onClick={() => setActivePath(f.path)}
                      className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-1.5 hover:bg-muted ${activePath === f.path ? 'bg-muted font-medium' : ''}`}
                    >
                      <FileCode className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="truncate">{f.path}</span>
                    </button>
                  ))}
                  {payload?.mode === 'analyze' && edits.map(e => (
                    <button
                      key={e.path}
                      onClick={() => setActivePath(e.path)}
                      className={`w-full text-left px-2 py-1.5 rounded text-xs hover:bg-muted ${activePath === e.path ? 'bg-muted font-medium' : ''}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Badge variant={e.action === 'create' ? 'default' : 'secondary'} className="h-4 text-[9px] px-1">
                          {e.action === 'create' ? 'NEW' : 'EDIT'}
                        </Badge>
                        <span className="truncate">{e.path}</span>
                      </div>
                      {e.note && <p className="text-[10px] text-muted-foreground truncate ml-1 mt-0.5">{e.note}</p>}
                    </button>
                  ))}
                  {payload?.mode === 'analyze' && edits.length === 0 && (
                    <p className="px-2 py-4 text-xs text-muted-foreground text-center">No changes suggested.</p>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Editor / Diff */}
            <div className="flex-1 min-w-0 flex flex-col">
              {payload?.mode === 'generate' && activeGen && (
                <>
                  <div className="px-3 py-2 border-b border-border bg-background flex items-center gap-2">
                    <FileCode className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-mono truncate">{activeGen.path}</span>
                    <Badge variant="default" className="h-4 text-[9px] px-1 ml-auto">NEW</Badge>
                  </div>
                  <div className="flex-1 min-h-0">
                    <Editor
                      height="100%"
                      theme={monacoTheme}
                      language={langFromPath(activeGen.path)}
                      value={activeGen.content}
                      options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12, wordWrap: 'on' }}
                    />
                  </div>
                </>
              )}
              {payload?.mode === 'analyze' && activeEdit && (
                <>
                  <div className="px-3 py-2 border-b border-border bg-background flex items-center gap-2">
                    <FileCode className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-mono truncate">{activeEdit.path}</span>
                    <Badge variant={activeEdit.action === 'create' ? 'default' : 'secondary'} className="h-4 text-[9px] px-1 ml-auto">
                      {activeEdit.action === 'create' ? 'NEW' : 'EDIT'}
                    </Badge>
                  </div>
                  <div className="flex-1 min-h-0">
                    <DiffEditor
                      height="100%"
                      theme={monacoTheme}
                      language={langFromPath(activeEdit.path)}
                      original={activeEdit.before}
                      modified={activeEdit.after}
                      options={{ readOnly: true, renderSideBySide: true, minimap: { enabled: false }, fontSize: 12, wordWrap: 'on' }}
                    />
                  </div>
                </>
              )}
              {!activeGen && !activeEdit && (
                <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                  Select a file to view
                </div>
              )}
            </div>
          </div>
        )}
      </SidebarInset>
    </div>
  );
};

export default CodeReview;
