import React, { useEffect, useState } from 'react';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '../components/AppSidebar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { UserPlus, Trash2, Mail, Users, Check, X } from 'lucide-react';
import { LoadingState } from '@/components/ui/LoadingState';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useCollaboration } from '@/hooks/useCollaboration';

interface Member {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  created_at: string;
}

const Team: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('viewer');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) { setLoading(false); return; }
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast({ title: 'Load failed', description: error.message, variant: 'destructive' });
    else setMembers(data as Member[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);

  const invite = async () => {
    if (!user) { navigate('/auth'); return; }
    if (!email.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('team_members').insert({
      owner_id: user.id,
      email: email.trim().toLowerCase(),
      name: name.trim() || null,
      role,
      status: 'pending',
    });
    setSaving(false);
    if (error) {
      toast({ title: 'Invite failed', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Invitation added', description: `${email} added as ${role}` });
    setOpen(false); setEmail(''); setName(''); setRole('viewer');
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('team_members').delete().eq('id', id);
    if (error) toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    else load();
  };

  const roleBadge = (r: string) => {
    const cls = r === 'admin' ? 'text-destructive border-destructive/30'
      : r === 'editor' ? 'text-primary border-primary/30'
      : 'text-muted-foreground border-border';
    return <Badge variant="outline" className={`text-[10px] ${cls}`}>{r}</Badge>;
  };

  return (
    <div className="min-h-screen flex w-full bg-background dark:sunrise-gradient">
      <AppSidebar activeSection="team" onSectionChange={() => {}} />
      <SidebarInset className="flex-1 flex flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-2 sm:px-4 bg-background/80 dark:bg-background/20 backdrop-blur-sm">
          <SidebarTrigger className="-ml-1" />
          <div className="ml-auto"><h1 className="text-lg sm:text-xl font-semibold">Team</h1></div>
        </header>
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-2">
                  <Users className="h-6 w-6" /> Team members
                </h2>
                <p className="text-sm text-muted-foreground">
                  {loading ? 'Loading…' : `${members.length} member${members.length === 1 ? '' : 's'}`}
                </p>
              </div>
              <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
                <UserPlus className="h-4 w-4" /> <span className="hidden sm:inline">Invite</span>
              </Button>
            </div>

            {!user ? (
              <Card><CardContent className="p-8 text-center text-sm">
                <Button onClick={() => navigate('/auth')}>Sign in to manage your team</Button>
              </CardContent></Card>
            ) : loading ? (
              <div className="flex justify-center py-16"><LoadingState variant="bars" size="md" /></div>
            ) : members.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
                No team members yet. Invite your first collaborator.
              </CardContent></Card>
            ) : (
              <div className="space-y-2">
                {members.map((m) => (
                  <Card key={m.id} className="dark:bg-card/40 dark:backdrop-blur-sm">
                    <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
                        {(m.name || m.email)[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.name || m.email}</p>
                        <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {m.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {roleBadge(m.role)}
                        <Badge variant={m.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                          {m.status}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => remove(m.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
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
          <DialogHeader><DialogTitle>Invite team member</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input placeholder="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
            <div>
              <label className="text-[11px] text-muted-foreground">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full h-9 px-2 rounded-md border border-input bg-background text-sm">
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={invite} disabled={saving || !email.trim()}>
              {saving ? <LoadingState variant="bars" size="sm" /> : 'Invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Team;
