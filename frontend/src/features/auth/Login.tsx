import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, Link, Container, Divider } from '@mui/material';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config';

export const Login: React.FC = () => {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);

  // Check username availability when typing or on blur
  const checkUsernameAvailability = async (nameVal: string) => {
    if (!nameVal.trim()) {
      setIsUsernameAvailable(null);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/auth/check-username?username=${encodeURIComponent(nameVal.trim())}`);
      if (response.ok) {
        const data = await response.json();
        setIsUsernameAvailable(data.available);
      }
    } catch (err) {
      console.error("Error checking username uniqueness:", err);
    }
  };

  useEffect(() => {
    if (isSignup) {
      const delayDebounceFn = setTimeout(() => {
        checkUsernameAvailability(username);
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setIsUsernameAvailable(null);
    }
  }, [username, isSignup]);

  const handleGoogleLoginResponse = async (response: any) => {
    setError(null);
    setLoading(true);
    try {
      const idToken = response.credential;
      await googleLogin(idToken);
      navigate('/projects');
    } catch (err: any) {
      setError(err.message || 'Google Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // Dynamically load Google Identity Services script for Admin logins
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-google-client-id.apps.googleusercontent.com';
      try {
        (window as any).google?.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleLoginResponse,
        });

        (window as any).google?.accounts.id.renderButton(
          document.getElementById('google-signin-btn'),
          { theme: 'outline', size: 'large', width: '100%' }
        );
      } catch (err) {
        console.error("Google Auth initialization failed:", err);
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (isSignup && isUsernameAvailable === false) {
      setError('Please choose an available username.');
      return;
    }

    setLoading(true);

    try {
      const subdomain = 'guest-tenant';
      // Logs in or registers regular users passwordless using their unique username
      await login(username.trim(), '', subdomain, username.trim());
      navigate('/projects');
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0F172A 0%, #0D9488 100%)',
        py: 4,
        px: 2
      }}
    >
      <Container maxWidth="xs" sx={{ p: 0 }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 800, color: 'white', letterSpacing: '-0.5px', mb: 1 }}>
            APEX FMEA
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 500 }}>
            AI-Assisted Quality Risk Workspace
          </Typography>
        </Box>

        <Card 
          sx={{ 
            width: '100%', 
            borderRadius: 4, 
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)', 
            border: '1px solid rgba(255, 255, 255, 0.1)', 
            background: 'rgba(255, 255, 255, 0.95)', 
            backdropFilter: 'blur(16px)' 
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 700, color: 'text.primary', textAlign: 'center' }}>
              {isSignup ? 'Register Workspace' : 'Sign In'}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                fullWidth
                label="Your Username"
                variant="outlined"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                required
                helperText={
                  isSignup && isUsernameAvailable !== null
                    ? isUsernameAvailable
                      ? '🟢 Username is available'
                      : '🔴 Username is already taken'
                    : 'Enter letters, numbers, hyphens, or underscores'
                }
                error={isSignup && isUsernameAvailable === false}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || (isSignup && isUsernameAvailable === false)}
                sx={{ 
                  mt: 1, 
                  height: 44, 
                  borderRadius: 2.5, 
                  fontWeight: 600,
                  fontSize: '1rem',
                  boxShadow: '0 4px 12px rgba(1, 105, 111, 0.25)',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(1, 105, 111, 0.35)',
                  }
                }}
              >
                {loading ? 'Processing...' : isSignup ? 'Create Account & Sign In' : 'Sign In'}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 0.5 }}>
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={() => {
                    setIsSignup(!isSignup);
                    setError(null);
                    setIsUsernameAvailable(null);
                  }}
                  sx={{ 
                    color: 'primary.main', 
                    textDecoration: 'none', 
                    fontWeight: 600,
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  {isSignup ? 'Already have an account? Sign In' : 'Need an account? Register here'}
                </Link>
              </Box>

              <Divider sx={{ my: 1.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  ADMIN PORTAL
                </Typography>
              </Divider>

              {/* Google Sign-in button for Neon Auth (Admins Only) */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <Box id="google-signin-btn" sx={{ width: '100%', minHeight: 40 }} />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};
