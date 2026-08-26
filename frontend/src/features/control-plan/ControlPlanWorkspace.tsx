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
  Grid,
  Divider,
  TablePagination,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Sync as SyncIcon,
} from '@mui/icons-material';
import { useAuth } from '../auth/AuthContext';
import { API_BASE_URL } from '../../config';
import { dialogSelectProps } from '../../theme/muiSelectConfig';
import { DocumentHeader } from '../../components/DocumentHeader';
import { ReportExporter } from '../reports/ReportExporter';
import { useToast, getToastSeverity } from '../../components/Toast/ToastProvider';
import { parseApiError } from '../../lib/api';
import { unwrapPaginated } from '../../lib/pagination';

interface ProcessStep {
  id: string;
  stepNumber: string;
  name: string;
  isOrphaned?: boolean;
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
  linkedPfmeaRows?: any[];
}

export const ControlPlanWorkspace: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { token } = useAuth();
  const { showToast } = useToast();

  // Project Document Revisions
  const [cpRevisionId, setCpRevisionId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>('');

  // Data states
  const [rows, setRows] = useState<ControlPlanRow[]>([]);
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);

  // FMEA reference states for split screen
  const [showSplitScreen, setShowSplitScreen] = useState(false);
  const [pfmeaRows, setPfmeaRows] = useState<any[]>([]);

  // Dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState('');
  const [selectedCharId, setSelectedCharId] = useState('');
  const [controlType, setControlType] = useState('detection');
  const [controlMethod, setControlMethod] = useState('');

  // Exporter Dialog state
  const [exporterOpen, setExporterOpen] = useState(false);

  // Load project Control Plan revision
  useEffect(() => {
    const resolveContext = async () => {
      setLoading(true);
      setError(null);
      try {
        const projResponse = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (projResponse.ok) {
          const projData = await projResponse.json();
          setProjectName(projData.name);
        }

        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/documents`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const msg = await parseApiError(response, 'Failed to resolve project document context.');
          throw new Error(msg);
        }
        const documents = await response.json();

        const cpDoc = documents.find((doc: any) => doc.type === 'CONTROL_PLAN');

        if (!cpDoc || !cpDoc.currentRevisionId) {
          throw new Error('Control Plan document context not initialized.');
        }

        setCpRevisionId(cpDoc.currentRevisionId);
      } catch (err: any) {
        const msg = err.message || 'An error occurred while loading project context.';
        setError(msg);
        showToast(msg, getToastSeverity(msg));
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
      const rowsResponse = await fetch(`${API_BASE_URL}/revisions/${cpRevisionId}/control-plan-rows?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!rowsResponse.ok) {
        const msg = await parseApiError(rowsResponse, 'Failed to load Control Plan rows');
        throw new Error(msg);
      }
      const payload = await rowsResponse.json();
      const { data, total: t } = unwrapPaginated<ControlPlanRow>(payload);
      setRows(data);
      setTotal(t);

      // 2. Fetch Process Steps and FMEA Rows
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

      const pfmeaDoc = docs.find((d: any) => d.type === 'PFMEA');
      if (pfmeaDoc && pfmeaDoc.currentRevisionId) {
        const pfmeaResponse = await fetch(`${API_BASE_URL}/revisions/${pfmeaDoc.currentRevisionId}/pfmea-rows?limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (pfmeaResponse.ok) {
          const pfmeaPayload = await pfmeaResponse.json();
          const { data } = unwrapPaginated<any>(pfmeaPayload);
          setPfmeaRows(data);
        }
      }
    } catch (err: any) {
      const msg = err.message || 'Could not load Control Plan workspace.';
      setError(msg);
      showToast(msg, getToastSeverity(msg));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cpRevisionId) {
      fetchData();
    }
  }, [cpRevisionId, page, limit]);

  useEffect(() => { setPage(1); }, [cpRevisionId]);

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
        const msg = await parseApiError(response, 'Synchronization failed.');
        throw new Error(msg);
      }

      const result = await response.json();
      setSuccess(result.message || 'Successfully synchronized Control Plan with FMEA.');
      await fetchData();
    } catch (err: any) {
      const msg = err.message || 'FMEA Control Plan synchronization failed.';
      setError(msg);
      showToast(msg, getToastSeverity(msg));
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncFromPfd = async () => {
    if (!cpRevisionId) return;
    setSyncing(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`${API_BASE_URL}/revisions/${cpRevisionId}/control-plan-rows/sync-pfd`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const msg = await parseApiError(response, 'Synchronization failed.');
        throw new Error(msg);
      }

      const result = await response.json();
      setSuccess(result.message || 'Successfully synchronized Control Plan with PFD.');
      await fetchData();
    } catch (err: any) {
      const msg = err.message || 'PFD Control Plan synchronization failed.';
      setError(msg);
      showToast(msg, getToastSeverity(msg));
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
        const msg = await parseApiError(response, 'Failed to create Control Plan row.');
        throw new Error(msg);
      }

      await fetchData();
      setSelectedStepId('');
      setSelectedCharId('');
      setControlMethod('');
    } catch (err: any) {
      const msg = err.message || 'Error occurred while adding Control Plan row.';
      setError(msg);
      showToast(msg, getToastSeverity(msg));
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
        const msg = await parseApiError(response, 'Failed to save cell update.');
        throw new Error(msg);
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to update field. Reverting...';
      setError(msg);
      showToast(msg, getToastSeverity(msg));
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
        const msg = await parseApiError(response, 'Failed to delete row.');
        throw new Error(msg);
      }

      await fetchData();
    } catch (err: any) {
      const msg = err.message || 'Could not delete Control Plan row.';
      setError(msg);
      showToast(msg, getToastSeverity(msg));
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
            startIcon={syncing ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}
            onClick={handleSyncFromPfd}
            disabled={syncing}
          >
            {syncing ? 'Syncing...' : 'Sync from PFD'}
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={syncing ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}
            onClick={handleSyncFromFmea}
            disabled={syncing}
          >
            {syncing ? 'Syncing...' : 'Sync from FMEA'}
          </Button>
          <Button
            variant="outlined"
            onClick={() => setShowSplitScreen(!showSplitScreen)}
            color={showSplitScreen ? 'primary' : 'inherit'}
          >
            {showSplitScreen ? 'Hide FMEA Linkage' : 'Show FMEA Linkage'}
          </Button>
          <Button
            variant="outlined"
            onClick={() => setExporterOpen(true)}
            color="primary"
          >
            Export Document
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

      {/* Main Grid Wrapper */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {showSplitScreen && (
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper sx={{ p: 2, border: '1px solid rgba(40, 37, 29, 0.1)', borderRadius: 3, boxShadow: 'none', bgcolor: 'background.paper' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                PFMEA Risk Controls Reference
              </Typography>
              <Stack spacing={2} sx={{ maxHeight: 600, overflowY: 'auto', pr: 1 }}>
                {pfmeaRows.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No active PFMEA rows found. Create rows in PFMEA to see them here.
                  </Typography>
                ) : (
                  pfmeaRows.map((fmeaRow: any) => (
                    <Paper 
                      key={fmeaRow.id} 
                      sx={{ 
                        p: 1.5, 
                        border: '1px solid rgba(40, 37, 29, 0.08)', 
                        bgcolor: '#F7F6F2', 
                        borderRadius: 2,
                        boxShadow: 'none'
                      }}
                    >
                      <Stack direction="row" sx={{ mb: 1, alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'primary.contrastText', px: 1, py: 0.25, borderRadius: 1 }}>
                          Step {fmeaRow.processStep?.stepNumber}
                        </Typography>
                        {fmeaRow.ap && (
                          <Chip 
                            label={`AP: ${fmeaRow.ap}`} 
                            size="small" 
                            color={fmeaRow.ap === 'H' ? 'error' : fmeaRow.ap === 'M' ? 'warning' : 'success'} 
                            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 'bold' }}
                          />
                        )}
                      </Stack>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {fmeaRow.processStep?.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        Failure Mode: {fmeaRow.failureModes?.[0]?.name || '—'}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                        Controls (Prevention / Detection):
                      </Typography>
                      <Stack spacing={0.5}>
                        {fmeaRow.controls?.map((ctrl: any, idx: number) => (
                          <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.paper', p: 0.75, borderRadius: 1, border: '1px solid rgba(40, 37, 29, 0.04)' }}>
                            <Typography variant="caption" sx={{ fontWeight: 500 }}>
                              {ctrl.control?.name}
                            </Typography>
                            <Chip 
                              label={ctrl.control?.type?.toUpperCase()} 
                              size="small" 
                              variant="outlined"
                              sx={{ height: 14, fontSize: '0.55rem', px: 0.5 }} 
                            />
                          </Box>
                        ))}
                        {(!fmeaRow.controls || fmeaRow.controls.length === 0) && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            No controls defined
                          </Typography>
                        )}
                      </Stack>
                    </Paper>
                  ))
                )}
              </Stack>
            </Paper>
          </Grid>
        )}
        <Grid size={{ xs: 12, md: showSplitScreen ? 7 : 12 }}>
          <>
          <TableContainer component={Paper} sx={{ border: '1px solid rgba(40, 37, 29, 0.1)', borderRadius: 3, bgcolor: 'background.paper', overflowX: 'auto', boxShadow: 'none' }}>
        <Table aria-label="Control Plan grid" size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#F7F6F2' }}>
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
                <TableRow key={row.id} sx={{ '&:hover': { bgcolor: 'rgba(40, 37, 29, 0.01)' } }}>
                  {/* Row Number */}
                  <TableCell sx={{ fontWeight: 'bold' }}>{row.rowNumber}</TableCell>

                  {/* Process Step */}
                  <TableCell>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {row.processStep?.stepNumber}
                      </Typography>
                      {row.linkedPfmeaRows && row.linkedPfmeaRows.length > 0 ? (
                        <Chip
                          label="FMEA"
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ height: 16, fontSize: '0.6rem', px: 0.5 }}
                        />
                      ) : (
                        <Chip
                          label="PFD"
                          size="small"
                          color="success"
                          variant="outlined"
                          sx={{ height: 16, fontSize: '0.6rem', px: 0.5 }}
                        />
                      )}
                      {row.processStep?.isOrphaned && (
                        <Chip
                          label="PFD Detached"
                          size="small"
                          color="error"
                          variant="outlined"
                          sx={{ height: 16, fontSize: '0.6rem', px: 0.5, fontWeight: 700 }}
                        />
                      )}
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {row.processStep?.name}
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
        <TablePagination
          component="div"
          count={total}
          page={page-1}
          onPageChange={(_,newPage)=> setPage(newPage+1)}
          rowsPerPage={limit}
          onRowsPerPageChange={e=> { setLimit(parseInt(e.target.value,10)); setPage(1); }}
          rowsPerPageOptions={[10,25,50]}
        />
        </>
        </Grid>
      </Grid>

      {/* Add Row Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Add Control Plan Row</DialogTitle>
        <DialogContent sx={{ minWidth: 400, pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Process Step</InputLabel>
              <Select
                {...dialogSelectProps}
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
                {...dialogSelectProps}
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

      <ReportExporter
        open={exporterOpen}
        onClose={() => setExporterOpen(false)}
        docType="CONTROL_PLAN"
        projectName={projectName}
        data={rows}
        steps={steps}
      />
    </Box>
  );
};

export default ControlPlanWorkspace;