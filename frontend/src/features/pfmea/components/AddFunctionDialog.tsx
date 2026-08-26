import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Box,
  CircularProgress,
  FormControl,
  FormLabel,
  Tabs,
  Tab,
  Stack,
  IconButton,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { API_BASE_URL } from '../../../config';

interface AddFunctionDialogProps {
  open: boolean;
  onClose: () => void;
  parentType: 'project' | 'process_step' | 'work_element' | null;
  parentId: string | null; // projectId, stepId, or `${stepId}::${weName}`
  projectId: string;
  token: string;
  onSuccess: () => void;
  editMode?: boolean;
  editNodeId?: string | null;
  initialNarration?: string;
  initialLocation?: 'your_plant' | 'ship_to' | 'end_user';
}

interface FunctionRow {
  narration: string;
}

const PARENT_LABELS: Record<string, string> = {
  project: 'Project',
  process_step: 'Process Step',
  work_element: 'Work Element',
};

export const AddFunctionDialog: React.FC<AddFunctionDialogProps> = ({
  open,
  onClose,
  parentType,
  parentId,
  projectId,
  token,
  onSuccess,
  editMode = false,
  editNodeId = null,
  initialNarration = '',
  initialLocation = 'your_plant',
}) => {
  const TextFieldAny = TextField as any;
  const [activeTab, setActiveTab] = useState<number>(0); // 0: Single, 1: Multiple

  // Single mode state
  const [narration, setNarration] = useState('');
  const [location, setLocation] = useState<'your_plant' | 'ship_to' | 'end_user'>('your_plant');

  // Multiple mode state
  const [rows, setRows] = useState<FunctionRow[]>([
    { narration: '' },
    { narration: '' },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (editMode) {
        setNarration(initialNarration);
        setLocation(initialLocation);
        setActiveTab(0);
      } else {
        setNarration('');
        setLocation('your_plant');
        setRows([
          { narration: '' },
          { narration: '' },
        ]);
        setActiveTab(0);
      }
      setError(null);
    }
  }, [open, editMode, initialNarration, initialLocation]);

  const handleClose = () => {
    setNarration('');
    setLocation('your_plant');
    setError(null);
    onClose();
  };

  const handleAddRow = () => {
    setRows((prev) => [...prev, { narration: '' }]);
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: keyof FunctionRow, val: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!parentType) return;
    if (!editMode && !parentId) return;
    setLoading(true);
    setError(null);

    try {
      if (editMode || activeTab === 0) {
        if (!narration.trim()) return;
        const url = editMode
          ? `${API_BASE_URL}/structure-functions/${editNodeId}`
          : `${API_BASE_URL}/structure-functions`;
        const method = editMode ? 'PATCH' : 'POST';
        const bodyData = editMode
          ? { narration: narration.trim(), location: parentType === 'project' ? location : undefined }
          : {
              projectId,
              parentType,
              parentId,
              narration: narration.trim(),
              location: parentType === 'project' ? location : 'your_plant',
            };

        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(bodyData),
        });

        if (!res.ok) {
          const e = await res.json();
          throw new Error(e.message || `Failed to ${editMode ? 'edit' : 'add'} function`);
        }
      } else {
        // Multiple mode batch submit
        const validRows = rows.filter((r) => r.narration.trim().length > 0);
        if (validRows.length === 0) {
          setError('Please enter at least one function narration.');
          setLoading(false);
          return;
        }

        const batchDtos = validRows.map((r) => ({
          projectId,
          parentType,
          parentId,
          narration: r.narration.trim(),
          location: parentType === 'project' ? location : 'your_plant',
        }));

        const res = await fetch(`${API_BASE_URL}/structure-functions/batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(batchDtos),
        });

        if (!res.ok) {
          const e = await res.json();
          throw new Error(e.message || 'Failed to add batch functions');
        }
      }

      handleClose();
      onSuccess();
    } catch (e: any) {
      setError(e.message || `Failed to ${editMode ? 'edit' : 'add'} function`);
    } finally {
      setLoading(false);
    }
  };

  if (!parentType) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      sx={{ '& .MuiDialog-paper': { borderTop: '4px solid #2e7d32' } }}
    >
      <DialogTitle sx={{ color: '#2e7d32', fontWeight: 'bold', pt: 2.5, pb: 1 }}>
        {editMode ? 'Edit' : 'Add'} Function / Requirement — {PARENT_LABELS[parentType]}
      </DialogTitle>
      <DialogContent>
        {!editMode && (
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
              <Tab label="Single Function" />
              <Tab label="Multiple Functions" />
            </Tabs>
          </Box>
        )}

        <Box sx={{ pt: 1 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {/* Single Mode or Edit Mode */}
          {(editMode || activeTab === 0) && (
            <>
              <TextFieldAny
                label="Function / Requirement Narration"
                value={narration}
                onChange={(e: any) => setNarration(e.target.value)}
                multiline
                rows={3}
                fullWidth
                size="small"
                placeholder="Describe what this element should accomplish..."
                sx={{ mb: 2 }}
                autoFocus
                InputLabelProps={{ shrink: true }}
              />
              {parentType === 'project' && (
                <FormControl component="fieldset" sx={{ mt: 1 }}>
                  <FormLabel component="legend" sx={{ fontWeight: 'bold', fontSize: '0.875rem', mb: 0.5 }}>
                    Location
                  </FormLabel>
                  <RadioGroup row value={location} onChange={(e) => setLocation(e.target.value as typeof location)}>
                    <FormControlLabel value="your_plant" control={<Radio size="small" />} label="Your Plant" />
                    <FormControlLabel value="ship_to" control={<Radio size="small" />} label="Ship To Plant" />
                    <FormControlLabel value="end_user" control={<Radio size="small" />} label="End User" />
                  </RadioGroup>
                </FormControl>
              )}
            </>
          )}

          {/* Multiple Mode */}
          {!editMode && activeTab === 1 && (
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                Enter multiple functions below. All functions will be added under this {PARENT_LABELS[parentType]}.
              </Typography>

              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#0f172a' }}>
                    <TableRow sx={{ bgcolor: '#0f172a' }}>
                      <TableCell sx={{ bgcolor: '#0f172a !important', color: '#ffffff !important', fontWeight: 'bold', fontSize: '0.75rem', letterSpacing: '0.04em', textTransform: 'uppercase', borderRight: '1px solid #334155', minWidth: 240 }}>
                        Function / Requirement Narration
                      </TableCell>
                      <TableCell sx={{ bgcolor: '#0f172a !important', color: '#ffffff !important', fontWeight: 'bold', fontSize: '0.75rem', letterSpacing: '0.04em', textTransform: 'uppercase', width: 60, textAlign: 'center' }}>
                        Action
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row, idx) => (
                      <TableRow key={idx} sx={{ bgcolor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                        <TableCell sx={{ p: 1, borderRight: '1px solid #e2e8f0' }}>
                          <TextFieldAny
                            value={row.narration}
                            onChange={(e: any) => handleRowChange(idx, 'narration', e.target.value)}
                            placeholder="e.g. Provide structural support to assembly..."
                            size="small"
                            fullWidth
                            variant="outlined"
                            sx={{ bgcolor: '#ffffff' }}
                          />
                        </TableCell>
                        <TableCell sx={{ p: 1, textAlign: 'center' }}>
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleRemoveRow(idx)}
                            disabled={rows.length <= 1}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Button
                startIcon={<AddIcon />}
                variant="outlined"
                size="small"
                onClick={handleAddRow}
                sx={{ alignSelf: 'flex-start' }}
              >
                + Add Row
              </Button>
            </Stack>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={
            loading ||
            (activeTab === 0 && !narration.trim()) ||
            (activeTab === 1 && rows.every((r) => !r.narration.trim()))
          }
          variant="contained"
          sx={{ bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? (editMode ? 'Saving...' : 'Adding...') : 'OK'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
