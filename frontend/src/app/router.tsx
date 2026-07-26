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
import { InitializingWorkspace } from '../features/auth/InitializingWorkspace';
import { PillarPage } from '../features/content/PillarPage';
import { IndustryFmeaPage } from '../features/programmatic/IndustryFmeaPage';
import { CompetitorVsPage } from '../features/programmatic/CompetitorVsPage';
import { GlossaryPage } from '../features/programmatic/GlossaryPage';

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
      {/* Root Landing Page & Auth */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<Login />} />
      <Route path="/app/initializing" element={<InitializingWorkspace />} />

      {/* SEO Educational Pillar Hubs */}
      <Route path="/learn/:slug" element={<PillarPage />} />
      <Route path="/:lang/learn/:slug" element={<PillarPage />} />

      {/* Programmatic Industry Pages */}
      <Route path="/fmea/:industry" element={<IndustryFmeaPage />} />
      <Route path="/:lang/fmea/:industry" element={<IndustryFmeaPage />} />

      {/* Programmatic Competitor Comparison Pages */}
      <Route path="/vs/:competitor" element={<CompetitorVsPage />} />
      <Route path="/:lang/vs/:competitor" element={<CompetitorVsPage />} />

      {/* Programmatic Glossary Pages */}
      <Route path="/glossary/:term" element={<GlossaryPage />} />
      <Route path="/:lang/glossary/:term" element={<GlossaryPage />} />
      
      {/* Protected App Workspace Routes */}
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
