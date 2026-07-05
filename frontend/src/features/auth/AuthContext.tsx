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
  googleLogin: (idToken: string) => Promise<void>;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      const claims = parseJwt(savedToken);
      if (claims && claims.exp * 1000 > Date.now()) {
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
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
      }
    }

    const performAutoLogin = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'guest@example.com', password: 'guestpassword', subdomain: 'guest-tenant' }),
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
            name: data.user.name,
            tenantId: claims.tenant_id || claims.tenantId,
            roles: claims.roles || [],
            permissions: claims.permissions || [],
          });
        } else {
          const signupResponse = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'guest@example.com',
              password: 'guestpassword',
              name: 'Guest User',
              subdomain: 'guest-tenant',
              tenantName: 'Guest Workspace',
            }),
          });
          if (signupResponse.ok) {
            const data = await signupResponse.json();
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
          }
        }
      } catch (err) {
        console.error('Silent auto guest login failed:', err);
      } finally {
        setLoading(false);
      }
    };

    performAutoLogin();
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

  const googleLogin = async (idToken: string) => {
    const response = await fetch(`${API_URL}/auth/google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: idToken }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Google login failed');
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
    <AuthContext.Provider value={{ token, user, loading, login, signup, logout, hasPermission, googleLogin }}>
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
