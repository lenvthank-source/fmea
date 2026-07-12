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
import { LandingPage } from '../features/landing/LandingPage';

import { Box, CircularProgress } from '@mui/material';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#f8fafc' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/projects" replace />} />
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
