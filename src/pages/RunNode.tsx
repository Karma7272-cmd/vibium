
import React from 'react';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '../components/AppSidebar';
import RunNodeHeader from '@/components/run-node/RunNodeHeader';
import RunNodeOptions from '@/components/run-node/RunNodeOptions';
import RunNodeSteps from '@/components/run-node/RunNodeSteps';
import RunNodeBenefits from '@/components/run-node/RunNodeBenefits';
import RunNodeSupport from '@/components/run-node/RunNodeSupport';
import Footer from '@/components/Footer';

const RunNode: React.FC = () => {
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
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">Run a Node</h1>
          </div>
        </header>
        <div className="flex-1 bg-gray-50 dark:bg-transparent p-8 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <RunNodeHeader />
            <RunNodeOptions />
            <RunNodeSteps />
            <RunNodeBenefits />
            <RunNodeSupport />
          </div>
        </div>
        <Footer />
      </SidebarInset>
    </div>
  );
};

export default RunNode;
