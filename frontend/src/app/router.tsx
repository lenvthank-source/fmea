import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { Login } from '../features/auth/Login';
import { AppShell } from '../components/Layout/AppShell';
import { ProjectList } from '../features/projects/ProjectList';
import { PfdWorkspace } from '../features/pfd/PfdWorkspace';
import { PfmeaWorkspace } from '../features/pfmea/PfmeaWorkspace';
import { ControlPlanWorkspace } from '../features/control-plan/ControlPlanWorkspace';
import { ActionsDashboard } from '../features/actions/ActionsDashboard';
import { Box, CircularProgress, Typography } from '@mui/material';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
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
        <Route path="projects/:projectId/control-plan" element={<ControlPlanWorkspace />} />
        <Route path="actions" element={<ActionsDashboard />} />
        <Route
          path="admin"
          element={
            <Box>
              <Typography variant="h5" sx={{ mb: 2 }}>Admin Panel</Typography>
              <Typography color="text.secondary">System settings are deferred to Sprint 3.</Typography>
            </Box>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
