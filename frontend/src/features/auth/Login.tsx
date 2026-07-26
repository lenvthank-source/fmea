import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Alert, Paper, CircularProgress, Chip, Divider } from '@mui/material';
import { AccountTree, SyncAlt, VerifiedUser, ArrowForward } from '@mui/icons-material';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../../components/SEO/SEO';
import { ThemeToggle } from '../../components/ThemeToggle/ThemeToggle';
import { motion } from 'framer-motion';

export const Login: React.FC = () => {
  const { login, token, guestLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [signInLoading, setSignInLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  useEffect(() => {
    if (token) {
      navigate('/app/projects', { replace: true });
    }
  }, [token, navigate]);

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

  const handleGuestAccess = async () => {
    setError('');
    setGuestLoading(true);
    try {
      await guestLogin();
      navigate('/app/projects');
    } catch (err: any) {
      setError(err.message || 'Guest access initialization failed');
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: 'background.default' }}>
      <SEO
        title="Login & Access Workspace | FMEApex AI Quality Risk Platform"
        description="Sign in to your secure FMEApex workspace. Access AIAG-VDA 7-step FMEA tools, PFD linking, and 21 CFR Part 11 audit trails."
        canonical="/login"
      />

      {/* Left Column: Brand & Showcase (Desktop) */}
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'between',
          p: 6,
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
          <Typography
            onClick={() => navigate('/')}
            sx={{
              fontWeight: 800,
              fontSize: '1.4rem',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #2DD4BF, #38BDF8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            FMEApex
          </Typography>
          <Chip label="21 CFR Part 11 Ready" size="small" sx={{ bgcolor: 'rgba(45,212,191,0.15)', color: '#2DD4BF', fontWeight: 700 }} />
        </Box>

        <Box sx={{ my: 'auto', maxWidth: 520, zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Typography variant="h2" sx={{ fontWeight: 800, mb: 2, fontSize: '2.5rem', lineHeight: 1.2 }}>
              Enterprise Quality Risk Management Powered by AI
            </Typography>
            <Typography variant="body1" sx={{ color: '#94A3B8', fontSize: '1.05rem', lineHeight: 1.7, mb: 4 }}>
              Automate AIAG-VDA 7-Step FMEAs, synchronize Control Plans bidirectionally, and enforce zero-gap process flow linking.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { icon: <AccountTree sx={{ color: '#2DD4BF' }} />, title: '7-Step Guided Workflow', desc: 'Step gating with automatic Action Priority lookup' },
                { icon: <SyncAlt sx={{ color: '#38BDF8' }} />, title: 'PFD ↔ PFMEA Bidirectional Sync', desc: 'Eliminate orphan process steps across all lines' },
                { icon: <VerifiedUser sx={{ color: '#10B981' }} />, title: 'Immutable Audit Trails', desc: '21 CFR Part 11 cryptographic signature logs' },
              ].map((feat, idx) => (
                <Paper
                  key={idx}
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  {feat.icon}
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#F8FAFC', fontWeight: 700 }}>
                      {feat.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                      {feat.desc}
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Box>
          </motion.div>
        </Box>

        <Typography variant="caption" sx={{ color: '#64748B', zIndex: 1 }}>
          © 2026 FMEApex Quality Risk Platform. All rights reserved.
        </Typography>
      </Box>

      {/* Right Column: Auth Card */}
      <Box
        sx={{
          width: { xs: '100%', md: '480px', lg: '540px' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          p: { xs: 3, sm: 6 },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
          <ThemeToggle />
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            boxShadow: (theme) => (theme.palette.mode === 'dark' ? '0 10px 30px rgba(0,0,0,0.5)' : '0 4px 20px rgba(15,23,42,0.06)'),
          }}
        >
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
              Sign In to Workspace
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter your corporate credentials or try the instant sandbox.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Guest Sandbox Instant Trial */}
          <Button
            variant="outlined"
            fullWidth
            onClick={handleGuestAccess}
            disabled={guestLoading || signInLoading}
            endIcon={!guestLoading && <ArrowForward />}
            sx={{
              py: 1.2,
              mb: 3,
              borderColor: 'secondary.main',
              color: 'secondary.main',
              fontWeight: 700,
              borderRadius: 2.5,
              '&:hover': { bgcolor: 'rgba(13, 148, 136, 0.08)', borderColor: 'secondary.dark' },
            }}
          >
            {guestLoading ? <CircularProgress size={22} color="inherit" /> : 'Launch 15-Day Free Guest Sandbox'}
          </Button>

          <Divider sx={{ mb: 3 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              OR SIGN IN WITH EMAIL
            </Typography>
          </Divider>

          <form onSubmit={handleSignIn}>
            <TextField
              fullWidth
              required
              label="Email Address"
              type="email"
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              required
              label="Password"
              type="password"
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={signInLoading || guestLoading}
              sx={{
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                fontWeight: 700,
                borderRadius: 2.5,
                py: 1.2,
                '&:hover': { bgcolor: 'primary.light' },
              }}
            >
              {signInLoading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
            </Button>
          </form>
        </Paper>
      </Box>
    </Box>
  );
};
