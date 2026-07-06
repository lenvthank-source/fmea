import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
}

interface AuthContextType {
  token: string | null;
  user: UserSession | null;
  loading: boolean;
  login: (email: string, password: string, subdomain: string, name?: string) => Promise<void>;
  signup: (email: string, password: string, name: string, subdomain: string, tenantName: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

import { API_BASE_URL } from '../../config';

const API_URL = API_BASE_URL;

function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

const originalFetch = window.fetch;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshAccessToken = async (): Promise<boolean> => {
    const savedRefreshToken = localStorage.getItem('refresh_token');
    if (!savedRefreshToken) {
      logout();
      return false;
    }
    try {
      const response = await originalFetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: savedRefreshToken }),
      });
      if (response.ok) {
        const data = await response.json();
        const accessToken = data.access_token;
        const claims = parseJwt(accessToken);
        localStorage.setItem('token', accessToken);
        localStorage.setItem('refresh_token', data.refresh_token);
        setToken(accessToken);
        setUser({
          id: claims.sub,
          email: claims.email,
          name: data.user?.name || claims.name || claims.email,
          tenantId: claims.tenant_id || claims.tenantId,
          roles: claims.roles || [],
          permissions: claims.permissions || [],
        });
        return true;
      } else {
        logout();
        return false;
      }
    } catch (err) {
      console.error('Token refresh failed:', err);
      logout();
      return false;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token');
      const savedRefreshToken = localStorage.getItem('refresh_token');

      if (savedToken) {
        const claims = parseJwt(savedToken);
        if (claims && claims.exp * 1000 > Date.now() + 30000) {
          setToken(savedToken);
          setUser({
            id: claims.sub,
            email: claims.email,
            name: claims.name || claims.email,
            tenantId: claims.tenant_id || claims.tenantId,
            roles: claims.roles || [],
            permissions: claims.permissions || [],
          });
          setLoading(false);
          return;
        }
      }

      if (savedRefreshToken) {
        const success = await refreshAccessToken();
        if (success) {
          setLoading(false);
          return;
        }
      }

      logout();
      setLoading(false);
    };

    initAuth();
  }, []);

  // Background token refresh check
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(async () => {
      const claims = parseJwt(token);
      if (claims && claims.exp * 1000 - Date.now() < 180000) {
        console.log('Access token expiring soon, refreshing...');
        await refreshAccessToken();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [token]);

  // Setup fetch interceptor for 401 responses
  useEffect(() => {
    window.fetch = async (...args) => {
      let [resource, config] = args;
      let response = await originalFetch(resource, config);
      
      if (response.status === 401) {
        const urlString = typeof resource === 'string' ? resource : (resource as Request).url;
        if (urlString.includes('/auth/refresh') || urlString.includes('/auth/login')) {
          return response;
        }
        
        console.warn('Request returned 401. Attempting token refresh...');
        const success = await refreshAccessToken();
        if (success) {
          const newToken = localStorage.getItem('token');
          if (newToken && config) {
            config.headers = {
              ...config.headers,
              'Authorization': `Bearer ${newToken}`
            };
          }
          response = await originalFetch(resource, config);
        } else {
          logout();
          window.location.href = '/login';
        }
      }
      
      return response;
    };
    
    return () => {
      window.fetch = originalFetch;
    };
  }, [token]);

  // Keep-alive background ping to keep backend and database awake while the app is open
  useEffect(() => {
    // Ping immediately on mount to wake up the server/db
    fetch(`${API_URL}/health`).catch((err) => console.warn('Initial keep-awake ping failed:', err));

    // Ping every 3 minutes (180,000 ms)
    const interval = setInterval(() => {
      fetch(`${API_URL}/health`).catch((err) => console.warn('Background keep-awake ping failed:', err));
    }, 180000);

    return () => clearInterval(interval);
  }, []);

  const login = async (email: string, password: string, subdomain: string, name?: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, subdomain, name }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Login failed');
    }

    const data = await response.json();
    const accessToken = data.access_token;
    const claims = parseJwt(accessToken);

    localStorage.setItem('token', accessToken);
    localStorage.setItem('refresh_token', data.refresh_token);
    
    setToken(accessToken);
    setUser({
      id: claims.sub,
      email: claims.email,
      name: data.user.name,
      tenantId: claims.tenant_id || claims.tenantId,
      roles: claims.roles || [],
      permissions: claims.permissions || [],
    });
  };

  const signup = async (email: string, password: string, name: string, subdomain: string, tenantName: string) => {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, subdomain, tenantName }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Signup failed');
    }

    const data = await response.json();
    const accessToken = data.access_token;
    const claims = parseJwt(accessToken);

    localStorage.setItem('token', accessToken);
    localStorage.setItem('refresh_token', data.refresh_token);

    setToken(accessToken);
    setUser({
      id: claims.sub,
      email: claims.email,
      name: data.user.name,
      tenantId: claims.tenant_id || claims.tenantId,
      roles: claims.roles || [],
      permissions: claims.permissions || [],
    });
  };



  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    setToken(null);
    setUser(null);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    // Admins have access to everything
    if (user.roles.includes('Admin')) return true;
    return user.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, signup, logout, hasPermission } as any}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
