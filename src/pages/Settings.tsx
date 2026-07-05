import React from 'react';
import { Palette, Database, Share2, ShieldCheck } from 'lucide-react';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppSidebar from '../components/AppSidebar';
import DataSourceSettings from '@/components/settings/DataSourceSettings';
import ThemeSettings from '@/components/settings/ThemeSettings';
import ConnectorSettings from '@/components/settings/ConnectorSettings';
import EnvSettings from '@/components/settings/EnvSettings';

const Settings: React.FC = () => {
  return (
    <div className="min-h-screen flex w-full bg-background dark:sunrise-gradient">
      <AppSidebar 
        activeSection="" 
        onSectionChange={() => {}} 
      />
      <SidebarInset className="flex-1 flex flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-2 sm:px-4 bg-background/80 dark:bg-background/20 backdrop-blur-sm">
          <SidebarTrigger className="-ml-1" />
          <div className="ml-auto">
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">nuvic ai</h1>
          </div>
        </header>
        
        <div className="flex-1 bg-gray-50 dark:bg-transparent dark:sunrise-gradient-subtle p-4 sm:p-8 overflow-auto">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-foreground mb-2">Settings</h1>
              <p className="text-base sm:text-lg text-gray-600 dark:text-muted-foreground">
                Manage your application preferences, environments and connectors
              </p>
            </div>

            <Tabs defaultValue="data-sources" className="space-y-6">
              <TabsList className="flex flex-col sm:inline-flex sm:flex-row w-full sm:w-auto h-auto sm:h-10 p-1 bg-background/80 dark:bg-card/40 backdrop-blur-sm overflow-x-auto">
                <TabsTrigger value="data-sources" className="w-full sm:w-auto justify-start sm:justify-center gap-2 px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Database className="h-4 w-4" />
                  <span className="sm:inline">Data Sources</span>
                </TabsTrigger>
                <TabsTrigger value="env" className="w-full sm:w-auto justify-start sm:justify-center gap-2 px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="sm:inline">Environments</span>
                </TabsTrigger>
                <TabsTrigger value="connectors" className="w-full sm:w-auto justify-start sm:justify-center gap-2 px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Share2 className="h-4 w-4" />
                  <span className="sm:inline">Connectors</span>
                </TabsTrigger>
                <TabsTrigger value="appearance" className="w-full sm:w-auto justify-start sm:justify-center gap-2 px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Palette className="h-4 w-4" />
                  <span className="sm:inline">Appearance</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="data-sources">
                <DataSourceSettings />
              </TabsContent>

              <TabsContent value="env">
                <EnvSettings />
              </TabsContent>

              <TabsContent value="connectors">
                <ConnectorSettings />
              </TabsContent>

              <TabsContent value="appearance">
                <ThemeSettings />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <footer className="mt-8 text-center py-4 border-t border-border bg-background/80 dark:bg-background/20 backdrop-blur-sm">
          <p className="text-xs text-muted-foreground">
            created with{' '}
            <a 
              href="/operator/npub1huggins123456789abcdef0123456789abcdef0123456789abcdef0123456789"
              className="text-primary hover:text-accent transition-colors underline"
            >
              hugs
            </a>
          </p>
        </footer>
      </SidebarInset>
    </div>
  );
};

export default Settings;
