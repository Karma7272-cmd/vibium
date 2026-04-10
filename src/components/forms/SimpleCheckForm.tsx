import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useIsMobile } from '@/hooks/use-mobile';
import { ArrowUp, Plus, File, Folder, FileArchive, Image, Github, ChevronDown, X, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
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
  const isMobile = useIsMobile();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalPrompt = prompt || "Ask to write";
    const checkData = {
      prompt: finalPrompt,
      timestamp: new Date().toISOString(),
      files: selectedFiles.map(f => f.name),
      repo: selectedRepo
    };
    console.log('Creating new check:', checkData);
    sessionStorage.setItem('pendingCheck', JSON.stringify(checkData));
    navigate('/pending-request');
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

  const removeRepo = () => {
    setSelectedRepo(null);
  };

  const currentPlaceholder = prompt || isTextareaFocused 
    ? "Test anything" 
    : "Ask to write";

  return (
    <div className={`space-y-4 ${isMobile ? "max-h-[60vh]" : ""}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative bg-white dark:bg-slate-900 rounded-lg border-2 border-gray-300 hover:border-gray-400 focus-within:border-gray-400 transition-all duration-200 shadow-sm hover:shadow-md">

          {(selectedFiles.length > 0 || selectedRepo) && (
            <div className="flex flex-wrap gap-2 px-4 pt-3 max-h-32 overflow-y-auto">
              {selectedRepo && (
                <Badge variant="secondary" className="gap-1 px-2 py-1">
                  <Github className="h-3 w-3" />
                  {selectedRepo.name}
                  <X className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors" onClick={removeRepo} />
                </Badge>
              )}
              {selectedFiles.map((file, i) => (
                <Badge key={i} variant="outline" className="gap-1 px-2 py-1">
                  <File className="h-3 w-3" />
                  <span className="max-w-[150px] truncate">{file.name}</span>
                  <X className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors" onClick={() => removeFile(i)} />
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
            className="w-full min-h-[100px] text-sm sm:text-base px-4 py-3 border-0 focus:ring-0 focus-visible:ring-0 shadow-none placeholder:text-gray-400 resize-none bg-transparent"
            rows={3}
          />

          <div className="flex items-center justify-between px-2 pb-2">
            <div className="flex items-center gap-1">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800">
                    <Plus className="h-5 w-5" data-testid="plus-icon" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 z-[100]">
                  <DropdownMenuItem className="cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <File className="mr-2 h-4 w-4" /> <span>Files</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => folderInputRef.current?.click()}>
                    <Folder className="mr-2 h-4 w-4" /> <span>Folder</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => zipInputRef.current?.click()}>
                    <FileArchive className="mr-2 h-4 w-4" /> <span>Zip files</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => imageInputRef.current?.click()}>
                    <Image className="mr-2 h-4 w-4" /> <span>Images</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu modal={false} onOpenChange={(open) => open && fetchRepos()}>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" size="sm" className="h-8 gap-1.5 px-2.5 rounded-md font-medium text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800">
                    <Github className="h-3.5 w-3.5" />
                    <span className="max-w-[100px] truncate">
                      {selectedRepo ? selectedRepo.name : "Select Repository"}
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[240px] max-h-[300px] overflow-y-auto z-[100]">
                  {localStorage.getItem('github_access_token') ? (
                    isReposLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : repos.length > 0 ? (
                      repos.map(repo => (
                        <DropdownMenuItem
                          key={repo.id}
                          className="cursor-pointer"
                          onClick={() => setSelectedRepo({ owner: repo.full_name.split('/')[0], name: repo.name })}
                        >
                          <div className="flex flex-col overflow-hidden">
                            <span className="font-medium truncate">{repo.name}</span>
                            <span className="text-[10px] text-muted-foreground truncate">{repo.full_name}</span>
                          </div>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <div className="py-4 px-2 text-center">
                        <p className="text-xs text-muted-foreground">No repositories found.</p>
                      </div>
                    )
                  ) : (
                    <div className="py-4 px-2 text-center">
                      <p className="text-xs text-muted-foreground mb-2">Connect GitHub to see your repositories.</p>
                      <Button size="sm" className="w-full text-xs h-8 gap-2" onClick={handleGithubConnect}>
                        <Github className="h-3.5 w-3.5" />
                        Connect GitHub
                      </Button>
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Button
              type="submit"
              className="w-10 h-10 p-0 bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300 rounded-full font-medium flex items-center justify-center transition-colors"
              variant="outline"
            >
              <ArrowUp size={16} />
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
