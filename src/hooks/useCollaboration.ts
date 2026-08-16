import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type TeamRole = 'viewer' | 'editor' | 'admin' | 'owner';

export interface Membership {
  id: string;
  owner_id: string;
  email: string;
  name: string | null;
  role: TeamRole;
  status: string;
  created_at: string;
}

const rank: Record<TeamRole, number> = { viewer: 1, editor: 2, admin: 3, owner: 4 };

/**
 * Collaboration state for the signed-in user:
 * - `memberships`: teams the user has accepted (grants access to that owner's projects)
 * - `invitations`: pending invitations addressed to the user's email
 * - `roleForOwner(ownerId)`: effective role on a resource owned by `ownerId`
 */
export const useCollaboration = () => {
  const { user } = useAuth();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [invitations, setInvitations] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setMemberships([]);
      setInvitations([]);
      setLoading(false);
      return;
    }
    const email = (user.email || '').toLowerCase();
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .or(`member_user_id.eq.${user.id},email.eq.${email}`)
      .neq('owner_id', user.id);

    if (!error && data) {
      const rows = data as unknown as Membership[];
      setMemberships(rows.filter(r => r.status === 'active'));
      setInvitations(rows.filter(r => r.status === 'pending'));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const respond = useCallback(async (invitationId: string, accept: boolean) => {
    if (!user) return { error: 'Not signed in' };
    const { error } = await supabase
      .from('team_members')
      .update({
        status: accept ? 'active' : 'declined',
        member_user_id: user.id,
        accepted_at: accept ? new Date().toISOString() : null,
      } as never)
      .eq('id', invitationId);
    if (error) return { error: error.message };
    await load();
    return {};
  }, [user, load]);

  const roleForOwner = useCallback((ownerId?: string | null): TeamRole | null => {
    if (!ownerId || !user) return null;
    if (ownerId === user.id) return 'owner';
    const m = memberships.find(x => x.owner_id === ownerId);
    return m ? m.role : null;
  }, [memberships, user]);

  const canEdit = useCallback((ownerId?: string | null) => {
    const r = roleForOwner(ownerId);
    return !!r && rank[r] >= rank.editor;
  }, [roleForOwner]);

  const canDelete = useCallback((ownerId?: string | null) => roleForOwner(ownerId) === 'owner', [roleForOwner]);

  return { memberships, invitations, loading, reload: load, respond, roleForOwner, canEdit, canDelete };
};
