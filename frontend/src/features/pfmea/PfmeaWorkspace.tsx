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
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Stack,
  Tooltip,
  TextField,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  PlaylistAdd as PlaylistAddIcon,
} from '@mui/icons-material';
import { useAuth } from '../auth/AuthContext';
import { PfmeaRowEditor } from './components/PfmeaRowEditor';
import { calculateAP } from './utils/apCalculator';
import { API_BASE_URL } from '../../config';
import { DocumentHeader } from '../../components/DocumentHeader';

interface ProcessStep {
  id: string;
  stepNumber: string;
  name: string;
  stepType: string;
}

interface PfmeaRow {
  id: string;
  processStepId: string;
  rowNumber: number;
  severity: number | null;
  occurrence: number | null;
  detection: number | null;
  ap: string | null;
  notes: string;
  status: string;
  accessLevel: string;
  processStep: { name: string; stepNumber: string };
  functions: { name: string }[];
  requirements: { name: string }[];
  failureModes: { name: string }[];
  effects: { name: string }[];
  causes: { name: string }[];
  controls: { name: string; type: string; detectionMethod?: string }[];
  characteristics: { name: string; classification: string; unitOfMeasure?: string }[];
}

export const PfmeaWorkspace: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { token } = useAuth();

  // Project Document Revisions
  const [pfmeaRevisionId, setPfmeaRevisionId] = useState<string | null>(null);
  const [pfdRevisionId, setPfdRevisionId] = useState<string | null>(null);

  // Data states
  const [rows, setRows] = useState<PfmeaRow[]>([]);
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog and Drawer states
  const [editorOpen, setEditorOpen] = useState(false);
  const [activeRow, setActiveRow] = useState<PfmeaRow | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Add row form state
  const [selectedStepId, setSelectedStepId] = useState('');

  // Corrective action creation state
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedRowForAction, setSelectedRowForAction] = useState<PfmeaRow | null>(null);
  const [actionDescription, setActionDescription] = useState('');
  const [actionPriority, setActionPriority] = useState('medium');
  const [actionOwnerId, setActionOwnerId] = useState('');
  const [actionDueDate, setActionDueDate] = useState('');
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);

  // Load tenant users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        }
      } catch (err) {
        console.error('Failed to load tenant users', err);
      }
    };
    if (token) {
      fetchUsers();
    }
  }, [token]);

  const handleCreateAction = async () => {
    if (!selectedRowForAction || !actionDescription || !actionOwnerId || !actionDueDate) return;
    setError(null);
    setActionDialogOpen(false);
    try {
      const response = await fetch(`${API_BASE_URL}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId,
          description: actionDescription,
          ownerId: actionOwnerId,
          dueDate: actionDueDate,
          priority: actionPriority,
          fmeaRowId: selectedRowForAction.id,
          fmeaType: 'PFMEA',
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to create corrective action.');
      }

      setActionDescription('');
      setActionPriority('medium');
      setActionOwnerId('');
      setActionDueDate('');
      setSelectedRowForAction(null);
      await fetchData(); // Reload to reflect updated risk scores if any sync occurred
    } catch (err: any) {
      setError(err.message || 'Could not create corrective action.');
    }
  };

  // Load project revisions context
  useEffect(() => {
    const resolveContext = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/documents`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to resolve project document schemas.');
        const documents = await response.json();

        const pfmeaDoc = documents.find((doc: any) => doc.type === 'PFMEA');
        const pfdDoc = documents.find((doc: any) => doc.type === 'PFD');

        if (!pfmeaDoc || !pfmeaDoc.currentRevisionId) {
          throw new Error('PFMEA Document context not found or revision uninitialized.');
        }
        if (!pfdDoc || !pfdDoc.currentRevisionId) {
          throw new Error('PFD Document context not found. Please setup process structure first.');
        }

        setPfmeaRevisionId(pfmeaDoc.currentRevisionId);
        setPfdRevisionId(pfdDoc.currentRevisionId);
      } catch (err: any) {
        setError(err.message || 'An error occurred while loading project context.');
        setLoading(false);
      }
    };

    if (projectId && token) {
      resolveContext();
    }
  }, [projectId, token]);

  // Load process steps and FMEA rows
  const fetchData = async () => {
    if (!pfmeaRevisionId || !pfdRevisionId) return;
    try {
      // 1. Fetch Process Steps (from PFD revision)
      const stepsResponse = await fetch(`${API_BASE_URL}/revisions/${pfdRevisionId}/pfd-steps`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!stepsResponse.ok) throw new Error('Failed to load Process Steps');
      const stepsData = await stepsResponse.json();
      setSteps(stepsData);

      // 2. Fetch PFMEA rows
      const rowsResponse = await fetch(`${API_BASE_URL}/revisions/${pfmeaRevisionId}/pfmea-rows`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!rowsResponse.ok) throw new Error('Failed to load PFMEA analysis rows');
      const rowsData = await rowsResponse.json();
      setRows(rowsData);
    } catch (err: any) {
      setError(err.message || 'Could not load FMEA workspace data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pfmeaRevisionId && pfdRevisionId) {
      fetchData();
    }
  }, [pfmeaRevisionId, pfdRevisionId]);

  // Add a new row
  const handleAddRow = async () => {
    if (!selectedStepId) return;
    setError(null);
    setAddDialogOpen(false);
    try {
      const nextRowNumber = rows.length > 0 ? Math.max(...rows.map((r) => r.rowNumber)) + 1 : 1;

      const response = await fetch(`${API_BASE_URL}/revisions/${pfmeaRevisionId}/pfmea-rows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          processStepId: selectedStepId,
          rowNumber: nextRowNumber,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create FMEA row.');
      }

      await fetchData();
      setSelectedStepId('');
    } catch (err: any) {
      setError(err.message || 'Error occurred while appending FMEA row.');
    }
  };

  // Delete a row
  const handleDeleteRow = async (rowId: string) => {
    if (!window.confirm('Are you sure you want to delete this analysis row? This action is permanent.')) return;
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/pfmea-rows/${rowId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete FMEA row.');
      }

      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Could not delete FMEA row.');
    }
  };

  // Inline Rating update (S, O, D)
  const handleRatingChange = async (rowId: string, field: 'severity' | 'occurrence' | 'detection', value: number) => {
    setError(null);
    // Find target row
    const targetRow = rows.find((r) => r.id === rowId);
    if (!targetRow) return;

    // Speculate AP locally for instant feedback
    const S = field === 'severity' ? value : targetRow.severity;
    const O = field === 'occurrence' ? value : targetRow.occurrence;
    const D = field === 'detection' ? value : targetRow.detection;
    const localAp = calculateAP(S, O, D);

    // Update state locally first
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, [field]: value, ap: localAp } : r))
    );

    try {
      const response = await fetch(`${API_BASE_URL}/pfmea-rows/${rowId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        throw new Error('Failed to persist rating update.');
      }

      // Sync official returned state
      const updatedRow = await response.json();
      setRows((prev) =>
        prev.map((r) => (r.id === rowId ? { ...r, severity: updatedRow.severity, occurrence: updatedRow.occurrence, detection: updatedRow.detection, ap: updatedRow.ap } : r))
      );
    } catch (err: any) {
      setError(err.message || 'Failed to update rating. Reverting...');
      fetchData(); // Rollback to server state
    }
  };

  // Detail panel save handler
  const handleSaveRowDetails = async (updatedData: any) => {
    if (!activeRow) return;
    const response = await fetch(`${API_BASE_URL}/pfmea-rows/${activeRow.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updatedData),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Failed to save FMEA row modifications.');
    }

    await fetchData();
  };

  const getApBadge = (ap: string | null) => {
    if (!ap) return <Chip label="—" size="small" variant="outlined" />;
    switch (ap) {
      case 'H':
        return <Chip label="High" size="small" color="error" sx={{ fontWeight: 'bold' }} />;
      case 'M':
        return <Chip label="Medium" size="small" color="warning" sx={{ fontWeight: 'bold' }} />;
      case 'L':
        return <Chip label="Low" size="small" color="success" sx={{ fontWeight: 'bold' }} />;
      default:
        return <Chip label={ap} size="small" />;
    }
  };

  // Options for S/O/D ratings
  const ratingOptions = Array.from({ length: 10 }, (_, i) => i + 1);

  if (loading && !pfmeaRevisionId) {
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
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddDialogOpen(true)}>
          Add Analysis Row
        </Button>
      </Box>

      <DocumentHeader projectId={projectId!} docType="PFMEA" />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Main Grid */}
      <TableContainer component={Paper} sx={{ border: '1px solid #2e2e36', backgroundImage: 'none', overflowX: 'auto' }}>
        <Table aria-label="PFMEA rows grid" size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#1b1b21' }}>
              <TableCell sx={{ minWidth: 40, fontWeight: 'bold' }}>#</TableCell>
              <TableCell sx={{ minWidth: 140, fontWeight: 'bold' }}>Process Step</TableCell>
              <TableCell sx={{ minWidth: 150, fontWeight: 'bold' }}>Functions / Requirements</TableCell>
              <TableCell sx={{ minWidth: 150, fontWeight: 'bold' }}>Failure Modes</TableCell>
              <TableCell sx={{ minWidth: 150, fontWeight: 'bold' }}>Effects</TableCell>
              <TableCell sx={{ minWidth: 60, fontWeight: 'bold', textAlign: 'center' }}>S</TableCell>
              <TableCell sx={{ minWidth: 150, fontWeight: 'bold' }}>Causes</TableCell>
              <TableCell sx={{ minWidth: 150, fontWeight: 'bold' }}>Prevention Controls</TableCell>
              <TableCell sx={{ minWidth: 150, fontWeight: 'bold' }}>Detection Controls</TableCell>
              <TableCell sx={{ minWidth: 60, fontWeight: 'bold', textAlign: 'center' }}>O</TableCell>
              <TableCell sx={{ minWidth: 60, fontWeight: 'bold', textAlign: 'center' }}>D</TableCell>
              <TableCell sx={{ minWidth: 70, fontWeight: 'bold', textAlign: 'center' }}>AP</TableCell>
              <TableCell sx={{ minWidth: 90, fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  No PFMEA analysis rows added yet. Click "Add Analysis Row" to begin.
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

                  {/* Functions & Requirements */}
                  <TableCell>
                    <Stack spacing={0.5}>
                      {row.functions.map((f, i) => (
                        <Chip key={i} label={`F: ${f.name}`} size="small" color="primary" variant="outlined" />
                      ))}
                      {row.requirements.map((req, i) => (
                        <Chip key={i} label={`R: ${req.name}`} size="small" color="info" variant="outlined" />
                      ))}
                      {row.functions.length === 0 && row.requirements.length === 0 && '—'}
                    </Stack>
                  </TableCell>

                  {/* Failure Modes */}
                  <TableCell>
                    <Stack spacing={0.5}>
                      {row.failureModes.map((fm, i) => (
                        <Chip key={i} label={fm.name} size="small" color="error" variant="outlined" />
                      ))}
                      {row.failureModes.length === 0 && '—'}
                    </Stack>
                  </TableCell>

                  {/* Effects */}
                  <TableCell>
                    <Stack spacing={0.5}>
                      {row.effects.map((e, i) => (
                        <Chip key={i} label={e.name} size="small" color="error" />
                      ))}
                      {row.effects.length === 0 && '—'}
                    </Stack>
                  </TableCell>

                  {/* Severity (S) */}
                  <TableCell align="center">
                    <Select
                      value={row.severity || ''}
                      onChange={(e) => handleRatingChange(row.id, 'severity', Number(e.target.value))}
                      size="small"
                      sx={{ minWidth: 55, '& .MuiSelect-select': { py: 0.5, px: 1 } }}
                    >
                      <MenuItem value="">—</MenuItem>
                      {ratingOptions.map((v) => (
                        <MenuItem key={v} value={v}>
                          {v}
                        </MenuItem>
                      ))}
                    </Select>
                  </TableCell>

                  {/* Causes */}
                  <TableCell>
                    <Stack spacing={0.5}>
                      {row.causes.map((c, i) => (
                        <Chip key={i} label={c.name} size="small" color="warning" variant="outlined" />
                      ))}
                      {row.causes.length === 0 && '—'}
                    </Stack>
                  </TableCell>

                  {/* Prevention Controls */}
                  <TableCell>
                    <Stack spacing={0.5}>
                      {row.controls
                        .filter((c) => c.type === 'prevention')
                        .map((c, i) => (
                          <Chip key={i} label={c.name} size="small" color="primary" variant="outlined" />
                        ))}
                      {row.controls.filter((c) => c.type === 'prevention').length === 0 && '—'}
                    </Stack>
                  </TableCell>

                  {/* Detection Controls */}
                  <TableCell>
                    <Stack spacing={0.5}>
                      {row.controls
                        .filter((c) => c.type === 'detection')
                        .map((c, i) => (
                          <Tooltip title={c.detectionMethod || ''} key={i}>
                            <Chip label={c.name} size="small" color="success" variant="outlined" />
                          </Tooltip>
                        ))}
                      {row.controls.filter((c) => c.type === 'detection').length === 0 && '—'}
                    </Stack>
                  </TableCell>

                  {/* Occurrence (O) */}
                  <TableCell align="center">
                    <Select
                      value={row.occurrence || ''}
                      onChange={(e) => handleRatingChange(row.id, 'occurrence', Number(e.target.value))}
                      size="small"
                      sx={{ minWidth: 55, '& .MuiSelect-select': { py: 0.5, px: 1 } }}
                    >
                      <MenuItem value="">—</MenuItem>
                      {ratingOptions.map((v) => (
                        <MenuItem key={v} value={v}>
                          {v}
                        </MenuItem>
                      ))}
                    </Select>
                  </TableCell>

                  {/* Detection (D) */}
                  <TableCell align="center">
                    <Select
                      value={row.detection || ''}
                      onChange={(e) => handleRatingChange(row.id, 'detection', Number(e.target.value))}
                      size="small"
                      sx={{ minWidth: 55, '& .MuiSelect-select': { py: 0.5, px: 1 } }}
                    >
                      <MenuItem value="">—</MenuItem>
                      {ratingOptions.map((v) => (
                        <MenuItem key={v} value={v}>
                          {v}
                        </MenuItem>
                      ))}
                    </Select>
                  </TableCell>

                  {/* AP Badge */}
                  <TableCell align="center">{getApBadge(row.ap)}</TableCell>

                  {/* Actions */}
                  <TableCell align="center">
                    <Tooltip title="Create Corrective Action">
                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={() => {
                          setSelectedRowForAction(row);
                          setActionDialogOpen(true);
                        }}
                      >
                        <PlaylistAddIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => {
                        setActiveRow(row);
                        setEditorOpen(true);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
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

      {/* Row Editor Drawer */}
      <PfmeaRowEditor
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setActiveRow(null);
        }}
        row={activeRow}
        steps={steps}
        onSave={handleSaveRowDetails}
      />

      {/* Add Row Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Add PFMEA Analysis Row</DialogTitle>
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
                    {s.stepNumber} - {s.name} ({s.stepType})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleAddRow} variant="contained" disabled={!selectedStepId}>
            Add Row
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Corrective Action Dialog */}
      <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Create Corrective Action</DialogTitle>
        <DialogContent sx={{ minWidth: 400, pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Step 6 Optimization: Define preventive or corrective tasks to reduce S/O/D ratings.
            </Typography>

            <TextField
              label="Action Description / Task"
              multiline
              rows={3}
              value={actionDescription}
              onChange={(e: any) => setActionDescription(e.target.value)}
              placeholder="Define action to reduce occurrence or improve detection..."
              fullWidth
              size="small"
              required
            />

            <FormControl fullWidth size="small">
              <InputLabel>Assigned Owner</InputLabel>
              <Select
                value={actionOwnerId}
                label="Assigned Owner"
                onChange={(e: any) => setActionOwnerId(e.target.value as string)}
                required
              >
                {users.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Priority</InputLabel>
              <Select
                value={actionPriority}
                label="Priority"
                onChange={(e: any) => setActionPriority(e.target.value as string)}
              >
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>

            <TextField
              {...({
                label: "Due Date",
                type: "date",
                value: actionDueDate,
                onChange: (e: any) => setActionDueDate(e.target.value),
                InputLabelProps: { shrink: true },
                fullWidth: true,
                size: "small",
                required: true
              } as any)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleCreateAction}
            variant="contained"
            disabled={!actionDescription || !actionOwnerId || !actionDueDate}
          >
            Create Action
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
