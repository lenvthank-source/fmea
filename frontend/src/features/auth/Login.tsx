import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Alert, Container, Divider, CircularProgress } from '@mui/material';
import { Check as CheckIcon } from '@mui/icons-material';
import { useAuth } from './AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

const features = [
  'AIAG-VDA 7-Step Compliance',
  'AI-Assisted Risk Analysis',
  'Real-time PFD ↔ PFMEA Sync',
  '21 CFR Part 11 Audit Ready',
];

export const Login: React.FC = () => {
  const { login, guestLogin, token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [signInLoading, setSignInLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  // If already authenticated, redirect
  useEffect(() => {
    if (token) {
      navigate('/app/projects', { replace: true });
    }
  }, [token, navigate]);

  // Auto-trigger guest login if ?guest=true
  useEffect(() => {
    if (searchParams.get('guest') === 'true' && !token) {
      handleGuestLogin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSignInLoading(true);
    try {
      await login(email, password, 'guest-tenant');
      navigate('/app/projects');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setSignInLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError('');
    setGuestLoading(true);
    try {
      await guestLogin();
      navigate('/app/projects');
    } catch (err: any) {
      setError(err.message || 'Guest login failed');
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left Panel */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          width: '50%',
          bgcolor: '#0F172A',
          background: 'linear-gradient(135deg, #0F172A 0%, #0F172A 60%, #0D9488 150%)',
          color: 'white',
          p: 6,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <Box
          sx={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 300,
            height: 300,
            borderRadius: '50%',
            bgcolor: 'rgba(13, 148, 136, 0.08)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -120,
            left: -60,
            width: 400,
            height: 400,
            borderRadius: '50%',
            bgcolor: 'rgba(13, 148, 136, 0.06)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '40%',
            right: '10%',
            width: 150,
            height: 150,
            borderRadius: '50%',
            bgcolor: 'rgba(13, 148, 136, 0.1)',
          }}
        />

        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 440 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
            FMEAworks
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', mb: 5 }}>
            AI-Powered Quality Risk Platform
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {features.map((feature) => (
              <Box key={feature} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CheckIcon sx={{ color: '#0D9488', fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem' }}>
                  {feature}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Right Panel */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: { xs: '100%', md: '50%' },
          bgcolor: 'white',
          p: 3,
        }}
      >
        <Container maxWidth="sm">
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            Welcome Back
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Sign in to continue to your workspace
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSignIn} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={signInLoading}
              sx={{
                bgcolor: '#0D9488',
                '&:hover': { bgcolor: '#0f766e' },
                textTransform: 'none',
                fontWeight: 600,
                py: 1.5,
                fontSize: '1rem',
                borderRadius: 2,
              }}
            >
              {signInLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </Box>

          <Divider sx={{ my: 4 }}>
            <Typography variant="body2" color="text.secondary">
              or
            </Typography>
          </Divider>

          <Box sx={{ textAlign: 'center' }}>
            <Button
              variant="outlined"
              size="large"
              fullWidth
              disabled={guestLoading}
              onClick={handleGuestLogin}
              sx={{
                borderColor: '#0D9488',
                color: '#0D9488',
                '&:hover': { borderColor: '#0f766e', bgcolor: 'rgba(13, 148, 136, 0.04)' },
                textTransform: 'none',
                fontWeight: 600,
                py: 1.5,
                fontSize: '1rem',
                borderRadius: 2,
              }}
            >
              {guestLoading ? <CircularProgress size={24} color="inherit" /> : 'Try Free — No Account Needed'}
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
              Instant access. Your workspace expires after 15 days.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};
