import React from 'react';
import { Plus, Shield, CreditCard, Share2, FileCode, Clock, Settings, Globe, Users, Smartphone, Bot, CheckCircle, BarChart3, FolderOpen, ListTodo, Info, LogOut, ChevronDown } from "lucide-react";
import { useNavigate, useLocation } from 'react-router-dom';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarHeader, SidebarFooter, useSidebar } from '@/components/ui/sidebar';
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
  type MenuItem = {
    id: string;
    label: string;
    icon: any;
    isRoute: boolean;
    hasSubmenu?: boolean;
    submenu?: { id: string; label: string; icon: any }[];
  };
  const menuItems: MenuItem[] = [
    {
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
    id: 'security',
    label: 'Website Security',
    icon: Shield,
    isRoute: true
  }, {
    id: 'pricing',
    label: 'Pricing',
    icon: CreditCard,
    isRoute: true
  }, {
    id: 'connectors',
    label: 'Connectors',
    icon: Share2,
    isRoute: true
  }, {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    isRoute: true
  }, {
    id: 'history',
    label: 'History',
    icon: Clock,
    isRoute: true
  }, {
    id: 'projects',
    label: 'Projects',
    icon: FolderOpen,
    isRoute: true
  }, {
    id: 'tasks',
    label: 'Tasks',
    icon: ListTodo,
    isRoute: true
  }, {
    id: 'team',
    label: 'Team',
    icon: Users,
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
      } else if (item.id === 'analytics') {
        navigate('/analytics');
      } else if (item.id === 'history') {
        navigate('/history');
      } else if (item.id === 'projects') {
        navigate('/projects');
      } else if (item.id === 'tasks') {
        navigate('/tasks');
      } else if (item.id === 'team') {
        navigate('/team');
      } else if (item.id === 'code-analysis') {
        navigate('/code-analysis');
      } else if (item.id === 'security') {
        navigate('/security');
      } else if (item.id === 'pricing') {
        navigate('/pricing');
      } else if (item.id === 'connectors') {
        navigate('/connectors');
      } else if (item.id === 'about') {
        navigate('/about');
      } else if (item.id === 'settings') {
        navigate('/settings');
      }
    } else {
      // For non-route items, navigate to network page with section
      navigate(`/network?section=${item.id}`, {
        replace: location.pathname === '/network'
      });
      onSectionChange(item.id);
    }

    // Close mobile sidebar after navigation
    if (isMobile) {
      setOpenMobile(false);
    }
  };
  const handleSubMenuClick = (subItemId: string, subItem: any) => {
    // Navigate to the network page with the section parameter for other items
    navigate(`/network?section=${subItemId}`, {
      replace: location.pathname === '/network'
    });
    onSectionChange(subItemId);
    if (isMobile) {
      setOpenMobile(false);
    }
  };
  const isItemActive = (item: any) => {
    if (item.isRoute) {
      if (item.id === 'new-check') {
        return location.pathname === '/';
      } else if (item.id === 'analytics') {
        return location.pathname === '/analytics';
      } else if (item.id === 'history') {
        return location.pathname === '/history';
      } else if (item.id === 'projects') {
        return location.pathname === '/projects';
      } else if (item.id === 'tasks') {
        return location.pathname === '/tasks';
      } else if (item.id === 'team') {
        return location.pathname === '/team';
      } else if (item.id === 'code-analysis') {
        return location.pathname === '/code-analysis';
      } else if (item.id === 'security') {
        return location.pathname === '/security';
      } else if (item.id === 'pricing') {
        return location.pathname === '/pricing';
      } else if (item.id === 'connectors') {
        return location.pathname === '/connectors';
      } else if (item.id === 'about') {
        return location.pathname === '/about';
      } else if (item.id === 'settings') {
        return location.pathname === '/settings';
      }
    }
    return activeSection === item.id;
  };
  const isSubItemActive = (subItemId: string, subItem: any) => {
    return location.pathname === '/network' && activeSection === subItemId;
  };

  // Helper function to render collapsed submenu items as individual menu items
  const renderCollapsedSubmenuItems = (submenu: any[]) => {
    return submenu.map(subItem => {
      const SubIcon = subItem.icon;
      const isSubActive = isSubItemActive(subItem.id, subItem);
      return <SidebarMenuItem key={subItem.id}>
          <SidebarMenuButton onClick={() => handleSubMenuClick(subItem.id, subItem)} isActive={isSubActive} tooltip={subItem.label} className="h-9 text-sm">
            <SubIcon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{subItem.label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>;
    });
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
              const isActive = isItemActive(item) || item.hasSubmenu && item.submenu?.some(sub => isSubItemActive(sub.id, sub));
              const shouldShowSubmenu = item.hasSubmenu && !isCollapsed;
              return <React.Fragment key={item.id}>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => handleMenuClick(item)} isActive={isActive && !item.hasSubmenu} tooltip={isCollapsed ? item.label : undefined} className="h-9 text-sm">
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </SidebarMenuButton>
                      
                      {shouldShowSubmenu && <SidebarMenuSub>
                          {item.submenu?.map(subItem => {
                      const SubIcon = subItem.icon;
                      const isSubActive = isSubItemActive(subItem.id, subItem);
                      return <SidebarMenuSubItem key={subItem.id}>
                                <SidebarMenuSubButton onClick={() => handleSubMenuClick(subItem.id, subItem)} isActive={isSubActive} className="h-8 text-sm">
                                  <SubIcon className="w-4 h-4 flex-shrink-0" />
                                  <span className="truncate">{subItem.label}</span>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>;
                    })}
                        </SidebarMenuSub>}
                    </SidebarMenuItem>
                    
                    {/* Render submenu items as individual menu items when collapsed */}
                    {isCollapsed && item.hasSubmenu && item.submenu && renderCollapsedSubmenuItems(item.submenu)}
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