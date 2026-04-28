import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireMedicationAccess?: boolean;
  requireAdminAccess?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireMedicationAccess = false,
  requireAdminAccess = false,
}) => {
  const { user, isAuthenticated, isLoading, canAccessMedication, canAccessAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check medication access (blocks non-infected users)
  if (requireMedicationAccess && !canAccessMedication) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check admin access
  if (requireAdminAccess && !canAccessAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
