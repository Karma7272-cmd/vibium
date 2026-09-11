import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type PlanId = 'free' | 'starter' | 'pro' | 'business';

export type FeatureKey =
  | 'github'
  | 'schedule'
  | 'team'
  | 'pipelines'
  | 'security'
  | 'analytics'
  | 'priority';

export interface PlanDefinition {
  id: PlanId;
  name: string;
  monthly: number;
  /** null = unlimited */
  projects: number | null;
  storageMb: number;
  seats: number;
  features: FeatureKey[];
  description: string;
}

/**
 * BYOK model: no AI credits are sold. Every AI call runs on the user's own
 * provider API keys (Connectors page). Plans unlock platform capacity and
 * collaboration features only.
 */
export const PLAN_DEFS: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Free',
    monthly: 0,
    projects: 3,
    storageMb: 10,
    seats: 1,
    features: ['analytics'],
    description: 'Bring your own API keys and try nuvic ai on small projects.',
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    monthly: 9,
    projects: 15,
    storageMb: 100,
    seats: 1,
    features: ['github', 'schedule', 'security', 'analytics'],
    description: 'Unlimited AI usage on your own keys, plus GitHub push and scheduled runs.',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    monthly: 25,
    projects: null,
    storageMb: 1024,
    seats: 5,
    features: ['github', 'schedule', 'team', 'pipelines', 'security', 'analytics'],
    description: 'For solo builders and small teams shipping real products.',
  },
  business: {
    id: 'business',
    name: 'Business',
    monthly: 49,
    projects: null,
    storageMb: 10240,
    seats: 50,
    features: ['github', 'schedule', 'team', 'pipelines', 'security', 'analytics', 'priority'],
    description: 'Larger teams, more storage, priority queue and dedicated support.',
  },
};

export const PLAN_ORDER: PlanId[] = ['free', 'starter', 'pro', 'business'];

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  github: 'GitHub push & pull requests',
  schedule: 'Scheduled & background tasks',
  team: 'Team collaboration & roles',
  pipelines: 'CI/CD pipelines',
  security: 'Security scanning',
  analytics: 'Website analytics',
  priority: 'Priority queue & dedicated support',
};

interface Usage {
  projects: number;
  storageMb: number;
}

export function usePlan() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<PlanId>('free');
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);
  const [usage, setUsage] = useState<Usage>({ projects: 0, storageMb: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setPlan('free');
      setUsage({ projects: 0, storageMb: 0 });
      setLoading(false);
      return;
    }
    const [{ data: sub }, { data: projects }] = await Promise.all([
      supabase
        .from('subscriptions' as any)
        .select('plan,status,current_period_end')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase.from('generated_projects' as any).select('files').eq('user_id', user.id),
    ]);

    const row = sub as any;
    const active =
      row &&
      row.status === 'active' &&
      (!row.current_period_end || new Date(row.current_period_end).getTime() > Date.now());
    setPlan(active && PLAN_ORDER.includes(row.plan) ? (row.plan as PlanId) : 'free');
    setPeriodEnd(row?.current_period_end ?? null);

    let bytes = 0;
    for (const p of ((projects as any[]) ?? [])) {
      for (const f of p.files ?? []) bytes += f.content?.length ?? 0;
    }
    setUsage({ projects: ((projects as any[]) ?? []).length, storageMb: bytes / (1024 * 1024) });
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const def = PLAN_DEFS[plan];
  const can = (feature: FeatureKey) => def.features.includes(feature);
  const projectsLeft = def.projects === null ? Infinity : Math.max(0, def.projects - usage.projects);
  const storageLeftMb = Math.max(0, def.storageMb - usage.storageMb);

  return {
    plan,
    planDef: def,
    periodEnd,
    usage,
    loading,
    can,
    canCreateProject: projectsLeft > 0 && storageLeftMb > 0,
    projectsLeft,
    storageLeftMb,
    refresh: load,
  };
}

export default usePlan;
