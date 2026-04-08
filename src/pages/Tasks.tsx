import React from 'react';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '../components/AppSidebar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { ListTodo, Plus, Circle, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Tasks: React.FC = () => {
  const tasks = [
    { id: 1, title: 'Set up monitoring for api.example.com', status: 'todo', priority: 'high', assignee: 'You' },
    { id: 2, title: 'Review failed checks from last week', status: 'in_progress', priority: 'medium', assignee: 'You' },
    { id: 3, title: 'Add SSL certificate checks', status: 'todo', priority: 'low', assignee: 'You' },
    { id: 4, title: 'Configure alert thresholds', status: 'done', priority: 'high', assignee: 'You' },
    { id: 5, title: 'Deploy new node in EU region', status: 'done', priority: 'medium', assignee: 'You' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-primary" />;
      default: return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge variant="destructive" className="text-xs">High</Badge>;
      case 'medium': return <Badge variant="outline" className="text-xs text-yellow-500 border-yellow-500/30">Medium</Badge>;
      default: return <Badge variant="secondary" className="text-xs">Low</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-background dark:sunrise-gradient">
      <AppSidebar activeSection="tasks" onSectionChange={() => {}} />
      <SidebarInset className="flex-1 flex flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-2 sm:px-4 bg-background/80 dark:bg-background/20 backdrop-blur-sm">
          <SidebarTrigger className="-ml-1" />
          <div className="ml-auto">
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">Tasks</h1>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">Tasks</h2>
                <p className="text-sm text-muted-foreground">Track and manage your work</p>
              </div>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Task</span>
              </Button>
            </div>

            <div className="space-y-2">
              {tasks.map((task) => (
                <Card key={task.id} className={`dark:bg-card/40 dark:backdrop-blur-sm ${task.status === 'done' ? 'opacity-60' : ''}`}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(task.status)}
                      <p className={`text-sm font-medium flex-1 min-w-0 truncate ${task.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {task.title}
                      </p>
                      <div className="hidden sm:block">
                        {getPriorityBadge(task.priority)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </SidebarInset>
    </div>
  );
};

export default Tasks;
