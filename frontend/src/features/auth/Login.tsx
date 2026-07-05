import React, { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, Link, Container } from '@mui/material';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Default subdomain is 'guest-tenant'
      const subdomain = 'guest-tenant';

      if (isSignup) {
        // Call the login endpoint, which now handles dynamic silent registration
        // if user doesn't exist, passing name.trim() along
        await login(email, password, subdomain, name.trim());
      } else {
        await login(email, password, subdomain);
      }
      navigate('/projects');
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please check your credentials.');
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
        background: 'linear-gradient(135deg, #01696F 0%, #004F53 100%)',
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

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {isSignup && (
                <TextField
                  fullWidth
                  label="Your Name"
                  variant="outlined"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    }
                  }}
                />
              )}

              <TextField
                fullWidth
                label="Email Address"
                type="email"
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />

              <TextField
                fullWidth
                label="Password"
                type="password"
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
                disabled={loading}
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

              <Box sx={{ textAlign: 'center', mt: 1 }}>
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={() => {
                    setIsSignup(!isSignup);
                    setError(null);
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
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};
