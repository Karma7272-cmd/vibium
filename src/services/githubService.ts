import { supabase } from "@/integrations/supabase/client";

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

async function getGitHubToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.provider_token || null;
}

export async function listUserRepos(): Promise<GitHubRepo[]> {
  const token = await getGitHubToken();
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
  const token = await getGitHubToken();
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
  const token = await getGitHubToken();
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

export async function commitAndPush(
  owner: string,
  repo: string,
  branch: string,
  files: Array<{ path: string; content: string }>,
  message: string
): Promise<void> {
  const token = await getGitHubToken();
  if (!token) throw new Error("Not authenticated with GitHub");

  // Get the latest commit SHA
  const branchResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!branchResponse.ok) {
    throw new Error(`Failed to get branch: ${branchResponse.statusText}`);
  }

  const branchData = await branchResponse.json();
  const latestCommitSha = branchData.object.sha;

  // Get the tree of the latest commit
  const commitResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits/${latestCommitSha}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!commitResponse.ok) {
    throw new Error(`Failed to get commit: ${commitResponse.statusText}`);
  }

  const commitData = await commitResponse.json();
  const baseTreeSha = commitData.tree.sha;

  // Create blobs for each file
  const tree = await Promise.all(
    files.map(async (file) => {
      const blobResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: file.content,
          encoding: 'utf-8',
        }),
      });

      if (!blobResponse.ok) {
        throw new Error(`Failed to create blob: ${blobResponse.statusText}`);
      }

      const blobData = await blobResponse.json();
      return {
        path: file.path,
        mode: '100644',
        type: 'blob',
        sha: blobData.sha,
      };
    })
  );

  // Create a new tree
  const treeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree,
    }),
  });

  if (!treeResponse.ok) {
    throw new Error(`Failed to create tree: ${treeResponse.statusText}`);
  }

  const treeData = await treeResponse.json();

  // Create a new commit
  const newCommitResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      tree: treeData.sha,
      parents: [latestCommitSha],
    }),
  });

  if (!newCommitResponse.ok) {
    throw new Error(`Failed to create commit: ${newCommitResponse.statusText}`);
  }

  const newCommitData = await newCommitResponse.json();

  // Update the branch reference
  const updateRefResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sha: newCommitData.sha,
    }),
  });

  if (!updateRefResponse.ok) {
    throw new Error(`Failed to update branch: ${updateRefResponse.statusText}`);
  }
}
