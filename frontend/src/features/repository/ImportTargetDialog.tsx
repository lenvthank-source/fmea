import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Alert,
  CircularProgress,
  Typography,
} from '@mui/material';
import { useAuth } from '../auth/AuthContext';
import { API_BASE_URL } from '../../config';

interface ImportTargetDialogProps {
  open: boolean;
  onClose: () => void;
  packageId: string;
  packageName: string;
  onSuccess: () => void;
}

export const ImportTargetDialog: React.FC<ImportTargetDialogProps> = ({
  open,
  onClose,
  packageId,
  packageName,
  onSuccess,
}) => {
  const { token } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedRevisionId, setSelectedRevisionId] = useState<string>('');
  const [processSteps, setProcessSteps] = useState<any[]>([]);
  const [selectedProcessStepId, setSelectedProcessStepId] = useState<string>('');

  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingSteps, setLoadingSteps] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch projects on mount
  useEffect(() => {
    if (open && token) {
      setLoadingProjects(true);
      setError(null);
      fetch(`${API_BASE_URL}/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setProjects(Array.isArray(data) ? data : []);
          setLoadingProjects(false);
        })
        .catch((err) => {
          console.error(err);
          setError('Failed to load projects');
          setLoadingProjects(false);
        });
    }
  }, [open, token]);

  // When project changes, fetch its active revision and process steps
  useEffect(() => {
    if (selectedProjectId && token) {
      setLoadingSteps(true);
      fetch(`${API_BASE_URL}/projects/${selectedProjectId}/revisions`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((revs) => {
          const revList = Array.isArray(revs) ? revs : [];
          const activeRev = revList.find((r: any) => r.status !== 'superseded') || revList[0];
          if (activeRev) {
            setSelectedRevisionId(activeRev.id);
            // Fetch process steps for active revision
            fetch(`${API_BASE_URL}/pfd-steps?revisionId=${activeRev.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
              .then((res) => res.json())
              .then((steps) => {
                setProcessSteps(Array.isArray(steps) ? steps : []);
                setLoadingSteps(false);
              })
              .catch((err) => {
                console.error(err);
                setLoadingSteps(false);
              });
          } else {
            setLoadingSteps(false);
          }
        })
        .catch((err) => {
          console.error(err);
          setLoadingSteps(false);
        });
    }
  }, [selectedProjectId, token]);

  const handleImport = async () => {
    if (!selectedRevisionId || !selectedProcessStepId) {
      setError('Please select a target project and process step.');
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/repository/packages/${packageId}/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          revisionId: selectedRevisionId,
          processStepId: selectedProcessStepId,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to import package');
      }

      setImporting(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to import package');
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold' }}>
        Import Work Element: {packageName}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Typography variant="body2" color="text.secondary">
            Select the destination project and process step to import this work element package into.
          </Typography>

          <FormControl fullWidth size="small">
            <InputLabel>Target Project</InputLabel>
            <Select
              value={selectedProjectId}
              label="Target Project"
              onChange={(e) => setSelectedProjectId(e.target.value)}
              disabled={loadingProjects}
            >
              {projects.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name} {p.orgPartNumber ? `(${p.orgPartNumber})` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedProjectId && (
            <FormControl fullWidth size="small">
              <InputLabel>Target Process Step</InputLabel>
              <Select
                value={selectedProcessStepId}
                label="Target Process Step"
                onChange={(e) => setSelectedProcessStepId(e.target.value)}
                disabled={loadingSteps}
              >
                {processSteps.map((step) => (
                  <MenuItem key={step.id} value={step.id}>
                    Step {step.stepNumber}: {step.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={importing}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleImport}
          disabled={importing || !selectedProcessStepId}
          startIcon={importing ? <CircularProgress size={18} color="inherit" /> : null}
        >
          {importing ? 'Importing...' : 'Confirm Import'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
