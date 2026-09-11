import React from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlan, FeatureKey, FEATURE_LABELS, PLAN_DEFS, PLAN_ORDER } from '@/hooks/usePlan';

/** Smallest plan that includes a feature — used for the upgrade prompt. */
export function requiredPlanFor(feature: FeatureKey) {
  return PLAN_ORDER.find((p) => PLAN_DEFS[p].features.includes(feature)) ?? 'pro';
}

interface Props {
  feature: FeatureKey;
  children: React.ReactNode;
  /** Render nothing instead of the upgrade card. */
  silent?: boolean;
}

export const PlanGate: React.FC<Props> = ({ feature, children, silent }) => {
  const { can, loading } = usePlan();
  if (loading) return null;
  if (can(feature)) return <>{children}</>;
  if (silent) return null;

  const needed = PLAN_DEFS[requiredPlanFor(feature)];
  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-center">
      <Lock className="w-5 h-5 mx-auto mb-3 text-muted-foreground" />
      <h3 className="text-sm font-semibold text-foreground mb-1">
        {FEATURE_LABELS[feature]} is on {needed.name}
      </h3>
      <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
        AI usage always runs on your own API keys. Plans unlock platform features like this one.
      </p>
      <Button asChild size="sm" className="rounded-full">
        <Link to="/pricing">Upgrade to {needed.name} — ${needed.monthly}/mo</Link>
      </Button>
    </div>
  );
};

export default PlanGate;
