import React from 'react';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '../components/AppSidebar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { FolderOpen, Plus, Globe, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Projects: React.FC = () => {
  const projects = [
    { id: 1, name: 'Production Monitor', urls: 12, status: 'active', visibility: 'public', lastRun: '2 min ago' },
    { id: 2, name: 'Staging Tests', urls: 5, status: 'active', visibility: 'private', lastRun: '1 hour ago' },
    { id: 3, name: 'API Health Checks', urls: 8, status: 'paused', visibility: 'public', lastRun: '3 days ago' },
  ];

  return (
    <div className="min-h-screen flex w-full bg-background dark:sunrise-gradient">
      <AppSidebar activeSection="projects" onSectionChange={() => {}} />
      <SidebarInset className="flex-1 flex flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-2 sm:px-4 bg-background/80 dark:bg-background/20 backdrop-blur-sm">
          <SidebarTrigger className="-ml-1" />
          <div className="ml-auto">
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">Projects</h1>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">Projects</h2>
                <p className="text-sm text-muted-foreground">Organize your checks into projects</p>
              </div>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Project</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Card key={project.id} className="dark:bg-card/40 dark:backdrop-blur-sm hover:border-primary/30 transition-colors cursor-pointer">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between mb-3">
                      <FolderOpen className="h-5 w-5 text-primary" />
                      {project.visibility === 'public' ? (
                        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <h3 className="font-semibold text-foreground text-sm mb-1">{project.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{project.urls} URLs · Last run {project.lastRun}</p>
                    <Badge variant={project.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                      {project.status}
                    </Badge>
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

export default Projects;
