import { useAuth } from '@/contexts/AuthContext';
import PreventionDashboard from './dashboard/PreventionDashboard';
import PatientDashboard from './dashboard/PatientDashboard';
import AdminDashboard from './dashboard/AdminDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  // Render appropriate dashboard based on user role
  switch (user?.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'infected':
      return <PatientDashboard />;
    case 'non-infected':
    default:
      return <PreventionDashboard />;
  }
};

export default Dashboard;
