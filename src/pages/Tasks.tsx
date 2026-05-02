import React, { useEffect, useState } from 'react';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '../components/AppSidebar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Circle, CheckCircle2, Clock, Loader2, Trash2, AlertCircle, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface Task {
  id: string;
  title: string;
  prompt: string | null;
  status: string;
  priority: string;
  scheduled_at: string | null;
  completed_at: string | null;
  result: string | null;
  created_at: string;
}

const Tasks: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [promptText, setPromptText] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [priority, setPriority] = useState('medium');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) { setLoading(false); return; }
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Failed to load tasks', description: error.message, variant: 'destructive' });
    } else {
      setTasks(data as Task[]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);

  // Realtime updates
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, [user?.id]);

  const createTask = async () => {
    if (!user) { navigate('/auth'); return; }
    if (!title.trim()) return;
    setSaving(true);
    const scheduled = scheduledAt ? new Date(scheduledAt).toISOString() : null;
    const status = scheduled ? 'scheduled' : 'pending';
    const { error } = await supabase.from('tasks').insert({
      user_id: user.id,
      title: title.trim(),
      prompt: promptText.trim() || null,
      status,
      priority,
      scheduled_at: scheduled,
    });
    setSaving(false);
    if (error) {
      toast({ title: 'Failed', description: error.message, variant: 'destructive' });
      return;
    }
    setOpen(false);
    setTitle(''); setPromptText(''); setScheduledAt(''); setPriority('medium');
    load();
  };

  const removeTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    else load();
  };

  const runNow = async (t: Task) => {
    await supabase.from('tasks').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      result: 'Manually completed',
    }).eq('id', t.id);
    load();
  };

  const statusIcon = (s: string) => {
    if (s === 'completed') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    if (s === 'running') return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
    if (s === 'scheduled') return <Clock className="h-4 w-4 text-blue-500" />;
    if (s === 'failed') return <AlertCircle className="h-4 w-4 text-destructive" />;
    return <Circle className="h-4 w-4 text-muted-foreground" />;
  };

  const priorityBadge = (p: string) => {
    if (p === 'high') return <Badge variant="destructive" className="text-xs">High</Badge>;
    if (p === 'medium') return <Badge variant="outline" className="text-xs text-yellow-500 border-yellow-500/30">Medium</Badge>;
    return <Badge variant="secondary" className="text-xs">Low</Badge>;
  };

  return (
    <div className="min-h-screen flex w-full bg-background dark:sunrise-gradient">
      <AppSidebar activeSection="tasks" onSectionChange={() => {}} />
      <SidebarInset className="flex-1 flex flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-2 sm:px-4 bg-background/80 dark:bg-background/20 backdrop-blur-sm">
          <SidebarTrigger className="-ml-1" />
          <div className="ml-auto"><h1 className="text-lg sm:text-xl font-semibold">Tasks</h1></div>
        </header>
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-1">Tasks</h2>
                <p className="text-sm text-muted-foreground">
                  {loading ? 'Loading…' : `${tasks.length} task${tasks.length === 1 ? '' : 's'}`}
                </p>
              </div>
              <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New Task</span>
              </Button>
            </div>

            {!user ? (
              <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
                <Button onClick={() => navigate('/auth')}>Sign in to view tasks</Button>
              </CardContent></Card>
            ) : loading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : tasks.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
                No tasks yet. Create one or schedule a prompt from the home page.
              </CardContent></Card>
            ) : (
              <div className="space-y-2">
                {tasks.map((t) => (
                  <Card key={t.id} className={`dark:bg-card/40 dark:backdrop-blur-sm ${t.status === 'completed' ? 'opacity-70' : ''}`}>
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start gap-3">
                        <div className="pt-0.5">{statusIcon(t.status)}</div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${t.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                            {t.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground mt-0.5">
                            <span className="capitalize">{t.status}</span>
                            {t.scheduled_at && (
                              <span>· {t.status === 'completed'
                                ? `ran ${formatDistanceToNow(new Date(t.completed_at || t.scheduled_at), { addSuffix: true })}`
                                : `scheduled ${format(new Date(t.scheduled_at), 'PPp')}`}</span>
                            )}
                          </div>
                          {t.result && <p className="text-[11px] text-muted-foreground mt-1 italic">{t.result}</p>}
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="hidden sm:block">{priorityBadge(t.priority)}</div>
                          {t.status !== 'completed' && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => runNow(t)} title="Mark complete">
                              <PlayCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeTask(t.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
        <Footer />
      </SidebarInset>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New task</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Textarea placeholder="Prompt or notes (optional)" value={promptText} onChange={(e) => setPromptText(e.target.value)} rows={3} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-muted-foreground">Schedule (optional)</label>
                <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground">Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full h-9 px-2 rounded-md border border-input bg-background text-sm">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={createTask} disabled={saving || !title.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tasks;
