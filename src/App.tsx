import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { CommandPalette } from "@/components/CommandPalette";
import Index from "@/pages/Index";

// Pages
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import VerifyEmail from "@/pages/VerifyEmail";
import Dashboard from "@/pages/Dashboard";
import Education from "@/pages/Education";
import Diet from "@/pages/Diet";
import ActivityPage from "@/pages/Activity";
import Medication from "@/pages/Medication";
import Notifications from "@/pages/Notifications";
import Settings from "@/pages/Settings";
import Unauthorized from "@/pages/Unauthorized";
import NotFound from "@/pages/NotFound";

// Admin Pages
import UserManagement from "@/pages/admin/UserManagement";
import ContentManagement from "@/pages/admin/ContentManagement";
import Analytics from "@/pages/admin/Analytics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CommandPalette />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected Routes with App Layout */}

            {/* Protected Routes with App Layout */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/education" element={<Education />} />
              <Route path="/diet" element={<Diet />} />
              <Route path="/activity" element={<ActivityPage />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<Settings />} />

              {/* Medication - ONLY accessible to infected patients and admins */}
              <Route
                path="/medication"
                element={
                  <ProtectedRoute requireMedicationAccess>
                    <Medication />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes - ONLY accessible to admins */}
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute requireAdminAccess>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/content"
                element={
                  <ProtectedRoute requireAdminAccess>
                    <ContentManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <ProtectedRoute requireAdminAccess>
                    <Analytics />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* 404 Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;