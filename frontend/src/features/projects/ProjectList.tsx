import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Grid, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, CircularProgress, CardActionArea } from '@mui/material';
import { Add as AddIcon, Business as BusinessIcon, AccessTime as AccessTimeIcon } from '@mui/icons-material';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config';

interface Project {
  id: string;
  name: string;
  description?: string;
  customer?: string;
  modelYear?: string;
  status: string;
  createdAt: string;
}

export const ProjectList: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [customer, setCustomer] = useState('');
  const [modelYear, setModelYear] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/projects`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to load projects');
      }
      const data = await response.json();
      setProjects(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProjects();
    }
  }, [token]);

  const handleOpen = () => {
    setOpen(true);
    setCreateError(null);
  };

  const handleClose = () => {
    setOpen(false);
    setName('');
    setDescription('');
    setCustomer('');
    setModelYear('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description, customer, modelYear }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to create project');
      }

      await fetchProjects();
      handleClose();
    } catch (err: any) {
      setCreateError(err.message || 'Could not create project');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Projects Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your manufacturing programs and FMEA assessments
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
          Create Project
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : projects.length === 0 ? (
        <Box sx={{ textAlign: 'center', p: 8, border: '1px dashed #2e2e36', borderRadius: 3 }}>
          <Typography color="text.secondary" gutterBottom>
            No projects found in this workspace.
          </Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={handleOpen} sx={{ mt: 2 }}>
            Create Your First Project
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={project.id}>
              <Card sx={{ border: '1px solid #2e2e36', height: '100%' }}>
                <CardActionArea
                  sx={{ height: '100%', p: 1 }}
                  onClick={() => navigate(`/projects/${project.id}/pfd`)}
                >
                  <CardContent>
                    <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                      {project.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, minHeight: 40 }}>
                      {project.description || 'No description provided.'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'text.secondary', fontSize: '0.875rem' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <BusinessIcon fontSize="small" />
                        <Typography variant="caption">{project.customer || 'Internal'}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AccessTimeIcon fontSize="small" />
                        <Typography variant="caption">{project.modelYear || 'N/A'}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Project Modal */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create Quality Project</DialogTitle>
        <Box component="form" onSubmit={handleCreate}>
          <DialogContent>
            {createError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {createError}
              </Alert>
            )}
            <TextField
              fullWidth
              label="Project Name"
              variant="outlined"
              margin="normal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <TextField
              fullWidth
              label="Description"
              variant="outlined"
              margin="normal"
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Grid container spacing={2}>
              <Grid size={6}>
                <TextField
                  fullWidth
                  label="Customer"
                  variant="outlined"
                  margin="normal"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  fullWidth
                  label="Model Year"
                  variant="outlined"
                  margin="normal"
                  value={modelYear}
                  onChange={(e) => setModelYear(e.target.value)}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleClose} disabled={createLoading}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createLoading}>
              {createLoading ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};
