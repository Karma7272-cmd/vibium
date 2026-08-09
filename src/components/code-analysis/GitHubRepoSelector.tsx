import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GitHubRepo, listUserRepos, getRepoTree, getBlobContent, setGitHubToken, fetchFilesInParallel, getRepoPermissions } from "@/services/githubService";
import { hydrateGithubToken } from "@/lib/githubToken";
import { useToast } from "@/hooks/use-toast";
import { GitBranch, Lock, Globe, Shield, ShieldCheck, Search } from "lucide-react";
import { LoadingState } from "@/components/ui/LoadingState";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";

interface GitHubRepoSelectorProps {
  onRepoImported: (files: Array<{ name: string; path: string; content: string; language?: string }>, repoInfo: { owner: string; repo: string; branch: string }, permissions: { push: boolean; pull: boolean; admin: boolean }) => void;
}

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', '__pycache__', '.venv', 'vendor', 'target', '.gradle']);
const CODE_EXTENSIONS = new Set([
  'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'go', 'rs', 'php', 'rb',
  'swift', 'kt', 'html', 'css', 'scss', 'json', 'xml', 'yaml', 'yml', 'md', 'sql',
  'sh', 'bash', 'toml', 'env', 'gitignore', 'dockerignore', 'dockerfile',
  'makefile', 'gradle', 'lock', 'cfg', 'ini', 'txt', 'svg',
]);

export function GitHubRepoSelector({ onRepoImported }: GitHubRepoSelectorProps) {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState<number | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState("");
  const { toast } = useToast();

  const setupGitHubToken = useCallback(async () => {
    // Prefer the DB-backed token so this works on any device.
    let token = localStorage.getItem('github_access_token');
    if (!token) token = await hydrateGithubToken();
    if (token) {
      setGitHubToken(token);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    (async () => {
      const hasToken = await setupGitHubToken();
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
    })();
  }, [setupGitHubToken]);

  const loadRepos = async () => {
    try {
      setLoading(true);
      const userRepos = await listUserRepos();
      setRepos(userRepos);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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

  const shouldIncludeFile = (path: string, size?: number): boolean => {
    if (size && size > 500000) return false; // Skip files > 500KB
    const parts = path.split('/');
    for (const part of parts.slice(0, -1)) {
      if (SKIP_DIRS.has(part) || part.startsWith('.')) return false;
    }
    const ext = path.split('.').pop()?.toLowerCase() || '';
    const fileName = parts[parts.length - 1]?.toLowerCase() || '';
    // Include known config files without extensions
    if (['makefile', 'dockerfile', 'procfile', 'gemfile', 'rakefile'].includes(fileName)) return true;
    return CODE_EXTENSIONS.has(ext);
  };

  const importRepo = async (repo: GitHubRepo) => {
    try {
      setImporting(repo.id);
      setImportProgress(0);
      setImportStatus("Fetching repository tree...");
      setupGitHubToken();
      const [owner, repoName] = repo.full_name.split('/');

      // Fetch permissions and tree in parallel
      const [permissions, tree] = await Promise.all([
        getRepoPermissions(owner, repoName),
        getRepoTree(owner, repoName, repo.default_branch),
      ]);

      // Filter to code files only
      const codeFiles = tree.filter(item =>
        item.type === 'blob' && shouldIncludeFile(item.path, item.size)
      );

      setImportStatus(`Fetching ${codeFiles.length} files...`);

      const files: Array<{ name: string; path: string; content: string; language?: string }> = [];
      let fetched = 0;

      // Fetch all file contents in parallel with concurrency limit
      const results = await fetchFilesInParallel(
        codeFiles,
        async (item) => {
          try {
            const content = await getBlobContent(owner, repoName, item.sha);
            fetched++;
            setImportProgress(Math.round((fetched / codeFiles.length) * 100));
            setImportStatus(`Fetched ${fetched}/${codeFiles.length} files`);
            return { name: item.path.split('/').pop()!, path: item.path, content, language: getLanguageFromPath(item.path) };
          } catch {
            fetched++;
            setImportProgress(Math.round((fetched / codeFiles.length) * 100));
            return null;
          }
        },
        15 // concurrent requests
      );

      results.forEach((r: any) => { if (r) files.push(r); });

      onRepoImported(files, { owner, repo: repoName, branch: repo.default_branch }, permissions);
      toast({
        title: "Success",
        description: `Imported ${files.length} files from ${repo.name}${permissions.push ? ' (push access)' : ' (read-only)'}`,
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setImporting(null);
      setImportProgress(0);
      setImportStatus("");
    }
  };

  const filteredRepos = repos.filter(repo =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (repo.description && repo.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search repositories..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[500px] overflow-y-auto pr-1 sm:pr-4 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
          <div className="space-y-2">
            {filteredRepos.length > 0 ? (
              filteredRepos.map((repo) => (
              <Card key={repo.id} className="p-3 sm:p-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm sm:text-base break-words">{repo.name}</h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {repo.private ? (
                        <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0.5">
                          <Lock className="h-3 w-3 mr-1" />
                          Private
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0.5">
                          <Globe className="h-3 w-3 mr-1" />
                          Public
                        </Badge>
                      )}
                      <Button size="sm" className="h-7 text-xs" onClick={() => importRepo(repo)} disabled={importing !== null}>
                        {importing === repo.id ? (
                          <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Importing</>
                        ) : (
                          "Import"
                        )}
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                    {repo.description || "No description"}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <GitBranch className="h-3 w-3" />
                    {repo.default_branch}
                  </div>
                </div>
                {importing === repo.id && (
                  <div className="mt-3 space-y-1">
                    <Progress value={importProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground">{importStatus}</p>
                  </div>
                )}
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No repositories found matching your search." : "No repositories found."}
            </div>
          )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
