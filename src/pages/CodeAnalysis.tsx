import { useState, useEffect } from "react";
import AppSidebar from "@/components/AppSidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Upload, Github, FileCode, Loader2, Download, Wand2, Search, Zap, MessageSquare, GitBranch, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import JSZip from "jszip";
import { FileTreeView } from "@/components/code-analysis/FileTreeView";
import { CodeChatPanel } from "@/components/code-analysis/CodeChatPanel";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Editor from "@monaco-editor/react";
import { useTheme } from "@/components/ThemeProvider";
import { GitHubRepoSelector } from "@/components/code-analysis/GitHubRepoSelector";
import { commitAndPush, setGitHubToken, createPullRequest, createBranch } from "@/services/githubService";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea as TextareaUI } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface CodeFile {
  name: string;
  content: string;
  language: string;
  path?: string;
}

const CodeAnalysis = () => {
  const [activeSection, setActiveSection] = useState("code-analysis");
  const [analyzing, setAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [codeFiles, setCodeFiles] = useState<CodeFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<CodeFile | null>(null);
  const [openTabs, setOpenTabs] = useState<CodeFile[]>([]);
  const [analysisResult, setAnalysisResult] = useState("");
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [repoInfo, setRepoInfo] = useState<{ owner: string; repo: string; branch: string } | null>(null);
  const [repoPermissions, setRepoPermissions] = useState<{ push: boolean; pull: boolean; admin: boolean } | null>(null);
  const [isPushing, setIsPushing] = useState(false);
  const [modifiedFiles, setModifiedFiles] = useState<string[]>([]);
  const [githubToken, setGithubTokenState] = useState<string | null>(localStorage.getItem('github_access_token'));
  const [githubUser, setGithubUser] = useState<{ login: string; avatar_url: string; name: string } | null>(null);
  const [showPRDialog, setShowPRDialog] = useState(false);
  const [prTitle, setPrTitle] = useState("");
  const [prBody, setPrBody] = useState("");
  const { toast } = useToast();
  const { theme } = useTheme();
  const { session } = useAuth();
  const isGitHubAuthenticated = !!githubToken;
  const isMobile = useIsMobile();

  // Handle GitHub OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state === 'github_oauth') {
      window.history.replaceState({}, '', window.location.pathname);
      exchangeGitHubCode(code);
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
      localStorage.setItem('github_access_token', data.access_token);
      setGithubTokenState(data.access_token);
      setGitHubToken(data.access_token);
      setGithubUser(data.github_user);
      toast({ title: "GitHub connected", description: `Connected as ${data.github_user.login}` });
    } catch (err: any) {
      toast({ title: "GitHub connection failed", description: err.message, variant: "destructive" });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    const zipFile = files.find(file => file.name.endsWith('.zip'));
    if (zipFile) await processZipFile(zipFile);
    else toast({ title: "Invalid file", description: "Please upload a ZIP file.", variant: "destructive" });
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.zip')) await processZipFile(file);
    else toast({ title: "Invalid file", description: "Please upload a ZIP file.", variant: "destructive" });
  };

  const processZipFile = async (file: File) => {
    setAnalyzing(true);
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
    } finally {
      setAnalyzing(false);
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

  const handleAiAction = async (action: 'analyze' | 'fix' | 'explain' | 'optimize') => {
    if (!selectedFile) return;
    setIsAiProcessing(true);
    setAnalysisResult("");
    try {
      const { data, error } = await supabase.functions.invoke('analyze-code', {
        body: { code: selectedFile.content, action, fileName: selectedFile.name },
      });
      if (error) throw error;
      if (data.error) { toast({ title: "Error", description: data.error, variant: "destructive" }); return; }
      if (action === 'fix' || action === 'optimize') {
        setSelectedFile({ ...selectedFile, content: data.result });
        toast({ title: "Success", description: `Code ${action === 'fix' ? 'fixed' : 'optimized'} successfully!` });
      } else {
        setAnalysisResult(data.result);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to process request.", variant: "destructive" });
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleExport = () => {
    if (!selectedFile) return;
    const blob = new Blob([selectedFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.name.split('/').pop() || selectedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${selectedFile.name} downloaded successfully.` });
  };

  const handleCodeEdit = (newContent: string) => {
    if (selectedFile) {
      const updated = { ...selectedFile, content: newContent };
      setSelectedFile(updated);
      setCodeFiles(prev => prev.map(f => f.name === selectedFile.name ? { ...f, content: newContent } : f));
      setOpenTabs(prev => prev.map(t => t.name === selectedFile.name ? { ...t, content: newContent } : t));
      if (!modifiedFiles.includes(selectedFile.name)) {
        setModifiedFiles(prev => [...prev, selectedFile.name]);
      }
    }
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
    const formattedFiles = files.map(f => ({ name: f.path, content: f.content, language: f.language || 'plaintext' }));
    setCodeFiles(formattedFiles);
    setSelectedFile(formattedFiles[0] || null);
    setOpenTabs(formattedFiles[0] ? [formattedFiles[0]] : []);
    setRepoInfo(info);
    setRepoPermissions(permissions);
    setModifiedFiles([]);
    toast({
      title: "Repository imported",
      description: `${files.length} files loaded. ${permissions.push ? 'Push access.' : 'Read-only.'}`,
    });
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
      setModifiedFiles([]);
      setShowPRDialog(false);
      setPrTitle("");
      setPrBody("");
      toast({ title: "Pull Request Created", description: `PR #${pr.number} created successfully` });
      window.open(pr.html_url, '_blank');
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsPushing(false);
    }
  };

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

  const handleGithubDisconnect = () => {
    localStorage.removeItem('github_access_token');
    setGithubTokenState(null);
    setGitHubToken(null);
    setGithubUser(null);
    toast({ title: "Disconnected", description: "GitHub account disconnected" });
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

  // Upload / connect screen
  if (!codeFiles.length) {
    return (
      <>
        <AppSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <h1 className="text-sm font-semibold">Code Analysis</h1>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
            <div className="mx-auto w-full max-w-3xl space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCode className="h-5 w-5" />
                    Upload Your Code
                  </CardTitle>
                  <CardDescription>Upload a ZIP file or connect your GitHub repository</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="github" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="upload">Upload ZIP</TabsTrigger>
                      <TabsTrigger value="github">GitHub</TabsTrigger>
                    </TabsList>
                    <TabsContent value="upload" className="space-y-4">
                      <div
                        className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"}`}
                        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                      >
                        <input type="file" accept=".zip" onChange={handleFileInput} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={analyzing} />
                        <div className="flex flex-col items-center gap-4">
                          {analyzing ? (
                            <><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="text-lg font-medium">Processing files...</p></>
                          ) : (
                            <><Upload className="h-12 w-12 text-muted-foreground" /><div><p className="text-lg font-medium">Drag & drop your ZIP file here</p><p className="text-sm text-muted-foreground mt-1">or click to browse</p></div></>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="github" className="space-y-4">
                      {isGitHubAuthenticated ? (
                        <div className="space-y-4">
                          {githubUser && (
                            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                              <div className="flex items-center gap-3">
                                <img src={githubUser.avatar_url} alt={githubUser.login} className="h-8 w-8 rounded-full" />
                                <div>
                                  <p className="text-sm font-medium">{githubUser.name || githubUser.login}</p>
                                  <p className="text-xs text-muted-foreground">@{githubUser.login}</p>
                                </div>
                              </div>
                              <Button variant="outline" size="sm" onClick={handleGithubDisconnect}>Disconnect</Button>
                            </div>
                          )}
                          <GitHubRepoSelector onRepoImported={handleRepoImported} />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-6 text-center py-8">
                          <div className="rounded-full bg-primary/10 p-4"><Github className="h-8 w-8 text-primary" /></div>
                          <div>
                            <h3 className="text-lg font-semibold mb-2">Connect GitHub Repository</h3>
                            <p className="text-sm text-muted-foreground mb-6">Authorize access to analyze your GitHub repositories</p>
                          </div>
                          <Button onClick={handleGithubConnect} size="lg" className="gap-2"><Github className="h-5 w-5" />Connect GitHub</Button>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </>
    );
  }

  // IDE Layout
  return (
    <>
      <AppSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <SidebarInset>
        {/* Top header bar with repo info + push/PR buttons */}
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            {repoInfo ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{repoInfo.owner}/{repoInfo.repo}</span>
                <Badge variant="outline" className="text-xs">
                  <GitBranch className="h-3 w-3 mr-1" />
                  {repoInfo.branch}
                </Badge>
                {repoPermissions && (
                  <Badge variant={repoPermissions.push ? "default" : "secondary"} className="text-xs">
                    {repoPermissions.push ? "Push" : "Read-only"}
                  </Badge>
                )}
                {modifiedFiles.length > 0 && (
                  <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                    {modifiedFiles.length} modified
                  </Badge>
                )}
              </div>
            ) : (
              <span className="text-sm font-semibold">Code Editor</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {repoInfo && modifiedFiles.length > 0 && repoPermissions?.push && (
              <Button onClick={handlePushToGitHub} disabled={isPushing} size="sm" variant="default" className="h-8 text-xs">
                {isPushing ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Pushing</> : <><Upload className="h-3 w-3 mr-1" />Push ({modifiedFiles.length})</>}
              </Button>
            )}
            {repoInfo && modifiedFiles.length > 0 && (
              <Button
                onClick={() => { setPrTitle(`Update ${modifiedFiles.length} file(s)`); setShowPRDialog(true); }}
                disabled={isPushing} size="sm" variant="outline" className="h-8 text-xs"
              >
                <GitBranch className="h-3 w-3 mr-1" />Pull Request
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setShowChat(!showChat)} className="h-8 text-xs">
              <MessageSquare className="h-3 w-3 mr-1" />AI Chat
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClearAll} className="h-8 text-xs text-destructive hover:text-destructive">
              Close Project
            </Button>
          </div>
        </header>

        {/* Main IDE area */}
        <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 48px)' }}>
          {/* File tree sidebar */}
          <div className="w-64 flex-shrink-0 border-r border-border bg-muted/30 flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Files</span>
              <span className="text-xs text-muted-foreground">{codeFiles.length}</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <FileTreeView
                files={codeFiles}
                selectedFile={selectedFile?.name || null}
                onFileSelect={openFileInTab}
              />
            </div>
          </div>

          {/* Editor area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* File tabs */}
            {openTabs.length > 0 && (
              <div className="flex items-center border-b border-border bg-muted/20 overflow-x-auto">
                <ScrollArea className="w-full" orientation="horizontal">
                  <div className="flex">
                    {openTabs.map(tab => {
                      const isActive = selectedFile?.name === tab.name;
                      const isModified = modifiedFiles.includes(tab.name);
                      return (
                        <button
                          key={tab.name}
                          onClick={() => setSelectedFile(tab)}
                          className={`group flex items-center gap-1.5 px-3 py-2 text-xs border-r border-border whitespace-nowrap transition-colors ${
                            isActive
                              ? 'bg-background text-foreground border-b-2 border-b-primary'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                          }`}
                        >
                          {isModified && <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 flex-shrink-0" />}
                          <span>{getShortName(tab.name)}</span>
                          <span
                            onClick={(e) => closeTab(tab.name, e)}
                            className="ml-1 opacity-0 group-hover:opacity-100 hover:bg-muted rounded p-0.5 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Monaco Editor */}
            <div className="flex-1 overflow-hidden">
              {selectedFile ? (
                <Editor
                  height="100%"
                  language={selectedFile.language || 'plaintext'}
                  value={selectedFile.content || ''}
                  onChange={(value) => handleCodeEdit(value || '')}
                  theme={theme === 'dark' ? 'vs-dark' : 'light'}
                  options={{
                    minimap: { enabled: !isMobile },
                    fontSize: 13,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    wordWrap: 'off',
                    padding: { top: 8 },
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p className="text-sm">Select a file from the tree to start editing</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Chat panel (slide-in) */}
          {showChat && (
            <div className="w-80 flex-shrink-0 border-l border-border bg-background">
              <CodeChatPanel
                allFiles={codeFiles}
                selectedFile={selectedFile}
                onFileUpdate={handleFileUpdate}
                onClose={() => setShowChat(false)}
              />
            </div>
          )}
        </div>
      </SidebarInset>

      <Dialog open={showPRDialog} onOpenChange={setShowPRDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Pull Request</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">Title</label><Input value={prTitle} onChange={(e) => setPrTitle(e.target.value)} placeholder="PR title" /></div>
            <div><label className="text-sm font-medium">Description</label><TextareaUI value={prBody} onChange={(e) => setPrBody(e.target.value)} placeholder="Describe your changes..." rows={4} /></div>
            <p className="text-xs text-muted-foreground">{modifiedFiles.length} file(s) will be committed to a new branch and a PR opened against <code>{repoInfo?.branch}</code>.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPRDialog(false)}>Cancel</Button>
            <Button onClick={handleCreatePR} disabled={isPushing || !prTitle.trim()}>
              {isPushing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</> : 'Create PR'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CodeAnalysis;
