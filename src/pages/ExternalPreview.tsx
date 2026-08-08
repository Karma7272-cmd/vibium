import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RefreshCw, AlertTriangle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Full-bleed host page for a WebContainer preview URL.
 * The raw preview URL cannot be opened directly in a bare tab (it is served
 * through a service worker scoped to a cross-origin-isolated page), so we embed
 * it here on our own origin, which keeps the isolation headers intact.
 */
const ExternalPreview: React.FC = () => {
  const [params] = useSearchParams();
  const url = params.get('url') ?? '';
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [valid, setValid] = useState(false);

  useEffect(() => {
    try {
      const parsed = new URL(url);
      setValid(parsed.protocol === 'https:' || parsed.protocol === 'http:');
    } catch {
      setValid(false);
    }
    document.title = 'Preview — nuvic ai';
  }, [url]);

  const reload = () => {
    if (iframeRef.current) iframeRef.current.src = url;
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <header className="flex h-10 shrink-0 items-center gap-2 border-b border-border px-3">
        <span className="text-xs font-semibold text-foreground">Preview</span>
        <span className="text-[11px] font-mono text-muted-foreground truncate max-w-[50vw]">{url}</span>
        <div className="ml-auto flex items-center gap-1">
          <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={reload}>
            <RefreshCw className="h-3 w-3" /> Reload
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 text-xs"
            onClick={() => window.open(url, '_blank', 'noopener=no')}
          >
            <ExternalLink className="h-3 w-3" /> Raw URL
          </Button>
        </div>
      </header>

      {valid ? (
        <iframe
          ref={iframeRef}
          src={url}
          title="Application preview"
          className="flex-1 w-full border-0 bg-white"
          allow="cross-origin-isolated; clipboard-read; clipboard-write"
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <AlertTriangle className="h-6 w-6 text-yellow-500" />
          <p className="text-sm">No valid preview URL provided.</p>
        </div>
      )}
    </div>
  );
};

export default ExternalPreview;
