import React, { useEffect, useState } from 'react';
import { Zap, HardDrive } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

// Free-tier caps (mirrors Pricing page)
const CREDITS_CAP = 50;
const STORAGE_CAP_BYTES = 10 * 1024 * 1024; // 10 MB

interface Usage {
  credits: number;
  bytes: number;
}

export const SidebarUsage: React.FC<{ collapsed?: boolean }> = ({ collapsed }) => {
  const { user } = useAuth();
  const [usage, setUsage] = useState<Usage>({ credits: 0, bytes: 0 });

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      const monthStart = new Date();
      monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
      const iso = monthStart.toISOString();

      const [tasks, projs, scans] = await Promise.all([
        supabase.from('tasks').select('id', { count: 'exact', head: true }).gte('created_at', iso),
        supabase.from('generated_projects' as any).select('files, created_at'),
        supabase.from('security_scans').select('id', { count: 'exact', head: true }).gte('created_at', iso),
      ]);

      const monthCredits =
        (tasks.count ?? 0) +
        (scans.count ?? 0) +
        ((projs.data as any[])?.filter(p => new Date(p.created_at) >= monthStart).length ?? 0);

      // Storage = sum of file content bytes across all generated projects
      let bytes = 0;
      for (const p of (projs.data as any[]) ?? []) {
        for (const f of (p.files ?? [])) bytes += (f.content?.length ?? 0);
      }

      if (!cancelled) setUsage({ credits: monthCredits, bytes });
    };

    load();
    const t = setInterval(load, 30_000);
    return () => { cancelled = true; clearInterval(t); };
  }, [user?.id]);

  if (!user) return null;

  const creditsPct = Math.min(100, (usage.credits / CREDITS_CAP) * 100);
  const bytesPct = Math.min(100, (usage.bytes / STORAGE_CAP_BYTES) * 100);
  const mbUsed = (usage.bytes / (1024 * 1024)).toFixed(2);
  const creditsLeft = Math.max(0, CREDITS_CAP - usage.credits);

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1.5 py-1" title={`${creditsLeft} credits · ${mbUsed}/10 MB`}>
        <Zap className={cn('w-3.5 h-3.5', creditsPct > 90 ? 'text-destructive' : 'text-primary')} />
        <HardDrive className={cn('w-3.5 h-3.5', bytesPct > 90 ? 'text-destructive' : 'text-accent')} />
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-sidebar-accent/40 border border-sidebar-border/40 p-2.5 space-y-2">
      <div>
        <div className="flex items-center justify-between text-[10px] font-medium mb-1">
          <span className="flex items-center gap-1 text-sidebar-foreground/70">
            <Zap className="w-3 h-3" /> Credits
          </span>
          <span className={cn('font-semibold', creditsPct > 90 ? 'text-destructive' : 'text-sidebar-foreground')}>
            {creditsLeft} left
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-sidebar-border/60 overflow-hidden">
          <div
            className={cn('h-full transition-all', creditsPct > 90 ? 'bg-destructive' : 'bg-primary')}
            style={{ width: `${creditsPct}%` }}
          />
        </div>
        <p className="text-[9px] text-sidebar-foreground/40 mt-0.5">{usage.credits} / {CREDITS_CAP} used this month</p>
      </div>

      <div>
        <div className="flex items-center justify-between text-[10px] font-medium mb-1">
          <span className="flex items-center gap-1 text-sidebar-foreground/70">
            <HardDrive className="w-3 h-3" /> Storage
          </span>
          <span className={cn('font-semibold', bytesPct > 90 ? 'text-destructive' : 'text-sidebar-foreground')}>
            {mbUsed} MB
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-sidebar-border/60 overflow-hidden">
          <div
            className={cn('h-full transition-all', bytesPct > 90 ? 'bg-destructive' : 'bg-accent')}
            style={{ width: `${bytesPct}%` }}
          />
        </div>
        <p className="text-[9px] text-sidebar-foreground/40 mt-0.5">of 10 MB free plan</p>
      </div>
    </div>
  );
};

export default SidebarUsage;
