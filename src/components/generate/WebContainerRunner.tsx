import React, { useEffect, useRef, useState, useCallback } from 'react';
import { WebContainer, type FileSystemTree } from '@webcontainer/api';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { Button } from '@/components/ui/button';
import {
  Loader2, Play, Square, RefreshCw, AlertTriangle,
  ExternalLink, Copy, Check, TerminalSquare, Globe,
  ListOrdered, ChevronRight, Wifi, WifiOff,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface CodeFile {
  name: string;
  content: string;
  language?: string;
}

interface AgentStep {
  id: number;
  icon: string;
  message: string;
  status: 'pending' | 'running' | 'done' | 'error';
  detail?: string;
}

export interface WebContainerRunnerProps {
  files: CodeFile[];
  projectName?: string;
  className?: string;
}

// ─── Singleton WebContainer boot ─────────────────────────────────────────────
let wcBootPromise: Promise<WebContainer> | null = null;
const getWC = () => {
  if (!wcBootPromise) wcBootPromise = WebContainer.boot();
  return wcBootPromise;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Detect the best start command from generated files */
function detectStartCommand(files: CodeFile[]): { install: string; start: string; label: string } {
  const names = new Set(files.map(f => f.name));
  const pkgFile = files.find(f => f.name === 'package.json');

  let pkgJson: any = null;
  try { pkgJson = pkgFile ? JSON.parse(pkgFile.content) : null; } catch { /* ignore */ }

  const scripts: Record<string, string> = pkgJson?.scripts ?? {};
  const deps = { ...(pkgJson?.dependencies ?? {}), ...(pkgJson?.devDependencies ?? {}) };
  const hasReact = files.some(f => f.name.endsWith('.tsx') || f.name.endsWith('.jsx') || (f.content && f.content.includes('react')));

  // 1. Vite project or React frontend
  if (names.has('vite.config.ts') || names.has('vite.config.js') || deps['vite'] || hasReact) {
    return { install: 'npm install --legacy-peer-deps', start: 'npm run dev', label: 'Vite React Dev Server' };
  }
  // 2. Next.js project
  if (names.has('next.config.ts') || names.has('next.config.js') || deps['next']) {
    return { install: 'npm install --legacy-peer-deps', start: 'npm run dev', label: 'Next.js Dev Server' };
  }
  // 3. Custom dev script
  if (scripts['dev']) {
    return { install: 'npm install --legacy-peer-deps', start: 'npm run dev', label: 'Dev server' };
  }
  // 4. Custom start script
  if (scripts['start']) {
    return { install: 'npm install --legacy-peer-deps', start: 'npm start', label: 'npm start' };
  }
  // 5. TypeScript / tsx / ts-node server
  const tsEntry = files.find(f => f.name === 'src/server.ts' || f.name === 'server.ts' || f.name === 'src/index.ts' || f.name === 'index.ts' || f.name === 'src/app.ts' || f.name === 'app.ts');
  if (tsEntry || deps['tsx'] || deps['ts-node']) {
    const entryPath = tsEntry?.name ?? 'src/index.ts';
    return { install: 'npm install --legacy-peer-deps', start: `npx tsx ${entryPath}`, label: 'TypeScript / TSX Server' };
  }
  // 6. Plain node fallback
  const jsEntry = files.find(f => f.name === 'server.js' || f.name === 'src/server.js' || f.name === 'index.js' || f.name === 'src/index.js' || f.name === 'app.js');
  return { install: 'npm install --legacy-peer-deps', start: `node ${jsEntry?.name ?? 'index.js'}`, label: 'Node.js Server' };
}

/** Detect TypeScript project */
function isTypeScriptProject(files: CodeFile[]): boolean {
  return files.some(f => f.name.endsWith('.ts') || f.name.endsWith('.tsx'));
}

/** Build a FileSystemTree from flat [{name, content}] with intelligent auto-healing */
function buildTree(files: CodeFile[]): FileSystemTree {
  const tree: FileSystemTree = {};
  const names = new Set(files.map(f => f.name));

  for (const f of files) {
    const parts = f.name.split('/').filter(Boolean);
    let node: any = tree;
    for (let i = 0; i < parts.length; i++) {
      const seg = parts[i];
      if (i === parts.length - 1) {
        node[seg] = { file: { contents: f.content ?? '' } };
      } else {
        if (!node[seg]) node[seg] = { directory: {} };
        node = node[seg].directory;
      }
    }
  }

  const hasReact = files.some(f => f.name.endsWith('.tsx') || f.name.endsWith('.jsx') || (f.content && f.content.includes('react')));
  const hasNodeServer = files.some(f => f.name.includes('server') || (f.content && (f.content.includes('express') || f.content.includes('http.createServer'))));
  const hasTs = files.some(f => f.name.endsWith('.ts') || f.name.endsWith('.tsx'));

  // 1. Guarantee package.json
  if (!tree['package.json']) {
    const scripts: Record<string, string> = {};
    const dependencies: Record<string, string> = {};
    const devDependencies: Record<string, string> = {};

    if (hasReact) {
      scripts['dev'] = 'vite';
      scripts['build'] = 'tsc && vite build';
      dependencies['react'] = '^18.2.0';
      dependencies['react-dom'] = '^18.2.0';
      devDependencies['vite'] = '^5.1.0';
      devDependencies['@vitejs/plugin-react'] = '^4.2.0';
      devDependencies['typescript'] = '^5.3.0';
      devDependencies['@types/react'] = '^18.2.0';
      devDependencies['@types/react-dom'] = '^18.2.0';
    } else if (hasNodeServer) {
      scripts['dev'] = 'tsx watch src/index.ts';
      scripts['start'] = 'node index.js';
      dependencies['express'] = '^4.18.2';
      dependencies['cors'] = '^2.8.5';
      devDependencies['tsx'] = '^4.7.1';
      devDependencies['typescript'] = '^5.3.0';
      devDependencies['@types/express'] = '^4.17.21';
      devDependencies['@types/node'] = '^20.11.0';
    } else {
      scripts['start'] = 'node index.js';
    }

    tree['package.json'] = {
      file: {
        contents: JSON.stringify(
          {
            name: 'generated-app',
            private: true,
            type: 'module',
            scripts,
            dependencies,
            devDependencies,
          },
          null,
          2
        ),
      },
    };
  }

  // 2. Guarantee index.html for React / Vite frontend apps
  if (!names.has('index.html') && hasReact) {
    let entryPoint = 'src/main.tsx';
    if (names.has('src/main.tsx')) entryPoint = 'src/main.tsx';
    else if (names.has('src/index.tsx')) entryPoint = 'src/index.tsx';
    else if (names.has('src/App.tsx')) entryPoint = 'src/App.tsx';
    else if (names.has('src/main.jsx')) entryPoint = 'src/main.jsx';
    else if (names.has('src/index.jsx')) entryPoint = 'src/index.jsx';

    tree['index.html'] = {
      file: {
        contents: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Generated Web App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/${entryPoint}"></script>
  </body>
</html>`,
      },
    };
  }

  // 3. Guarantee vite.config.ts if React/Vite app lacks vite.config
  if (!names.has('vite.config.ts') && !names.has('vite.config.js') && hasReact) {
    tree['vite.config.ts'] = {
      file: {
        contents: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
});`,
      },
    };
  }

  // 4. Guarantee tsconfig.json if TypeScript app
  if (!names.has('tsconfig.json') && hasTs) {
    tree['tsconfig.json'] = {
      file: {
        contents: JSON.stringify(
          {
            compilerOptions: {
              target: 'ES2020',
              useDefineForClassFields: true,
              module: 'ESNext',
              lib: ['ES2020', 'DOM', 'DOM.Iterable'],
              skipLibCheck: true,
              moduleResolution: 'bundler',
              allowImportingTsExtensions: true,
              resolveJsonModule: true,
              isolatedModules: true,
              noEmit: true,
              jsx: 'react-jsx',
              strict: false,
              esModuleInterop: true,
            },
            include: ['src'],
          },
          null,
          2
        ),
      },
    };
  }

  return tree;
}

// ─── Agent step definitions ───────────────────────────────────────────────────
const INITIAL_STEPS: Omit<AgentStep, 'status'>[] = [
  { id: 1, icon: '🔧', message: 'Booting WebContainer' },
  { id: 2, icon: '📁', message: 'Mounting project files' },
  { id: 3, icon: '🔍', message: 'Detecting project type' },
  { id: 4, icon: '📦', message: 'Installing dependencies' },
  { id: 5, icon: '🔨', message: 'Preparing TypeScript' },
  { id: 6, icon: '🚀', message: 'Starting dev server' },
  { id: 7, icon: '✅', message: 'Application live' },
];

type TabId = 'preview' | 'terminal' | 'logs';

// ─── Component ────────────────────────────────────────────────────────────────
export const WebContainerRunner: React.FC<WebContainerRunnerProps> = ({
  files,
  projectName = 'Project',
  className,
}) => {
  const termHostRef = useRef<HTMLDivElement | null>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const wcRef = useRef<WebContainer | null>(null);
  const shellRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const logsEndRef = useRef<HTMLDivElement | null>(null);

  const [status, setStatus] = useState<'idle' | 'booting' | 'installing' | 'starting' | 'running' | 'error'>('idle');
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('logs');
  const [steps, setSteps] = useState<AgentStep[]>(
    INITIAL_STEPS.map(s => ({ ...s, status: 'pending' })),
  );
  const [copied, setCopied] = useState(false);
  const [isIsolated] = useState(() =>
    typeof window !== 'undefined' ? Boolean((window as any).crossOriginIsolated) : false,
  );

  const updateStep = useCallback(
    (id: number, update: Partial<AgentStep>) => {
      setSteps(prev => prev.map(s => (s.id === id ? { ...s, ...update } : s)));
    },
    [],
  );

  const appendLog = useCallback((msg: string) => {
    setSteps(prev => {
      const last = [...prev];
      const running = last.find(s => s.status === 'running');
      if (running) {
        return last.map(s =>
          s.id === running.id ? { ...s, detail: (s.detail ? s.detail + '\n' : '') + msg } : s,
        );
      }
      return last;
    });
    setTimeout(() => logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, []);

  // Boot + run pipeline
  const runPipeline = useCallback(async () => {
    const isCurrentlyIsolated = typeof window !== 'undefined' && Boolean((window as any).crossOriginIsolated);
    if (!isCurrentlyIsolated) {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.register('/coi-serviceworker.js').catch(() => {});
      }
      setStatus('error');
      setError('Cross-Origin Isolation is required to run WebContainer (SharedArrayBuffer). Click "Enable Isolation & Reload" to activate.');
      return;
    }

    setSteps(INITIAL_STEPS.map(s => ({ ...s, status: 'pending' })));
    setPreviewUrl(null);
    setStatus('booting');
    setActiveTab('logs');

    // Step 1 — Boot
    updateStep(1, { status: 'running' });
    let wc: WebContainer;
    try {
      wc = await getWC();
      wcRef.current = wc;
      updateStep(1, { status: 'done', detail: 'WebContainer booted successfully' });
    } catch (e: any) {
      updateStep(1, { status: 'error', detail: e?.message });
      setError(e?.message ?? 'Boot failed');
      setStatus('error');
      return;
    }

    // Step 2 — Mount files
    updateStep(2, { status: 'running' });
    try {
      const tree = buildTree(files);
      await wc.mount(tree);
      updateStep(2, { status: 'done', detail: `Mounted ${files.length} file(s)` });
    } catch (e: any) {
      updateStep(2, { status: 'error', detail: e?.message });
      setError(e?.message ?? 'Mount failed');
      setStatus('error');
      return;
    }

    // Step 3 — Detect project
    const { install, start, label } = detectStartCommand(files);
    const isTS = isTypeScriptProject(files);
    updateStep(3, { status: 'done', detail: `Detected: ${label}${isTS ? ' (TypeScript)' : ''}` });

    // Step 5 — TS setup (skip step detail if not TS)
    if (!isTS) {
      updateStep(5, { status: 'done', detail: 'No TypeScript setup needed' });
    }

    // Step 4 — Install
    updateStep(4, { status: 'running' });
    setStatus('installing');
    try {
      const installCmd = install.split(' ');
      const installProcess = await wc.spawn(installCmd[0], installCmd.slice(1));
      installProcess.output.pipeTo(
        new WritableStream({ write(chunk) { appendLog(chunk); } }),
      );
      const installExit = await installProcess.exit;
      if (installExit !== 0) throw new Error(`npm install exited with code ${installExit}`);
      updateStep(4, { status: 'done', detail: 'Dependencies installed' });
    } catch (e: any) {
      updateStep(4, { status: 'error', detail: e?.message });
      setError(e?.message ?? 'Install failed');
      setStatus('error');
      return;
    }

    // Step 5 — TypeScript config
    if (isTS) {
      updateStep(5, { status: 'running' });
      const hasTsConfig = files.some(f => f.name === 'tsconfig.json');
      if (!hasTsConfig) {
        await wc.fs.writeFile('tsconfig.json', JSON.stringify({
          compilerOptions: {
            target: 'ES2020',
            module: 'commonjs',
            lib: ['ES2020'],
            strict: false,
            esModuleInterop: true,
            outDir: './dist',
            rootDir: './src',
            skipLibCheck: true,
          },
          include: ['src/**/*', '*.ts'],
        }, null, 2));
      }
      updateStep(5, { status: 'done', detail: hasTsConfig ? 'tsconfig.json found' : 'tsconfig.json injected' });
    }

    // Step 6 — Start server
    updateStep(6, { status: 'running' });
    setStatus('starting');

    // Start shell for interactive terminal
    await startShell(wc);

    // Listen for server-ready event
    wc.on('server-ready', (port, url) => {
      updateStep(6, { status: 'done', detail: `Server ready on port ${port}` });
      updateStep(7, { status: 'done', detail: `Live at ${url}` });
      setPreviewUrl(url);
      setStatus('running');
      setActiveTab('preview');
    });

    // Run the start command in the shell
    try {
      const startParts = start.split(' ');
      const serverProcess = await wc.spawn(startParts[0], startParts.slice(1));
      serverProcess.output.pipeTo(
        new WritableStream({ write(chunk) { appendLog(chunk); termRef.current?.write(chunk); } }),
      );
      serverProcess.exit.then(code => {
        if (code !== 0 && status !== 'running') {
          updateStep(6, { status: 'error', detail: `Server exited with code ${code}` });
          setStatus('error');
          setError(`Server process exited with code ${code}`);
        }
      });
    } catch (e: any) {
      updateStep(6, { status: 'error', detail: e?.message });
      setStatus('error');
      setError(e?.message ?? 'Failed to start server');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, isIsolated]);

  const startShell = async (wc: WebContainer) => {
    const term = termRef.current;
    if (!term) return;
    try { shellRef.current?.kill?.(); } catch { /* noop */ }
    const shell = await wc.spawn('jsh', { terminal: { cols: term.cols, rows: term.rows } });
    shellRef.current = shell;
    shell.output.pipeTo(new WritableStream({ write(chunk) { term.write(chunk); } }));
    const writer = shell.input.getWriter();
    term.onData(d => writer.write(d));
    term.onResize(({ cols, rows }) => { try { shell.resize({ cols, rows }); } catch { /* noop */ } });
  };

  // Init xterm
  useEffect(() => {
    if (!termHostRef.current) return;
    const term = new Terminal({
      convertEol: true,
      cursorBlink: true,
      fontSize: 12,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      theme: {
        background: '#0d0d14',
        foreground: '#e2e8f0',
        cursor: '#7c6af7',
        selectionBackground: '#7c6af740',
        black: '#1a1a2e', red: '#f87171', green: '#4ade80',
        yellow: '#fbbf24', blue: '#60a5fa', magenta: '#a78bfa',
        cyan: '#34d399', white: '#f1f5f9',
      },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(termHostRef.current);
    fit.fit();
    termRef.current = term;
    fitRef.current = fit;

    const ro = new ResizeObserver(() => { try { fit.fit(); } catch { /* noop */ } });
    ro.observe(termHostRef.current);

    return () => {
      ro.disconnect();
      term.dispose();
    };
  }, []);

  // Fit terminal when tab switches to terminal
  useEffect(() => {
    if (activeTab === 'terminal') {
      setTimeout(() => { try { fitRef.current?.fit(); } catch { /* noop */ } }, 100);
    }
  }, [activeTab]);

  // Re-mount files when they change and WC is running
  useEffect(() => {
    if (status === 'running' && wcRef.current) {
      wcRef.current.mount(buildTree(files)).catch(() => { /* noop */ });
    }
  }, [files, status]);

  const handleCopyUrl = () => {
    if (!previewUrl) return;
    navigator.clipboard.writeText(previewUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleRestart = async () => {
    setStatus('idle');
    setSteps(INITIAL_STEPS.map(s => ({ ...s, status: 'pending' })));
    setPreviewUrl(null);
    try { shellRef.current?.kill?.(); } catch { /* noop */ }
    await runPipeline();
  };

  // ─── Render helpers ─────────────────────────────────────────────────────────

  const statusColors: Record<string, string> = {
    idle: 'bg-zinc-500/20 text-zinc-300',
    booting: 'bg-yellow-500/20 text-yellow-300',
    installing: 'bg-blue-500/20 text-blue-300',
    starting: 'bg-purple-500/20 text-purple-300',
    running: 'bg-emerald-500/20 text-emerald-300',
    error: 'bg-red-500/20 text-red-300',
  };

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'preview', label: 'Preview', icon: <Globe className="h-3 w-3" /> },
    { id: 'terminal', label: 'Terminal', icon: <TerminalSquare className="h-3 w-3" /> },
    { id: 'logs', label: 'Agent Logs', icon: <ListOrdered className="h-3 w-3" /> },
  ];

  const stepStatusIcon = (s: AgentStep) => {
    if (s.status === 'running') return <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400 shrink-0" />;
    if (s.status === 'done') return <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />;
    if (s.status === 'error') return <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />;
    return <ChevronRight className="h-3.5 w-3.5 text-zinc-600 shrink-0" />;
  };

  return (
    <div className={`flex flex-col h-full bg-[#0d0d14] text-white select-none ${className ?? ''}`}>
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-white/10 bg-black/50 shrink-0">
        {/* Traffic lights */}
        <div className="flex items-center gap-1.5 mr-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
        </div>

        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 mr-1">
          {projectName}
        </span>

        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusColors[status]}`}>
          {status === 'idle' ? 'idle'
            : status === 'booting' ? 'booting…'
            : status === 'installing' ? 'installing…'
            : status === 'starting' ? 'starting…'
            : status === 'running' ? 'live'
            : 'error'}
        </span>

        {previewUrl && (
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded px-2 py-0.5 max-w-[200px]">
            {status === 'running'
              ? <Wifi className="h-2.5 w-2.5 text-emerald-400 shrink-0" />
              : <WifiOff className="h-2.5 w-2.5 text-zinc-500 shrink-0" />
            }
            <span className="text-[10px] font-mono text-white/50 truncate">{previewUrl}</span>
          </div>
        )}

        <div className="ml-auto flex items-center gap-1">
          {previewUrl && (
            <>
              <Button
                size="sm" variant="ghost"
                className="h-6 px-2 text-[10px] text-white/60 hover:text-white hover:bg-white/10 gap-1"
                onClick={handleCopyUrl}
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied' : 'Copy URL'}
              </Button>
              <Button
                size="sm" variant="ghost"
                className="h-6 px-2 text-[10px] text-white/60 hover:text-white hover:bg-white/10 gap-1"
                onClick={() => window.open(previewUrl, '_blank')}
              >
                <ExternalLink className="h-3 w-3" /> Open
              </Button>
            </>
          )}

          {status === 'idle' || status === 'error' ? (
            <Button
              size="sm" variant="ghost"
              className="h-6 px-2.5 text-[10px] text-emerald-300 hover:text-emerald-100 hover:bg-emerald-500/10 gap-1 border border-emerald-500/30"
              onClick={runPipeline}
            >
              <Play className="h-3 w-3" /> Run
            </Button>
          ) : status === 'running' ? (
            <Button
              size="sm" variant="ghost"
              className="h-6 px-2 text-[10px] text-white/60 hover:text-white hover:bg-white/10 gap-1"
              onClick={handleRestart}
            >
              <RefreshCw className="h-3 w-3" /> Restart
            </Button>
          ) : (
            <Button
              size="sm" variant="ghost"
              className="h-6 px-2 text-[10px] text-white/40 gap-1 cursor-not-allowed"
              disabled
            >
              <Loader2 className="h-3 w-3 animate-spin" /> Running…
            </Button>
          )}
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex items-center gap-0 border-b border-white/10 bg-black/30 shrink-0 px-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium transition-all duration-150 border-b-2 ${
              activeTab === tab.id
                ? 'border-violet-400 text-white'
                : 'border-transparent text-white/40 hover:text-white/70'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.id === 'preview' && status === 'running' && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            )}
          </button>
        ))}
      </div>

      {/* ── Not isolated warning ── */}
      {typeof window !== 'undefined' && !(window as any).crossOriginIsolated && (
        <div className="flex items-center justify-between gap-2 p-2.5 bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-200 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-400" />
            <div>
              <p className="font-semibold">Cross-Origin Isolation Required</p>
              <p className="opacity-70 text-[11px]">
                WebContainer needs COOP/COEP headers to enable SharedArrayBuffer.
              </p>
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

      {/* ── Tab panels ── */}
      <div className="flex-1 min-h-0 relative overflow-hidden">

        {/* Preview iframe */}
        <div className={`absolute inset-0 ${activeTab === 'preview' ? 'flex flex-col' : 'hidden'}`}>
          {previewUrl ? (
            <iframe
              ref={iframeRef}
              src={previewUrl}
              className="flex-1 w-full border-0 bg-white"
              title={`${projectName} preview`}
              allow="cross-origin-isolated"
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-white/30">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Globe className="h-7 w-7" />
                </div>
                {(status === 'booting' || status === 'installing' || status === 'starting') && (
                  <div className="absolute -top-1 -right-1">
                    <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                  </div>
                )}
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-white/50">
                  {status === 'idle' ? 'Press ▶ Run to start the app' : 'Starting server…'}
                </p>
                <p className="text-xs text-white/25">Preview will appear here once the server is ready</p>
              </div>
              {status === 'idle' && isIsolated && (
                <Button
                  size="sm"
                  className="gap-2 bg-violet-600 hover:bg-violet-700 text-white border-0 mt-2"
                  onClick={runPipeline}
                >
                  <Play className="h-3.5 w-3.5" /> Run Project
                </Button>
              )}
            </div>
          )}
        </div>

        {/* xterm Terminal */}
        <div
          className={`absolute inset-0 px-1 py-1 ${activeTab === 'terminal' ? 'flex' : 'hidden'}`}
          style={{ background: '#0d0d14' }}
        >
          <div ref={termHostRef} className="flex-1 overflow-hidden" />
        </div>

        {/* Agent Logs */}
        <div className={`absolute inset-0 overflow-y-auto ${activeTab === 'logs' ? 'block' : 'hidden'}`}>
          <div className="p-4 space-y-1 min-h-full">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-3">
              Agent Execution Log — {projectName}
            </p>

            {steps.map((step, idx) => (
              <div
                key={step.id}
                className={`rounded-lg border transition-all duration-300 overflow-hidden ${
                  step.status === 'running'
                    ? 'border-blue-500/40 bg-blue-500/5'
                    : step.status === 'done'
                    ? 'border-emerald-500/20 bg-emerald-500/3'
                    : step.status === 'error'
                    ? 'border-red-500/30 bg-red-500/5'
                    : 'border-white/5 bg-white/2 opacity-40'
                }`}
              >
                <div className="flex items-center gap-2.5 px-3 py-2">
                  {/* Step number */}
                  <span className="text-[10px] font-mono text-white/20 w-4 shrink-0">
                    {String(idx + 1).padStart(2, '0')}
                  </span>

                  {/* Emoji icon */}
                  <span className="text-sm shrink-0">{step.icon}</span>

                  {/* Message */}
                  <span className={`text-xs font-medium flex-1 ${
                    step.status === 'running' ? 'text-blue-200'
                      : step.status === 'done' ? 'text-emerald-200'
                      : step.status === 'error' ? 'text-red-300'
                      : 'text-white/30'
                  }`}>
                    {step.message}
                  </span>

                  {/* Status icon */}
                  {stepStatusIcon(step)}
                </div>

                {/* Detail / output */}
                {step.detail && (
                  <div className="px-3 pb-2 pt-0">
                    <pre className={`text-[10px] font-mono leading-relaxed whitespace-pre-wrap break-all max-h-32 overflow-y-auto ${
                      step.status === 'error' ? 'text-red-300/70' : 'text-white/30'
                    }`}>
                      {step.detail}
                    </pre>
                  </div>
                )}
              </div>
            ))}

            {/* Error display */}
            {status === 'error' && error && (
              <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                <p className="text-xs font-semibold text-red-300 mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" /> Execution failed
                </p>
                <pre className="text-[10px] font-mono text-red-300/70 whitespace-pre-wrap break-all">{error}</pre>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2 h-7 text-xs text-red-300 hover:text-red-100 hover:bg-red-500/10 gap-1"
                  onClick={runPipeline}
                >
                  <RefreshCw className="h-3 w-3" /> Retry
                </Button>
              </div>
            )}

            {/* Success state */}
            {status === 'running' && previewUrl && (
              <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-emerald-300">🎉 Application is live!</p>
                  <p className="text-[10px] font-mono text-emerald-300/60 mt-0.5">{previewUrl}</p>
                </div>
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                  onClick={() => setActiveTab('preview')}
                >
                  <Globe className="h-3 w-3" /> View Preview
                </Button>
              </div>
            )}

            <div ref={logsEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebContainerRunner;
