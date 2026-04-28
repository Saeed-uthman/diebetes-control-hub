import { FileText, Users, Search, Bell, Activity, Utensils, BookOpen, Pill } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: 'content' | 'users' | 'search' | 'notifications' | 'activity' | 'diet' | 'education' | 'medication';
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

const iconMap = {
  content: FileText,
  users: Users,
  search: Search,
  notifications: Bell,
  activity: Activity,
  diet: Utensils,
  education: BookOpen,
  medication: Pill,
};

export const EmptyState = ({
  icon = 'content',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) => {
  const Icon = iconMap[icon];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
};

export default EmptyState;
