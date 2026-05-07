import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Loader2, ArrowLeft, Github, Upload, FileCode, Sparkles, GitPullRequest,
  Database, Key, MessageSquare, X, PanelLeftClose, PanelLeft, Code2, FolderTree,
  GitBranch, Download, ChevronsUpDown, ChevronDown, Columns2, AlignJustify,
  Search, Filter, Eye, ExternalLink, CheckCircle2,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from '@/components/ThemeProvider';
import { DiffEditor, Editor } from '@monaco-editor/react';
import { FileTreeView } from '@/components/code-analysis/FileTreeView';
import { CodeChatPanel } from '@/components/code-analysis/CodeChatPanel';
import FileChangeCard from '@/components/code-review/FileChangeCard';
import {
  setGitHubToken, createRepo, commitAndPush, getRepoTree, getBlobContent,
  fetchFilesInParallel, getRepoPermissions, createBranch, createPullRequest,
} from '@/services/githubService';

type Mode = 'generate' | 'analyze';
type ViewMode = 'stacked' | 'editor';

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
  const [stageMsg, setStageMsg] = useState('Preparing\u2026');

  const [genFiles, setGenFiles] = useState<GeneratedFile[]>([]);
  const [genMeta, setGenMeta] = useState<{ project_name: string; description: string; stack: string } | null>(null);
  const [schema, setSchema] = useState<SchemaTable[]>([]);
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  const [newRepoName, setNewRepoName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const [edits, setEdits] = useState<EditFile[]>([]);
  const [editSummary, setEditSummary] = useState('');
  const [repoFiles, setRepoFiles] = useState<{ path: string; content: string }[]>([]);
  const [repoBranch, setRepoBranch] = useState<string>('main');
  const [canPush, setCanPush] = useState(false);

  const [activePath, setActivePath] = useState<string | null>(null);
  const [pushing, setPushing] = useState(false);
  const [showFiles, setShowFiles] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [treeSearch, setTreeSearch] = useState('');
  const isMobile = useIsMobile();
  const [mobileView, setMobileView] = useState<'chat' | 'files' | 'code'>('code');

  const [viewMode, setViewMode] = useState<ViewMode>('stacked');
  const [sideBySide, setSideBySide] = useState(true);
  const [allExpanded, setAllExpanded] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [autoPR, setAutoPR] = useState(true);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [prNumber, setPrNumber] = useState<number | null>(null);

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
      setStageMsg('Generating full-stack code\u2026');
      const { data, error } = await supabase.functions.invoke('generate-project', { body: { prompt } });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setGenFiles(data.files);
      setGenMeta({ project_name: data.project_name, description: data.description, stack: data.stack });
      setSchema(data.database_schema?.tables || []);
      setEnvVars(data.env_vars || []);
      setNewRepoName(data.project_name);
      setActivePath(data.files[0]?.path || null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      toast({ title: 'Generation failed', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const runAnalyze = async (prompt: string, repo: { owner: string; name: string }) => {
    try {
      const token = localStorage.getItem('github_access_token');
      if (!token) throw new Error('GitHub not connected');
      setGitHubToken(token);

      setStageMsg('Fetching repository\u2026');
      const perms = await getRepoPermissions(repo.owner, repo.name).catch(() => ({ push: false, pull: true, admin: false }));
      setCanPush(perms.push);

      const repoResp = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.name}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' },
      });
      const repoJson = await repoResp.json();
      const branch = repoJson.default_branch || 'main';
      setRepoBranch(branch);

      const tree = await getRepoTree(repo.owner, repo.name, branch);
      const blobs = tree.filter((t: { type: string; size?: number }) => t.type === 'blob' && (t.size ?? 0) < 200_000);

      setStageMsg(`Reading ${blobs.length} files\u2026`);
      const files = await fetchFilesInParallel(
        blobs,
        async (b: { path: string; sha: string }) => {
          try {
            const content = await getBlobContent(repo.owner, repo.name, b.sha);
            return { path: b.path, content };
          } catch { return null; }
        },
        15,
      );
      const cleaned = files.filter((f: { path: string; content: string } | null) => f && f.content !== null);

      setRepoFiles(cleaned);

      setStageMsg('AI is analyzing and editing\u2026');
      const { data, error } = await supabase.functions.invoke('analyze-and-edit', {
        body: { prompt, files: cleaned },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const editsList: EditFile[] = data.edits || [];
      const summary: string = data.summary || '';
      setEdits(editsList);
      setEditSummary(summary);
      setActivePath(editsList[0]?.path || null);

      if (autoPR && editsList.length > 0) {
        try {
          setStageMsg('Creating pull request\u2026');
          const branchName = `vibium-ai-${Date.now()}`;
          const filesToCommit = editsList.map(e => ({ path: e.path, content: e.after }));
          const message = summary || `AI edits to ${editsList.length} file(s)`;
          await createBranch(repo.owner, repo.name, branchName, branch);
          await commitAndPush(repo.owner, repo.name, branchName, filesToCommit, message);
          const pr = await createPullRequest(
            repo.owner, repo.name,
            message.split('\n')[0].slice(0, 80),
            summary,
            branchName, branch,
          );
          setPrUrl(pr.html_url);
          setPrNumber(pr.number);
          toast({ title: 'PR created automatically', description: `#${pr.number}` });
        } catch (prErr: unknown) {
          const prMsg = prErr instanceof Error ? prErr.message : 'PR creation failed';
          toast({ title: 'Auto PR failed', description: prMsg, variant: 'destructive' });
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      toast({ title: 'Analysis failed', description: msg, variant: 'destructive' });
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
      await commitAndPush(
        repo.owner, repo.name, repo.default_branch,
        genFiles.map(f => ({ path: f.path, content: f.content })),
        `Initial generated commit via Vibium AI`,
      );
      toast({ title: 'Repo created', description: `Pushed ${genFiles.length} files.` });
      window.open(repo.html_url, '_blank');
      sessionStorage.removeItem('pendingCodeRequest');
      navigate('/');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      toast({ title: 'Push failed', description: msg, variant: 'destructive' });
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
        setPrUrl(pr.html_url);
        setPrNumber(pr.number);
        toast({ title: 'PR opened', description: `#${pr.number}` });
        window.open(pr.html_url, '_blank');
      } else {
        await commitAndPush(payload.repo.owner, payload.repo.name, repoBranch, filesToCommit, message);
        toast({ title: 'Pushed', description: `${edits.length} file(s) committed to ${repoBranch}` });
      }
      sessionStorage.removeItem('pendingCodeRequest');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      toast({ title: 'Push failed', description: msg, variant: 'destructive' });
    } finally {
      setPushing(false);
    }
  };

  const activeGen = useMemo(() => genFiles.find(f => f.path === activePath), [genFiles, activePath]);
  const activeEdit = useMemo(() => edits.find(e => e.path === activePath), [edits, activePath]);
  const monacoTheme = actualTheme === 'dark' ? 'vs-dark' : 'vs-light';

  const treeFiles = useMemo(() => {
    if (payload?.mode === 'generate') {
      return genFiles.map(f => ({ name: f.path, content: f.content, language: langFromPath(f.path) }));
    }
    const editedPaths = new Set(edits.map(e => e.path));
    const editedFiles = edits.map(e => ({ name: e.path, content: e.after, language: langFromPath(e.path) }));
    const untouchedFiles = repoFiles
      .filter(f => !editedPaths.has(f.path))
      .map(f => ({ name: f.path, content: f.content, language: langFromPath(f.path) }));
    return [...editedFiles, ...untouchedFiles];
  }, [payload?.mode, genFiles, edits, repoFiles]);

  const handleFileUpdate = (fileName: string, newContent: string) => {
    if (payload?.mode === 'generate') {
      const exists = genFiles.some(f => f.path === fileName);
      if (exists) {
        setGenFiles(prev => prev.map(f => f.path === fileName ? { ...f, content: newContent } : f));
      } else {
        setGenFiles(prev => [...prev, { path: fileName, content: newContent }]);
      }
    } else {
      const existing = edits.find(e => e.path === fileName);
      if (existing) {
        setEdits(prev => prev.map(e => e.path === fileName ? { ...e, after: newContent } : e));
      } else {
        const repoFile = repoFiles.find(f => f.path === fileName);
        setEdits(prev => [...prev, {
          path: fileName,
          action: repoFile ? 'edit' : 'create',
          before: repoFile?.content || '',
          after: newContent,
          note: 'Modified via AI chat',
        }]);
      }
    }
    toast({ title: 'File updated', description: fileName });
  };

  const activeFileForChat = activeGen
    ? { name: activeGen.path, content: activeGen.content }
    : activeEdit
      ? { name: activeEdit.path, content: activeEdit.after }
      : activePath
        ? (() => {
            const rf = repoFiles.find(f => f.path === activePath);
            return rf ? { name: rf.path, content: rf.content } : null;
          })()
        : null;

  const filteredEdits = useMemo(() => {
    if (!filterText) return edits;
    const q = filterText.toLowerCase();
    return edits.filter(e => e.path.toLowerCase().includes(q));
  }, [edits, filterText]);

  const filteredGenFiles = useMemo(() => {
    if (!filterText) return genFiles;
    const q = filterText.toLowerCase();
    return genFiles.filter(f => f.path.toLowerCase().includes(q));
  }, [genFiles, filterText]);

  const totalChanges = payload?.mode === 'generate' ? genFiles.length : edits.length;

  const handleDownloadZip = async () => {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const files = payload?.mode === 'generate' ? genFiles : edits.map(e => ({ path: e.path, content: e.after }));
      files.forEach(f => zip.file(f.path, f.content));
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${genMeta?.project_name || payload?.repo?.name || 'code-review'}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      toast({ title: 'Download failed', description: msg, variant: 'destructive' });
    }
  };

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden">
      <AppSidebar activeSection="code-analysis" onSectionChange={() => {}} />
      <SidebarInset className="flex flex-col flex-1 overflow-hidden min-w-0 h-full">
        {/* Header */}
        <header className="flex h-12 md:h-14 shrink-0 items-center justify-between border-b border-border bg-card px-3 md:px-4">
          <div className="flex items-center gap-2 min-w-0">
            <SidebarTrigger className="-ml-1" />
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-1 h-8">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Back</span>
            </Button>
            <div className="h-5 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="h-4 w-4 text-primary shrink-0" />
              <h1 className="text-xs md:text-sm font-semibold truncate">
                {payload?.mode === 'generate' ? 'Review Generated Project' : 'Review AI Edits'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant={showChat ? 'default' : 'outline'}
              onClick={() => {
                setShowChat(s => !s);
                if (isMobile) setMobileView('chat');
              }}
              className="gap-1.5 h-8"
              title="AI chat"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-xs">Chat</span>
            </Button>
            {payload?.mode === 'generate' && genFiles.length > 0 && (
              <Button size="sm" onClick={handlePushNew} disabled={pushing || !newRepoName.trim()} className="gap-1.5 h-8">
                {pushing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Github className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline text-xs">Create repo & push</span>
                <span className="sm:hidden text-xs">Push</span>
              </Button>
            )}
            {payload?.mode === 'analyze' && edits.length > 0 && (
              <>
                {canPush && !prUrl && (
                  <Button size="sm" onClick={() => handlePushEdits(false)} disabled={pushing} className="gap-1.5 h-8">
                    {pushing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    <span className="hidden sm:inline text-xs">Push</span>
                  </Button>
                )}
                {prUrl ? (
                  <Button size="sm" className="gap-1.5 h-8 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => window.open(prUrl, '_blank')}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline text-xs">PR #{prNumber}</span>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => handlePushEdits(true)} disabled={pushing} className="gap-1.5 h-8">
                    <GitPullRequest className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline text-xs">Open PR</span>
                    <span className="sm:hidden text-xs">PR</span>
                  </Button>
                )}
              </>
            )}
          </div>
        </header>

        {/* Loading state */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <Loader2 className="h-10 w-10 animate-spin text-primary relative" />
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">{stageMsg}</p>
              {payload && (
                <p className="text-xs text-muted-foreground/60 max-w-md truncate">&ldquo;{payload.prompt}&rdquo;</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
            {/* Left sidebar: file tree (editor mode) or meta info */}
            {viewMode === 'editor' && (isMobile ? mobileView === 'files' : showFiles) && (
              <div className="w-full md:w-72 shrink-0 md:border-r border-border bg-card/50 flex flex-col overflow-hidden">
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

                {payload?.mode === 'analyze' && editSummary && (
                  <div className="p-3 border-b border-border">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Summary</p>
                    <p className="text-xs leading-relaxed">{editSummary}</p>
                  </div>
                )}

                <div className="p-2 border-b border-border">
                  <Input
                    value={treeSearch}
                    onChange={(e) => setTreeSearch(e.target.value)}
                    placeholder="Search files\u2026"
                    className="h-7 text-xs"
                  />
                </div>
                <div className="flex-1 min-h-0">
                  <FileTreeView
                    files={treeFiles}
                    selectedFile={activePath}
                    onFileSelect={(p) => { setActivePath(p); if (isMobile) setMobileView('code'); }}
                    searchTerm={treeSearch}
                  />
                </div>
              </div>
            )}

            {/* Main content area */}
            <div className={`flex-1 min-w-0 flex flex-col overflow-hidden ${isMobile && mobileView === 'chat' ? 'hidden' : ''} ${isMobile && viewMode === 'editor' && mobileView === 'files' ? 'hidden' : ''}`}>
              {/* Review toolbar */}
              <div className="flex items-center justify-between px-3 md:px-5 py-2 md:py-2.5 border-b border-border bg-card/50 gap-2 shrink-0">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {/* Branch info */}
                  {payload?.repo && (
                    <div className="flex items-center gap-1.5 bg-muted/50 rounded-md px-2 py-1 border border-border/50 shrink-0">
                      <GitBranch className="h-3 w-3 text-muted-foreground/70" />
                      <span className="text-[10px] md:text-xs font-mono text-muted-foreground truncate max-w-[120px] md:max-w-[200px]">
                        {repoBranch}
                      </span>
                    </div>
                  )}
                  {payload?.mode === 'generate' && genMeta && (
                    <div className="flex items-center gap-1.5 bg-muted/50 rounded-md px-2 py-1 border border-border/50 shrink-0">
                      <Code2 className="h-3 w-3 text-muted-foreground/70" />
                      <span className="text-[10px] md:text-xs font-mono text-muted-foreground truncate max-w-[120px] md:max-w-[200px]">
                        {genMeta.project_name}
                      </span>
                    </div>
                  )}

                  {/* File count badge */}
                  <Badge variant="secondary" className="text-[10px] md:text-xs h-5 md:h-6 px-1.5 md:px-2 shrink-0">
                    {totalChanges} file{totalChanges !== 1 ? 's' : ''} changed
                  </Badge>
                </div>

                {/* Toolbar actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Filter */}
                  <div className="hidden md:flex items-center gap-1 bg-muted/30 rounded-md border border-border/40 px-2 py-1">
                    <Search className="h-3 w-3 text-muted-foreground/50" />
                    <input
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                      placeholder="Filter files\u2026"
                      className="bg-transparent border-none outline-none text-xs w-24 lg:w-32 placeholder:text-muted-foreground/40"
                    />
                  </div>

                  {/* Auto PR toggle (analyze mode only) */}
                  {payload?.mode === 'analyze' && !prUrl && (
                    <label className="hidden md:flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer px-1">
                      <Switch checked={autoPR} onCheckedChange={setAutoPR} className="h-4 w-7 data-[state=checked]:bg-primary" />
                      <span>Auto PR</span>
                    </label>
                  )}

                  {/* Download zip */}
                  <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs hidden md:inline-flex" onClick={handleDownloadZip}>
                    <Download className="h-3 w-3" />
                    <span className="hidden lg:inline">Download zip</span>
                  </Button>

                  {/* Side-by-side toggle (stacked view only) */}
                  {viewMode === 'stacked' && !isMobile && (
                    <Button
                      variant={sideBySide ? 'default' : 'outline'}
                      size="sm"
                      className="gap-1 h-7 text-xs"
                      onClick={() => setSideBySide(s => !s)}
                    >
                      {sideBySide ? <Columns2 className="h-3 w-3" /> : <AlignJustify className="h-3 w-3" />}
                      <span className="hidden lg:inline">{sideBySide ? 'Split' : 'Unified'}</span>
                    </Button>
                  )}

                  {/* Collapse/expand all (stacked view) */}
                  {viewMode === 'stacked' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 h-7 text-xs"
                      onClick={() => setAllExpanded(e => !e)}
                    >
                      <ChevronsUpDown className="h-3 w-3" />
                      <span className="hidden md:inline">{allExpanded ? 'Collapse all' : 'Expand all'}</span>
                    </Button>
                  )}

                  {/* View mode toggle */}
                  <div className="flex items-center bg-muted/50 rounded-md border border-border/50 p-0.5">
                    <button
                      onClick={() => setViewMode('stacked')}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] md:text-xs font-medium transition-colors ${
                        viewMode === 'stacked'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Filter className="h-3 w-3" />
                      <span className="hidden md:inline">Stacked</span>
                    </button>
                    <button
                      onClick={() => setViewMode('editor')}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] md:text-xs font-medium transition-colors ${
                        viewMode === 'editor'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Eye className="h-3 w-3" />
                      <span className="hidden md:inline">Editor</span>
                    </button>
                  </div>

                  {/* File tree toggle (editor mode) */}
                  {viewMode === 'editor' && !isMobile && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowFiles(s => !s)}
                      className="gap-1 h-7"
                      title={showFiles ? 'Hide files' : 'Show files'}
                    >
                      {showFiles ? <PanelLeftClose className="h-3.5 w-3.5" /> : <PanelLeft className="h-3.5 w-3.5" />}
                    </Button>
                  )}
                </div>
              </div>

              {/* Stacked view */}
              {viewMode === 'stacked' && (
                <ScrollArea className="flex-1">
                  <div className="p-3 md:p-5 space-y-2 md:space-y-3 max-w-[1400px] mx-auto w-full pb-20 md:pb-6">
                    {/* Summary (analyze mode) */}
                    {payload?.mode === 'analyze' && editSummary && (
                      <div className="rounded-lg border border-border/60 bg-card p-3 md:p-4 mb-3 md:mb-4">
                        <div className="flex items-start gap-2">
                          <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">AI Summary</p>
                            <p className="text-xs md:text-sm leading-relaxed text-foreground/80">{editSummary}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Auto-PR success banner */}
                    {prUrl && (
                      <div className="rounded-lg border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 p-3 md:p-4 mb-3 md:mb-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs md:text-sm font-medium text-emerald-800 dark:text-emerald-300">
                                Pull request created automatically
                              </p>
                              <p className="text-[10px] md:text-xs text-emerald-600/80 dark:text-emerald-400/60">
                                PR #{prNumber} is ready for review
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            className="gap-1.5 h-7 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                            onClick={() => window.open(prUrl, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span className="text-xs">View PR</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Generate mode meta */}
                    {payload?.mode === 'generate' && genMeta && (
                      <div className="rounded-lg border border-border/60 bg-card p-3 md:p-4 mb-3 md:mb-4">
                        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="flex items-center gap-1.5 bg-primary/10 rounded-md px-2 py-1">
                              <Code2 className="h-3.5 w-3.5 text-primary" />
                              <span className="text-xs font-semibold text-primary">{genMeta.project_name}</span>
                            </div>
                            <Badge variant="outline" className="text-[10px] h-5">{genMeta.stack}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground/70 flex-1 min-w-0 truncate">{genMeta.description}</p>
                          <div className="flex items-center gap-2 shrink-0">
                            <Input
                              value={newRepoName}
                              onChange={(e) => setNewRepoName(e.target.value)}
                              placeholder="Repo name"
                              className="h-7 text-xs w-36 md:w-44"
                            />
                            <label className="flex items-center gap-1 text-[10px] text-muted-foreground whitespace-nowrap">
                              <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="rounded" />
                              Private
                            </label>
                          </div>
                        </div>

                        {(envVars.length > 0 || schema.length > 0) && (
                          <div className="mt-3 pt-3 border-t border-border/40 flex flex-wrap gap-3">
                            {envVars.length > 0 && (
                              <div className="flex-1 min-w-[200px]">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 flex items-center gap-1">
                                  <Key className="h-3 w-3" /> Env variables ({envVars.length})
                                </p>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                  {envVars.map((v) => (
                                    <div key={v.name} className="text-[10px] bg-muted/30 rounded px-1.5 py-0.5 border border-border/30 flex items-center gap-1">
                                      <span className="font-mono font-semibold">{v.name}</span>
                                      {v.required && <span className="text-[8px] text-primary">req</span>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {schema.length > 0 && (
                              <div className="flex-1 min-w-[200px]">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 flex items-center gap-1">
                                  <Database className="h-3 w-3" /> DB schema ({schema.length})
                                </p>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                  {schema.map((t) => (
                                    <div key={t.name} className="text-[10px] bg-muted/30 rounded px-1.5 py-0.5 border border-border/30">
                                      <span className="font-mono font-semibold text-primary">{t.name}</span>
                                      <span className="text-muted-foreground ml-1">({t.columns.length} cols)</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Mobile filter */}
                    {isMobile && (
                      <div className="flex items-center gap-1 bg-muted/30 rounded-md border border-border/40 px-2 py-1.5">
                        <Search className="h-3 w-3 text-muted-foreground/50" />
                        <input
                          value={filterText}
                          onChange={(e) => setFilterText(e.target.value)}
                          placeholder="Filter files\u2026"
                          className="bg-transparent border-none outline-none text-xs flex-1 placeholder:text-muted-foreground/40"
                        />
                      </div>
                    )}

                    {/* File cards */}
                    {payload?.mode === 'analyze' && (
                      filteredEdits.length > 0 ? (
                        filteredEdits.map((edit) => (
                          <FileChangeCard
                            key={edit.path}
                            path={edit.path}
                            action={edit.action}
                            before={edit.before}
                            after={edit.after}
                            note={edit.note}
                            isActive={activePath === edit.path}
                            onSelect={() => setActivePath(edit.path)}
                            sideBySide={!isMobile && sideBySide}
                            defaultExpanded={allExpanded}
                          />
                        ))
                      ) : (
                        <div className="rounded-lg border border-border/40 bg-card p-8 text-center">
                          <FileCode className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            {filterText ? 'No files match your filter' : 'No changes suggested'}
                          </p>
                        </div>
                      )
                    )}

                    {payload?.mode === 'generate' && (
                      filteredGenFiles.length > 0 ? (
                        filteredGenFiles.map((file) => (
                          <FileChangeCard
                            key={file.path}
                            path={file.path}
                            action="create"
                            before=""
                            after={file.content}
                            isActive={activePath === file.path}
                            onSelect={() => setActivePath(file.path)}
                            sideBySide={false}
                            defaultExpanded={allExpanded}
                          />
                        ))
                      ) : (
                        <div className="rounded-lg border border-border/40 bg-card p-8 text-center">
                          <FileCode className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            {filterText ? 'No files match your filter' : 'No files generated'}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </ScrollArea>
              )}

              {/* Editor view */}
              {viewMode === 'editor' && (isMobile ? mobileView === 'code' : true) && (
                <div className="flex-1 min-h-0 flex flex-col">
                  {payload?.mode === 'generate' && activeGen && (
                    <>
                      <div className="px-3 py-2 border-b border-border bg-card/50 flex items-center gap-2">
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
                      <div className="px-3 py-2 border-b border-border bg-card/50 flex items-center gap-2">
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
                          options={{ readOnly: true, renderSideBySide: !isMobile, minimap: { enabled: false }, fontSize: 12, wordWrap: 'on' }}
                        />
                      </div>
                    </>
                  )}
                  {!activeGen && !activeEdit && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                      <FileCode className="h-10 w-10 text-muted-foreground/20" />
                      <p className="text-sm">Select a file to view</p>
                      <Button variant="outline" size="sm" onClick={() => setViewMode('stacked')} className="gap-1.5">
                        <Filter className="h-3.5 w-3.5" />
                        Switch to Stacked view
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: AI chat */}
            {(isMobile ? mobileView === 'chat' : showChat) && (
              <div className="w-full md:w-96 shrink-0 md:border-l border-border bg-card/30 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-3 h-10 border-b border-border">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-semibold">AI Assistant</span>
                  </div>
                  {!isMobile && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowChat(false)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
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

            {/* Mobile pill nav */}
            {isMobile && (
              <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50">
                <div className="flex items-center gap-1 bg-card/95 backdrop-blur-md border border-border rounded-full shadow-lg p-1">
                  {([
                    { id: 'chat', label: 'Chat', icon: MessageSquare },
                    { id: 'files', label: 'Files', icon: FolderTree },
                    { id: 'code', label: viewMode === 'stacked' ? 'Review' : 'Code', icon: Code2 },
                  ] as const).map(t => {
                    const Icon = t.icon;
                    const active = mobileView === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          setMobileView(t.id);
                          if (t.id === 'chat') setShowChat(true);
                        }}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
                          active
                            ? 'bg-primary/15 text-primary border border-primary/40 shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {t.label}
                      </button>
                    );
                  })}
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
