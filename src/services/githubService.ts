// GitHub token will be set by the component that uses this service
let currentGitHubToken: string | null = null;

export function setGitHubToken(token: string | null) {
  currentGitHubToken = token;
}

export async function createRepo(name: string, description: string, isPrivate: boolean = false): Promise<{ owner: string; name: string; default_branch: string; html_url: string }> {
  const token = currentGitHubToken;
  if (!token) throw new Error("Not authenticated with GitHub");

  const response = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, description, private: isPrivate, auto_init: true }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Failed to create repo: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    owner: data.owner.login,
    name: data.name,
    default_branch: data.default_branch || 'main',
    html_url: data.html_url,
  };
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  default_branch: string;
  html_url: string;
}

export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: 'file' | 'dir';
  content?: string;
  encoding?: string;
}

function getGitHubToken(): string | null {
  return currentGitHubToken;
}

export async function listUserRepos(): Promise<GitHubRepo[]> {
  const token = getGitHubToken();
  if (!token) throw new Error("Not authenticated with GitHub");

  const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  return response.json();
}

export async function getRepoContents(owner: string, repo: string, path: string = ''): Promise<GitHubFile[]> {
  const token = getGitHubToken();
  if (!token) throw new Error("Not authenticated with GitHub");

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  return response.json();
}

export async function getFileContent(owner: string, repo: string, path: string): Promise<string> {
  const token = getGitHubToken();
  if (!token) throw new Error("Not authenticated with GitHub");

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  const data = await response.json();
  if (data.content && data.encoding === 'base64') {
    return atob(data.content);
  }
  return data.content || '';
}

// Use the Git Trees API to fetch the entire repo tree in a single call
export async function getRepoTree(owner: string, repo: string, branch: string): Promise<Array<{ path: string; type: string; sha: string; size?: number }>> {
  const token = getGitHubToken();
  if (!token) throw new Error("Not authenticated with GitHub");

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.tree || [];
}

// Fetch file content by blob SHA (faster than contents API)
export async function getBlobContent(owner: string, repo: string, sha: string): Promise<string> {
  const token = getGitHubToken();
  if (!token) throw new Error("Not authenticated with GitHub");

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs/${sha}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  const data = await response.json();
  if (data.content && data.encoding === 'base64') {
    return atob(data.content);
  }
  return data.content || '';
}

// Parallel batch fetcher with concurrency limit
export async function fetchFilesInParallel<T>(
  items: T[],
  fetcher: (item: T) => Promise<any>,
  concurrency: number = 10
): Promise<any[]> {
  const results: any[] = [];
  let index = 0;

  const worker = async () => {
    while (index < items.length) {
      const i = index++;
      try {
        results[i] = await fetcher(items[i]);
      } catch {
        results[i] = null;
      }
    }
  };

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export async function commitAndPush(
  owner: string,
  repo: string,
  branch: string,
  files: Array<{ path: string; content: string }>,
  message: string
): Promise<void> {
  const token = getGitHubToken();
  if (!token) throw new Error("Not authenticated with GitHub");

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  // Get the latest commit SHA
  const branchResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, { headers });
  if (!branchResponse.ok) throw new Error(`Failed to get branch: ${branchResponse.statusText}`);
  const branchData = await branchResponse.json();
  const latestCommitSha = branchData.object.sha;

  // Get the tree of the latest commit
  const commitResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits/${latestCommitSha}`, { headers });
  if (!commitResponse.ok) throw new Error(`Failed to get commit: ${commitResponse.statusText}`);
  const commitData = await commitResponse.json();
  const baseTreeSha = commitData.tree.sha;

  // Create blobs in parallel
  const tree = await Promise.all(
    files.map(async (file) => {
      const blobResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: file.content, encoding: 'utf-8' }),
      });
      if (!blobResponse.ok) throw new Error(`Failed to create blob: ${blobResponse.statusText}`);
      const blobData = await blobResponse.json();
      return { path: file.path, mode: '100644' as const, type: 'blob' as const, sha: blobData.sha };
    })
  );

  // Create a new tree
  const treeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
    method: 'POST', headers,
    body: JSON.stringify({ base_tree: baseTreeSha, tree }),
  });
  if (!treeResponse.ok) throw new Error(`Failed to create tree: ${treeResponse.statusText}`);
  const treeData = await treeResponse.json();

  // Create a new commit
  const newCommitResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
    method: 'POST', headers,
    body: JSON.stringify({ message, tree: treeData.sha, parents: [latestCommitSha] }),
  });
  if (!newCommitResponse.ok) throw new Error(`Failed to create commit: ${newCommitResponse.statusText}`);
  const newCommitData = await newCommitResponse.json();

  // Update the branch reference
  const updateRefResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
    method: 'PATCH', headers,
    body: JSON.stringify({ sha: newCommitData.sha }),
  });
  if (!updateRefResponse.ok) throw new Error(`Failed to update branch: ${updateRefResponse.statusText}`);
}

// Create a pull request
export async function createPullRequest(
  owner: string,
  repo: string,
  title: string,
  body: string,
  head: string,
  base: string
): Promise<{ html_url: string; number: number }> {
  const token = getGitHubToken();
  if (!token) throw new Error("Not authenticated with GitHub");

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, body, head, base }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || `Failed to create PR: ${response.statusText}`);
  }

  return response.json();
}

// Create a new branch from existing branch
export async function createBranch(owner: string, repo: string, newBranch: string, fromBranch: string): Promise<void> {
  const token = getGitHubToken();
  if (!token) throw new Error("Not authenticated with GitHub");

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  // Get SHA of source branch
  const refResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${fromBranch}`, { headers });
  if (!refResponse.ok) throw new Error(`Failed to get branch: ${refResponse.statusText}`);
  const refData = await refResponse.json();

  // Create new branch
  const createResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
    method: 'POST', headers,
    body: JSON.stringify({ ref: `refs/heads/${newBranch}`, sha: refData.object.sha }),
  });
  if (!createResponse.ok) {
    const errData = await createResponse.json().catch(() => ({}));
    throw new Error(errData.message || `Failed to create branch: ${createResponse.statusText}`);
  }
}

// Merge a pull request
export async function mergePullRequest(
  owner: string,
  repo: string,
  pull_number: number,
  options?: { commit_title?: string; commit_message?: string; merge_method?: 'merge' | 'squash' | 'rebase' }
): Promise<{ merged: boolean; sha?: string; message?: string }> {
  const token = getGitHubToken();
  if (!token) throw new Error("Not authenticated with GitHub");

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pull_number}/merge`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      commit_title: options?.commit_title,
      commit_message: options?.commit_message,
      merge_method: options?.merge_method || 'merge',
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || `Failed to merge PR: ${response.statusText}`);
  }
  return response.json();
}

// Check repo permissions for current user
export async function getRepoPermissions(owner: string, repo: string): Promise<{ push: boolean; pull: boolean; admin: boolean }> {
  const token = getGitHubToken();
  if (!token) throw new Error("Not authenticated with GitHub");

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) throw new Error(`GitHub API error: ${response.statusText}`);
  const data = await response.json();

  return {
    push: data.permissions?.push ?? false,
    pull: data.permissions?.pull ?? true,
    admin: data.permissions?.admin ?? false,
  };
}
