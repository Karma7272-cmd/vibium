import React, { useEffect, useRef, useState } from 'react';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '../components/AppSidebar';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Play, Square, TerminalSquare, AlertTriangle, Sparkles, ChevronRight } from 'lucide-react';
import { WebContainer } from '@webcontainer/api';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import '@xterm/xterm/css/xterm.css';

const STARTER_FILES = {
  'package.json': {
    file: {
      contents: JSON.stringify({
        name: 'web-sandbox',
        type: 'module',
        scripts: { start: 'node index.js' },
      }, null, 2),
    },
  },
  'index.js': {
    file: {
      contents: `console.log("Hello from WebContainer!");\nconsole.log("Try: ls, cat package.json, npm install, node index.js");\n`,
    },
  },
};

let bootPromise: Promise<WebContainer> | null = null;
const getContainer = () => {
  if (!bootPromise) bootPromise = WebContainer.boot();
  return bootPromise;
};

const TerminalPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const wcRef = useRef<WebContainer | null>(null);
  const shellWriterRef = useRef<WritableStreamDefaultWriter<string> | null>(null);
  const [status, setStatus] = useState<'idle' | 'booting' | 'ready' | 'error'>('idle');
  const [error, setError] = useState<string>('');
  const [aiGoal, setAiGoal] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiCommands, setAiCommands] = useState<string[]>([]);
  const [aiExplanation, setAiExplanation] = useState('');
  const { toast } = useToast();

  const isIsolated = typeof window !== 'undefined' && (window as any).crossOriginIsolated;

  useEffect(() => {
    return () => {
      termRef.current?.dispose();
      shellWriterRef.current?.close().catch(() => {});
    };
  }, []);

  const boot = async () => {
    if (!isIsolated) {
      setError('WebContainers require cross-origin isolation (COOP/COEP headers). Open this app in its production domain or a self-hosted environment with those headers set.');
      setStatus('error');
      return;
    }
    if (!containerRef.current) return;
    setStatus('booting'); setError('');

    try {
      const term = new Terminal({
        convertEol: true,
        fontFamily: 'Menlo, monospace',
        fontSize: 13,
        theme: { background: '#0a0a0a' },
      });
      const fit = new FitAddon();
      term.loadAddon(fit);
      term.open(containerRef.current);
      fit.fit();
      termRef.current = term;
      window.addEventListener('resize', () => fit.fit());

      term.writeln('\x1b[36mBooting WebContainer...\x1b[0m');
      const wc = await getContainer();
      wcRef.current = wc;
      await wc.mount(STARTER_FILES);
      term.writeln('\x1b[32mReady. Starting shell.\x1b[0m\r\n');

      const shell = await wc.spawn('jsh', { terminal: { cols: term.cols, rows: term.rows } });
      shell.output.pipeTo(new WritableStream({ write(data) { term.write(data); } }));
      const writer = shell.input.getWriter();
      shellWriterRef.current = writer;
      term.onData((data) => writer.write(data));

      setStatus('ready');
    } catch (e: any) {
      setError(e?.message || String(e));
      setStatus('error');
    }
  };

  const stop = async () => {
    try { await shellWriterRef.current?.close(); } catch {}
    termRef.current?.dispose();
    termRef.current = null;
    shellWriterRef.current = null;
    setStatus('idle');
  };

  const askAI = async () => {
    if (!aiGoal.trim()) return;
    setAiBusy(true); setAiCommands([]); setAiExplanation('');
    try {
      let files: string[] = [];
      try {
        const ls = await wcRef.current?.fs.readdir('/');
        if (ls) files = ls;
      } catch { /* not booted */ }
      const { data, error } = await supabase.functions.invoke('terminal-ai', { body: { goal: aiGoal, cwd_files: files } });
      if (error) throw error;
      setAiCommands(data?.commands || []);
      setAiExplanation(data?.explanation || '');
    } catch (e: any) {
      toast({ title: 'AI error', description: e.message || String(e), variant: 'destructive' });
    } finally { setAiBusy(false); }
  };

  const runCommand = async (cmd: string) => {
    if (status !== 'ready' || !shellWriterRef.current) {
      toast({ title: 'Terminal not running', description: 'Boot the terminal first.', variant: 'destructive' });
      return;
    }
    await shellWriterRef.current.write(cmd + '\n');
  };
  const runAll = async () => { for (const c of aiCommands) await runCommand(c); };

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar activeSection="" onSectionChange={() => {}} />
      <SidebarInset className="flex-1 flex flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-lg sm:text-xl font-semibold ml-auto">Web Terminal</h1>
        </header>
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="text-center">
              <div className="inline-flex p-2 bg-primary/10 rounded-full mb-2"><TerminalSquare className="w-6 h-6 text-primary" /></div>
              <h2 className="text-2xl font-bold">In-browser Node terminal</h2>
              <p className="text-sm text-muted-foreground">Powered by WebContainers. Runs entirely in your browser.</p>
            </div>

            {!isIsolated && (
              <Card className="p-4 border-orange-500/40 bg-orange-500/5">
                <div className="flex gap-2 text-sm">
                  <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0" />
                  <div>
                    <strong>Cross-origin isolation required.</strong><br />
                    WebContainers need <code>COOP/COEP</code> response headers. This preview may not have them; in production set:
                    <pre className="text-[10px] mt-2 bg-muted p-2 rounded">Cross-Origin-Embedder-Policy: require-corp{'\n'}Cross-Origin-Opener-Policy: same-origin</pre>
                  </div>
                </div>
              </Card>
            )}

            <div className="flex gap-2 justify-center">
              {status !== 'ready' ? (
                <Button onClick={boot} disabled={status === 'booting' || !isIsolated} className="gap-2">
                  {status === 'booting' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  Boot terminal
                </Button>
              ) : (
                <Button variant="destructive" onClick={stop} className="gap-2">
                  <Square className="h-4 w-4" /> Stop
                </Button>
              )}
            </div>

            {error && <Card className="p-3 border-destructive/40 bg-destructive/5 text-xs text-destructive">{error}</Card>}

            <Card className="p-3 space-y-2 border-primary/30 bg-primary/5">
              <div className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-primary" /> AI command helper</div>
              <div className="flex gap-2">
                <Input placeholder="e.g. install express and write a hello-world server" value={aiGoal} onChange={e => setAiGoal(e.target.value)} onKeyDown={e => e.key === 'Enter' && askAI()} />
                <Button onClick={askAI} disabled={aiBusy || !aiGoal.trim()} className="gap-2">
                  {aiBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Suggest
                </Button>
              </div>
              {aiExplanation && <p className="text-xs text-muted-foreground">{aiExplanation}</p>}
              {aiCommands.length > 0 && (
                <div className="space-y-1">
                  {aiCommands.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 bg-background rounded px-2 py-1 border border-border/60">
                      <code className="flex-1 text-xs font-mono">{c}</code>
                      <Button size="sm" variant="ghost" className="h-7 gap-1" onClick={() => runCommand(c)}><ChevronRight className="h-3 w-3" />Run</Button>
                    </div>
                  ))}
                  <div className="flex justify-end pt-1">
                    <Button size="sm" variant="outline" onClick={runAll} disabled={status !== 'ready'}>Run all</Button>
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-2 bg-[#0a0a0a]">
              <div ref={containerRef} className="h-[500px] w-full" />
            </Card>
          </div>
        </div>
        <Footer />
      </SidebarInset>
    </div>
  );
};

export default TerminalPage;
