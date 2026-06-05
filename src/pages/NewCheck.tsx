import React from 'react';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '../components/AppSidebar';
import SimpleCheckForm from '../components/forms/SimpleCheckForm';
import Footer from '../components/Footer';
import { useIsMobile } from '@/hooks/use-mobile';
const NewCheck: React.FC = () => {
  const isMobile = useIsMobile();
  return <div className="min-h-screen flex w-full bg-background dark:sunrise-gradient">
      <AppSidebar activeSection="" onSectionChange={() => {}} />
      <SidebarInset className="flex-1 flex flex-col relative">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-2 sm:px-4 bg-background/80 dark:bg-background/20 backdrop-blur-sm">
          <SidebarTrigger className="-ml-1" />
          <div className="ml-auto">
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">Vibium Network</h1>
          </div>
        </header>
        <div className={`flex-1 bg-cover bg-center bg-no-repeat px-4 ${isMobile ? "h-[calc(100vh-3rem)]" : "min-h-0"} dark:bg-none`} style={{
        backgroundImage: 'url(/hero-background.jpg)'
      }}>
          <div className="w-full max-w-lg mx-auto pt-[20vh] pb-20">
            <div className="text-center mb-4">
              <h1 className={`font-black font-sans text-white mb-2 ${isMobile ? "text-2xl" : "text-2xl sm:text-3xl"} drop-shadow-lg`}>What can I build for you?</h1>
              <p className="text-xs sm:text-sm text-white/80 drop-shadow">Describe an app to generate, or pick a repo to analyze & edit.</p>
            </div>
            <SimpleCheckForm />
          </div>
        </div>
        
      </SidebarInset>
    </div>;
};
export default NewCheck;