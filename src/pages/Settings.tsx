import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LoadingCard } from '@/components/ui/loading-state';
import notificationService, { NotificationPreferences } from '@/services/notificationService';
import authService from '@/services/authService';
import {
  User,
  Bell,
  Shield,
  Palette,
  Mail,
  Lock,
  Save,
  Camera,
  HeartPulse,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

const Settings = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Profile state
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  // Notification preferences
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    medication_reminders: true,
    medication_alerts: true,
    glucose_reminders: true,
    appointment_reminders: true,
    education_updates: true,
    system_notifications: true,
    email_notifications: true,
    email_reminders: true,
    weekly_reports: false,
    push_notifications: true,
  });

  // Theme settings
  const [theme, setTheme] = useState({
    darkMode: true,
    compactMode: false,
    highContrast: false,
  });

  const [prefsLoading, setPrefsLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    setPrefsLoading(true);
    try {
      const response = await notificationService.getPreferences();
      if (response.success && response.data) {
        setNotifications(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch notification preferences:', err);
    } finally {
      setPrefsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name,
        email: user.email,
      });
    }
  }, [user]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadge = () => {
    switch (user?.role) {
      case 'admin':
        return (
          <Badge className="bg-purple-500/20 text-purple-400">
            <Shield className="mr-1 h-3 w-3" />
            Administrator
          </Badge>
        );
      case 'infected':
        return (
          <Badge className="bg-primary/20 text-primary">
            <HeartPulse className="mr-1 h-3 w-3" />
            Patient
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-500/20 text-blue-400">
            <Users className="mr-1 h-3 w-3" />
            Prevention User
          </Badge>
        );
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const response = await authService.updateProfile(profile);
      if (response.success) {
        toast.success('Profile updated successfully');
        refreshUser?.();
      } else {
        toast.error(response.error?.message || 'Failed to update profile');
      }
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationService.updatePreferences(notifications);
      if (response.success) {
        toast.success('Notification preferences saved');
      } else {
        toast.error(response.error?.message || 'Failed to save preferences');
      }
    } catch {
      toast.error('Failed to save notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTheme = () => {
    // Theme settings would typically be stored locally or on the server
    toast.success('Theme settings saved');
  };

  const handleChangePassword = () => {
    toast.info('Password change feature coming soon');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Profile Information
          </CardTitle>
          <CardDescription>Update your personal details and account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20 border-2 border-border">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {user ? getInitials(user.name) : '?'}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="outline"
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div>
              <h3 className="text-lg font-semibold">{user?.name}</h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="mt-2">{getRoleBadge()}</div>
            </div>
          </div>

          <Separator />

          {/* Profile Form */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
          </div>

          <Button onClick={handleSaveProfile} className="gap-2" disabled={loading}>
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      {prefsLoading ? (
        <LoadingCard />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notification Preferences
            </CardTitle>
            <CardDescription>Choose how you want to receive updates and reminders</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Reminders</Label>
                  <p className="text-sm text-muted-foreground">Receive daily summary emails</p>
                </div>
                <Switch
                  checked={notifications.email_reminders}
                  onCheckedChange={(checked) =>
                    setNotifications((prev) => ({ ...prev, email_reminders: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Medication Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get reminded to take your medications</p>
                </div>
                <Switch
                  checked={notifications.medication_alerts}
                  onCheckedChange={(checked) =>
                    setNotifications((prev) => ({ ...prev, medication_alerts: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Education Updates</Label>
                  <p className="text-sm text-muted-foreground">New articles and learning materials</p>
                </div>
                <Switch
                  checked={notifications.education_updates}
                  onCheckedChange={(checked) =>
                    setNotifications((prev) => ({ ...prev, education_updates: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Reports</Label>
                  <p className="text-sm text-muted-foreground">Weekly health and activity summaries</p>
                </div>
                <Switch
                  checked={notifications.weekly_reports}
                  onCheckedChange={(checked) =>
                    setNotifications((prev) => ({ ...prev, weekly_reports: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Browser push notifications</p>
                </div>
                <Switch
                  checked={notifications.push_notifications}
                  onCheckedChange={(checked) =>
                    setNotifications((prev) => ({ ...prev, push_notifications: checked }))
                  }
                />
              </div>
            </div>

            <Button onClick={handleSaveNotifications} className="gap-2" disabled={loading}>
              <Save className="h-4 w-4" />
              Save Preferences
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Appearance
          </CardTitle>
          <CardDescription>Customize the look and feel of the application</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Dark Mode</Label>
                <p className="text-sm text-muted-foreground">Use dark theme across the app</p>
              </div>
              <Switch
                checked={theme.darkMode}
                onCheckedChange={(checked) =>
                  setTheme((prev) => ({ ...prev, darkMode: checked }))
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Compact Mode</Label>
                <p className="text-sm text-muted-foreground">Reduce spacing for more content</p>
              </div>
              <Switch
                checked={theme.compactMode}
                onCheckedChange={(checked) =>
                  setTheme((prev) => ({ ...prev, compactMode: checked }))
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>High Contrast</Label>
                <p className="text-sm text-muted-foreground">Increase color contrast for accessibility</p>
              </div>
              <Switch
                checked={theme.highContrast}
                onCheckedChange={(checked) =>
                  setTheme((prev) => ({ ...prev, highContrast: checked }))
                }
              />
            </div>
          </div>

          <Button onClick={handleSaveTheme} className="gap-2">
            <Save className="h-4 w-4" />
            Save Settings
          </Button>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Security
          </CardTitle>
          <CardDescription>Manage your password and account security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Lock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Change Password</p>
                <p className="text-sm text-muted-foreground">Update your account password</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleChangePassword}>
              Change
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Mail className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
              </div>
            </div>
            <Badge variant="outline">Coming Soon</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
