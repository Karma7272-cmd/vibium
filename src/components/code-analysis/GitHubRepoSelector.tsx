import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GitHubRepo, listUserRepos, getRepoContents, getFileContent, setGitHubToken } from "@/services/githubService";
import { useToast } from "@/hooks/use-toast";
import { Loader2, GitBranch, Lock, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface GitHubRepoSelectorProps {
  onRepoImported: (files: Array<{ name: string; path: string; content: string; language?: string }>, repoInfo: { owner: string; repo: string; branch: string }) => void;
}

export function GitHubRepoSelector({ onRepoImported }: GitHubRepoSelectorProps) {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState<number | null>(null);
  const { toast } = useToast();
  const { session } = useAuth();

  const setupGitHubToken = useCallback(() => {
    const providerToken = session?.provider_token;
    if (providerToken) {
      setGitHubToken(providerToken);
      return true;
    }
    return false;
  }, [session]);

  useEffect(() => {
    const hasToken = setupGitHubToken();
    if (hasToken) {
      loadRepos();
    } else {
      setLoading(false);
      toast({
        title: "GitHub not connected",
        description: "Please sign in with GitHub to access your repositories.",
        variant: "destructive",
      });
    }
  }, [setupGitHubToken]);

  const loadRepos = async () => {
    try {
      setLoading(true);
      const userRepos = await listUserRepos();
      setRepos(userRepos);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getLanguageFromPath = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'tsx': 'typescript',
      'py': 'python', 'java': 'java', 'cpp': 'cpp', 'c': 'c', 'cs': 'csharp',
      'go': 'go', 'rs': 'rust', 'php': 'php', 'rb': 'ruby', 'swift': 'swift',
      'kt': 'kotlin', 'html': 'html', 'css': 'css', 'scss': 'scss',
      'json': 'json', 'xml': 'xml', 'yaml': 'yaml', 'yml': 'yaml',
      'md': 'markdown', 'sql': 'sql', 'sh': 'shell', 'bash': 'shell',
    };
    return languageMap[ext || ''] || 'plaintext';
  };

  const importRepo = async (repo: GitHubRepo) => {
    try {
      setImporting(repo.id);
      setupGitHubToken();
      const [owner, repoName] = repo.full_name.split('/');

      toast({ title: "Importing repository", description: "Fetching files from GitHub..." });

      const files: Array<{ name: string; path: string; content: string; language?: string }> = [];

      const processDirectory = async (path: string = '') => {
        const contents = await getRepoContents(owner, repoName, path);
        for (const item of contents) {
          if (item.type === 'file') {
            if (item.size > 1000000) continue;
            try {
              const content = await getFileContent(owner, repoName, item.path);
              files.push({ name: item.name, path: item.path, content, language: getLanguageFromPath(item.path) });
            } catch (error) {
              console.error(`Failed to fetch ${item.path}:`, error);
            }
          } else if (item.type === 'dir' && !item.name.startsWith('.') && item.name !== 'node_modules') {
            await processDirectory(item.path);
          }
        }
      };

      await processDirectory();
      onRepoImported(files, { owner, repo: repoName, branch: repo.default_branch });
      toast({ title: "Success", description: `Imported ${files.length} files from ${repo.name}` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setImporting(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your GitHub Repositories</CardTitle>
        <CardDescription>Select a repository to import and edit</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {repos.map((repo) => (
              <Card key={repo.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{repo.name}</h3>
                      {repo.private ? (
                        <Badge variant="secondary" className="shrink-0">
                          <Lock className="h-3 w-3 mr-1" />
                          Private
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="shrink-0">
                          <Globe className="h-3 w-3 mr-1" />
                          Public
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {repo.description || "No description"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <GitBranch className="h-3 w-3" />
                      {repo.default_branch}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => importRepo(repo)} disabled={importing !== null}>
                    {importing === repo.id ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importing</>
                    ) : (
                      "Import"
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
