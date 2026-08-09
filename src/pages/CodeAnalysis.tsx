import React, { useState, useEffect, useRef } from 'react';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '../components/AppSidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea as TextareaUI } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/components/ThemeProvider';
import {
  Github,
  Search,
  Plus,
  X,
  Loader2,
  Code2,
  MessageSquare,
  FolderTree,
  GitBranch,
  Upload,
  FilePlus,
  FolderPlus, ArrowUp, GitPullRequest, Sparkles, Lock, ExternalLink, CheckCircle2, GitMerge, TerminalSquare,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/LoadingState';
import { GitHubRepoSelector } from '@/components/code-analysis/GitHubRepoSelector';
import { FileTreeView } from '@/components/code-analysis/FileTreeView';
import { CodeChatPanel } from '@/components/code-analysis/CodeChatPanel';
import { WebContainerTerminal } from '@/components/code-analysis/WebContainerTerminal';
import { setGitHubToken, commitAndPush, createPullRequest, createBranch, createRepo, mergePullRequest } from '@/services/githubService';
import { hydrateGithubToken, persistGithubToken, clearGithubToken, getGithubTokenSync } from '@/lib/githubToken';
import { Switch } from '@/components/ui/switch';
import Editor from '@monaco-editor/react';
import { ScrollArea } from '@/components/ui/scroll-area';
import JSZip from 'jszip';
import Footer from '@/components/Footer';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface CodeFile {
  name: string;
  content: string;
  language: string;
}

const CodeAnalysis: React.FC = () => {
  const [activeSection, setActiveSection] = useState("code-analysis");
  const [codeFiles, setCodeFiles] = useState<CodeFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<CodeFile | null>(null);
  const [repoInfo, setRepoInfo] = useState<{ owner: string; repo: string; branch: string } | null>(null);
  const [repoPermissions, setRepoPermissions] = useState<{ push: boolean; pull: boolean; admin: boolean } | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openTabs, setOpenTabs] = useState<CodeFile[]>([]);
  const [isPushing, setIsPushing] = useState(false);
  const [showNewItemDialog, setShowNewItemDialog] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemType, setNewItemType] = useState<"file" | "folder">("file");
  const [parentPath, setParentPath] = useState("");
  const [modifiedFiles, setModifiedFiles] = useState<string[]>([]);
  const [githubToken, setGithubTokenState] = useState<string | null>(getGithubTokenSync());
  const [githubUser, setGithubUser] = useState<{ login: string; avatar_url: string; name: string } | null>(null);
  const [showPRDialog, setShowPRDialog] = useState(false);
  const [prTitle, setPrTitle] = useState("");
  const [prBody, setPrBody] = useState("");
  const [mobilePanel, setMobilePanel] = useState<'chat' | 'files' | 'code' | 'terminal'>('code');
  const [showTerminal, setShowTerminal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPushGenDialog, setShowPushGenDialog] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');
  const [isPrivateRepo, setIsPrivateRepo] = useState(false);
  const [pushedRepoUrl, setPushedRepoUrl] = useState<string | null>(null);
  const [openPR, setOpenPR] = useState<{ number: number; url: string; title: string; owner: string; repo: string } | null>(null);
  const [isMerging, setIsMerging] = useState(false);
  const { toast } = useToast();
  const { actualTheme } = useTheme();
  const isGitHubAuthenticated = !!githubToken;
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateNewItem = () => {
    if (!newItemName.trim()) return;

    const name = parentPath ? `${parentPath}/${newItemName.trim()}` : newItemName.trim();
    if (newItemType === "file") {
      const newFile: CodeFile = {
        name,
        content: "",
        language: getLanguageFromFilename(name)
      };
      setCodeFiles(prev => [...prev, newFile]);
      setSelectedFile(newFile);
      if (!openTabs.find(t => t.name === name)) {
        setOpenTabs(prev => [...prev, newFile]);
      }
      setModifiedFiles(prev => [...prev, name]);
      toast({ title: "File created", description: `${name} has been created.` });
    } else {
      const placeholderName = `${name}/.keep`;
      const newFile: CodeFile = {
        name: placeholderName,
        content: "",
        language: "plaintext"
      };
      setCodeFiles(prev => [...prev, newFile]);
      toast({ title: "Folder created", description: `${name} has been created.` });
    }

    setNewItemName("");
    setShowNewItemDialog(false);
  };

  const handleAttachFiles = () => {
    fileInputRef.current?.click();
  };

  const handleAttachFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newCodeFiles: CodeFile[] = [];
    let imageCount = 0;

    for (const file of files) {
      const fileName = (file as any).webkitRelativePath || file.name;

      if (file.name.endsWith('.zip')) {
        await processZipFile(file);
      } else if (isCodeFile(fileName)) {
        const content = await file.text();
        const newFile: CodeFile = { name: fileName, content, language: getLanguageFromFilename(fileName) };
        newCodeFiles.push(newFile);
      } else if (file.type.startsWith('image/')) {
        imageCount++;
      }
    }

    if (newCodeFiles.length > 0) {
      setCodeFiles(prev => [...prev, ...newCodeFiles]);
      if (!selectedFile && newCodeFiles.length > 0) {
        setSelectedFile(newCodeFiles[0]);
        setOpenTabs(prev => [...prev, newCodeFiles[0]]);
      }
      toast({
        title: "Files added",
        description: `Loaded ${newCodeFiles.length} file(s)${imageCount > 0 ? ` and ${imageCount} image(s)` : ''}.`
      });
    } else if (imageCount > 0) {
      toast({ title: "Images added", description: `Acknowledged ${imageCount} image(s).` });
    } else {
      toast({ title: "No compatible files", description: "Upload ZIPs, code files, or images.", variant: "destructive" });
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state === 'github_oauth') {
      window.history.replaceState({}, '', window.location.pathname);
      exchangeGitHubCode(code);
    } else {
      // Pull the token from the database so it works across devices.
      hydrateGithubToken().then((tk) => { if (tk) setGithubTokenState(tk); }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (githubToken) {
      setGitHubToken(githubToken);
      fetch('https://api.github.com/user', {
        headers: { 'Authorization': `Bearer ${githubToken}`, 'Accept': 'application/vnd.github.v3+json' }
      }).then(r => r.json()).then(data => {
        if (data.login) setGithubUser({ login: data.login, avatar_url: data.avatar_url, name: data.name });
      }).catch(() => {});
    }
  }, [githubToken]);

  const exchangeGitHubCode = async (code: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('github-oauth', {
        body: { code, redirect_uri: `${window.location.origin}/code-analysis` },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      await persistGithubToken(data.access_token);
      setGithubTokenState(data.access_token);
      setGitHubToken(data.access_token);
      setGithubUser(data.github_user);
      toast({ title: "GitHub connected", description: `Connected as ${data.github_user.login}` });
    } catch (err: any) {
      toast({ title: "GitHub connection failed", description: err.message, variant: "destructive" });
    }
  };

  const processZipFile = async (file: File) => {
    toast({ title: "Processing ZIP file", description: `Extracting ${file.name}...` });
    try {
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);
      const extractedFiles: CodeFile[] = [];
      for (const [filename, zipEntry] of Object.entries(contents.files)) {
        if (!zipEntry.dir && isCodeFile(filename)) {
          const content = await zipEntry.async('text');
          extractedFiles.push({ name: filename, content, language: getLanguageFromFilename(filename) });
        }
      }
      if (extractedFiles.length === 0) {
        toast({ title: "No code files found", description: "The ZIP file doesn't contain any recognized code files.", variant: "destructive" });
      } else {
        setCodeFiles(extractedFiles);
        setSelectedFile(extractedFiles[0]);
        setOpenTabs([extractedFiles[0]]);
        toast({ title: "Success", description: `Extracted ${extractedFiles.length} code files.` });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to process ZIP file.", variant: "destructive" });
    }
  };

  const isCodeFile = (filename: string): boolean => {
    const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.cs',
      '.go', '.rs', '.php', '.rb', '.swift', '.kt', '.html', '.css',
      '.json', '.xml', '.sql', '.sh', '.bash'];
    return codeExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  };

  const getLanguageFromFilename = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const languageMap: { [key: string]: string } = {
      'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'tsx': 'typescript',
      'py': 'python', 'java': 'java', 'cpp': 'cpp', 'c': 'c', 'cs': 'csharp',
      'go': 'go', 'rs': 'rust', 'php': 'php', 'rb': 'ruby', 'swift': 'swift',
      'kt': 'kotlin', 'html': 'html', 'css': 'css', 'json': 'json', 'xml': 'xml',
      'sql': 'sql', 'sh': 'bash', 'bash': 'bash'
    };
    return languageMap[ext || ''] || 'plaintext';
  };

  const handleFileUpdate = (fileName: string, newContent: string) => {
    setCodeFiles(prev => prev.map(f => f.name === fileName ? { ...f, content: newContent } : f));
    if (!modifiedFiles.includes(fileName)) setModifiedFiles(prev => [...prev, fileName]);
    if (selectedFile?.name === fileName) setSelectedFile({ ...selectedFile, content: newContent });
    setOpenTabs(prev => prev.map(t => t.name === fileName ? { ...t, content: newContent } : t));
  };

  const handleRepoImported = (
    files: Array<{ name: string; path: string; content: string; language?: string }>,
    info: { owner: string; repo: string; branch: string },
    permissions: { push: boolean; pull: boolean; admin: boolean }
  ) => {
    if (!files || files.length === 0) {
      toast({
        title: "No files found",
        description: "The repository appears to be empty or has no compatible files.",
        variant: "destructive"
      });
      return;
    }

    try {
      const formattedFiles = files.map(f => ({
        name: f.path || f.name || 'unnamed-file',
        content: f.content || '',
        language: f.language || 'plaintext'
      }));

      setCodeFiles(formattedFiles);
      setSelectedFile(formattedFiles[0]);
      setOpenTabs([formattedFiles[0]]);
      setRepoInfo(info);
      setRepoPermissions(permissions);
      setModifiedFiles([]);
      setMobilePanel('code');

      toast({
        title: "Repository imported",
        description: `${files.length} files loaded. ${permissions.push ? 'Push access.' : 'Read-only.'}`,
      });
    } catch (err) {
      console.error("Error importing repo:", err);
      toast({
        title: "Import failed",
        description: "An error occurred while processing the repository files.",
        variant: "destructive"
      });
    }
  };

  const handlePushToGitHub = async () => {
    if (!repoInfo || modifiedFiles.length === 0) return;
    try {
      setIsPushing(true);
      const filesToCommit = modifiedFiles.map(fileName => {
        const file = codeFiles.find(f => f.name === fileName);
        return { path: file!.name, content: file!.content };
      });
      await commitAndPush(repoInfo.owner, repoInfo.repo, repoInfo.branch, filesToCommit, `Update ${modifiedFiles.length} file(s) via Code Analysis`);
      setModifiedFiles([]);
      toast({ title: "Success", description: `Pushed ${filesToCommit.length} file(s) to GitHub` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsPushing(false);
    }
  };

  const handleCreatePR = async () => {
    if (!repoInfo || !prTitle.trim()) return;
    try {
      setIsPushing(true);
      const branchName = `code-analysis-${Date.now()}`;
      await createBranch(repoInfo.owner, repoInfo.repo, branchName, repoInfo.branch);
      const filesToCommit = modifiedFiles.map(fileName => {
        const file = codeFiles.find(f => f.name === fileName);
        return { path: file!.name, content: file!.content };
      });
      await commitAndPush(repoInfo.owner, repoInfo.repo, branchName, filesToCommit, prTitle);
      const pr = await createPullRequest(repoInfo.owner, repoInfo.repo, prTitle, prBody || `Updated ${modifiedFiles.length} file(s)`, branchName, repoInfo.branch);
      setOpenPR({ number: pr.number, url: pr.html_url, title: prTitle, owner: repoInfo.owner, repo: repoInfo.repo });
      setModifiedFiles([]);
      setShowPRDialog(false);
      toast({ title: "PR Created", description: `Successfully created PR #${pr.number}` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsPushing(false);
    }
  };

  const handleMergePR = async () => {
    if (!openPR) return;
    const token = localStorage.getItem('github_access_token');
    if (!token) { toast({ title: 'GitHub not connected', variant: 'destructive' }); return; }
    setGitHubToken(token);
    setIsMerging(true);
    try {
      const res = await mergePullRequest(openPR.owner, openPR.repo, openPR.number, {
        commit_title: `Merge PR #${openPR.number}: ${openPR.title}`,
        merge_method: 'squash',
      });
      if (res.merged) {
        toast({ title: 'PR merged', description: `#${openPR.number} merged into ${openPR.repo}` });
        setOpenPR(null);
      } else {
        toast({ title: 'Merge blocked', description: res.message || 'PR could not be merged.', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Merge failed', description: e.message, variant: 'destructive' });
    } finally {
      setIsMerging(false);
    }
  };

  const handlePushGeneratedFiles = async () => {
    if (!codeFiles.length || !newRepoName.trim()) return;
    const token = localStorage.getItem('github_access_token');
    if (!token) {
      toast({ title: 'GitHub not connected', description: 'Sign in with GitHub first.', variant: 'destructive' });
      return;
    }
    setGitHubToken(token);
    try {
      setIsPushing(true);
      const repo = await createRepo(newRepoName.trim(), '', isPrivateRepo);
      await commitAndPush(
        repo.owner, repo.name, repo.default_branch,
        codeFiles.map(f => ({ path: f.name, content: f.content })),
        `Initial commit via nuvic ai AI`,
      );
      setPushedRepoUrl(repo.html_url);
      setShowPushGenDialog(false);
      toast({ title: 'Repository created', description: `Pushed ${codeFiles.length} files to ${repo.owner}/${repo.name}` });
      window.open(repo.html_url, '_blank');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Push failed';
      toast({ title: 'Push failed', description: msg, variant: 'destructive' });
    } finally {
      setIsPushing(false);
    }
  };

  const handleAIGenerate = async (overridePrompt?: string, overrideRepo?: { owner: string; name: string } | null) => {
    const usedPrompt = (overridePrompt ?? aiPrompt).trim();
    if (!usedPrompt) return;
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-project', { body: { prompt: usedPrompt } });
      if (error) {
        let msg = 'Generation failed';
        try {
          const body = error.context ? await error.context.json() : null;
          if (body?.error) msg = body.error;
          else if (error.message) msg = error.message;
        } catch {
          if (error.message) msg = error.message;
        }
        throw new Error(msg);
      }
      if (!data) throw new Error('No response from server. Please try again.');
      if (data.error) throw new Error(data.error);
      const files: CodeFile[] = (data.files || []).map((f: any) => ({
        name: f.path, content: f.content, language: getLanguageFromFilename(f.path),
      }));
      if (files.length === 0) throw new Error('No files were generated. Try a more specific prompt.');
      setCodeFiles(files);
      setSelectedFile(files[0]);
      setOpenTabs([files[0]]);
      setModifiedFiles(files.map(f => f.name));
      setMobilePanel('code');

      const { data: { user } } = await supabase.auth.getUser();
      let projectId: string | null = null;
      if (user) {
        const { data: ins } = await supabase.from('generated_projects' as any).insert({
          user_id: user.id,
          name: data.project_name || usedPrompt.slice(0, 80),
          description: data.description,
          prompt: usedPrompt,
          stack: data.stack,
          files: data.files || [],
          env_vars: data.env_vars || [],
          database_schema: data.database_schema || null,
          repo_full_name: overrideRepo ? `${overrideRepo.owner}/${overrideRepo.name}` : null,
        } as any).select('id').single();
        projectId = (ins as any)?.id ?? null;
      }
      toast({ title: 'Project generated', description: `${files.length} files created` });

      if (overrideRepo && localStorage.getItem('github_access_token')) {
        try {
          const tk = localStorage.getItem('github_access_token')!;
          setGitHubToken(tk);
          const branchName = `ai-generate-${Date.now()}`;
          const repoRes = await fetch(`https://api.github.com/repos/${overrideRepo.owner}/${overrideRepo.name}`, {
            headers: { Authorization: `Bearer ${tk}` },
          });
          const repoData = await repoRes.json();
          const baseBranch = repoData.default_branch || 'main';
          await createBranch(overrideRepo.owner, overrideRepo.name, branchName, baseBranch);
          await commitAndPush(overrideRepo.owner, overrideRepo.name, branchName,
            files.map(f => ({ path: f.name, content: f.content })),
            `AI: ${(data.project_name || usedPrompt).slice(0, 60)}`);
          const pr = await createPullRequest(
            overrideRepo.owner, overrideRepo.name,
            `AI generated: ${(data.project_name || usedPrompt).slice(0, 60)}`,
            `Generated from prompt:\n\n> ${usedPrompt}\n\n${data.description || ''}`,
            branchName, baseBranch,
          );
          setOpenPR({ number: pr.number, url: pr.html_url, title: `AI generated: ${(data.project_name || usedPrompt).slice(0, 60)}`, owner: overrideRepo.owner, repo: overrideRepo.name });
          if (projectId) {
            await supabase.from('generated_projects' as any).update({ pr_url: pr.html_url }).eq('id', projectId);
          }
          toast({ title: 'Pull request created', description: `#${pr.number} on ${overrideRepo.owner}/${overrideRepo.name}` });
        } catch (prErr: any) {
          toast({ title: 'PR creation failed', description: prErr.message, variant: 'destructive' });
        }
      }
    } catch (e: any) {
      toast({ title: 'Generation failed', description: e.message || 'Something went wrong. Please try again.', variant: 'destructive' });
    } finally { setIsGenerating(false); }
  };

  useEffect(() => {
    const raw = sessionStorage.getItem('pendingCodeRequest');
    if (!raw) return;
    sessionStorage.removeItem('pendingCodeRequest');
    try {
      const req = JSON.parse(raw);
      if (req.mode === 'generate' && req.prompt) {
        setAiPrompt(req.prompt);
        setTimeout(() => handleAIGenerate(req.prompt, req.repo || null), 100);
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line
  }, []);

  const handleClearAll = () => {
    setCodeFiles([]);
    setSelectedFile(null);
    setOpenTabs([]);
    setModifiedFiles([]);
    setRepoInfo(null);
    toast({ title: "Cleared", description: "All files cleared" });
  };

  const handleGithubConnect = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('github-client-id');
      if (error || !data?.client_id) { toast({ title: "Error", description: "GitHub OAuth not configured", variant: "destructive" }); return; }
      const redirectUri = `${window.location.origin}/code-analysis`;
      const scope = 'repo read:user';
      window.location.href = `https://github.com/login/oauth/authorize?client_id=${data.client_id}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=github_oauth`;
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleGithubDisconnect = async () => {
    await clearGithubToken();
    setGithubTokenState(null);
    setGitHubToken(null);
    setGithubUser(null);
    toast({ title: "Disconnected", description: "GitHub account disconnected" });
  };

  const handleCodeEdit = (newContent: string) => {
    if (selectedFile) {
      handleFileUpdate(selectedFile.name, newContent);
    }
  };

  const openFileInTab = (fileName: string) => {
    const file = codeFiles.find(f => f.name === fileName);
    if (!file) return;
    setSelectedFile(file);
    if (!openTabs.find(t => t.name === file.name)) {
      setOpenTabs(prev => [...prev, file]);
    }
  };

  const closeTab = (fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTabs = openTabs.filter(t => t.name !== fileName);
    setOpenTabs(newTabs);
    if (selectedFile?.name === fileName) {
      setSelectedFile(newTabs.length > 0 ? newTabs[newTabs.length - 1] : null);
    }
  };

  const getShortName = (fullPath: string) => fullPath.split('/').pop() || fullPath;

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden">
      <AppSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <SidebarInset className="flex flex-col flex-1 overflow-hidden min-w-0 h-full">
        {/* Unified Header */}
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-3 md:px-4 z-20">
          {codeFiles.length > 0 ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-1 md:mr-2 h-4" />
                {repoInfo ? (
                  <div className="flex items-center gap-1.5 md:gap-3 min-w-0 overflow-hidden">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Github className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs md:text-sm font-bold truncate max-w-[100px] md:max-w-[200px]">
                        {repoInfo.repo}
                      </span>
                    </div>
                    {selectedFile && !isMobile && (
                      <div className="flex items-center gap-1.5 min-w-0 hidden sm:flex">
                        <Separator orientation="vertical" className="h-3 opacity-30" />
                        <Code2 className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                        <span className="text-xs font-medium truncate text-muted-foreground">
                          {getShortName(selectedFile.name)}
                        </span>
                      </div>
                    )}
                    <Badge variant="secondary" className="text-[10px] md:text-xs shrink-0 bg-muted font-mono h-5 px-1.5">
                      <GitBranch className="h-3 w-3 mr-1" />
                      {repoInfo.branch}
                    </Badge>
                  </div>
                ) : (
                  <h1 className="text-sm font-semibold">Local Project</h1>
                )}
              </div>

              <div className="flex items-center gap-1 md:gap-2">
                {repoInfo && repoPermissions?.push && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size={isMobile ? "icon" : "sm"}
                      className="h-8 px-2 gap-1.5 text-xs font-bold"
                      onClick={handlePushToGitHub}
                      disabled={isPushing || modifiedFiles.length === 0}
                      title={`Commit to ${repoInfo.branch}`}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                      {!isMobile && <span>Push</span>}
                    </Button>
                    <Button
                      variant="ghost"
                      size={isMobile ? "icon" : "sm"}
                      className="h-8 px-2 gap-1.5 text-xs font-bold"
                      onClick={() => setShowPRDialog(true)}
                      disabled={isPushing || modifiedFiles.length === 0}
                      title="Create Pull Request"
                    >
                      <GitPullRequest className="h-3.5 w-3.5" />
                      {!isMobile && <span>Pull Request</span>}
                    </Button>
                    {openPR && openPR.owner === repoInfo.owner && openPR.repo === repoInfo.repo && (
                      <Button
                        size={isMobile ? "icon" : "sm"}
                        className="h-8 px-2 gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={handleMergePR}
                        disabled={isMerging}
                        title={`Merge PR #${openPR.number}`}
                      >
                        {isMerging ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <GitMerge className="h-3.5 w-3.5" />}
                        {!isMobile && <span>Merge #{openPR.number}</span>}
                      </Button>
                    )}
                  </div>
                )}
                {!repoInfo && openPR && (
                  <Button
                    size="sm"
                    className="h-8 px-2 gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={handleMergePR}
                    disabled={isMerging}
                    title={`Merge PR #${openPR.number} in ${openPR.repo}`}
                  >
                    {isMerging ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <GitMerge className="h-3.5 w-3.5" />}
                    <span>Merge #{openPR.number}</span>
                  </Button>
                )}
                {!repoInfo && codeFiles.length > 0 && isGitHubAuthenticated && (
                  pushedRepoUrl ? (
                    <Button
                      size="sm"
                      className="gap-1.5 h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => window.open(pushedRepoUrl, '_blank')}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="text-xs">View Repo</span>
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="gap-1.5 h-8"
                      onClick={() => setShowPushGenDialog(true)}
                      disabled={isPushing}
                    >
                      <Github className="h-3.5 w-3.5" />
                      <span className="text-xs">Push to GitHub</span>
                    </Button>
                  )
                )}
                <Button
                  variant={showTerminal ? "default" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowTerminal(v => !v)}
                  title="Toggle terminal"
                >
                  <TerminalSquare className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowSearch(!showSearch)}
                >
                  <Search className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleAttachFiles}
                >
                  <Upload className="h-4 w-4" />
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  multiple
                  onChange={handleAttachFileChange}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <h1 className="text-sm font-semibold">Code Analysis</h1>
            </div>
          )}
        </header>

        {/* Content Area */}
        {codeFiles.length > 0 ? (
          <div className="flex-1 flex overflow-hidden relative w-full h-full">
            {/* Panel 1: AI Chat (Left) */}
            {(!isMobile || mobilePanel === 'chat') && (
              <div className={`${isMobile ? 'absolute inset-0 z-40 w-full h-full bg-background' : 'w-80 lg:w-96 border-r'} flex flex-col shrink-0 border-border bg-background overflow-hidden h-full`}>
                <CodeChatPanel
                  allFiles={codeFiles}
                  selectedFile={selectedFile}
                  onFileUpdate={handleFileUpdate}
                  onAttachFiles={handleAttachFiles}
                />
              </div>
            )}

            {/* Panel 2: File Explorer (Center) */}
            {(!isMobile || mobilePanel === 'files') && (
              <div className={`${isMobile ? 'absolute inset-0 z-40 w-full h-full bg-background' : 'w-64 lg:w-72 border-r'} flex flex-col shrink-0 border-border bg-muted/5 overflow-hidden h-full`}>
                <div className="flex flex-col h-full">
                  <div className="p-3 border-b bg-background/50 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Explorer</span>
                    <div className="flex items-center gap-0.5">
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setShowNewItemDialog(true)}>
                        <FilePlus className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => {
                        setNewItemType("folder");
                        setShowNewItemDialog(true);
                      }}>
                        <FolderPlus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {showSearch && (
                    <div className="px-3 py-2 border-b bg-background/50">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        <Input
                          placeholder="Search files..."
                          className="h-7 pl-7 text-[11px] bg-muted/50 border-none"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          autoFocus
                        />
                      </div>
                    </div>
                  )}
                  <FileTreeView
                    searchTerm={searchQuery}
                    files={codeFiles}
                    selectedFile={selectedFile?.name || null}
                    onFileSelect={(fileName) => {
                      openFileInTab(fileName);
                      if (isMobile) setMobilePanel('code');
                    }}
                    onAddItem={(path, type) => {
                      setParentPath(path);
                      setNewItemType(type);
                      setShowNewItemDialog(true);
                    }}
                  />
                </div>
              </div>
            )}

            {/* Panel 3: Editor (Right) */}
            {(!isMobile || mobilePanel === 'code') && (
              <div className={`${isMobile ? 'absolute inset-0 z-40 w-full h-full bg-background' : 'flex-1'} flex flex-col min-w-0 overflow-hidden h-full`}>
                {/* File tabs */}
                <div className="flex items-center border-b border-border bg-muted/30 overflow-x-auto scrollbar-hide shrink-0 z-10">
                  <ScrollArea className="w-full">
                    <div className="flex min-h-[36px]">
                      {openTabs.map(tab => {
                        const isActive = selectedFile?.name === tab.name;
                        const isModified = modifiedFiles.includes(tab.name);
                        return (
                          <button
                            key={tab.name}
                            onClick={() => setSelectedFile(tab)}
                            className={`group flex items-center gap-2 px-3 py-2 text-[11px] border-r border-border whitespace-nowrap transition-colors relative h-9 ${
                              isActive
                                ? 'bg-background text-foreground font-bold'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            }`}
                          >
                            {isActive && <div className="absolute top-0 left-0 right-0 h-[3px] bg-primary" />}
                            {isModified && <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0" />}
                            <span className="truncate max-w-[120px]">{getShortName(tab.name)}</span>
                            <span
                              onClick={(e) => closeTab(tab.name, e)}
                              className={`ml-1 rounded p-0.5 transition-all ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} hover:bg-muted` }
                            >
                              <X className="h-3 w-3" />
                            </span>
                          </button>
                        );
                      })}
                      {openTabs.length === 0 && (
                        <div className="flex items-center px-4 text-[10px] text-muted-foreground italic">
                          No files open
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Editor Content (stacked with terminal on desktop when shown) */}
                <div className="flex-1 overflow-hidden bg-background min-h-0">
                  {selectedFile ? (
                    <Editor
                      height="100%"
                      language={selectedFile.language || 'plaintext'}
                      value={selectedFile.content || ''}
                      onChange={(value) => handleCodeEdit(value || '')}
                      theme={actualTheme === 'dark' ? 'vs-dark' : 'light'}
                      options={{
                        minimap: { enabled: !isMobile },
                        fontSize: isMobile ? 12 : 13,
                        lineNumbers: isMobile ? 'off' : 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        wordWrap: 'on',
                        padding: { top: 8 },
                        fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                        fontWeight: '600',
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4 bg-muted/5">
                      <div className="rounded-full bg-muted p-4">
                        <Code2 className="h-8 w-8 opacity-20" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold">No file selected</p>
                        <p className="text-xs font-medium opacity-70">Choose a file from the explorer to start editing</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Desktop inline terminal (bottom split) */}
                {!isMobile && showTerminal && (
                  <div className="h-64 border-t border-border shrink-0">
                    <WebContainerTerminal files={codeFiles} />
                  </div>
                )}
              </div>
            )}

            {/* Panel 4: Terminal (Mobile full-screen) */}
            {isMobile && mobilePanel === 'terminal' && (
              <div className="absolute inset-0 z-40 w-full h-full bg-background flex flex-col overflow-hidden">
                <WebContainerTerminal files={codeFiles} />
              </div>
            )}
          </div>
        ) : (
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="mx-auto w-full max-w-3xl space-y-6">
              <div className="rounded-2xl bg-muted/60 dark:bg-[#1a1a1a] border border-border dark:border-[#333] shadow-lg overflow-hidden">
                <TextareaUI
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ask nuvic ai to build features, fix bugs, or work on your code"
                  rows={2}
                  className="resize-none text-sm bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground/80 placeholder:text-muted-foreground/60 px-5 pt-4 pb-2"
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAIGenerate(); }}
                />
                <div className="flex items-center justify-between px-4 pb-3">
                  <button
                    type="button"
                    onClick={handleAttachFiles}
                    className="p-1.5 rounded-lg hover:bg-foreground/10 text-muted-foreground/60 hover:text-foreground/70 transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (aiPrompt.trim()) handleAIGenerate(); }}
                    disabled={isGenerating || !aiPrompt.trim()}
                    className="p-1.5 rounded-lg hover:bg-foreground/10 text-muted-foreground/60 hover:text-foreground/70 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Card className="border-2 border-dashed border-muted-foreground/20 bg-muted/5">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 rounded-full bg-primary/10 p-4 w-16 h-16 flex items-center justify-center">
                    <Github className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-bold">Connect Your Repository</CardTitle>
                  <CardDescription>
                    Connect your GitHub account or upload a local project to start analyzing code with AI.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isGitHubAuthenticated ? (
                    <div className="space-y-6">
                      {githubUser && (
                        <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
                          <div className="flex items-center gap-3">
                            <img src={githubUser.avatar_url} alt={githubUser.login} className="h-10 w-10 rounded-full border border-border" />
                            <div>
                              <p className="font-semibold text-foreground">{githubUser.name || githubUser.login}</p>
                              <p className="text-xs text-muted-foreground font-mono">@{githubUser.login}</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={handleGithubDisconnect} className="hover:bg-destructive hover:text-destructive-foreground">
                            Disconnect
                          </Button>
                        </div>
                      )}
                      <GitHubRepoSelector onRepoImported={handleRepoImported} />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4 py-8">
                      <Button onClick={handleGithubConnect} size="lg" className="w-full sm:w-auto gap-2 text-base h-12 px-8">
                        <Github className="h-5 w-5" />
                        Connect with GitHub
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        We'll need permission to read your repositories.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            <Footer />
          </main>
        )}

        {/* Mobile Navigation Tabs */}
        {isMobile && codeFiles.length > 0 && (
          <div className="h-12 flex items-center justify-center border-t border-border bg-background px-4 shrink-0 z-30">
            <div className="flex items-center bg-muted/50 rounded-full p-1 w-full max-w-[380px]">
              <button
                onClick={() => setMobilePanel('chat')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  mobilePanel === 'chat' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Chat
              </button>
              <button
                onClick={() => setMobilePanel('files')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  mobilePanel === 'files' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'
                }`}
              >
                <FolderTree className="h-3.5 w-3.5" />
                Files
              </button>
              <button
                onClick={() => setMobilePanel('code')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  mobilePanel === 'code' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'
                }`}
              >
                <Code2 className="h-3.5 w-3.5" />
                Code
              </button>
              <button
                onClick={() => setMobilePanel('terminal')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  mobilePanel === 'terminal' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'
                }`}
              >
                <TerminalSquare className="h-3.5 w-3.5" />
                Term
              </button>
            </div>
          </div>
        )}
      </SidebarInset>

      {/* Dialogs */}
      <Dialog open={showPRDialog} onOpenChange={setShowPRDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Pull Request</DialogTitle>
            <DialogDescription>
              Submit your changes for review. A new branch will be created.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="pr-title">Title</Label>
              <Input id="pr-title" value={prTitle} onChange={(e) => setPrTitle(e.target.value)} placeholder="Fix bug in editor layout" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pr-desc">Description</Label>
              <TextareaUI id="pr-desc" value={prBody} onChange={(e) => setPrBody(e.target.value)} placeholder="What changed in this PR?" rows={4} className="resize-none" />
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              {modifiedFiles.length} modified file(s) will be included.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPRDialog(false)}>Cancel</Button>
            <Button onClick={handleCreatePR} disabled={isPushing || !prTitle.trim()}>
              {isPushing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</> : 'Create PR'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPushGenDialog} onOpenChange={setShowPushGenDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              Push to GitHub
            </DialogTitle>
            <DialogDescription>
              Create a new repository and push {codeFiles.length} generated file(s).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="repo-name">Repository name</Label>
              <Input id="repo-name" value={newRepoName} onChange={(e) => setNewRepoName(e.target.value)} placeholder="my-project" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch checked={isPrivateRepo} onCheckedChange={setIsPrivateRepo} className="h-4 w-7" />
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Private repository</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPushGenDialog(false)}>Cancel</Button>
            <Button onClick={handlePushGeneratedFiles} disabled={isPushing || !newRepoName.trim()} className="gap-1.5">
              {isPushing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Pushing...</> : <><Upload className="h-4 w-4" />Create & Push</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewItemDialog} onOpenChange={setShowNewItemDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {newItemType === "file" ? <FilePlus className="h-5 w-5" /> : <FolderPlus className="h-5 w-5" />}
              Create New {newItemType === "file" ? "File" : "Folder"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder={newItemType === "file" ? "example.ts" : "new-folder"}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreateNewItem(); }}
                autoFocus
              />
            </div>
            {parentPath && (
              <p className="text-[10px] text-muted-foreground">
                Will be created in: <code className="bg-muted px-1 rounded">{parentPath}</code>
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewItemDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateNewItem} disabled={!newItemName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CodeAnalysis;
