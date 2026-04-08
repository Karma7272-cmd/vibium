import React from 'react';
import { Monitor, Plus, Settings, Info, FileCode, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar } from '@/components/ui/sidebar';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from './ui/button';
interface AppSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}
const AppSidebar: React.FC<AppSidebarProps> = ({
  activeSection,
  onSectionChange
}) => {
  const {
    state,
    isMobile,
    setOpenMobile
  } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const isCollapsed = state === 'collapsed';
  const menuItems = [{
    id: 'new-check',
    label: 'New Check',
    icon: Plus,
    isRoute: true
  }, {
    id: 'code-analysis',
    label: 'Code AI',
    icon: FileCode,
    isRoute: true
  }, {
    id: 'run-node',
    label: 'Run a Node',
    icon: Monitor,
    isRoute: true
  }, {
    id: 'about',
    label: 'About',
    icon: Info,
    isRoute: true
  }, {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    isRoute: true
  }];
  const handleMenuClick = (item: any) => {
    if (item.isRoute) {
      if (item.id === 'new-check') {
        navigate('/');
      } else if (item.id === 'run-node') {
        navigate('/run-node');
      } else if (item.id === 'code-analysis') {
        navigate('/code-analysis');
      } else if (item.id === 'about') {
        navigate('/about');
      } else if (item.id === 'settings') {
        navigate('/settings');
      }
    }

    // Close mobile sidebar after navigation
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const isItemActive = (item: any) => {
    if (item.isRoute) {
      if (item.id === 'new-check') {
        return location.pathname === '/';
      } else if (item.id === 'run-node') {
        return location.pathname === '/run-node';
      } else if (item.id === 'code-analysis') {
        return location.pathname === '/code-analysis';
      } else if (item.id === 'about') {
        return location.pathname === '/about';
      } else if (item.id === 'settings') {
        return location.pathname === '/settings';
      }
    }
    return false;
  };



  return <Sidebar collapsible="icon" className="border-r h-screen">
      <SidebarHeader className="border-b">
        <div className="flex items-center justify-between p-2">
          {!isCollapsed ? <div className="flex-1">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">Vibium Network</h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Edit code & Testing Network</p>
            </div> : null}
          <ThemeToggle className="ml-auto" />
        </div>
      </SidebarHeader>
      
      <SidebarContent className="flex-1">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = isItemActive(item);

              return <React.Fragment key={item.id}>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => handleMenuClick(item)} isActive={isActive} tooltip={isCollapsed ? item.label : undefined} className="h-9 text-sm">
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </SidebarMenuButton>
                      

                    </SidebarMenuItem>
                    
                    {/* Render submenu items as individual menu items when collapsed */}

                  </React.Fragment>;
            })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t mt-auto">
        {!isCollapsed && <div className="p-2 sm:p-4 space-y-3">
            {user ? (
              <>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Logged in as</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                  <Button variant="ghost" size="sm" onClick={signOut} className="w-full mt-2">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4">
                <Button variant="default" size="sm" onClick={() => navigate('/auth')} className="w-full">
                  Sign In
                </Button>
              </div>
            )}
          </div>}
      </SidebarFooter>
    </Sidebar>;
};
export default AppSidebar;