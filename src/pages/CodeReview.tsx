import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowLeft, Github, Upload, FileCode, Sparkles, GitPullRequest, Database, Key, MessageSquare, X, PanelLeftClose, PanelLeft, Code2, FolderTree } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from '@/components/ThemeProvider';
import { DiffEditor, Editor } from '@monaco-editor/react';
import { FileTreeView } from '@/components/code-analysis/FileTreeView';
import { CodeChatPanel } from '@/components/code-analysis/CodeChatPanel';
import {
  setGitHubToken, createRepo, commitAndPush, getRepoTree, getBlobContent,
  fetchFilesInParallel, getRepoPermissions, createBranch, createPullRequest,
} from '@/services/githubService';

type Mode = 'generate' | 'analyze';

interface GeneratedFile { path: string; content: string }
interface EditFile { path: string; action: 'edit' | 'create'; before: string; after: string; note: string }
interface SchemaColumn { name: string; type: string; constraints?: string }
interface SchemaTable { name: string; description?: string; columns: SchemaColumn[] }
interface EnvVar { name: string; description: string; example?: string; required: boolean }

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
  const [schema, setSchema] = useState<SchemaTable[]>([]);
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  const [newRepoName, setNewRepoName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  // analyze mode state
  const [edits, setEdits] = useState<EditFile[]>([]);
  const [editSummary, setEditSummary] = useState('');
  const [repoBranch, setRepoBranch] = useState<string>('main');
  const [canPush, setCanPush] = useState(false);

  const [activePath, setActivePath] = useState<string | null>(null);
  const [pushing, setPushing] = useState(false);
  const [showFiles, setShowFiles] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [treeSearch, setTreeSearch] = useState('');
  const isMobile = useIsMobile();
  const [mobileView, setMobileView] = useState<'chat' | 'files' | 'code'>('files');

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
      setSchema(data.database_schema?.tables || []);
      setEnvVars(data.env_vars || []);
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

  // Unified file list for tree + chat
  const treeFiles = useMemo(() => {
    if (payload?.mode === 'generate') {
      return genFiles.map(f => ({ name: f.path, content: f.content, language: langFromPath(f.path) }));
    }
    return edits.map(e => ({ name: e.path, content: e.after, language: langFromPath(e.path) }));
  }, [payload?.mode, genFiles, edits]);

  const handleFileUpdate = (fileName: string, newContent: string) => {
    if (payload?.mode === 'generate') {
      setGenFiles(prev => prev.map(f => f.path === fileName ? { ...f, content: newContent } : f));
    } else {
      setEdits(prev => prev.map(e => e.path === fileName ? { ...e, after: newContent } : e));
    }
    toast({ title: 'File updated', description: fileName });
  };

  const activeFileForChat = activeGen
    ? { name: activeGen.path, content: activeGen.content }
    : activeEdit
      ? { name: activeEdit.path, content: activeEdit.after }
      : null;

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
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowFiles(s => !s)}
              className="gap-1.5 hidden md:inline-flex"
              title={showFiles ? 'Hide files' : 'Show files'}
            >
              {showFiles ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </Button>
            <Button
              size="sm"
              variant={showChat ? 'default' : 'outline'}
              onClick={() => setShowChat(s => !s)}
              className="gap-1.5"
              title="AI chat"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Chat</span>
            </Button>
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
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative pb-16 md:pb-0">
            {/* Left: files sidebar */}
            {(isMobile ? mobileView === 'files' : showFiles) && (
              <div className="w-full md:w-72 shrink-0 md:border-r border-border bg-muted/10 flex flex-col overflow-hidden">
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

                    {envVars.length > 0 && (
                      <div className="pt-2 border-t border-border/60">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 flex items-center gap-1">
                          <Key className="h-3 w-3" /> Env variables ({envVars.length})
                        </p>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {envVars.map((v) => (
                            <div key={v.name} className="text-[10px] bg-background/60 rounded px-1.5 py-1 border border-border/40">
                              <div className="flex items-center gap-1">
                                <span className="font-mono font-semibold">{v.name}</span>
                                {v.required && <Badge variant="outline" className="h-3.5 text-[8px] px-1">req</Badge>}
                              </div>
                              <p className="text-muted-foreground leading-tight">{v.description}</p>
                              {v.example && <p className="font-mono text-muted-foreground/70 truncate">e.g. {v.example}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {schema.length > 0 && (
                      <div className="pt-2 border-t border-border/60">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 flex items-center gap-1">
                          <Database className="h-3 w-3" /> DB schema ({schema.length})
                        </p>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {schema.map((t) => (
                            <div key={t.name} className="text-[10px] bg-background/60 rounded px-1.5 py-1 border border-border/40">
                              <p className="font-mono font-semibold text-primary">{t.name}</p>
                              {t.description && <p className="text-muted-foreground leading-tight mb-0.5">{t.description}</p>}
                              <ul className="space-y-0.5">
                                {t.columns.map((c) => (
                                  <li key={c.name} className="font-mono leading-tight">
                                    <span>{c.name}</span> <span className="text-muted-foreground">{c.type}</span>
                                    {c.constraints && <span className="text-muted-foreground/70"> {c.constraints}</span>}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {payload?.mode === 'analyze' && (
                  <>
                    {editSummary && (
                      <div className="p-3 border-b border-border">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Summary</p>
                        <p className="text-xs leading-relaxed">{editSummary}</p>
                      </div>
                    )}
                    {edits.length > 0 && (
                      <div className="p-2 border-b border-border space-y-0.5 max-h-48 overflow-y-auto">
                        <p className="px-1 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                          Changes ({edits.length})
                        </p>
                        {edits.map(e => (
                          <button
                            key={e.path}
                            onClick={() => setActivePath(e.path)}
                            className={`w-full text-left px-2 py-1 rounded text-xs hover:bg-muted ${activePath === e.path ? 'bg-muted font-medium' : ''}`}
                          >
                            <div className="flex items-center gap-1.5">
                              <Badge variant={e.action === 'create' ? 'default' : 'secondary'} className="h-4 text-[9px] px-1">
                                {e.action === 'create' ? 'NEW' : 'EDIT'}
                              </Badge>
                              <span className="truncate">{e.path.split('/').pop()}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {edits.length === 0 && (
                      <p className="px-3 py-4 text-xs text-muted-foreground text-center border-b border-border">
                        No changes suggested.
                      </p>
                    )}
                  </>
                )}

                <div className="p-2 border-b border-border">
                  <Input
                    value={treeSearch}
                    onChange={(e) => setTreeSearch(e.target.value)}
                    placeholder="Search files…"
                    className="h-7 text-xs"
                  />
                </div>
                <div className="flex-1 min-h-0">
                  <FileTreeView
                    files={treeFiles}
                    selectedFile={activePath}
                    onFileSelect={setActivePath}
                    searchTerm={treeSearch}
                  />
                </div>
              </div>
            )}

            {/* Center: Editor / Diff */}
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
                      onChange={(v) => v !== undefined && handleFileUpdate(activeGen.path, v)}
                      options={{ minimap: { enabled: false }, fontSize: 12, wordWrap: 'on' }}
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

            {/* Right: AI chat */}
            {showChat && (
              <div className="w-full md:w-96 shrink-0 border-t md:border-t-0 md:border-l border-border bg-muted/5 flex flex-col">
                <div className="flex items-center justify-between px-3 h-10 border-b border-border">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-semibold">AI Assistant</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowChat(false)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex-1 min-h-0">
                  <CodeChatPanel
                    allFiles={treeFiles}
                    selectedFile={activeFileForChat}
                    onFileUpdate={handleFileUpdate}
                    onClose={() => setShowChat(false)}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </SidebarInset>
    </div>
  );
};

export default CodeReview;
