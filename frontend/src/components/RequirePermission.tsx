import React, { useEffect, useState } from 'react';
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
  redirectTo = '/',
}) => {
  const { hasPermission, user } = useAuth();
  const location = useLocation();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (user && hasPermission(permission)) {
      setAuthorized(true);
    } else {
      setAuthorized(false);
    }
  }, [user, hasPermission, permission]);

  if (!authorized) {
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