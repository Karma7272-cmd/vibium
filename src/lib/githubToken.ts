// GitHub access token persistence.
// Stored in the `connector_credentials` table (connector_id = 'github') so it
// follows the user across devices. Mirrored to localStorage for synchronous
// access by existing call sites.
import { supabase } from '@/integrations/supabase/client';

const LS_KEY = 'github_access_token';

export function getGithubTokenSync(): string | null {
  try { return localStorage.getItem(LS_KEY); } catch { return null; }
}

/** Fetch the token from the database and mirror it into localStorage. */
export async function hydrateGithubToken(): Promise<string | null> {
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes?.user) return getGithubTokenSync();
  const { data } = await supabase
    .from('connector_credentials')
    .select('api_key')
    .eq('connector_id', 'github')
    .maybeSingle();
  const token = (data as any)?.api_key || null;
  try {
    if (token) localStorage.setItem(LS_KEY, token);
    else localStorage.removeItem(LS_KEY);
  } catch {}
  return token;
}

/** Save the token to the database and localStorage. */
export async function persistGithubToken(token: string): Promise<void> {
  try { localStorage.setItem(LS_KEY, token); } catch {}
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes?.user) return;
  await supabase.from('connector_credentials').upsert(
    {
      user_id: userRes.user.id,
      connector_id: 'github',
      api_key: token,
      status: 'connected',
      last_tested_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,connector_id' },
  );
}

/** Remove the token from database and localStorage. */
export async function clearGithubToken(): Promise<void> {
  try { localStorage.removeItem(LS_KEY); } catch {}
  await supabase.from('connector_credentials').delete().eq('connector_id', 'github');
}
