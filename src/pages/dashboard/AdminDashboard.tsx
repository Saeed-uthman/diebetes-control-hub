import { useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users, FileText, BarChart3, Plus, ChevronRight, UserCheck, UserX, Clock, Shield, HeartPulse, TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthenticatedData } from '@/hooks/useApiData';
import { useApiAction } from '@/hooks/useApiAction';
import { analyticsService } from '@/services/analyticsService';
import { userService } from '@/services/userService';
import { educationService } from '@/services/educationService';
import { LoadingSpinner } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const fetchSummary = useCallback(() => analyticsService.getSummary(), []);
  const fetchUserStats = useCallback(() => userService.getStats(), []);
  const fetchPending = useCallback(() => userService.getPending(), []);
  const fetchContent = useCallback(() => educationService.getAll({ status: 'published' }), []);

  const { data: summary, loading, error, refetch } = useAuthenticatedData(fetchSummary, isAuthenticated);
  const { data: userStats } = useAuthenticatedData(fetchUserStats, isAuthenticated);
  const { data: pendingUsers } = useAuthenticatedData(fetchPending, isAuthenticated);
  const { data: contentList } = useAuthenticatedData(fetchContent, isAuthenticated);

  const { execute: verifyUser } = useApiAction(
    (id: string) => userService.verify(id),
    { successMessage: 'User verified', onSuccess: refetch }
  );
  const { execute: deleteUser } = useApiAction(
    (id: string) => userService.delete(id),
    { successMessage: 'User rejected', onSuccess: refetch }
  );

  if (loading && !summary) return <LoadingSpinner message="Loading dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const recentContent = (contentList ?? []).slice(0, 3);

  const statCards = [
    { title: 'Total Users', value: (summary?.total_users ?? userStats?.total ?? 0).toLocaleString(), sub: <><span className="text-primary">+{summary?.user_growth_percentage ?? 0}%</span> from last month</>, icon: Users },
    { title: 'Active Users', value: summary?.active_users ?? 0, sub: 'Currently active', icon: TrendingUp },
    { title: 'Pending Verification', value: userStats?.pending ?? pendingUsers?.length ?? 0, sub: 'Requires attention', icon: Clock, valueClass: 'text-warning' },
    { title: 'Content Pieces', value: summary?.total_content ?? 0, sub: 'Articles, videos, guides', icon: FileText },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">System overview and management</p>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" className="gap-2 text-xs" onClick={() => navigate('/admin/content')}>
            <Plus className="h-3.5 w-3.5" />Create Content
          </Button>
          <div className="flex items-center gap-2 rounded-full bg-purple-500/10 px-3 py-1.5 ring-1 ring-purple-500/20">
            <Shield className="h-4 w-4 text-purple-400" />
            <span className="text-xs font-semibold text-purple-400">Administrator</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title} className="border-border/40">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground/60" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.valueClass ?? ''}`}>{card.value}</div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* User Distribution */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="h-4 w-4 text-primary" />User Distribution</CardTitle>
            <CardDescription className="text-xs">Users by role type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'Administrators', count: userStats?.admin ?? 0, icon: <Shield className="h-4 w-4 text-purple-400" />, bg: 'bg-purple-500/10', bar: 'bg-purple-500' },
                { label: 'Infected Patients', count: userStats?.infected ?? 0, icon: <HeartPulse className="h-4 w-4 text-primary" />, bg: 'bg-primary/10', bar: 'bg-primary' },
                { label: 'Non-Infected Users', count: userStats?.non_infected ?? 0, icon: <Users className="h-4 w-4 text-blue-400" />, bg: 'bg-blue-500/10', bar: 'bg-blue-500' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.bg}`}>{item.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs font-medium">{item.label}</p>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full ${item.bar} transition-all duration-500`} style={{ width: `${((item.count / (userStats?.total || 1)) * 100)}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-semibold tabular-nums">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Content */}
        <Card className="border-border/40 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4 text-primary" />Recent Content</CardTitle>
              <CardDescription className="text-xs">Latest educational materials</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate('/admin/content')}>View All <ChevronRight className="ml-1 h-3.5 w-3.5" /></Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {recentContent.map((content) => (
                <div key={content.id} className="flex items-center justify-between rounded-lg border border-border/30 bg-muted/20 p-3.5 transition-colors hover:bg-muted/40">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{content.title}</p>
                    <p className="text-xs capitalize text-muted-foreground">{content.category}</p>
                  </div>
                  <Badge className="shrink-0 border-0 bg-primary/15 text-primary">{content.status}</Badge>
                </div>
              ))}
              {recentContent.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No content yet</p>}
            </div>
          </CardContent>
        </Card>

        {/* Pending Verifications */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Clock className="h-4 w-4 text-warning" />Pending Verification</CardTitle>
            <CardDescription className="text-xs">Users awaiting approval</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {(pendingUsers ?? []).slice(0, 5).map((user) => (
                <div key={user.id} className="space-y-2.5 rounded-lg border border-border/30 bg-muted/20 p-3">
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-[10px] text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="h-7 flex-1 text-xs" onClick={() => verifyUser(user.id)}><UserCheck className="mr-1 h-3 w-3" /> Approve</Button>
                    <Button size="sm" variant="outline" className="h-7 flex-1 text-xs" onClick={() => deleteUser(user.id)}><UserX className="mr-1 h-3 w-3" /> Reject</Button>
                  </div>
                </div>
              ))}
              {(!pendingUsers || pendingUsers.length === 0) && <p className="py-6 text-center text-sm text-muted-foreground">No pending users</p>}
            </div>
          </CardContent>
        </Card>

        {/* Platform Health */}
        <Card className="border-border/40 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Platform Health</CardTitle>
            <CardDescription className="text-xs">Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { value: `${summary?.medication_adherence_rate ?? 0}%`, label: 'Med Adherence' },
                { value: `${summary?.content_engagement_rate ?? 0}%`, label: 'Engagement' },
                { value: summary?.average_glucose_level ?? 0, label: 'Avg Glucose' },
                { value: summary?.new_users_this_month ?? 0, label: 'New This Month' },
              ].map((kpi) => (
                <div key={kpi.label} className="rounded-lg bg-muted/30 p-3.5 text-center">
                  <p className="text-xl font-bold text-primary">{kpi.value}</p>
                  <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">{kpi.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
