import React, { useState } from 'react';
import {
  Plus,
  Shield,
  CreditCard,
  Share2,
  FileCode,
  Clock,
  Settings,
  Users,
  BarChart3,
  FolderOpen,
  ListTodo,
  Info,
  LogOut,
  Search,
  ChevronRight,
  Zap,
  Globe,
  Activity,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface AppSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

type MenuItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  isRoute: boolean;
  badge?: string | number;
  badgeVariant?: 'default' | 'success' | 'warning';
};

type MenuGroup = {
  label: string;
  items: MenuItem[];
};

const menuGroups: MenuGroup[] = [
  {
    label: 'Build',
    items: [
      { id: 'new-check', label: 'Generate', icon: Plus, isRoute: true },
      { id: 'code-analysis', label: 'Code AI', icon: FileCode, isRoute: true },
      { id: 'projects', label: 'Projects', icon: FolderOpen, isRoute: true },
      { id: 'tasks', label: 'Tasks', icon: ListTodo, isRoute: true },
      
    ],
  },
  {
    label: 'Ship',
    items: [
      { id: 'connectors', label: 'Connectors', icon: Share2, isRoute: true },
    ],
  },
  {
    label: 'Monitor',
    items: [
      { id: 'analytics', label: 'Analytics', icon: BarChart3, isRoute: true },
      { id: 'security', label: 'Security', icon: Shield, isRoute: true },
      { id: 'history', label: 'History', icon: Clock, isRoute: true },
    ],
  },
  {
    label: 'Account',
    items: [
      { id: 'team', label: 'Team', icon: Users, isRoute: true },
      { id: 'pricing', label: 'Pricing', icon: CreditCard, isRoute: true },
      { id: 'settings', label: 'Settings', icon: Settings, isRoute: true },
      { id: 'about', label: 'About', icon: Info, isRoute: true },
    ],
  },
];

const routeMap: Record<string, string> = {
  'new-check': '/',
  'code-analysis': '/code-analysis',
  analytics: '/analytics',
  history: '/history',
  projects: '/projects',
  tasks: '/tasks',
  
  team: '/team',
  security: '/security',
  pricing: '/pricing',
  connectors: '/connectors',
  about: '/about',
  settings: '/settings',
};

