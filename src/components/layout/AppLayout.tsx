import { Outlet, useLocation, Link } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from './AppSidebar';
import { Bell, Search, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { Separator } from '@/components/ui/separator';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/education': 'Education',
  '/diet': 'Diet & Nutrition',
  '/activity': 'Activity',
  '/medication': 'Medication',
  '/notifications': 'Notifications',
  '/settings': 'Settings',
  '/admin/users': 'User Management',
  '/admin/content': 'Content Management',
  '/admin/analytics': 'Analytics',
};

const AppLayout = () => {
  const { user } = useAuth();
  const location = useLocation();

  const currentTitle = pageTitles[location.pathname] || 'Dashboard';
  const isSubPage = location.pathname.startsWith('/admin');

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          {/* Top Header */}
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-xl lg:px-6">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-8 w-8 text-muted-foreground hover:text-foreground" />
              <Separator orientation="vertical" className="hidden h-5 lg:block" />

              {/* Breadcrumb */}
              <nav className="hidden items-center gap-1.5 text-sm lg:flex">
                {isSubPage && (
                  <>
                    <Link to="/dashboard" className="text-muted-foreground transition-colors hover:text-foreground">
                      Admin
                    </Link>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                  </>
                )}
                <span className="font-medium text-foreground">{currentTitle}</span>
              </nav>

              {/* Mobile title */}
              <span className="text-sm font-medium text-foreground lg:hidden">{currentTitle}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <Search className="h-4 w-4" />
              </Button>

              <Link to="/notifications">
                <Button variant="ghost" size="icon" className="relative h-8 w-8 text-muted-foreground hover:text-foreground">
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground ring-2 ring-background">
                    3
                  </span>
                </Button>
              </Link>

              <Separator orientation="vertical" className="mx-1 hidden h-5 sm:block" />

              <div className="hidden items-center gap-2.5 sm:flex">
                <Avatar className="h-7 w-7 ring-1 ring-border">
                  <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                    {user ? getInitials(user.name) : '?'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground">
                  {user?.name?.split(' ')[0]}
                </span>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-4 lg:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
