import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Stack,
  IconButton,
  Alert,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useAuth } from '../auth/AuthContext';
import { RatingDropdown } from '../pfmea/components/RatingDropdown';
import { API_BASE_URL } from '../../config';
import { TREE_COLORS, TREE_TYPOGRAPHY, TREE_ASSETS } from '../shared/fmeaTreeStyles';

interface EditPackageDialogProps {
  open: boolean;
  onClose: () => void;
  pkg: any;
  onSuccess: () => void;
}

export const EditPackageDialog: React.FC<EditPackageDialogProps> = ({
  open,
  onClose,
  pkg,
  onSuccess,
}) => {
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [functions, setFunctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (pkg) {
      setName(pkg.name || '');
      setDescription(pkg.description || '');
      const rawFunctions = pkg.packageData?.functions || [];
      const clonedFunctions = rawFunctions.map((fn: any) => ({
        name: fn.name || fn.narration || '',
        description: fn.description || '',
        failures: (fn.failures || []).map((fail: any) => ({
          name: fail.name || fail.narration || '',
          severity: fail.severity || fail.severityRating || null,
          occurrence: fail.occurrence || fail.occurrenceRating || null,
          detection: fail.detection || fail.detectionRating || null,
          preventionControl: fail.preventionControl || fail.currentControlPrevention || '',
          detectionControl: fail.detectionControl || fail.currentControlDetection || '',
          filterCode: fail.filterCode || '',
        })),
      }));
      setFunctions(clonedFunctions);
    }
  }, [pkg]);

  const handleAddFunction = () => {
    setFunctions([
      ...functions,
      {
        name: '',
        description: '',
        failures: [
          {
            name: '',
            occurrence: null,
            detection: null,
            preventionControl: '',
            detectionControl: '',
            filterCode: '',
          },
        ],
      },
    ]);
  };

  const handleRemoveFunction = (fnIdx: number) => {
    setFunctions(functions.filter((_, idx) => idx !== fnIdx));
  };

  const handleFunctionChange = (fnIdx: number, field: string, val: any) => {
    const updated = [...functions];
    updated[fnIdx] = { ...updated[fnIdx], [field]: val };
    setFunctions(updated);
  };

  const handleAddFailure = (fnIdx: number) => {
    const updated = [...functions];
    const failures = updated[fnIdx].failures || [];
    updated[fnIdx].failures = [
      ...failures,
      {
        name: '',
        occurrence: null,
        detection: null,
        preventionControl: '',
        detectionControl: '',
        filterCode: '',
      },
    ];
    setFunctions(updated);
  };

  const handleRemoveFailure = (fnIdx: number, failIdx: number) => {
    const updated = [...functions];
    updated[fnIdx].failures = updated[fnIdx].failures.filter((_: any, idx: number) => idx !== failIdx);
    setFunctions(updated);
  };

  const handleFailureChange = (fnIdx: number, failIdx: number, field: string, val: any) => {
    const updated = [...functions];
    const failures = [...updated[fnIdx].failures];
    failures[failIdx] = { ...failures[failIdx], [field]: val };
    updated[fnIdx].failures = failures;
    setFunctions(updated);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Package name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const bodyData = {
        name: name.trim(),
        description: description.trim() || null,
        packageData: {
          functions: functions.map((fn) => ({
            name: fn.name.trim(),
            description: fn.description?.trim() || null,
            failures: (fn.failures || []).map((fail: any) => ({
              name: fail.name.trim(),
              severity: fail.severity || null,
              occurrence: fail.occurrence || null,
              detection: fail.detection || null,
              preventionControl: fail.preventionControl?.trim() || null,
              detectionControl: fail.detectionControl?.trim() || null,
              filterCode: fail.filterCode?.trim() || null,
            })),
          })),
        },
      };

      const res = await fetch(`${API_BASE_URL}/repository/packages/${pkg.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to update package');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update package');
    } finally {
      setLoading(false);
    }
  };

  const TextFieldAny = TextField as any;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle
        sx={{
          fontWeight: 700,
          fontSize: '16px',
          color: TREE_COLORS.nodeText.workElem,
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box
          component="img"
          src={TREE_ASSETS.workElement}
          alt="Work Element"
          sx={{ width: 24, height: 24, objectFit: 'contain' }}
        />
        Edit Work Element Package — {pkg?.name}
      </DialogTitle>
      <DialogContent sx={{ pt: 2.5 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Stack spacing={2.5}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextFieldAny
              label="Work Element Package Name"
              value={name}
              onChange={(e: any) => setName(e.target.value)}
              fullWidth
              size="small"
              required
            />
            <TextFieldAny
              label="Description / Category"
              value={description}
              onChange={(e: any) => setDescription(e.target.value)}
              fullWidth
              size="small"
            />
          </Box>

          <Divider />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#0f172a' }}>
              Package Functions & Failure Causes
            </Typography>
            <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={handleAddFunction}>
              + Add Function
            </Button>
          </Box>

          {functions.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', bgcolor: '#f8fafc' }}>
              <Typography color="text.secondary">No functions in this package. Click "+ Add Function" to create one.</Typography>
            </Paper>
          ) : (
            functions.map((fn, fnIdx) => (
              <Paper key={fnIdx} variant="outlined" sx={{ p: 2, bgcolor: '#ffffff', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      component="img"
                      src={TREE_ASSETS.function}
                      alt="Function"
                      sx={{ width: 22, height: 22, objectFit: 'contain' }}
                    />
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontSize: '15px',
                        fontWeight: 600,
                        color: TREE_COLORS.nodeText.function,
                      }}
                    >
                      Function #{fnIdx + 1}
                    </Typography>
                  </Box>
                  <IconButton color="error" size="small" onClick={() => handleRemoveFunction(fnIdx)} disabled={functions.length <= 1}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 2, mb: 2 }}>
                  <TextFieldAny
                    label="Function Narration"
                    value={fn.name}
                    onChange={(e: any) => handleFunctionChange(fnIdx, 'name', e.target.value)}
                    size="small"
                    fullWidth
                    placeholder="e.g. Maintaining pressing length..."
                  />
                  <TextFieldAny
                    label="Description / Spec (Optional)"
                    value={fn.description}
                    onChange={(e: any) => handleFunctionChange(fnIdx, 'description', e.target.value)}
                    size="small"
                    fullWidth
                    placeholder="e.g. Spec tolerance ± 0.1 mm..."
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Box
                    component="img"
                    src={TREE_ASSETS.failure}
                    alt="Failure"
                    sx={{ width: 20, height: 20, objectFit: 'contain' }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: TREE_COLORS.nodeText.failure,
                      display: 'block',
                    }}
                  >
                    Nested Failure Causes for Function #{fnIdx + 1}:
                  </Typography>
                </Box>

                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden', mb: 1.5 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#0f172a' }}>
                      <TableRow sx={{ bgcolor: '#0f172a' }}>
                        <TableCell sx={{ bgcolor: '#0f172a !important', color: '#ffffff !important', fontWeight: 'bold', fontSize: '0.75rem', borderRight: '1px solid #334155', minWidth: 180 }}>
                          Failure Cause Narration
                        </TableCell>
                        <TableCell sx={{ bgcolor: '#0f172a !important', color: '#ffffff !important', fontWeight: 'bold', fontSize: '0.75rem', borderRight: '1px solid #334155', minWidth: 160 }}>
                          Prevention Control
                        </TableCell>
                        <TableCell sx={{ bgcolor: '#0f172a !important', color: '#ffffff !important', fontWeight: 'bold', fontSize: '0.75rem', borderRight: '1px solid #334155', width: 85 }}>
                          OCC
                        </TableCell>
                        <TableCell sx={{ bgcolor: '#0f172a !important', color: '#ffffff !important', fontWeight: 'bold', fontSize: '0.75rem', borderRight: '1px solid #334155', minWidth: 160 }}>
                          Detection Control
                        </TableCell>
                        <TableCell sx={{ bgcolor: '#0f172a !important', color: '#ffffff !important', fontWeight: 'bold', fontSize: '0.75rem', borderRight: '1px solid #334155', width: 85 }}>
                          DET
                        </TableCell>
                        <TableCell sx={{ bgcolor: '#0f172a !important', color: '#ffffff !important', fontWeight: 'bold', fontSize: '0.75rem', borderRight: '1px solid #334155', minWidth: 110 }}>
                          Filter Code
                        </TableCell>
                        <TableCell sx={{ bgcolor: '#0f172a !important', color: '#ffffff !important', fontWeight: 'bold', fontSize: '0.75rem', width: 50, textAlign: 'center' }}>
                          Action
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(fn.failures || []).map((fail: any, failIdx: number) => (
                        <TableRow key={failIdx} sx={{ bgcolor: failIdx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                          <TableCell sx={{ p: 0.8, borderRight: '1px solid #e2e8f0' }}>
                            <TextFieldAny
                              value={fail.name}
                              onChange={(e: any) => handleFailureChange(fnIdx, failIdx, 'name', e.target.value)}
                              placeholder="Cause narration..."
                              size="small"
                              fullWidth
                            />
                          </TableCell>
                          <TableCell sx={{ p: 0.8, borderRight: '1px solid #e2e8f0' }}>
                            <TextFieldAny
                              value={fail.preventionControl}
                              onChange={(e: any) => handleFailureChange(fnIdx, failIdx, 'preventionControl', e.target.value)}
                              placeholder="Prevention..."
                              size="small"
                              fullWidth
                            />
                          </TableCell>
                          <TableCell sx={{ p: 0.8, borderRight: '1px solid #e2e8f0' }}>
                            <RatingDropdown
                              ratingType="occurrence"
                              value={fail.occurrence}
                              onChange={(val) => handleFailureChange(fnIdx, failIdx, 'occurrence', val)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell sx={{ p: 0.8, borderRight: '1px solid #e2e8f0' }}>
                            <TextFieldAny
                              value={fail.detectionControl}
                              onChange={(e: any) => handleFailureChange(fnIdx, failIdx, 'detectionControl', e.target.value)}
                              placeholder="Detection..."
                              size="small"
                              fullWidth
                            />
                          </TableCell>
                          <TableCell sx={{ p: 0.8, borderRight: '1px solid #e2e8f0' }}>
                            <RatingDropdown
                              ratingType="detection"
                              value={fail.detection}
                              onChange={(val) => handleFailureChange(fnIdx, failIdx, 'detection', val)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell sx={{ p: 0.8, borderRight: '1px solid #e2e8f0' }}>
                            <TextFieldAny
                              value={fail.filterCode}
                              onChange={(e: any) => handleFailureChange(fnIdx, failIdx, 'filterCode', e.target.value)}
                              placeholder="FC-01..."
                              size="small"
                              fullWidth
                            />
                          </TableCell>
                          <TableCell sx={{ p: 0.8, textAlign: 'center' }}>
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleRemoveFailure(fnIdx, failIdx)}
                              disabled={(fn.failures || []).length <= 1}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Button startIcon={<AddIcon />} size="small" variant="text" onClick={() => handleAddFailure(fnIdx)}>
                  + Add Failure Cause to Function #{fnIdx + 1}
                </Button>
              </Paper>
            ))
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading || !name.trim()}
          variant="contained"
          color="primary"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? 'Saving...' : 'Save Package Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
