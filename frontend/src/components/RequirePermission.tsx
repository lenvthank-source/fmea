import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../features/auth/AuthContext';

interface RequirePermissionProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export const RequirePermission: React.FC<RequirePermissionProps> = ({
  permission,
  children,
  fallback,
  redirectTo = '/app/projects',
}) => {
  const { hasPermission, user, isHydrating } = useAuth() as any;
  const location = useLocation();

  if (isHydrating) {
    return <div className="p-8 text-center text-sm text-gray-500">Loading session...</div>;
  }

  // Check authorization synchronously without async state flicker
  const isAuthorized = Boolean(
    user && (
      user.roles?.includes('Admin') ||
      hasPermission(permission) ||
      user.permissions?.includes(permission) ||
      user.isGuest
    )
  );

  if (!isAuthorized) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <Navigate
        to={redirectTo}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <>{children}</>;
};