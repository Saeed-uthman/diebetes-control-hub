import { useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Users,
  Eye,
  TrendingUp,
  Clock,
  Activity,
  Heart,
  Shield,
  FileText,
  Pill,
  Droplet,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthenticatedData } from '@/hooks/useApiData';
import { analyticsService } from '@/services/analyticsService';
import { userService } from '@/services/userService';
import { LoadingSpinner } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';

const ROLE_COLORS = [
  'hsl(280, 70%, 60%)',
  'hsl(var(--primary))',
  'hsl(210, 100%, 60%)',
];

const Analytics = () => {
  const { isAuthenticated } = useAuth();

  const fetchSummary = useCallback(() => analyticsService.getSummary(), []);
  const fetchUserTrends = useCallback(() => analyticsService.getUserTrends({ period: 'month' }), []);
  const fetchContentEngagement = useCallback(() => analyticsService.getContentEngagement(), []);
  const fetchActivity = useCallback(() => analyticsService.getPlatformActivity({ period: 'week' }), []);
  const fetchUserStats = useCallback(() => userService.getStats(), []);
  const fetchMedMetrics = useCallback(() => analyticsService.getMedicationMetrics(), []);
  const fetchGlucoseMetrics = useCallback(() => analyticsService.getGlucoseMetrics(), []);

  const { data: summary, loading: loadingSummary, error: errorSummary, refetch: refetchSummary } = useAuthenticatedData(fetchSummary, isAuthenticated);
  const { data: userTrends, loading: loadingTrends } = useAuthenticatedData(fetchUserTrends, isAuthenticated);
  const { data: contentEngagement, loading: loadingContent } = useAuthenticatedData(fetchContentEngagement, isAuthenticated);
  const { data: platformActivity, loading: loadingActivity } = useAuthenticatedData(fetchActivity, isAuthenticated);
  const { data: userStats } = useAuthenticatedData(fetchUserStats, isAuthenticated);
  const { data: medMetrics } = useAuthenticatedData(fetchMedMetrics, isAuthenticated);
  const { data: glucoseMetrics } = useAuthenticatedData(fetchGlucoseMetrics, isAuthenticated);

  if (loadingSummary && !summary) return <LoadingSpinner message="Loading analytics..." />;
  if (errorSummary) return <ErrorState message={errorSummary} onRetry={refetchSummary} />;

  const roleDistribution = userStats
    ? [
        { name: 'Admins', value: userStats.admin, color: ROLE_COLORS[0] },
        { name: 'Patients', value: userStats.infected, color: ROLE_COLORS[1] },
        { name: 'Prevention', value: userStats.non_infected, color: ROLE_COLORS[2] },
      ]
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Platform performance and user insights</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-purple-500/10 px-4 py-2">
          <Shield className="h-5 w-5 text-purple-400" />
          <span className="font-medium text-purple-400">Admin Only</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(summary?.total_users ?? 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-primary">+{summary?.new_users_this_month ?? 0}</span> this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(summary?.active_users ?? 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Content Pieces</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.total_content ?? 0}</div>
            <p className="text-xs text-muted-foreground">Articles, videos, guides</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.content_engagement_rate ?? 0}%</div>
            <p className="text-xs text-muted-foreground">Active participation</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Growth Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              User Growth Trends
            </CardTitle>
            <CardDescription>User registration over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {loadingTrends ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">Loading chart...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={userTrends ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="total_users" name="Total Users" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                    <Line type="monotone" dataKey="new_users" name="New Users" stroke="hsl(280, 70%, 60%)" strokeWidth={2} dot={{ fill: 'hsl(280, 70%, 60%)' }} />
                    <Line type="monotone" dataKey="active_users" name="Active Users" stroke="hsl(210, 100%, 60%)" strokeWidth={2} dot={{ fill: 'hsl(210, 100%, 60%)' }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              User Distribution
            </CardTitle>
            <CardDescription>Users by role type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={roleDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {roleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {roleDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-muted-foreground">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Content Engagement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Content Engagement
            </CardTitle>
            <CardDescription>Views and completions by content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {loadingContent ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">Loading...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(contentEngagement ?? []).slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis type="category" dataKey="title" stroke="hsl(var(--muted-foreground))" fontSize={12} width={120} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Legend />
                    <Bar dataKey="views" name="Views" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="completions" name="Completions" fill="hsl(210, 100%, 60%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Platform Activity
            </CardTitle>
            <CardDescription>Daily logins and user actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {loadingActivity ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">Loading...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={platformActivity ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Legend />
                    <Bar dataKey="logins" name="Logins" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="content_views" name="Content Views" fill="hsl(280, 70%, 60%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health Metrics */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Medication Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-primary" />
              Medication Metrics
            </CardTitle>
            <CardDescription>Platform-wide medication stats</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Adherence Rate</span>
                  <Badge className="bg-primary/20 text-primary">{medMetrics?.adherence_rate ?? 0}%</Badge>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary transition-all" style={{ width: `${medMetrics?.adherence_rate ?? 0}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{medMetrics?.doses_taken ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Doses Taken</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-destructive">{medMetrics?.doses_missed ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Doses Missed</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Glucose Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplet className="h-5 w-5 text-primary" />
              Glucose Metrics
            </CardTitle>
            <CardDescription>Platform-wide glucose stats</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">In Range</span>
                  <Badge className="bg-primary/20 text-primary">{glucoseMetrics?.in_range_percentage ?? 0}%</Badge>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary transition-all" style={{ width: `${glucoseMetrics?.in_range_percentage ?? 0}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{glucoseMetrics?.average_level ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Avg Level (mg/dL)</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{glucoseMetrics?.total_readings ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Total Readings</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
