import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
  isGuest: boolean;
}

interface AuthContextType {
  token: string | null;
  user: UserSession | null;
  isHydrating: boolean;
  login: (email: string, password: string, subdomain: string, name?: string) => Promise<void>;
  guestLogin: () => Promise<void>;
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
  const [isHydrating, setIsHydrating] = useState(true);

  const refreshAccessToken = async (): Promise<boolean> => {
    const savedRefreshToken = localStorage.getItem('refresh_token');
    if (!savedRefreshToken) {
      logout();
      return false;
    }

    const refreshPromise = (async () => {
      try {
        const response = await originalFetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: savedRefreshToken }),
        });
        if (response.ok) {
          const data = await response.json();
          const accessToken = data.access_token;
          localStorage.setItem('token', accessToken);
          localStorage.setItem('refresh_token', data.refresh_token);
          setToken(accessToken);
          
          // Fetch fresh user data with permissions from server
          const meResponse = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });
          if (meResponse.ok) {
            const meData = await meResponse.json();
            setUser(meData);
          } else {
            // Fallback to JWT claims if /me fails
            const claims = parseJwt(accessToken);
            setUser({
              id: claims.sub,
              email: claims.email,
              name: claims.name || claims.email,
              tenantId: claims.tenant_id || claims.tenantId,
              roles: claims.roles || [],
              permissions: claims.permissions || [],
              isGuest: false,
            });
          }
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
    })();

    return refreshPromise;
  };

  // Fetch fresh user data with permissions from server
  const fetchMe = async (tkn: string): Promise<UserSession | null> => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${tkn}` },
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.error('Failed to fetch /me:', err);
    }
    return null;
  };

  // Hydrate session from localStorage on mount — survives reload until 72h inactivity or cookies cleared
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedRefresh = localStorage.getItem('refresh_token');
    if (!savedToken && !savedRefresh) {
      setIsHydrating(false);
      return;
    }
    // If we have a token, try to restore it immediately (no flicker)
    if (savedToken) {
      const claims = parseJwt(savedToken);
      const isExpired = claims ? claims.exp * 1000 < Date.now() - 5000 : true;
      if (!isExpired) {
        setToken(savedToken);
        fetchMe(savedToken)
          .then((me) => {
            if (me) {
              setUser(me);
            } else if (claims) {
              setUser({
                id: claims.sub,
                email: claims.email,
                name: claims.name || claims.email,
                tenantId: claims.tenant_id || claims.tenantId,
                roles: claims.roles || [],
                permissions: claims.permissions || [],
                isGuest: !!claims.isGuest,
              });
            }
            setIsHydrating(false);
          })
          .catch(() => {
            // Fallback to refresh if /me failed
            if (savedRefresh) {
              refreshAccessToken().finally(() => setIsHydrating(false));
            } else setIsHydrating(false);
          });
        return;
      }
    }
    // Token expired/missing but refresh exists -> try silent refresh
    if (savedRefresh) {
      refreshAccessToken().finally(() => setIsHydrating(false));
    } else {
      // No valid token & no refresh -> clear stale storage
      if (savedToken) {
        try {
          const c = parseJwt(savedToken);
          if (!c || c.exp * 1000 < Date.now()) {
            localStorage.removeItem('token');
            localStorage.removeItem('refresh_token');
          }
        } catch { /* ignore */ }
      }
      setIsHydrating(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          window.location.href = '/';
        }
      }
      
      return response;
    };
    
    return () => {
      window.fetch = originalFetch;
    };
  }, [token]);

  // Keep-alive ping — only when authenticated and tab visible, to avoid cold-start contention on login
  useEffect(() => {
    if (!token) return;
    if (document.hidden) return;
    const interval = setInterval(() => {
      if (document.hidden) return;
      fetch(`${API_URL}/health`).catch((err) => console.warn('Background keep-awake ping failed:', err));
    }, 300000); // 5 min, less aggressive
    return () => clearInterval(interval);
  }, [token]);

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

    localStorage.setItem('token', accessToken);
    localStorage.setItem('refresh_token', data.refresh_token);
    
    setToken(accessToken);
    
    // Use session from login response if available (avoids extra /auth/me round-trip)
    if (data.session) {
      setUser(data.session);
    } else {
      const meData = await fetchMe(accessToken);
      if (meData) {
        setUser(meData);
      } else {
        const claims = parseJwt(accessToken);
        setUser({
          id: claims.sub,
          email: claims.email,
          name: data.user?.name || claims.name || claims.email,
          tenantId: claims.tenant_id || claims.tenantId,
          roles: claims.roles || [],
          permissions: claims.permissions || [],
          isGuest: false,
        });
      }
    }
  };

  const guestLogin = async () => {
    const response = await fetch(`${API_URL}/auth/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Guest login failed');
    }

    const data = await response.json();
    const accessToken = data.access_token;

    localStorage.setItem('token', accessToken);
    localStorage.setItem('refresh_token', data.refresh_token);
    
    setToken(accessToken);
    
    if (data.session) {
      setUser({ ...data.session, isGuest: true });
    } else {
      const meData = await fetchMe(accessToken);
      if (meData) {
        setUser({ ...meData, isGuest: true });
      } else {
        const claims = parseJwt(accessToken);
        setUser({
          id: claims.sub,
          email: claims.email,
          name: data.user?.name || claims.name || claims.email,
          tenantId: claims.tenant_id || claims.tenantId,
          roles: claims.roles || [],
          permissions: claims.permissions || [],
          isGuest: true,
        });
      }
    }
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
    <AuthContext.Provider value={{ token, user, isHydrating, login, guestLogin, logout, hasPermission }}>
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
