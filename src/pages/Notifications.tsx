import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingCard } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { useApiData } from '@/hooks/useApiData';
import { useApiAction } from '@/hooks/useApiAction';
import notificationService, { Notification, NotificationType } from '@/services/notificationService';
import {
  Bell,
  Pill,
  Droplet,
  Calendar,
  BookOpen,
  Activity,
  Utensils,
  Settings,
  Check,
  CheckCheck,
  Trash2,
  Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Notifications = () => {
  const { user } = useAuth();
  const { data: notifications, loading, error, refetch } = useApiData<Notification[]>(
    () => notificationService.getAll(), [], { refetchOnFocus: true, pollingInterval: 30000 }
  );
  const [filter, setFilter] = useState<NotificationType | 'all'>('all');

  const filteredNotifications = useMemo(() => {
    if (filter === 'all') return notifications || [];
    return (notifications || []).filter(n => n.type === filter);
  }, [notifications, filter]);

  const unreadCount = (notifications || []).filter(n => !n.read).length;

  const getNotificationIcon = (type: NotificationType) => {
    const icons: Record<NotificationType, React.ReactNode> = {
      medication: <Pill className="h-5 w-5 text-green-500" />,
      glucose: <Droplet className="h-5 w-5 text-blue-500" />,
      appointment: <Calendar className="h-5 w-5 text-purple-500" />,
      education: <BookOpen className="h-5 w-5 text-amber-500" />,
      activity: <Activity className="h-5 w-5 text-cyan-500" />,
      diet: <Utensils className="h-5 w-5 text-orange-500" />,
      system: <Bell className="h-5 w-5 text-gray-500" />,
    };
    return icons[type] || <Bell className="h-5 w-5 text-gray-500" />;
  };

  const getPriorityBadge = (priority?: Notification['priority']) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-destructive/20 text-destructive">High</Badge>;
      case 'medium':
        return <Badge className="bg-warning/20 text-warning">Medium</Badge>;
      default:
        return null;
    }
  };

  const formatNotificationTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const { execute: markAsRead } = useApiAction(
    (id: string) => notificationService.markAsRead(id),
    { onSuccess: refetch }
  );

  const { execute: doMarkAllAsRead } = useApiAction(
    () => notificationService.markAllAsRead(),
    { successMessage: 'All notifications marked as read', onSuccess: refetch }
  );

  const { execute: doDelete } = useApiAction(
    (id: string) => notificationService.delete(id),
    { successMessage: 'Notification deleted', onSuccess: refetch }
  );

  const NotificationItem = ({ notification }: { notification: Notification }) => (
    <div 
      className={`flex gap-4 rounded-lg border p-4 transition-colors ${
        notification.read 
          ? 'border-border/50 bg-background' 
          : 'border-primary/30 bg-primary/5'
      }`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
        {getNotificationIcon(notification.type)}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{notification.title}</h4>
              {getPriorityBadge(notification.priority)}
              {!notification.read && (
                <span className="h-2 w-2 rounded-full bg-primary" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">{notification.message}</p>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatNotificationTime(notification.created_at)}
          </span>
        </div>
        <div className="flex items-center gap-2 pt-2">
          {notification.action_url && (
            <Button asChild size="sm" variant="outline">
              <Link to={notification.action_url}>View</Link>
            </Button>
          )}
          {!notification.read && (
            <Button 
              size="sm" 
              variant="ghost"
            onClick={() => markAsRead(notification.id)}
            >
              <Check className="mr-1 h-3 w-3" /> Mark as read
            </Button>
          )}
          <Button 
            size="sm" 
            variant="ghost"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => doDelete(notification.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-7 w-7 text-primary" />
            Notifications
          </h1>
          <p className="text-muted-foreground">Stay updated with your health reminders</p>
        </div>
        <ErrorState message={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-7 w-7 text-primary" />
            Notifications
            {unreadCount > 0 && (
              <Badge className="ml-2">{unreadCount} new</Badge>
            )}
          </h1>
          <p className="text-muted-foreground">Stay updated with your health reminders</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => doMarkAllAsRead()} disabled={unreadCount === 0}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
          <Button variant="outline" asChild>
            <Link to="/settings">
              <Settings className="mr-2 h-4 w-4" />
              Preferences
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      {loading ? (
        <div className="space-y-3">
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
        </div>
      ) : (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="all" onClick={() => setFilter('all')}>
              <Filter className="mr-1 h-4 w-4" /> All
            </TabsTrigger>
            {user?.role !== 'non-infected' && (
              <>
                <TabsTrigger value="medication" onClick={() => setFilter('medication')}>
                  <Pill className="mr-1 h-4 w-4" /> Medication
                </TabsTrigger>
                <TabsTrigger value="glucose" onClick={() => setFilter('glucose')}>
                  <Droplet className="mr-1 h-4 w-4" /> Glucose
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="education" onClick={() => setFilter('education')}>
              <BookOpen className="mr-1 h-4 w-4" /> Education
            </TabsTrigger>
            <TabsTrigger value="activity" onClick={() => setFilter('activity')}>
              <Activity className="mr-1 h-4 w-4" /> Activity
            </TabsTrigger>
            <TabsTrigger value="diet" onClick={() => setFilter('diet')}>
              <Utensils className="mr-1 h-4 w-4" /> Diet
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map(notification => (
                <NotificationItem key={notification.id} notification={notification} />
              ))
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Bell className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No notifications</h3>
                  <p className="text-muted-foreground">You're all caught up!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {['medication', 'glucose', 'education', 'activity', 'diet'].map(type => (
            <TabsContent key={type} value={type} className="space-y-3">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map(notification => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Bell className="h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-medium">No {type} notifications</h3>
                    <p className="text-muted-foreground">Nothing here yet</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
};

export default Notifications;
