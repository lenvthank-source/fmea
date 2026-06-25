import React, { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, Link, Container } from '@mui/material';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [subdomain, setSubdomain] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [tenantName, setTenantName] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignup) {
        // Sign up logic
        const response = await fetch('http://localhost:3000/api/v1/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name, subdomain, tenantName }),
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.message || 'Signup failed');
        }
        // Login immediately after signup
        await login(email, password, subdomain);
      } else {
        await login(email, password, subdomain);
      }
      navigate('/projects');
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            APEX FMEA
          </Typography>
          <Typography variant="body2" color="text.secondary">
            AI-Assisted Quality Risk Workspace
          </Typography>
        </Box>

        <Card sx={{ width: '100%', border: '1px solid #2e2e36', background: 'rgba(30, 30, 36, 0.85)', backdropFilter: 'blur(10px)' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
              {isSignup ? 'Create Workspace' : 'Sign In'}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Workspace Subdomain"
                variant="outlined"
                margin="normal"
                placeholder="company-name"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                required
                helperText="e.g. Acme for acme.apex-fmea.com"
                sx={{ mb: 1 }}
              />

              {isSignup && (
                <>
                  <TextField
                    fullWidth
                    label="Company / Tenant Name"
                    variant="outlined"
                    margin="normal"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    required
                    sx={{ mb: 1 }}
                  />
                  <TextField
                    fullWidth
                    label="Your Name"
                    variant="outlined"
                    margin="normal"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    sx={{ mb: 1 }}
                  />
                </>
              )}

              <TextField
                fullWidth
                label="Email Address"
                type="email"
                variant="outlined"
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                sx={{ mb: 1 }}
              />

              <TextField
                fullWidth
                label="Password"
                type="password"
                variant="outlined"
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                sx={{ mb: 3 }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mb: 2, height: 48 }}
              >
                {loading ? 'Processing...' : isSignup ? 'Create and Sign In' : 'Sign In'}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={() => {
                    setIsSignup(!isSignup);
                    setError(null);
                  }}
                  sx={{ color: 'secondary.main', textDecoration: 'none' }}
                >
                  {isSignup ? 'Already have a workspace? Sign In' : 'Need a new tenant workspace? Register here'}
                </Link>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};
