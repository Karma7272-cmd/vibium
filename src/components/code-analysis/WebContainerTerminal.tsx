import React, { useEffect, useRef, useState } from 'react';
import { WebContainer, type FileSystemTree } from '@webcontainer/api';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { Button } from '@/components/ui/button';
import { Loader2, Play, RefreshCw, Square, AlertTriangle } from 'lucide-react';

interface CodeFile { name: string; content: string; language?: string; }
interface Props {
  files: CodeFile[];
  className?: string;
}

// Single shared WebContainer instance (WebContainer only supports one per page).
let bootPromise: Promise<WebContainer> | null = null;
const getContainer = () => {
  if (!bootPromise) bootPromise = WebContainer.boot();
  return bootPromise;
};

// Convert flat [{name:'src/x.ts',content}] into WebContainer's FileSystemTree.
function filesToTree(files: CodeFile[]): FileSystemTree {
  const tree: FileSystemTree = {};
  for (const f of files) {
    const parts = f.name.split('/').filter(Boolean);
    let node: any = tree;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (i === parts.length - 1) {
        node[p] = { file: { contents: f.content ?? '' } };
      } else {
        if (!node[p]) node[p] = { directory: {} };
        node = node[p].directory;
      }
    }
  }
  // Guarantee a minimal package.json so `npm i` / `node` work even without one.
  if (!tree['package.json']) {
    tree['package.json'] = {
      file: {
        contents: JSON.stringify(
          { name: 'nuvic ai-sandbox', private: true, type: 'module', scripts: { start: 'node index.js' } },
          null, 2,
        ),
      },
    };
  }
  return tree;
}

