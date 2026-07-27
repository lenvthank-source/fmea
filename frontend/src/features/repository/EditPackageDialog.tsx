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
  Collapse,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  KeyboardArrowRight as CollapseChevron,
  KeyboardArrowDown as ExpandChevron,
  UnfoldMore as ExpandAllIcon,
  UnfoldLess as CollapseAllIcon,
} from '@mui/icons-material';
import { useAuth } from '../auth/AuthContext';
import { RatingDropdown } from '../pfmea/components/RatingDropdown';
import { API_BASE_URL } from '../../config';
import { TREE_COLORS, TREE_ASSETS } from '../shared/fmeaTreeStyles';

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
  const [expandedFunctions, setExpandedFunctions] = useState<Record<number, boolean>>({});
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

      // Expand all functions by default
      const initialExpanded: Record<number, boolean> = {};
      clonedFunctions.forEach((_: any, idx: number) => {
        initialExpanded[idx] = true;
      });
      setExpandedFunctions(initialExpanded);
    }
  }, [pkg]);

  const toggleFunctionExpand = (fnIdx: number) => {
    setExpandedFunctions((prev) => ({ ...prev, [fnIdx]: !prev[fnIdx] }));
  };

  const handleExpandAll = () => {
    const allExpanded: Record<number, boolean> = {};
    functions.forEach((_, idx) => {
      allExpanded[idx] = true;
    });
    setExpandedFunctions(allExpanded);
  };

  const handleCollapseAll = () => {
    setExpandedFunctions({});
  };

  const handleAddFunction = () => {
    const newFnIdx = functions.length;
    setFunctions([
      ...functions,
      {
        name: '',
        description: '',
        failures: [
          {
            name: '',
            severity: null,
            occurrence: null,
            detection: null,
            preventionControl: '',
            detectionControl: '',
            filterCode: '',
          },
        ],
      },
    ]);
    setExpandedFunctions((prev) => ({ ...prev, [newFnIdx]: true }));
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
        severity: null,
        occurrence: null,
        detection: null,
        preventionControl: '',
        detectionControl: '',
        filterCode: '',
      },
    ];
    setFunctions(updated);
    setExpandedFunctions((prev) => ({ ...prev, [fnIdx]: true }));
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
      setError('Work Element Package name is required');
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
      {/* Header Banner matching PFMEA Structure Tree Header */}
      <DialogTitle
        sx={{
          bgcolor: '#0f172a',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            component="img"
            src={TREE_ASSETS.workElement}
            alt="Work Element"
            sx={{ width: 26, height: 26, objectFit: 'contain', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
          />
          <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
            Work Element Package Tree Editor — {name || pkg?.name}
          </Typography>
        </Box>
        <Chip
          label="PFMEA Structure Tree View"
          size="small"
          sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#ffffff', fontWeight: 600, fontSize: '0.75rem' }}
        />
      </DialogTitle>

      <DialogContent sx={{ pt: 2.5, bgcolor: '#f8fafc' }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Action Toolbar matching PfmeaStructureTree */}
        <Paper variant="outlined" sx={{ p: 1.5, mb: 2.5, bgcolor: '#ffffff', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                color="primary"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddFunction}
              >
                + Add Function
              </Button>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Expand All Tree Nodes">
                <Button size="small" variant="outlined" startIcon={<ExpandAllIcon />} onClick={handleExpandAll}>
                  Expand All
                </Button>
              </Tooltip>
              <Tooltip title="Collapse All Tree Nodes">
                <Button size="small" variant="outlined" startIcon={<CollapseAllIcon />} onClick={handleCollapseAll}>
                  Collapse All
                </Button>
              </Tooltip>
            </Stack>
          </Box>
        </Paper>

        <Stack spacing={2.5}>
          {/* ROOT NODE: Work Element Package (Level 1 Root) */}
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              bgcolor: TREE_COLORS.selectedBg,
              borderLeft: `5px solid ${TREE_COLORS.selectedBorder}`,
              borderRadius: 2,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box
                component="img"
                src={TREE_ASSETS.workElement}
                alt="Work Element Root"
                sx={{ width: 24, height: 24, objectFit: 'contain' }}
              />
              <Typography
                variant="subtitle1"
                sx={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: TREE_COLORS.nodeText.workElem,
                }}
              >
                Work Element (Package Root)
              </Typography>
              <Chip label={`${functions.length} functions`} size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextFieldAny
                label="Work Element Name"
                value={name}
                onChange={(e: any) => setName(e.target.value)}
                fullWidth
                size="small"
                required
                sx={{ bgcolor: '#ffffff', borderRadius: 1 }}
              />
              <TextFieldAny
                label="Description / Category"
                value={description}
                onChange={(e: any) => setDescription(e.target.value)}
                fullWidth
                size="small"
                sx={{ bgcolor: '#ffffff', borderRadius: 1 }}
              />
            </Box>
          </Paper>

          {/* BRANCH NODES: Functions & Nested Failures */}
          {functions.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', bgcolor: '#ffffff', borderRadius: 2 }}>
              <Typography color="text.secondary">No functions in this package. Click "+ Add Function" above to add one.</Typography>
            </Paper>
          ) : (
            functions.map((fn, fnIdx) => {
              const isExpanded = Boolean(expandedFunctions[fnIdx]);
              const failCount = (fn.failures || []).length;

              return (
                <Box
                  key={fnIdx}
                  sx={{
                    ml: 3,
                    pl: 2,
                    borderLeft: `2px solid ${TREE_COLORS.connectorLine}`,
                    position: 'relative',
                  }}
                >
                  {/* FUNCTION NODE HEADER */}
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      bgcolor: '#ffffff',
                      borderRadius: 2,
                      borderLeft: `4px solid ${TREE_COLORS.iconBorder.function}`,
                      transition: 'all 0.2s ease',
                      '&:hover': { bgcolor: TREE_COLORS.hoverBg },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton size="small" onClick={() => toggleFunctionExpand(fnIdx)} sx={{ color: TREE_COLORS.chevron }}>
                          {isExpanded ? <ExpandChevron /> : <CollapseChevron />}
                        </IconButton>

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
                          Function #{fnIdx + 1} {fn.name ? `— ${fn.name}` : ''}
                        </Typography>

                        <Chip
                          label={`${failCount} cause${failCount !== 1 ? 's' : ''}`}
                          size="small"
                          color="success"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      </Box>

                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="outlined"
                          color="success"
                          startIcon={<AddIcon />}
                          onClick={() => handleAddFailure(fnIdx)}
                        >
                          + Add Cause
                        </Button>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleRemoveFunction(fnIdx)}
                          disabled={functions.length <= 1}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Box>

                    {/* Function Narration & Spec Controls */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 2, ml: 4 }}>
                      <TextFieldAny
                        label="Function / Requirement Narration"
                        value={fn.name}
                        onChange={(e: any) => handleFunctionChange(fnIdx, 'name', e.target.value)}
                        size="small"
                        fullWidth
                        placeholder="e.g. Maintaining pressing length..."
                      />
                      <TextFieldAny
                        label="Description / Specification (Optional)"
                        value={fn.description}
                        onChange={(e: any) => handleFunctionChange(fnIdx, 'description', e.target.value)}
                        size="small"
                        fullWidth
                        placeholder="e.g. Tolerance ± 0.1 mm..."
                      />
                    </Box>

                    {/* FAILURE CAUSE LEAF NODES (Collapsible) */}
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <Box sx={{ mt: 2, ml: 4 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: TREE_COLORS.nodeText.failure,
                            display: 'block',
                            mb: 1.5,
                          }}
                        >
                          Nested Failure Causes for Function #{fnIdx + 1}:
                        </Typography>

                        <Stack spacing={1.5}>
                          {(fn.failures || []).map((fail: any, failIdx: number) => (
                            <Paper
                              key={failIdx}
                              variant="outlined"
                              sx={{
                                p: 1.5,
                                bgcolor: failIdx % 2 === 0 ? '#ffffff' : '#f8fafc',
                                borderLeft: `4px solid ${TREE_COLORS.iconBorder.failure}`,
                                borderRadius: 1.5,
                                ml: 2,
                                pl: 2,
                                borderLeftStyle: 'solid',
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box
                                    component="img"
                                    src={TREE_ASSETS.failure}
                                    alt="Failure Cause"
                                    sx={{ width: 18, height: 18, objectFit: 'contain' }}
                                  />
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      fontSize: '13px',
                                      fontWeight: 600,
                                      color: TREE_COLORS.nodeText.failure,
                                    }}
                                  >
                                    Failure Cause #{failIdx + 1}
                                  </Typography>
                                </Box>
                                <IconButton
                                  color="error"
                                  size="small"
                                  onClick={() => handleRemoveFailure(fnIdx, failIdx)}
                                  disabled={(fn.failures || []).length <= 1}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>

                              {/* Extensive Failure Cause Input Grid */}
                              <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', gap: 1.5 }}>
                                <TextFieldAny
                                  label="Failure Cause Narration"
                                  value={fail.name}
                                  onChange={(e: any) => handleFailureChange(fnIdx, failIdx, 'name', e.target.value)}
                                  placeholder="Cause narration..."
                                  size="small"
                                  fullWidth
                                />
                                <TextFieldAny
                                  label="Prevention Control"
                                  value={fail.preventionControl}
                                  onChange={(e: any) =>
                                    handleFailureChange(fnIdx, failIdx, 'preventionControl', e.target.value)
                                  }
                                  placeholder="Prevention..."
                                  size="small"
                                  fullWidth
                                />
                                <Box>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                    OCC
                                  </Typography>
                                  <RatingDropdown
                                    ratingType="occurrence"
                                    value={fail.occurrence}
                                    onChange={(val) => handleFailureChange(fnIdx, failIdx, 'occurrence', val)}
                                    size="small"
                                  />
                                </Box>
                                <TextFieldAny
                                  label="Detection Control"
                                  value={fail.detectionControl}
                                  onChange={(e: any) =>
                                    handleFailureChange(fnIdx, failIdx, 'detectionControl', e.target.value)
                                  }
                                  placeholder="Detection..."
                                  size="small"
                                  fullWidth
                                />
                                <Box>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                    DET
                                  </Typography>
                                  <RatingDropdown
                                    ratingType="detection"
                                    value={fail.detection}
                                    onChange={(val) => handleFailureChange(fnIdx, failIdx, 'detection', val)}
                                    size="small"
                                  />
                                </Box>
                                <TextFieldAny
                                  label="Filter Code"
                                  value={fail.filterCode}
                                  onChange={(e: any) => handleFailureChange(fnIdx, failIdx, 'filterCode', e.target.value)}
                                  placeholder="FC-01..."
                                  size="small"
                                  fullWidth
                                />
                              </Box>
                            </Paper>
                          ))}
                        </Stack>
                      </Box>
                    </Collapse>
                  </Paper>
                </Box>
              );
            })
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, bgcolor: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
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
          {loading ? 'Saving Package Changes...' : 'Save Package Tree Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
