import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { AppShell } from '../components/Layout/AppShell';
import { ProjectList } from '../features/projects/ProjectList';
import { ProjectSettings } from '../features/projects/ProjectSettings';
import { PfdWorkspace } from '../features/pfd/PfdWorkspace';
import { PfmeaWorkspace } from '../features/pfmea/PfmeaWorkspace';
import { DfmeaWorkspace } from '../features/dfmea/DfmeaWorkspace';
import { ControlPlanWorkspace } from '../features/control-plan/ControlPlanWorkspace';
import { ActionsDashboard } from '../features/actions/ActionsDashboard';
import { LinkageMap } from '../features/linkage/LinkageMap';
import { Login } from '../features/auth/Login';
import { AdminPanel } from '../features/admin/AdminPanel';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useAuth();

  // If authentication is still loading (e.g. silent auto-login), we render the children (AppShell)
  // so the user sees the sidebar/navbar and the skeleton dashboard immediately.
  if (!loading && !token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/projects" replace />} />
        <Route path="projects" element={<ProjectList />} />
        <Route path="projects/:projectId/pfd" element={<PfdWorkspace />} />
        <Route path="projects/:projectId/pfmea" element={<PfmeaWorkspace />} />
        <Route path="projects/:projectId/dfmea" element={<DfmeaWorkspace />} />
        <Route path="projects/:projectId/control-plan" element={<ControlPlanWorkspace />} />
        <Route path="projects/:projectId/linkage" element={<LinkageMap />} />
        <Route path="projects/:projectId/settings" element={<ProjectSettings />} />
        <Route path="actions" element={<ActionsDashboard />} />
        <Route path="admin" element={<AdminPanel />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
