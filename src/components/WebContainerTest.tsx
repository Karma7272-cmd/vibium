import React, { useState } from 'react';
import { WebContainer } from '@webcontainer/api';
import { Button } from '@/components/ui/button';
import { Loader2, Play, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Result =
  | { state: 'idle' }
  | { state: 'running'; step: string }
  | { state: 'ok'; detail: string }
  | { state: 'fail'; reason: string };

// Reuse the page-wide instance if one already booted (WebContainer allows only one).
let sharedBoot: Promise<WebContainer> | null = null;
const bootOnce = () => {
  if (!sharedBoot) sharedBoot = WebContainer.boot();
  return sharedBoot;
};

const WebContainerTest: React.FC<{ className?: string }> = ({ className }) => {
  const [result, setResult] = useState<Result>({ state: 'idle' });

  const run = async () => {
    try {
      if (typeof window === 'undefined' || !window.crossOriginIsolated) {
        setResult({
          state: 'fail',
          reason:
            'Page is not cross-origin isolated (crossOriginIsolated === false). COOP: same-origin and COEP: require-corp headers are required — hard-refresh the page.',
        });
        return;
      }
      if (typeof SharedArrayBuffer === 'undefined') {
        setResult({
          state: 'fail',
          reason: 'SharedArrayBuffer is unavailable in this browser context.',
        });
        return;
      }

      setResult({ state: 'running', step: 'Booting WebContainer…' });
      const wc = await bootOnce();

      setResult({ state: 'running', step: 'Mounting test files…' });
      await wc.mount({
        'nuvic-check.js': {
          file: { contents: 'console.log("webcontainer-ok:" + process.version);' },
        },
      });

      setResult({ state: 'running', step: 'Running node…' });
      const proc = await wc.spawn('node', ['nuvic-check.js']);
      let out = '';
      await proc.output.pipeTo(
        new WritableStream({
          write(chunk) {
            out += chunk;
          },
        }),
      );
      const code = await proc.exit;

      if (code !== 0) {
        setResult({
          state: 'fail',
          reason: `node exited with code ${code}. Output: ${out.trim() || '(empty)'}`,
        });
        return;
      }
      setResult({
        state: 'ok',
        detail: out.trim() || 'WebContainer booted and executed successfully.',
      });
    } catch (e: any) {
      setResult({
        state: 'fail',
        reason: e?.message ? String(e.message) : String(e),
      });
    }
  };

  const running = result.state === 'running';

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Button
        size="sm"
        variant="outline"
        onClick={run}
        disabled={running}
        className="h-7 gap-1.5 text-xs"
      >
        {running ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Play className="w-3.5 h-3.5" />
        )}
        Run WebContainer Test
      </Button>

      {result.state === 'running' && (
        <p className="text-[11px] text-muted-foreground">{result.step}</p>
      )}
      {result.state === 'ok' && (
        <p className="text-[11px] text-emerald-500 flex items-start gap-1">
          <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" />
          <span className="break-all">WebContainer works — {result.detail}</span>
        </p>
      )}
      {result.state === 'fail' && (
        <p className="text-[11px] text-destructive flex items-start gap-1 max-w-md">
          <XCircle className="w-3 h-3 mt-0.5 shrink-0" />
          <span className="break-words">{result.reason}</span>
        </p>
      )}
    </div>
  );
};

export default WebContainerTest;