const AppSidebar: React.FC<AppSidebarProps> = ({ activeSection, onSectionChange }) => {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const isCollapsed = state === 'collapsed';
  const [searchQuery, setSearchQuery] = useState('');

  const handleMenuClick = (item: MenuItem) => {
    const route = routeMap[item.id];
    if (route) {
      navigate(route);
    } else {
      navigate(`/network?section=${item.id}`, {
        replace: location.pathname === '/network',
      });
      onSectionChange(item.id);
    }
    if (isMobile) setOpenMobile(false);
  };

  const isItemActive = (item: MenuItem): boolean => {
    const route = routeMap[item.id];
    if (route) {
      return location.pathname === route;
    }
    return activeSection === item.id;
  };

  const allItems = menuGroups.flatMap((g) => g.items);
  const filteredGroups = searchQuery.trim()
    ? [
        {
          label: 'Results',
          items: allItems.filter((item) =>
            item.label.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        },
      ]
    : menuGroups;

  const userInitials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'VN';

  return (
    <Sidebar collapsible="icon" className="border-r h-screen">
      {/* ── Header ── */}
      <SidebarHeader className="border-b border-sidebar-border/60 px-3 py-3">
        <div className="flex items-center gap-2">
          {/* Logo mark */}
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
            <Zap className="w-4 h-4 text-white" />
          </div>

          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-tight text-sidebar-foreground truncate">
                Vibium Network
              </p>
              <p className="text-[10px] text-sidebar-foreground/50 leading-tight truncate">
                Edit code &amp; Test Network
              </p>
            </div>
          )}

          {!isCollapsed && (
            <ThemeToggle className="ml-auto flex-shrink-0 h-7 w-7" />
          )}
        </div>

        {/* Search — only shown when expanded */}
        {!isCollapsed && (
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sidebar-foreground/40 pointer-events-none" />
            <input
              type="text"
              placeholder="Search…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                'w-full h-8 pl-8 pr-3 rounded-lg text-xs',
                'bg-sidebar-accent/40 border border-sidebar-border/50',
                'text-sidebar-foreground placeholder:text-sidebar-foreground/35',
                'focus:outline-none focus:ring-1 focus:ring-sidebar-ring/60 focus:border-sidebar-ring/60',
                'transition-all duration-150'
              )}
            />
          </div>
        )}
      </SidebarHeader>

      {/* ── Content ── */}
      <SidebarContent className="flex-1 px-2 py-2">
        {filteredGroups.map((group) => (
          <SidebarGroup key={group.label} className="p-0 mb-1">
            <SidebarGroupLabel
              className={cn(
                'px-2 mb-0.5 text-[10px] font-semibold uppercase tracking-widest',
                'text-sidebar-foreground/40',
                'group-data-[collapsible=icon]:hidden'
              )}
            >
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = isItemActive(item);
                  return (
                    <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                        onClick={() => handleMenuClick(item)}
                        isActive={isActive}
                        tooltip={isCollapsed ? item.label : undefined}
                        className={cn(
                          'h-9 rounded-lg text-sm font-medium gap-2.5 transition-all duration-150 border',
                          isActive
                            ? 'bg-gradient-to-r from-primary/20 to-primary/10 text-primary border-primary/25 shadow-sm'
                            : 'text-sidebar-foreground/70 border-sidebar-border/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 hover:border-sidebar-border'
                        )}
                      >
                        <div
                          className={cn(
                            'flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-md transition-all duration-150',
                            isActive
                              ? 'text-primary'
                              : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground'
                          )}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="truncate">{item.label}</span>
                        {item.badge !== undefined && !isCollapsed && (
                          <span
                            className={cn(
                              'ml-auto flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold flex items-center justify-center',
                              item.badgeVariant === 'success'
                                ? 'bg-emerald-500/20 text-emerald-500'
                                : item.badgeVariant === 'warning'
                                ? 'bg-amber-500/20 text-amber-500'
                                : 'bg-primary/20 text-primary'
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                        {isActive && !isCollapsed && (
                          <ChevronRight className="ml-auto w-3 h-3 text-primary/60 flex-shrink-0" />
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* No search results */}
        {searchQuery.trim() && filteredGroups[0]?.items.length === 0 && (
          <p className="text-xs text-sidebar-foreground/40 text-center py-6 px-4">
            No results for "{searchQuery}"
          </p>
        )}
      </SidebarContent>

      {/* ── Footer ── */}
      <SidebarFooter className="border-t border-sidebar-border/60 p-2">
        {!isCollapsed ? (
          <div className="rounded-xl bg-sidebar-accent/40 border border-sidebar-border/40 p-3 flex items-center gap-3">
            {/* Avatar */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-[11px] font-bold text-white shadow">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              {user ? (
                <>
                  <p className="text-xs font-semibold text-sidebar-foreground truncate leading-tight">
                    {user.email}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Activity className="w-2.5 h-2.5 text-emerald-500" />
                    <span className="text-[10px] text-emerald-500 font-medium">Active</span>
                  </div>
                </>
              ) : (
                <p className="text-xs text-sidebar-foreground/50 leading-tight">Not signed in</p>
              )}
            </div>
            {user ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="flex-shrink-0 h-7 w-7 rounded-lg hover:bg-destructive/10 hover:text-destructive text-sidebar-foreground/40"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate('/auth')}
                className="flex-shrink-0 h-7 text-xs px-3 rounded-lg"
              >
                Sign In
              </Button>
            )}
          </div>
        ) : (
          /* Collapsed footer — show avatar only */
          <div className="flex flex-col items-center gap-2 py-1">
            <div
              className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-[11px] font-bold text-white shadow cursor-pointer"
              title={user?.email ?? 'Not signed in'}
            >
              {userInitials}
            </div>
            <ThemeToggle className="h-7 w-7" />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
