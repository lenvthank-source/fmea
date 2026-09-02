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
import { Add as AddIcon, Delete as DeleteIcon, Close as CloseIcon } from '@mui/icons-material';
import { API_BASE_URL } from '../../../config';
import { useToast, getToastSeverity } from '../../../components/Toast/ToastProvider';
import { parseApiError } from '../../../lib/api';
import { HierarchyBreadcrumbs } from '../../../components/HierarchyBreadcrumbs';
import type { BreadcrumbItem } from '../../../components/HierarchyBreadcrumbs';

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
  hierarchyChain?: BreadcrumbItem[];
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
  hierarchyChain,
}) => {
  const { showToast } = useToast();
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
          const msg = await parseApiError(res, `Failed to ${editMode ? 'edit' : 'add'} function`);
          throw new Error(msg);
        }
      } else {
        // Multiple mode batch submit
        const validRows = rows.filter((r) => r.narration.trim().length > 0);
        if (validRows.length === 0) {
          const msg = 'Please enter at least one function narration.';
          setError(msg);
          showToast(msg, getToastSeverity(msg));
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
          const msg = await parseApiError(res, 'Failed to add batch functions');
          throw new Error(msg);
        }
      }

      handleClose();
      onSuccess();
    } catch (e: any) {
      const msg = e.message || `Failed to ${editMode ? 'edit' : 'add'} function`;
      setError(msg);
      showToast(msg, getToastSeverity(msg));
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
      slotProps={{
        paper: {
          sx: {
            borderRadius: '12px',
            border: '1px solid #e4e4e7',
            boxShadow: '0 20px 40px -8px rgba(0,0,0,0.12)',
            p: 0,
            overflow: 'hidden'
          }
        }
      }}
    >
      <DialogTitle sx={{ px: 3, py: 2, borderBottom: '1px solid #f4f4f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#ffffff' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#09090b' }}>
              {editMode ? 'Edit' : 'Add'} Function / Requirement
            </Typography>
            <Box
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: '4px',
                fontSize: '0.675rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                bgcolor: '#dcfce7',
                color: '#15803d'
              }}
            >
              {PARENT_LABELS[parentType]}
            </Box>
          </Box>
          <Typography sx={{ fontSize: '0.75rem', color: '#71717a', mt: 0.25 }}>
            Define process function or technical requirement in the 7-step quality tree
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small" sx={{ color: '#71717a', '&:hover': { bgcolor: '#f4f4f5' } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ px: 3, py: 2.5, bgcolor: '#ffffff' }}>
        <HierarchyBreadcrumbs items={hierarchyChain} />
        {!editMode && (
          <Box sx={{ mb: 2.5, display: 'inline-flex', p: '3px', bgcolor: '#f4f4f5', borderRadius: '8px', border: '1px solid #e4e4e7' }}>
            <Box
              onClick={() => setActiveTab(0)}
              sx={{
                px: 2,
                py: 0.65,
                borderRadius: '6px',
                cursor: 'pointer',
                bgcolor: activeTab === 0 ? '#ffffff' : 'transparent',
                color: activeTab === 0 ? '#09090b' : '#71717a',
                fontWeight: activeTab === 0 ? 700 : 500,
                fontSize: '0.8rem',
                boxShadow: activeTab === 0 ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Single Function
            </Box>
            <Box
              onClick={() => setActiveTab(1)}
              sx={{
                px: 2,
                py: 0.65,
                borderRadius: '6px',
                cursor: 'pointer',
                bgcolor: activeTab === 1 ? '#ffffff' : 'transparent',
                color: activeTab === 1 ? '#09090b' : '#71717a',
                fontWeight: activeTab === 1 ? 700 : 500,
                fontSize: '0.8rem',
                boxShadow: activeTab === 1 ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Multiple Functions
            </Box>
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

              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', border: '1px solid #e4e4e7', overflow: 'hidden', boxShadow: 'none' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#fafafa' }}>
                    <TableRow sx={{ bgcolor: '#fafafa', borderBottom: '1px solid #e4e4e7' }}>
                      <TableCell sx={{ color: '#71717a !important', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase', borderRight: '1px solid #e4e4e7', minWidth: 240, py: 1.25 }}>
                        Function / Requirement Narration
                      </TableCell>
                      <TableCell sx={{ color: '#71717a !important', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase', width: 64, textAlign: 'center', py: 1.25 }}>
                        Action
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row, idx) => (
                      <TableRow key={idx} sx={{ bgcolor: idx % 2 === 0 ? '#ffffff' : '#fafafa', '&:hover': { bgcolor: '#f4f4f5' } }}>
                        <TableCell sx={{ p: 1, borderRight: '1px solid #e4e4e7', borderBottom: '1px solid #e4e4e7' }}>
                          <TextFieldAny
                            value={row.narration}
                            onChange={(e: any) => handleRowChange(idx, 'narration', e.target.value)}
                            placeholder="e.g. Provide structural support to assembly..."
                            size="small"
                            fullWidth
                            variant="outlined"
                            sx={{
                              bgcolor: '#ffffff',
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '6px',
                                fontSize: '0.8125rem',
                                '& fieldset': { borderColor: '#e4e4e7' },
                                '&:hover fieldset': { borderColor: '#a1a1aa' },
                                '&.Mui-focused fieldset': { borderColor: '#09090b' },
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ p: 1, textAlign: 'center', borderBottom: '1px solid #e4e4e7' }}>
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveRow(idx)}
                            disabled={rows.length <= 1}
                            sx={{
                              color: '#a1a1aa',
                              '&:hover': { color: '#ef4444', bgcolor: '#fee2e2' },
                              '&.Mui-disabled': { color: '#e4e4e7' }
                            }}
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
                startIcon={<AddIcon fontSize="small" />}
                variant="outlined"
                size="small"
                onClick={handleAddRow}
                sx={{
                  alignSelf: 'flex-start',
                  bgcolor: '#ffffff',
                  color: '#09090b',
                  border: '1px solid #e4e4e7',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  textTransform: 'none',
                  borderRadius: '7px',
                  px: 2,
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#f4f4f5', borderColor: '#d4d4d8' }
                }}
              >
                Add Row
              </Button>
            </Stack>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #f4f4f5', bgcolor: '#fafafa' }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          size="small"
          sx={{
            color: '#71717a',
            fontSize: '0.8125rem',
            fontWeight: 600,
            textTransform: 'none',
            borderRadius: '6px',
            border: '1px solid #e4e4e7',
            bgcolor: '#ffffff',
            px: 2,
            '&:hover': { bgcolor: '#f4f4f5', borderColor: '#d4d4d8' }
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={
            loading ||
            (activeTab === 0 && !narration.trim()) ||
            (activeTab === 1 && rows.every((r) => !r.narration.trim()))
          }
          size="small"
          variant="contained"
          sx={{
            bgcolor: '#09090b',
            color: '#ffffff',
            fontSize: '0.8125rem',
            fontWeight: 600,
            textTransform: 'none',
            borderRadius: '6px',
            px: 2.5,
            boxShadow: 'none',
            '&:hover': { bgcolor: '#27272a', boxShadow: 'none' }
          }}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? (editMode ? 'Saving...' : 'Adding...') : (editMode ? 'Save Changes' : 'Add Function')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};