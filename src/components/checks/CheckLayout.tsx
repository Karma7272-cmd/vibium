
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

interface CheckLayoutProps {
  children: React.ReactNode;
  breadcrumbItems?: BreadcrumbItem[];
  showNetworkBreadcrumb?: boolean;
  checksIsActive?: boolean;
}

const CheckLayout: React.FC<CheckLayoutProps> = ({ 
  children, 
  breadcrumbItems = [],
  showNetworkBreadcrumb = true,
  checksIsActive = false
}) => {
  const baseBreadcrumbs: BreadcrumbItem[] = [];
  
  if (showNetworkBreadcrumb) {
    baseBreadcrumbs.push({ label: 'Network', href: '/network' });
  }
  
  baseBreadcrumbs.push({ 
    label: 'Checks', 
    href: checksIsActive ? undefined : '/checks',
    isActive: checksIsActive
  });

  const allBreadcrumbs = [...baseBreadcrumbs, ...breadcrumbItems];

  return (
    <div className="min-h-screen flex w-full bg-background dark:sunrise-gradient">
      <AppSidebar 
        activeSection="checks" 
        onSectionChange={() => {}} 
      />
      <SidebarInset className="flex-1 flex flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-2 sm:px-4 bg-background/80 dark:bg-background/20 backdrop-blur-sm">
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
          <div className="container mx-auto p-6 bg-gray-50 dark:bg-transparent min-h-full">
            {children}
          </div>
        </div>
        <Footer />
      </SidebarInset>
    </div>
  );
};

export default CheckLayout;
