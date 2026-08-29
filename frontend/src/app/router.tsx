import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { AppShell } from '../components/Layout/AppShell';
import { ProjectList } from '../features/projects/ProjectList';
import { ProjectSettings } from '../features/projects/ProjectSettings';
import { LandingPage } from '../features/landing/LandingPage';
import { InitializingWorkspace } from '../features/auth/InitializingWorkspace';
import { PillarPage } from '../features/content/PillarPage';
import { IndustryFmeaPage } from '../features/programmatic/IndustryFmeaPage';
import { CompetitorVsPage } from '../features/programmatic/CompetitorVsPage';
import { GlossaryPage } from '../features/programmatic/GlossaryPage';
import { RequirePermission } from '../components/RequirePermission';
import { Login } from '../features/auth/Login';
import { ProductPage } from '../features/product/ProductPage';
import { AboutPage } from '../features/company/AboutPage';
import { PricingPage } from '../features/pricing/PricingPage';
import { LearnHubPage } from '../features/learn/LearnHubPage';
import { BlogListPage } from '../features/blog/BlogListPage';
import { BlogPostPage } from '../features/blog/BlogPostPage';

const PfdWorkspace = lazy(() => import('../features/pfd/PfdWorkspace'));
const PfmeaWorkspace = lazy(() => import('../features/pfmea/PfmeaWorkspace'));
const DfmeaWorkspace = lazy(() => import('../features/dfmea/DfmeaWorkspace'));
const ControlPlanWorkspace = lazy(() => import('../features/control-plan/ControlPlanWorkspace'));
const ActionsDashboard = lazy(() => import('../features/actions/ActionsDashboard'));
const AdminPanel = lazy(() => import('../features/admin/AdminPanel'));
const LinkageMap = lazy(() => import('../features/linkage/LinkageMap'));
const RepositoryPage = lazy(() => import('../features/repository/RepositoryPage'));

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isHydrating } = useAuth() as any;

  if (isHydrating) {
    return <InitializingWorkspace />;
  }

  // After hydration, token null means no session (72h expired or cleared)
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

      {/* Experience Store */}
      <Route path="/product" element={<ProductPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/learn" element={<LearnHubPage />} />
      <Route path="/blog" element={<BlogListPage />} />
      <Route path="/blog/:slug" element={<BlogPostPage />} />
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
        <Route path="projects/:projectId/pfd" element={<Suspense fallback={<div>Loading...</div>}><PfdWorkspace /></Suspense>} />
        <Route path="projects/:projectId/pfmea" element={<Suspense fallback={<div>Loading...</div>}><PfmeaWorkspace /></Suspense>} />
        <Route path="projects/:projectId/dfmea" element={<Suspense fallback={<div>Loading...</div>}><DfmeaWorkspace /></Suspense>} />
        <Route path="projects/:projectId/control-plan" element={<Suspense fallback={<div>Loading...</div>}><ControlPlanWorkspace /></Suspense>} />
        <Route path="projects/:projectId/linkage" element={<Suspense fallback={<div>Loading...</div>}><LinkageMap /></Suspense>} />
        <Route path="projects/:projectId/settings" element={<ProjectSettings />} />
        <Route path="actions" element={<Suspense fallback={<div>Loading...</div>}><ActionsDashboard /></Suspense>} />
        <Route path="repository" element={<Suspense fallback={<div>Loading...</div>}><RepositoryPage /></Suspense>} />
        <Route path="admin" element={
        <RequirePermission permission="admin.config">
          <Suspense fallback={<div>Loading...</div>}>
            <AdminPanel />
          </Suspense>
        </RequirePermission>
      } />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