export const WebContainerTerminal: React.FC<Props> = ({ files, className }) => {
  const termHostRef = useRef<HTMLDivElement | null>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const wcRef = useRef<WebContainer | null>(null);
  const shellRef = useRef<any>(null);
  const [status, setStatus] = useState<'idle' | 'booting' | 'ready' | 'error'>('idle');
  const [error, setError] = useState<string>('');
  const [isolated, setIsolated] = useState<boolean>(
    typeof window !== 'undefined' ? Boolean((window as any).crossOriginIsolated) : false,
  );

  // Boot container + xterm
  useEffect(() => {
    if (!termHostRef.current) return;
    if (!(window as any).crossOriginIsolated) {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.register('/coi-serviceworker.js').catch(() => {});
      }
      setIsolated(false);
      setStatus('error');
      setError('Cross-origin isolation required for WebContainer execution. Click below to activate COOP/COEP.');
      return;
    }
    setIsolated(true);

    const term = new Terminal({
      convertEol: true,
      cursorBlink: true,
      fontSize: 12,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      theme: { background: '#0b0b0f' },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(termHostRef.current);
    fit.fit();
    termRef.current = term;
    fitRef.current = fit;

    const ro = new ResizeObserver(() => { try { fit.fit(); } catch { /* noop */ } });
    ro.observe(termHostRef.current);

    let disposed = false;
    (async () => {
      try {
        setStatus('booting');
        term.writeln('\x1b[36m> Booting WebContainer…\x1b[0m');
        const wc = await getContainer();
        if (disposed) return;
        wcRef.current = wc;
        term.writeln('\x1b[36m> Mounting project files…\x1b[0m');
        await wc.mount(filesToTree(files));
        await startShell();
        setStatus('ready');
      } catch (e: any) {
        setStatus('error');
        setError(e?.message || 'Failed to boot WebContainer');
        term.writeln(`\x1b[31m! ${e?.message || e}\x1b[0m`);
      }
    })();

    return () => {
      disposed = true;
      ro.disconnect();
      try { shellRef.current?.kill?.(); } catch { /* noop */ }
      term.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync edited files into the running container without remounting the whole
  // project (which would reset the shell and any running process).
  const syncedRef = useRef<Map<string, string>>(new Map());
  useEffect(() => {
    if (status !== 'ready' || !wcRef.current) return;
    const wc = wcRef.current;
    const t = setTimeout(async () => {
      for (const f of files) {
        const content = f.content ?? '';
        if (syncedRef.current.get(f.name) === content) continue;
        const dir = f.name.split('/').slice(0, -1).join('/');
        try {
          if (dir) { try { await wc.fs.mkdir(dir, { recursive: true }); } catch { /* exists */ } }
          await wc.fs.writeFile(f.name, content);
          syncedRef.current.set(f.name, content);
        } catch { /* noop */ }
      }
    }, 400);
    return () => clearTimeout(t);
  }, [files, status]);


  const startShell = async () => {
    const wc = wcRef.current;
    const term = termRef.current;
    if (!wc || !term) return;
    try { shellRef.current?.kill?.(); } catch { /* noop */ }
    const shell = await wc.spawn('jsh', {
      terminal: { cols: term.cols, rows: term.rows },
    });
    shellRef.current = shell;
    shell.output.pipeTo(new WritableStream({ write(chunk) { term.write(chunk); } }));
    const input = shell.input.getWriter();
    term.onData((data) => input.write(data));
    term.onResize(({ cols, rows }) => { try { shell.resize({ cols, rows }); } catch { /* noop */ } });
  };

  const runInstall = async () => {
    const shell = shellRef.current;
    if (!shell) return;
    const w = shell.input.getWriter();
    await w.write('npm install\n');
    w.releaseLock();
  };

  const runStart = async () => {
    const shell = shellRef.current;
    if (!shell) return;
    const w = shell.input.getWriter();
    await w.write('npm start\n');
    w.releaseLock();
  };

  const restart = async () => {
    if (!wcRef.current || !termRef.current) return;
    termRef.current.writeln('\x1b[33m\r\n> Restarting shell…\x1b[0m');
    await startShell();
  };

  return (
    <div className={`flex flex-col h-full bg-[#0b0b0f] text-white ${className ?? ''}`}>
      <div className="flex items-center gap-1 px-2 py-1 border-b border-white/10 bg-black/40 shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-wider text-white/60 mr-2">Terminal</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
          status === 'ready' ? 'bg-emerald-500/20 text-emerald-300' :
          status === 'error' ? 'bg-red-500/20 text-red-300' :
          'bg-yellow-500/20 text-yellow-300'
        }`}>{status}</span>
        <div className="ml-auto flex items-center gap-1">
          <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-white/70 hover:text-white hover:bg-white/10 gap-1"
            onClick={runInstall} disabled={status !== 'ready'}>
            <Play className="h-3 w-3" /> npm i
          </Button>
          <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-white/70 hover:text-white hover:bg-white/10 gap-1"
            onClick={runStart} disabled={status !== 'ready'}>
            <Play className="h-3 w-3" /> start
          </Button>
          <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-white/70 hover:text-white hover:bg-white/10 gap-1"
            onClick={restart} disabled={status === 'booting'}>
            <RefreshCw className="h-3 w-3" /> reset
          </Button>
        </div>
      </div>
      {status === 'error' && !isolated && (
        <div className="p-3 text-xs text-yellow-200 bg-yellow-500/10 border-b border-yellow-500/30 flex items-center justify-between gap-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-yellow-400" />
            <div>
              <p className="font-semibold text-yellow-200">Terminal Unavailable</p>
              <p className="opacity-80 text-[11px]">{error}</p>
            </div>
          </div>
          <Button
            size="sm"
            className="h-7 text-xs bg-yellow-600 hover:bg-yellow-700 text-white font-medium gap-1 shrink-0"
            onClick={() => {
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/coi-serviceworker.js').then(() => {
                  window.location.reload();
                }).catch(() => window.location.reload());
              } else {
                window.location.reload();
              }
            }}
          >
            <RefreshCw className="h-3 w-3" /> Enable & Reload
          </Button>
        </div>
      )}
      {status === 'booting' && (
        <div className="flex items-center gap-2 text-xs text-white/60 px-3 py-1.5 border-b border-white/10">
          <Loader2 className="h-3 w-3 animate-spin" /> Booting sandbox…
        </div>
      )}
      <div ref={termHostRef} className="flex-1 overflow-hidden px-1 py-1" />
    </div>
  );
};

export default WebContainerTerminal;
