import { cn } from '@/lib/utils';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useIsMobile } from '@/hooks/use-mobile';
import { ArrowUp, Plus, File, Folder, FileArchive, Image, Github, ChevronDown, X, Loader2, Clock, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { listUserRepos, GitHubRepo, setGitHubToken } from '@/services/githubService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const SimpleCheckForm: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<{ owner: string; name: string } | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [isReposLoading, setIsReposLoading] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const isMobile = useIsMobile();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed) {
      toast({ title: "Enter a prompt", description: "Describe what you'd like to build or change." });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Sign in required", description: "Sign in to generate.", variant: "destructive" });
      navigate('/auth');
      return;
    }

    // If a future schedule is set, persist as a task and exit.
    if (scheduledDate && scheduledDate.getTime() > Date.now()) {
      const { error } = await supabase.from('tasks').insert({
        user_id: user.id,
        title: trimmed.slice(0, 120),
        prompt: trimmed,
        status: 'scheduled',
        kind: 'generate',
        scheduled_at: scheduledDate.toISOString(),
        repo_full_name: selectedRepo ? `${selectedRepo.owner}/${selectedRepo.name}` : null,
      } as any);
      if (error) {
        toast({ title: "Could not schedule", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Task scheduled", description: `Will run ${format(scheduledDate, "PPP p")}` });
      setPrompt(''); setScheduledDate(undefined);
      navigate('/tasks');
      return;
    }

    // Analyze existing repo flow still goes to Code AI workspace
    if (selectedRepo && localStorage.getItem('github_access_token')) {
      sessionStorage.setItem('pendingCodeRequest', JSON.stringify({
        mode: 'analyze', prompt: trimmed, repo: selectedRepo,
      }));
      navigate('/code-analysis');
      return;
    }

    // Generate mode — call AI directly, save as project, no GitHub required.
    setIsGenerating(true);
    try {
      toast({ title: "Generating…", description: "AI is building your project." });
      const { data, error } = await supabase.functions.invoke('generate-project', {
        body: { prompt: trimmed },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.files?.length) throw new Error('No files generated');

      const { data: inserted, error: insErr } = await supabase
        .from('generated_projects')
        .insert({
          user_id: user.id,
          name: data.project_name || trimmed.slice(0, 60),
          description: data.description ?? null,
          prompt: trimmed,
          stack: data.stack ?? null,
          files: data.files,
          env_vars: data.env_vars ?? [],
          database_schema: data.database_schema ?? null,
          repo_full_name: selectedRepo ? `${selectedRepo.owner}/${selectedRepo.name}` : null,
        } as any)
        .select('id')
        .single();
      if (insErr) throw insErr;

      toast({ title: "Project ready", description: `${data.files.length} files generated. Download or push to GitHub.` });
      setPrompt('');
      navigate(`/projects?open=${(inserted as any).id}`);
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message || 'Try again', variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGithubConnect = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('github-client-id');
      if (error || !data?.client_id) {
        toast({ title: "Error", description: "GitHub OAuth not configured", variant: "destructive" });
        return;
      }
      const redirectUri = `${window.location.origin}/code-analysis`;
      const scope = 'repo read:user';
      window.location.href = `https://github.com/login/oauth/authorize?client_id=${data.client_id}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=github_oauth`;
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const fetchRepos = async () => {
    const token = localStorage.getItem('github_access_token');
    if (!token) return;
    setGitHubToken(token);
    setIsReposLoading(true);
    try {
      const userRepos = await listUserRepos();
      setRepos(userRepos);
    } catch (error: any) {
      console.error("Failed to fetch repos", error);
    } finally {
      setIsReposLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeRepo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRepo(null);
  };

  const currentPlaceholder = selectedRepo
    ? `Ask AI to edit ${selectedRepo.name}…`
    : (isTextareaFocused ? "Describe a full-stack app to generate" : "Ask to write");

  return (
    <div className={cn("space-y-4", isMobile && "max-h-[60vh]")}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-gray-300 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-600 focus-within:border-primary/50 transition-all duration-200 shadow-sm overflow-hidden">

          {(selectedFiles.length > 0 || selectedRepo) && (
            <div className="flex flex-wrap gap-2 px-4 pt-3 pb-1 max-h-32 overflow-y-auto bg-muted/10 border-b border-border/50">
              {selectedRepo && (
                <Badge variant="secondary" className="gap-1.5 px-2 py-1 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                  <Github className="h-3 w-3" />
                  <span className="max-w-[150px] truncate">{selectedRepo.name}</span>
                  <X className="h-3 w-3 cursor-pointer opacity-70 hover:opacity-100" onClick={removeRepo} />
                </Badge>
              )}
              {selectedFiles.map((file, i) => (
                <Badge key={i} variant="outline" className="gap-1.5 px-2 py-1 bg-background">
                  <File className="h-3 w-3 text-muted-foreground" />
                  <span className="max-w-[150px] truncate">{file.name}</span>
                  <X className="h-3 w-3 cursor-pointer opacity-70 hover:opacity-100" onClick={() => removeFile(i)} />
                </Badge>
              ))}
            </div>
          )}

          <Textarea
            placeholder={currentPlaceholder}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onFocus={() => setIsTextareaFocused(true)}
            onBlur={() => setIsTextareaFocused(false)}
            className="w-full min-h-[100px] text-sm sm:text-base px-4 py-4 border-0 focus:ring-0 focus-visible:ring-0 shadow-none placeholder:text-gray-400 resize-none bg-transparent"
            rows={3}
          />

          <div className="flex items-center justify-between px-3 pb-3">
            <div className="flex items-center gap-1.5">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <Plus className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 z-[100]">
                  <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => fileInputRef.current?.click()}>
                    <File className="h-4 w-4" /> <span>Files</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => folderInputRef.current?.click()}>
                    <Folder className="h-4 w-4" /> <span>Folder</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => zipInputRef.current?.click()}>
                    <FileArchive className="h-4 w-4" /> <span>Zip files</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => imageInputRef.current?.click()}>
                    <Image className="h-4 w-4" /> <span>Images</span>
                  </DropdownMenuItem>
                  <div className="h-px my-1 bg-muted" />
                  <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => navigate('/settings')}>
                    <Settings className="h-4 w-4" /> <span>Settings</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

                            <Popover open={isTimerOpen} onOpenChange={setIsTimerOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className={cn("h-9 w-9 rounded-full transition-colors", scheduledDate ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                    <Clock className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3 border-b border-border">
                    <h4 className="text-xs font-semibold">Schedule Task</h4>
                    {scheduledDate && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Selected: {format(scheduledDate, "PPP p")}
                      </p>
                    )}
                  </div>
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={(d) => {
                      if (!d) { setScheduledDate(undefined); return; }
                      // Preserve previously selected time if any, else default to next hour
                      const base = new Date(d);
                      if (scheduledDate) {
                        base.setHours(scheduledDate.getHours(), scheduledDate.getMinutes(), 0, 0);
                      } else {
                        const now = new Date();
                        base.setHours(now.getHours() + 1, 0, 0, 0);
                      }
                      setScheduledDate(base);
                    }}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today;
                    }}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                  <div className="p-3 border-t border-border flex items-center justify-between gap-2">
                    <span className="text-[10px] font-medium">Time</span>
                    <input
                      type="time"
                      value={scheduledDate ? format(scheduledDate, "HH:mm") : ""}
                      className="text-xs bg-transparent border border-border rounded px-2 py-1 outline-none"
                      onChange={(e) => {
                        const v = e.target.value;
                        if (!v) return;
                        const [hours, minutes] = v.split(':').map((n) => parseInt(n, 10));
                        const base = scheduledDate ? new Date(scheduledDate) : new Date();
                        base.setHours(hours, minutes, 0, 0);
                        setScheduledDate(base);
                      }}
                    />
                  </div>
                  <div className="p-2 border-t border-border flex justify-between gap-2">
                    <Button variant="ghost" size="sm" className="text-[10px] h-7" onClick={() => setScheduledDate(undefined)}>Clear</Button>
                    <Button variant="default" size="sm" className="text-[10px] h-7" onClick={() => setIsTimerOpen(false)}>Set Time</Button>
                  </div>
                </PopoverContent>
              </Popover>

              <DropdownMenu modal={false} onOpenChange={(open) => open && fetchRepos()}>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 px-3 rounded-full font-medium text-[11px] bg-background border-border hover:bg-muted transition-colors">
                    <Github className="h-3.5 w-3.5" />
                    <span className="max-w-[120px] truncate">
                      {selectedRepo ? selectedRepo.name : "Select Repository"}
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[240px] max-h-[300px] overflow-y-auto z-[100]">
                  {localStorage.getItem('github_access_token') ? (
                    isReposLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    ) : repos.length > 0 ? (
                      <div className="py-1">
                        <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Your Repositories</div>
                        {repos.map(repo => (
                          <DropdownMenuItem
                            key={repo.id}
                            className="cursor-pointer py-2"
                            onClick={() => setSelectedRepo({ owner: repo.full_name.split('/')[0], name: repo.name })}
                          >
                            <div className="flex flex-col overflow-hidden">
                              <span className="font-semibold text-xs truncate">{repo.name}</span>
                              <span className="text-[10px] text-muted-foreground truncate">{repo.full_name}</span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 px-4 text-center">
                        <p className="text-xs text-muted-foreground">No repositories found.</p>
                      </div>
                    )
                  ) : (
                    <div className="py-6 px-4 text-center">
                      <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Github className="h-5 w-5 text-primary" />
                      </div>
                      <p className="text-xs font-semibold mb-1">GitHub not connected</p>
                      <p className="text-[10px] text-muted-foreground mb-4">Connect to select a repository</p>
                      <Button size="sm" className="w-full text-xs h-8 gap-2 rounded-lg" onClick={handleGithubConnect}>
                        Connect GitHub
                      </Button>
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Button
              type="submit"
              disabled={isGenerating}
              className="w-10 h-10 p-0 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-medium flex items-center justify-center transition-all shadow-md active:scale-95"
            >
              {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <ArrowUp size={18} />}
            </Button>
          </div>
        </div>

        <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />
        <input type="file" ref={folderInputRef} className="hidden" {...({ webkitdirectory: "", directory: "" } as any)} onChange={handleFolderChange} />
        <input type="file" ref={zipInputRef} className="hidden" accept=".zip" onChange={handleFileChange} />
        <input type="file" ref={imageInputRef} className="hidden" accept="image/*" multiple onChange={handleFileChange} />
      </form>
    </div>
  );
};

export default SimpleCheckForm;
