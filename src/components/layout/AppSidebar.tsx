import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Heart,
  LayoutDashboard,
  BookOpen,
  Utensils,
  Activity,
  Pill,
  Bell,
  Users,
  FileText,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const AppSidebar = () => {
  const { user, logout, canAccessMedication, canAccessAdmin } = useAuth();
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => location.pathname === path;

  const mainNavItems = [
    { title: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { title: 'Education', path: '/education', icon: BookOpen },
    { title: 'Diet & Nutrition', path: '/diet', icon: Utensils },
    { title: 'Activity', path: '/activity', icon: Activity },
    { title: 'Notifications', path: '/notifications', icon: Bell },
  ];

  const medicationItem = { title: 'Medication', path: '/medication', icon: Pill };

  const adminNavItems = [
    { title: 'Users', path: '/admin/users', icon: Users },
    { title: 'Content', path: '/admin/content', icon: FileText },
    { title: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  ];

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const getRoleBadgeColor = () => {
    switch (user?.role) {
      case 'admin': return 'bg-purple-500/15 text-purple-400 ring-1 ring-purple-500/20';
      case 'infected': return 'bg-primary/15 text-primary ring-1 ring-primary/20';
      default: return 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20';
    }
  };

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'admin': return 'Administrator';
      case 'infected': return 'Patient';
      default: return 'Prevention';
    }
  };

  const NavItem = ({ item }: { item: { title: string; path: string; icon: React.ElementType } }) => {
    const active = isActive(item.path);
    const link = (
      <Link
        to={item.path}
        className={cn(
          'group/item flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
          active
            ? 'bg-primary/10 text-primary shadow-sm shadow-primary/5'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
        )}
      >
        <item.icon className={cn(
          'h-[18px] w-[18px] shrink-0 transition-colors duration-200',
          active ? 'text-primary' : 'text-muted-foreground group-hover/item:text-sidebar-foreground'
        )} />
        {!collapsed && <span className="truncate">{item.title}</span>}
        {active && !collapsed && (
          <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarMenuButton asChild>{link}</SidebarMenuButton>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            {item.title}
          </TooltipContent>
        </Tooltip>
      );
    }

    return <SidebarMenuButton asChild>{link}</SidebarMenuButton>;
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/50">
      {/* Header */}
      <SidebarHeader className="border-b border-sidebar-border/50 p-4">
        <Link to="/dashboard" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <Heart className="h-5 w-5 text-primary" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="truncate text-sm font-bold text-sidebar-foreground">DiabetesCare</h1>
              <p className="truncate text-[11px] text-muted-foreground">Health Platform</p>
            </div>
          )}
        </Link>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Main Menu
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <NavItem item={item} />
                </SidebarMenuItem>
              ))}
              {canAccessMedication && (
                <SidebarMenuItem>
                  <NavItem item={medicationItem} />
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin */}
        {canAccessAdmin && (
          <SidebarGroup className="mt-4">
            {!collapsed && (
              <SidebarGroupLabel className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Administration
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">
                {adminNavItems.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <NavItem item={item} />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Settings */}
        <SidebarGroup className="mt-auto pt-4">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <NavItem item={{ title: 'Settings', path: '/settings', icon: Settings }} />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border/50 p-3">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <Avatar className="h-9 w-9 shrink-0 ring-1 ring-border">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {user ? getInitials(user.name) : '?'}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  {user?.name}
                </p>
                <span className={cn('mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold', getRoleBadgeColor())}>
                  {getRoleLabel()}
                </span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={logout}
                    className="h-8 w-8 shrink-0 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">Sign out</TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
