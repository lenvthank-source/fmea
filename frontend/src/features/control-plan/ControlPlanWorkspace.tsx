import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Input,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Sync as SyncIcon,
} from '@mui/icons-material';
import { useAuth } from '../auth/AuthContext';
import { API_BASE_URL } from '../../config';
import { DocumentHeader } from '../../components/DocumentHeader';

interface ProcessStep {
  id: string;
  stepNumber: string;
  name: string;
}

interface Characteristic {
  id: string;
  name: string;
  classification: string;
}

interface ControlPlanRow {
  id: string;
  processStepId: string;
  characteristicId: string | null;
  rowNumber: number;
  specTolerance: string | null;
  measurementMethod: string | null;
  sampleSize: string | null;
  frequency: string | null;
  controlType: string;
  controlMethod: string | null;
  reactionPlan: string | null;
  responsible: string | null;
  notes: string | null;
  processStep: ProcessStep;
  characteristic: Characteristic | null;
}

export const ControlPlanWorkspace: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { token } = useAuth();

  // Project Document Revisions
  const [cpRevisionId, setCpRevisionId] = useState<string | null>(null);

  // Data states
  const [rows, setRows] = useState<ControlPlanRow[]>([]);
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState('');
  const [selectedCharId, setSelectedCharId] = useState('');
  const [controlType, setControlType] = useState('detection');
  const [controlMethod, setControlMethod] = useState('');

  // Load project Control Plan revision
  useEffect(() => {
    const resolveContext = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/documents`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to resolve project document context.');
        const documents = await response.json();

        const cpDoc = documents.find((doc: any) => doc.type === 'CONTROL_PLAN');

        if (!cpDoc || !cpDoc.currentRevisionId) {
          throw new Error('Control Plan document context not initialized.');
        }

        setCpRevisionId(cpDoc.currentRevisionId);
      } catch (err: any) {
        setError(err.message || 'An error occurred while loading project context.');
        setLoading(false);
      }
    };

    if (projectId && token) {
      resolveContext();
    }
  }, [projectId, token]);

  const fetchData = async () => {
    if (!cpRevisionId) return;
    try {
      // 1. Fetch Control Plan rows
      const rowsResponse = await fetch(`${API_BASE_URL}/revisions/${cpRevisionId}/control-plan-rows`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!rowsResponse.ok) throw new Error('Failed to load Control Plan rows');
      const rowsData = await rowsResponse.json();
      setRows(rowsData);

      // 2. Fetch Process Steps (to populate dropdowns for manual addition)
      // We resolve the PFD revision by fetching project docs first, but let's grab from project document listing
      const docsResponse = await fetch(`${API_BASE_URL}/projects/${projectId}/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const docs = await docsResponse.json();
      const pfdDoc = docs.find((d: any) => d.type === 'PFD');
      if (pfdDoc && pfdDoc.currentRevisionId) {
        const stepsResponse = await fetch(`${API_BASE_URL}/revisions/${pfdDoc.currentRevisionId}/pfd-steps`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (stepsResponse.ok) {
          const stepsData = await stepsResponse.json();
          setSteps(stepsData);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Could not load Control Plan workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cpRevisionId) {
      fetchData();
    }
  }, [cpRevisionId]);

  // Trigger FMEA synchronization
  const handleSyncFromFmea = async () => {
    if (!cpRevisionId) return;
    setSyncing(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`${API_BASE_URL}/revisions/${cpRevisionId}/control-plan-rows/sync`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Synchronization failed.');
      }

      const result = await response.json();
      setSuccess(result.message || 'Successfully synchronized Control Plan with FMEA.');
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'FMEA Control Plan synchronization failed.');
    } finally {
      setSyncing(false);
    }
  };

  // Add a manual row
  const handleAddRow = async () => {
    if (!selectedStepId || !cpRevisionId) return;
    setError(null);
    setSuccess(null);
    setAddDialogOpen(false);
    try {
      const nextRowNumber = rows.length > 0 ? Math.max(...rows.map((r) => r.rowNumber)) + 1 : 1;

      const response = await fetch(`${API_BASE_URL}/revisions/${cpRevisionId}/control-plan-rows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          processStepId: selectedStepId,
          characteristicId: selectedCharId || undefined,
          rowNumber: nextRowNumber,
          controlType,
          controlMethod: controlMethod || 'Visual Inspection',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create Control Plan row.');
      }

      await fetchData();
      setSelectedStepId('');
      setSelectedCharId('');
      setControlMethod('');
    } catch (err: any) {
      setError(err.message || 'Error occurred while adding Control Plan row.');
    }
  };

  // Update a field inline
  const handleFieldChange = async (rowId: string, field: string, value: string) => {
    setError(null);
    setSuccess(null);
    
    // Update local state first for instantaneous visual updates
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, [field]: value } : r))
    );

    try {
      const response = await fetch(`${API_BASE_URL}/control-plan-rows/${rowId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        throw new Error('Failed to save cell update.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update field. Reverting...');
      fetchData(); // Rollback to server state
    }
  };

  // Delete a row
  const handleDeleteRow = async (rowId: string) => {
    if (!window.confirm('Are you sure you want to delete this Control Plan row?')) return;
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/control-plan-rows/${rowId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete row.');
      }

      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Could not delete Control Plan row.');
    }
  };

  if (loading && !cpRevisionId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Title Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end', gap: 2, alignItems: 'center' }}>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={syncing ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}
            onClick={handleSyncFromFmea}
            disabled={syncing}
          >
            {syncing ? 'Syncing...' : 'Sync from FMEA'}
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddDialogOpen(true)}>
            Add Control Row
          </Button>
        </Stack>
      </Box>

      <DocumentHeader projectId={projectId!} docType="CONTROL_PLAN" />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Main Grid */}
      <TableContainer component={Paper} sx={{ border: '1px solid #2e2e36', backgroundImage: 'none', overflowX: 'auto' }}>
        <Table aria-label="Control Plan grid" size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#1b1b21' }}>
              <TableCell sx={{ minWidth: 40, fontWeight: 'bold' }}>#</TableCell>
              <TableCell sx={{ minWidth: 150, fontWeight: 'bold' }}>Process Step</TableCell>
              <TableCell sx={{ minWidth: 140, fontWeight: 'bold' }}>Characteristic</TableCell>
              <TableCell sx={{ minWidth: 120, fontWeight: 'bold' }}>Class</TableCell>
              <TableCell sx={{ minWidth: 150, fontWeight: 'bold' }}>Specification / Tolerance</TableCell>
              <TableCell sx={{ minWidth: 160, fontWeight: 'bold' }}>Measurement Method</TableCell>
              <TableCell sx={{ minWidth: 100, fontWeight: 'bold' }}>Sample Size</TableCell>
              <TableCell sx={{ minWidth: 110, fontWeight: 'bold' }}>Frequency</TableCell>
              <TableCell sx={{ minWidth: 180, fontWeight: 'bold' }}>Control Method</TableCell>
              <TableCell sx={{ minWidth: 180, fontWeight: 'bold' }}>Reaction Plan</TableCell>
              <TableCell sx={{ minWidth: 130, fontWeight: 'bold' }}>Responsible</TableCell>
              <TableCell sx={{ minWidth: 60, fontWeight: 'bold', textAlign: 'center' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  No Control Plan rows active. Click "Sync from FMEA" to pull controls from FMEA analysis, or click "Add Control Row" to add manually.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.01)' } }}>
                  {/* Row Number */}
                  <TableCell sx={{ fontWeight: 'bold' }}>{row.rowNumber}</TableCell>

                  {/* Process Step */}
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {row.processStep.stepNumber}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.processStep.name}
                    </Typography>
                  </TableCell>

                  {/* Characteristic */}
                  <TableCell>
                    {row.characteristic ? row.characteristic.name : '—'}
                  </TableCell>

                  {/* Characteristic Classification */}
                  <TableCell>
                    {row.characteristic && row.characteristic.classification !== 'standard' ? (
                      <Chip
                        label={row.characteristic.classification.toUpperCase()}
                        size="small"
                        color="secondary"
                        sx={{ fontWeight: 'bold', height: 20 }}
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">Standard</Typography>
                    )}
                  </TableCell>

                  {/* Spec / Tolerance */}
                  <TableCell>
                    <Input
                      value={row.specTolerance || ''}
                      onChange={(e) => handleFieldChange(row.id, 'specTolerance', e.target.value)}
                      size="small"
                      disableUnderline
                      fullWidth
                    />
                  </TableCell>

                  {/* Measurement Method */}
                  <TableCell>
                    <Input
                      value={row.measurementMethod || ''}
                      onChange={(e) => handleFieldChange(row.id, 'measurementMethod', e.target.value)}
                      size="small"
                      disableUnderline
                      fullWidth
                    />
                  </TableCell>

                  {/* Sample Size */}
                  <TableCell>
                    <Input
                      value={row.sampleSize || ''}
                      onChange={(e) => handleFieldChange(row.id, 'sampleSize', e.target.value)}
                      size="small"
                      disableUnderline
                      fullWidth
                    />
                  </TableCell>

                  {/* Frequency */}
                  <TableCell>
                    <Input
                      value={row.frequency || ''}
                      onChange={(e) => handleFieldChange(row.id, 'frequency', e.target.value)}
                      size="small"
                      disableUnderline
                      fullWidth
                    />
                  </TableCell>

                  {/* Control Method */}
                  <TableCell>
                    <Typography variant="body2">{row.controlMethod || '—'}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Type: {row.controlType}
                    </Typography>
                  </TableCell>

                  {/* Reaction Plan */}
                  <TableCell>
                    <Input
                      value={row.reactionPlan || ''}
                      onChange={(e) => handleFieldChange(row.id, 'reactionPlan', e.target.value)}
                      size="small"
                      disableUnderline
                      multiline
                      fullWidth
                    />
                  </TableCell>

                  {/* Responsible */}
                  <TableCell>
                    <Input
                      value={row.responsible || ''}
                      onChange={(e) => handleFieldChange(row.id, 'responsible', e.target.value)}
                      size="small"
                      disableUnderline
                      fullWidth
                    />
                  </TableCell>

                  {/* Delete Button */}
                  <TableCell align="center">
                    <IconButton size="small" color="error" onClick={() => handleDeleteRow(row.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Row Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Add Control Plan Row</DialogTitle>
        <DialogContent sx={{ minWidth: 400, pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Process Step</InputLabel>
              <Select
                value={selectedStepId}
                label="Process Step"
                onChange={(e) => setSelectedStepId(e.target.value)}
              >
                {steps.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.stepNumber} - {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Control Type</InputLabel>
              <Select
                value={controlType}
                label="Control Type"
                onChange={(e) => setControlType(e.target.value)}
              >
                <MenuItem value="prevention">Prevention Control</MenuItem>
                <MenuItem value="detection">Detection Control</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Control / Inspection Method"
              value={controlMethod}
              onChange={(e) => setControlMethod(e.target.value)}
              size="small"
              fullWidth
              placeholder="e.g. Vernier Caliper check"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleAddRow} variant="contained" disabled={!selectedStepId || !controlMethod}>
            Add Row
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
