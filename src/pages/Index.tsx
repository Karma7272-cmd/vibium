
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { SidebarInset, SidebarTrigger, SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from '../components/AppSidebar';
import MainContent from '../components/MainContent';
import CrossOriginStatus from '../components/CrossOriginStatus';
import WebContainerTest from '../components/WebContainerTest';



const Index: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState('network');
  // Load sidebar state from localStorage or default to true
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const savedSidebarState = localStorage.getItem('sidebar-open');
    return savedSidebarState !== null ? savedSidebarState === 'true' : true;
  });

  useEffect(() => {
    const section = searchParams.get('section');
    if (section) {
      setActiveSection(section);
    }
  }, [searchParams]);

  // Save sidebar state to localStorage when it changes
  const handleSidebarOpenChange = (open: boolean) => {
    setSidebarOpen(open);
    localStorage.setItem('sidebar-open', String(open));
  };

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={handleSidebarOpenChange}>
      <div className="min-h-screen flex w-full bg-background dark:sunrise-gradient">
        <AppSidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection} 
        />
        <SidebarInset className="flex-1 flex flex-col">
          <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-2 sm:px-4 bg-background/80 dark:bg-background/20 backdrop-blur-sm">
            <SidebarTrigger className="-ml-1" />
            <div className="ml-auto flex items-center gap-2">
              <CrossOriginStatus />
              <h1 className="text-lg sm:text-xl font-semibold text-foreground">nuvic ai</h1>
            </div>
          </header>

          <div className="px-2 sm:px-4 py-2 border-b border-border/60">
            <WebContainerTest />
          </div>


          <div className="flex-1 overflow-auto">
            <MainContent />
          </div>
          <footer className="mt-8 text-center py-4 border-t border-border bg-background/80 dark:bg-background/20 backdrop-blur-sm">
            <p className="text-xs text-muted-foreground">
              created with{' '}
              <Link 
                to="/operator/npub1huggins123456789abcdef0123456789abcdef0123456789abcdef0123456789"
                className="text-primary hover:text-accent transition-colors underline"
              >
                hugs
              </Link>
            </p>
          </footer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Index;
