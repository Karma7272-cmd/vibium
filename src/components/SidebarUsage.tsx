import React from 'react';
import { Link } from 'react-router-dom';
import { HardDrive, FolderGit2, KeyRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlan } from '@/hooks/usePlan';
import { cn } from '@/lib/utils';

/**
 * BYOK model: no AI credits are metered. We show the plan and its capacity
 * (projects + storage) instead.
 */
export const SidebarUsage: React.FC<{ collapsed?: boolean }> = ({ collapsed }) => {
  const { user } = useAuth();
  const { planDef, usage, loading } = usePlan();

  if (!user || loading) return null;

  const projectsCap = planDef.projects;
  const projectsPct = projectsCap === null ? 0 : Math.min(100, (usage.projects / projectsCap) * 100);
  const storagePct = Math.min(100, (usage.storageMb / planDef.storageMb) * 100);
  const storageLabel = planDef.storageMb >= 1024 ? `${planDef.storageMb / 1024} GB` : `${planDef.storageMb} MB`;
  const mbUsed = usage.storageMb.toFixed(2);

  if (collapsed) {
    return (
      <div
        className="flex flex-col items-center gap-1.5 py-1"
        title={`${planDef.name} · ${usage.projects}${projectsCap === null ? '' : `/${projectsCap}`} projects · ${mbUsed}/${storageLabel}`}
      >
        <FolderGit2 className={cn('w-3.5 h-3.5', projectsPct > 90 ? 'text-destructive' : 'text-primary')} />
        <HardDrive className={cn('w-3.5 h-3.5', storagePct > 90 ? 'text-destructive' : 'text-accent')} />
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-sidebar-accent/40 border border-sidebar-border/40 p-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-sidebar-foreground/70 uppercase tracking-wide">
          {planDef.name} plan
        </span>
        <Link to="/pricing" className="text-[10px] font-semibold text-primary hover:underline">
          {planDef.id === 'business' ? 'Manage' : 'Upgrade'}
        </Link>
      </div>

      <div>
        <div className="flex items-center justify-between text-[10px] font-medium mb-1">
          <span className="flex items-center gap-1 text-sidebar-foreground/70">
            <FolderGit2 className="w-3 h-3" /> Projects
          </span>
          <span className={cn('font-semibold', projectsPct > 90 ? 'text-destructive' : 'text-sidebar-foreground')}>
            {usage.projects}{projectsCap === null ? '' : ` / ${projectsCap}`}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-sidebar-border/60 overflow-hidden">
          <div
            className={cn('h-full transition-all', projectsPct > 90 ? 'bg-destructive' : 'bg-primary')}
            style={{ width: `${projectsCap === null ? 100 : projectsPct}%` }}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-[10px] font-medium mb-1">
          <span className="flex items-center gap-1 text-sidebar-foreground/70">
            <HardDrive className="w-3 h-3" /> Storage
          </span>
          <span className={cn('font-semibold', storagePct > 90 ? 'text-destructive' : 'text-sidebar-foreground')}>
            {mbUsed} MB
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-sidebar-border/60 overflow-hidden">
          <div
            className={cn('h-full transition-all', storagePct > 90 ? 'bg-destructive' : 'bg-accent')}
            style={{ width: `${storagePct}%` }}
          />
        </div>
        <p className="text-[9px] text-sidebar-foreground/40 mt-0.5">of {storageLabel}</p>
      </div>

      <p className="flex items-start gap-1 text-[9px] text-sidebar-foreground/40 pt-1 border-t border-sidebar-border/40">
        <KeyRound className="w-2.5 h-2.5 mt-[2px] shrink-0" />
        AI runs on your own API keys — no credits.
      </p>
    </div>
  );
};

export default SidebarUsage;
