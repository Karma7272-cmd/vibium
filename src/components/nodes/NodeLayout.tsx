
import React from 'react';
import { Link } from 'react-router-dom';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import AppSidebar from '@/components/AppSidebar';
import Footer from '@/components/Footer';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

interface NodeLayoutProps {
  children: React.ReactNode;
  breadcrumbItems?: BreadcrumbItem[];
  showNetworkBreadcrumb?: boolean;
  nodesIsActive?: boolean;
}

const NodeLayout: React.FC<NodeLayoutProps> = ({ 
  children, 
  breadcrumbItems = [],
  showNetworkBreadcrumb = true,
  nodesIsActive = false
}) => {
  const baseBreadcrumbs: BreadcrumbItem[] = [];
  
  if (showNetworkBreadcrumb) {
    baseBreadcrumbs.push({ label: 'Network', href: '/network' });
  }
  
  baseBreadcrumbs.push({ 
    label: 'Nodes', 
    href: nodesIsActive ? undefined : '/nodes',
    isActive: nodesIsActive
  });

  const allBreadcrumbs = [...baseBreadcrumbs, ...breadcrumbItems];

  return (
    <div className="min-h-screen flex w-full bg-background sunrise-gradient">
      <AppSidebar 
        activeSection="nodes" 
        onSectionChange={() => {}} 
      />
      <SidebarInset className="flex-1 flex flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b dark:border-border px-2 sm:px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="ml-auto">
            <Breadcrumb>
              <BreadcrumbList>
                {allBreadcrumbs.map((item, index) => (
                  <React.Fragment key={item.label}>
                    <BreadcrumbItem>
                      {item.href && !item.isActive ? (
                        <BreadcrumbLink asChild>
                          <Link to={item.href} className="text-primary hover:text-primary/80">
                            {item.label}
                          </Link>
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{item.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                    {index < allBreadcrumbs.length - 1 && <BreadcrumbSeparator />}
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex-1 overflow-auto">
          <div className="p-2 sm:p-4 lg:p-6 bg-gray-50 dark:bg-background sunrise-gradient min-h-full">
            {children}
          </div>
        </div>
        <Footer />
      </SidebarInset>
    </div>
  );
};

export default NodeLayout;
