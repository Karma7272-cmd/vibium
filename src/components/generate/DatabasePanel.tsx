import React, { useMemo, useState } from 'react';
import { Database, Copy, Download, Check, Plug, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Editor from '@monaco-editor/react';
import { useTheme } from '@/components/ThemeProvider';
import { useToast } from '@/hooks/use-toast';

interface DatabasePanelProps {
  /** All project files — used to locate generated .sql migrations. */
  files: { path: string; content: string }[];
  /** Persist a project env var (key/value). */
  onSaveEnv?: (key: string, value: string) => void | Promise<void>;
  /** Currently stored env values, keyed by env name. */
  envValues?: Record<string, string>;
}

const SUPABASE_KEYS = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'] as const;

export const DatabasePanel: React.FC<DatabasePanelProps> = ({ files, onSaveEnv, envValues = {} }) => {
  const { actualTheme } = useTheme();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const sqlFiles = useMemo(
    () => files.filter((f) => f.path.toLowerCase().endsWith('.sql')),
    [files],
  );
  const sql = useMemo(() => sqlFiles.map((f) => `-- ${f.path}\n${f.content}`).join('\n\n'), [sqlFiles]);

  const [supabaseUrl, setSupabaseUrl] = useState(envValues['VITE_SUPABASE_URL'] || '');
  const [anonKey, setAnonKey] = useState(envValues['VITE_SUPABASE_ANON_KEY'] || '');
  const [serviceKey, setServiceKey] = useState(envValues['SUPABASE_SERVICE_ROLE_KEY'] || '');
  const [dbUrl, setDbUrl] = useState(envValues['DATABASE_URL'] || '');

  const copySql = async () => {
    await navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const downloadSql = () => {
    const blob = new Blob([sql], { type: 'text/sql' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'schema.sql';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const save = async (pairs: [string, string][]) => {
    if (!onSaveEnv) return;
    setSaving(true);
    try {
      for (const [k, v] of pairs) await onSaveEnv(k, v);
      toast({ title: 'Connection saved', description: 'Credentials stored with this project.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0">
        <Database className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">Database</span>
        <Badge variant="secondary" className="text-[10px]">{sqlFiles.length} SQL file(s)</Badge>
      </div>

      <Tabs defaultValue="sql" className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-3 mt-2 w-fit">
          <TabsTrigger value="sql" className="text-xs">SQL queries</TabsTrigger>
          <TabsTrigger value="connect" className="text-xs">Connect</TabsTrigger>
        </TabsList>

        <TabsContent value="sql" className="flex-1 min-h-0 mt-2 data-[state=inactive]:hidden">
          {sql ? (
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-2 px-3 pb-2">
                <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={copySql}>
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} Copy SQL
                </Button>
                <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={downloadSql}>
                  <Download className="h-3 w-3" /> Download
                </Button>
                <span className="text-[11px] text-muted-foreground hidden sm:inline">
                  Paste into your Supabase SQL editor, or run <code className="font-mono">psql $DATABASE_URL -f schema.sql</code>
                </span>
              </div>
              <div className="flex-1 min-h-0">
                <Editor
                  height="100%"
                  language="sql"
                  value={sql}
                  theme={actualTheme === 'dark' ? 'vs-dark' : 'vs-light'}
                  options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12, wordWrap: 'on' }}
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground px-6 text-center">
              This project has no SQL migration. Ask the AI to add a database schema.
            </div>
          )}
        </TabsContent>

        <TabsContent value="connect" className="flex-1 min-h-0 mt-2 overflow-y-auto data-[state=inactive]:hidden">
          <div className="p-3 space-y-6 max-w-xl">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Plug className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold">Supabase account</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Paste your own Supabase project credentials. They are stored as this project's env variables.
              </p>
              <Input value={supabaseUrl} onChange={(e) => setSupabaseUrl(e.target.value)} placeholder="https://xxxx.supabase.co" className="h-8 text-xs font-mono" />
              <Input value={anonKey} onChange={(e) => setAnonKey(e.target.value)} placeholder="anon / publishable key" type="password" className="h-8 text-xs font-mono" />
              <Input value={serviceKey} onChange={(e) => setServiceKey(e.target.value)} placeholder="service role key (optional, server only)" type="password" className="h-8 text-xs font-mono" />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="h-8 text-xs"
                  disabled={saving || !supabaseUrl.trim() || !anonKey.trim()}
                  onClick={() => save([
                    ['VITE_SUPABASE_URL', supabaseUrl.trim()],
                    ['VITE_SUPABASE_ANON_KEY', anonKey.trim()],
                    ...(serviceKey.trim() ? ([['SUPABASE_SERVICE_ROLE_KEY', serviceKey.trim()]] as [string, string][]) : []),
                  ])}
                >
                  Save Supabase connection
                </Button>
                <Button size="sm" variant="ghost" className="h-8 text-xs gap-1" onClick={() => window.open('https://supabase.com/dashboard', '_blank')}>
                  Open dashboard <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="space-y-2 border-t border-border pt-5">
              <h4 className="text-sm font-semibold">Custom database</h4>
              <p className="text-xs text-muted-foreground">
                Any Postgres-compatible database (Neon, RDS, Railway, self-hosted). Used by the generated <code className="font-mono">pg</code> client.
              </p>
              <Input value={dbUrl} onChange={(e) => setDbUrl(e.target.value)} placeholder="postgresql://user:password@host:5432/dbname" type="password" className="h-8 text-xs font-mono" />
              <Button
                size="sm"
                className="h-8 text-xs"
                disabled={saving || !dbUrl.trim()}
                onClick={() => save([['DATABASE_URL', dbUrl.trim()]])}
              >
                Save custom connection
              </Button>
            </div>

            {sql && (
              <div className="border-t border-border pt-5 space-y-2">
                <h4 className="text-sm font-semibold">Apply the schema</h4>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal pl-4">
                  <li>Copy the SQL from the “SQL queries” tab.</li>
                  <li>Supabase: open your project’s SQL editor, paste, and run.</li>
                  <li>Custom: run <code className="font-mono">psql "$DATABASE_URL" -f supabase/migrations/0001_init.sql</code>.</li>
                </ol>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DatabasePanel;
