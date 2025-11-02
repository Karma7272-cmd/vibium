import React from 'react';
import { Monitor, Plus, Settings, Globe, Smartphone, CheckCircle, Users, Bot, Info, FileCode } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarHeader, SidebarFooter, useSidebar } from '@/components/ui/sidebar';
import { ThemeToggle } from './ThemeToggle';
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
  const isCollapsed = state === 'collapsed';
  const menuItems = [{
    id: 'new-check',
    label: 'New Check',
    icon: Plus,
    isRoute: true
  }, {
    id: 'network',
    label: 'Network Overview',
    icon: Globe,
    isRoute: true,
    hasSubmenu: true,
    submenu: [{
      id: 'operators',
      label: 'Operators',
      icon: Users,
      isRoute: true
    }, {
      id: 'nodes',
      label: 'Nodes',
      icon: Smartphone,
      isRoute: true
    }, {
      id: 'agents',
      label: 'Agents',
      icon: Bot,
      isRoute: true
    }, {
      id: 'checks',
      label: 'Checks',
      icon: CheckCircle,
      isRoute: true
    }]
  }, {
    id: 'run-node',
    label: 'Run a Node',
    icon: Monitor,
    isRoute: true
  }, {
    id: 'code-analysis',
    label: 'Code AI',
    icon: FileCode,
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
      } else if (item.id === 'network') {
        navigate('/network');
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
    if (subItem.isRoute) {
      // Direct route navigation for operators, nodes, agents, and checks
      if (subItemId === 'operators') {
        navigate('/operators');
      } else if (subItemId === 'nodes') {
        navigate('/nodes');
      } else if (subItemId === 'agents') {
        navigate('/agents');
      } else if (subItemId === 'checks') {
        navigate('/checks');
      }
    } else {
      // Navigate to the network page with the section parameter for other items
      navigate(`/network?section=${subItemId}`, {
        replace: location.pathname === '/network'
      });
      onSectionChange(subItemId);
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
      } else if (item.id === 'network') {
        return location.pathname === '/network';
      } else if (item.id === 'settings') {
        return location.pathname === '/settings';
      }
    }
    return activeSection === item.id;
  };
  const isSubItemActive = (subItemId: string, subItem: any) => {
    if (subItem?.isRoute) {
      // Check direct routes for operators, nodes, agents, and checks
      if (subItemId === 'operators') {
        return location.pathname === '/operators';
      } else if (subItemId === 'nodes') {
        return location.pathname === '/nodes';
      } else if (subItemId === 'agents') {
        return location.pathname === '/agents';
      } else if (subItemId === 'checks') {
        return location.pathname === '/checks';
      }
    }
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
        {!isCollapsed && <div className="p-2 sm:p-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Network Status</span>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">847 nodes online</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">23 jobs running</p>
            </div>
          </div>}
      </SidebarFooter>
    </Sidebar>;
};
export default AppSidebar;