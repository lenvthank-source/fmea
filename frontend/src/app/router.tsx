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
import { EnglishAlias, PublicNotFound } from '../components/site/PublicLayout';

const PfdWorkspace = lazy(() => import('../features/pfd/PfdWorkspace'));
const PfmeaWorkspace = lazy(() => import('../features/pfmea/PfmeaWorkspace'));
const DfmeaWorkspace = lazy(() => import('../features/dfmea/DfmeaWorkspace'));
const ControlPlanWorkspace = lazy(() => import('../features/control-plan/ControlPlanWorkspace'));
const ActionsDashboard = lazy(() => import('../features/actions/ActionsDashboard'));
const AdminPanel = lazy(() => import('../features/admin/AdminPanel'));
const LinkageMap = lazy(() => import('../features/linkage/LinkageMap'));
const RepositoryPage = lazy(() => import('../features/repository/RepositoryPage'));

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isHydrating, guestLogin } = useAuth() as any;
  const [autoLoggingIn, setAutoLoggingIn] = React.useState(false);

  React.useEffect(() => {
    if (!isHydrating && !token) {
      const hasLoggedOut = sessionStorage.getItem('logged_out') === 'true';
      if (!hasLoggedOut) {
        setAutoLoggingIn(true);
        guestLogin()
          .catch(() => {})
          .finally(() => setAutoLoggingIn(false));
      }
    }
  }, [isHydrating, token, guestLogin]);

  if (isHydrating || autoLoggingIn) {
    return <InitializingWorkspace />;
  }

  // After hydration, token null means user has explicitly logged out
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
      <Route path="/admin" element={<Navigate to="/app/admin" replace />} />
      <Route path="/app/initializing" element={<InitializingWorkspace initializeGuest />} />

      {/* Experience Store */}
      <Route path="/product" element={<ProductPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/learn" element={<LearnHubPage />} />
      <Route path="/blog" element={<BlogListPage />} />
      <Route path="/blog/:slug" element={<BlogPostPage />} />
      {/* SEO Educational Pillar Hubs */}
      <Route path="/learn/:slug" element={<PillarPage />} />
      <Route path="/:lang/learn/:slug" element={<EnglishAlias />} />

      {/* Programmatic Industry Pages */}
      <Route path="/fmea/:industry" element={<IndustryFmeaPage />} />
      <Route path="/:lang/fmea/:industry" element={<EnglishAlias />} />

      {/* Programmatic Competitor Comparison Pages */}
      <Route path="/vs/:competitor" element={<CompetitorVsPage />} />
      <Route path="/:lang/vs/:competitor" element={<EnglishAlias />} />

      {/* Programmatic Glossary Pages */}
      <Route path="/glossary/:term" element={<GlossaryPage />} />
      <Route path="/:lang/glossary/:term" element={<EnglishAlias />} />
      
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
        {/* Direct workspace shortcuts */}
        <Route path="pfd/:projectId" element={<Navigate to="/app/projects/:projectId/pfd" replace />} />
        <Route path="pfmea/:projectId" element={<Navigate to="/app/projects/:projectId/pfmea" replace />} />
        <Route path="control-plan/:projectId" element={<Navigate to="/app/projects/:projectId/control-plan" replace />} />
        <Route path="linkage/:projectId" element={<Navigate to="/app/projects/:projectId/linkage" replace />} />
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

      <Route path="*" element={<PublicNotFound />} />
    </Routes>
  );
};
