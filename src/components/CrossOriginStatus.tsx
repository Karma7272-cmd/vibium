import React from 'react';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

/**
 * Small badge showing whether the page is cross-origin isolated
 * (COOP: same-origin + COEP: require-corp), which WebContainers require.
 */
const CrossOriginStatus: React.FC<{ className?: string }> = ({ className }) => {
  const isolated =
    typeof window !== 'undefined' && Boolean(window.crossOriginIsolated);
  const sab = typeof SharedArrayBuffer !== 'undefined';

  const Icon = isolated ? ShieldCheck : ShieldAlert;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 h-6 px-2 rounded-full border text-[10px] font-semibold',
              isolated
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-500',
              className
            )}
          >
            <Icon className="w-3 h-3" />
            {isolated ? 'Isolated' : 'Not isolated'}
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs text-xs">
          <p className="font-semibold mb-1">Cross-origin isolation</p>
          <p>crossOriginIsolated: {String(isolated)}</p>
          <p>SharedArrayBuffer: {sab ? 'available' : 'unavailable'}</p>
          <p className="mt-1 opacity-80">
            {isolated
              ? 'COOP/COEP headers are active — WebContainers can run.'
              : 'COOP (same-origin) and COEP (require-corp) headers are missing. Hard-refresh; WebContainers will not run without them.'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CrossOriginStatus;
