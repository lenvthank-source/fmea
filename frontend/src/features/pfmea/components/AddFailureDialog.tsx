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
  CircularProgress,
  Stack,
  Divider,
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
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { RatingDropdown } from './RatingDropdown';
import { API_BASE_URL } from '../../../config';
import { useToast, getToastSeverity } from '../../../components/Toast/ToastProvider';
import { parseApiError } from '../../../lib/api';
import { HierarchyBreadcrumbs } from '../../../components/HierarchyBreadcrumbs';
import type { BreadcrumbItem } from '../../../components/HierarchyBreadcrumbs';

interface AddFailureDialogProps {
  open: boolean;
  onClose: () => void;
  role: 'effect' | 'mode' | 'cause' | null;
  functionId: string | null; // ID of the parent StructureFunction
  functionNarration: string;
  token: string;
  onSuccess: () => void;
  editMode?: boolean;
  editNodeId?: string | null;
  initialNarration?: string;
  initialSeverityRating?: number | null;
  initialOccurrenceRating?: number | null;
  initialDetectionRating?: number | null;
  initialControlPrevention?: string;
  initialControlDetection?: string;
  initialFilterCode?: string;
  hierarchyChain?: BreadcrumbItem[];
}

interface FailureRow {
  narration: string;
  severityRating: number | null;
  occurrenceRating: number | null;
  detectionRating: number | null;
  currentControlPrevention: string;
  currentControlDetection: string;
  filterCode: string;
}

export const AddFailureDialog: React.FC<AddFailureDialogProps> = ({
  open,
  onClose,
  role,
  functionId,
  functionNarration,
  token,
  onSuccess,
  editMode = false,
  editNodeId = null,
  initialNarration = '',
  initialSeverityRating = null,
  initialOccurrenceRating = null,
  initialDetectionRating = null,
  initialControlPrevention = '',
  initialControlDetection = '',
  initialFilterCode = '',
  hierarchyChain,
}) => {
  const { showToast } = useToast();
  const TextFieldAny = TextField as any;
  const [activeTab, setActiveTab] = useState<number>(0); // 0: Single, 1: Multiple

  // Single mode state
  const [narration, setNarration] = useState('');
  const [severityRating, setSeverityRating] = useState<number | null>(null);
  const [occurrenceRating, setOccurrenceRating] = useState<number | null>(null);
  const [detectionRating, setDetectionRating] = useState<number | null>(null);
  const [currentControlPrevention, setCurrentControlPrevention] = useState('');
  const [currentControlDetection, setCurrentControlDetection] = useState('');
  const [filterCode, setFilterCode] = useState('');

  // Multiple mode state (cards)
  const [rows, setRows] = useState<FailureRow[]>([
    {
      narration: '',
      severityRating: null,
      occurrenceRating: null,
      detectionRating: null,
      currentControlPrevention: '',
      currentControlDetection: '',
      filterCode: '',
    },
    {
      narration: '',
      severityRating: null,
      occurrenceRating: null,
      detectionRating: null,
      currentControlPrevention: '',
      currentControlDetection: '',
      filterCode: '',
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (editMode) {
        setNarration(initialNarration);
        setSeverityRating(initialSeverityRating);
        setOccurrenceRating(initialOccurrenceRating);
        setDetectionRating(initialDetectionRating);
        setCurrentControlPrevention(initialControlPrevention);
        setCurrentControlDetection(initialControlDetection);
        setFilterCode(initialFilterCode);
        setActiveTab(0);
      } else {
        setNarration('');
        setSeverityRating(null);
        setOccurrenceRating(null);
        setDetectionRating(null);
        setCurrentControlPrevention('');
        setCurrentControlDetection('');
        setFilterCode('');
        setRows([
          {
            narration: '',
            severityRating: null,
            occurrenceRating: null,
            detectionRating: null,
            currentControlPrevention: '',
            currentControlDetection: '',
            filterCode: '',
          },
          {
            narration: '',
            severityRating: null,
            occurrenceRating: null,
            detectionRating: null,
            currentControlPrevention: '',
            currentControlDetection: '',
            filterCode: '',
          },
        ]);
        setActiveTab(0);
      }
      setError(null);
    }
  }, [
    open,
    editMode,
    initialNarration,
    initialSeverityRating,
    initialOccurrenceRating,
    initialDetectionRating,
    initialControlPrevention,
    initialControlDetection,
    initialFilterCode,
  ]);

  const handleClose = () => {
    setNarration('');
    setSeverityRating(null);
    setOccurrenceRating(null);
    setDetectionRating(null);
    setCurrentControlPrevention('');
    setCurrentControlDetection('');
    setFilterCode('');
    setError(null);
    onClose();
  };

  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      {
        narration: '',
        severityRating: null,
        occurrenceRating: null,
        detectionRating: null,
        currentControlPrevention: '',
        currentControlDetection: '',
        filterCode: '',
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: keyof FailureRow, val: any) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!role) return;
    if (!editMode && !functionId) return;
    setLoading(true);
    setError(null);

    try {
      if (editMode || activeTab === 0) {
        if (!narration.trim()) return;
        const body: any = editMode ? { narration: narration.trim() } : { functionId, narration: narration.trim() };
        if (role === 'effect') {
          body.severityRating = severityRating;
        }
        if (role === 'cause') {
          body.occurrenceRating = occurrenceRating;
          body.detectionRating = detectionRating;
          body.currentControlPrevention = currentControlPrevention.trim() || null;
          body.currentControlDetection = currentControlDetection.trim() || null;
          body.filterCode = filterCode.trim() || null;
        }

        const url = editMode
          ? `${API_BASE_URL}/structure-failures/${editNodeId}`
          : `${API_BASE_URL}/structure-failures`;
        const method = editMode ? 'PATCH' : 'POST';

        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const msg = await parseApiError(res, `Failed to ${editMode ? 'edit' : 'add'} failure`);
          throw new Error(msg);
        }
      } else {
        // Multiple mode batch submit
        const validRows = rows.filter((r) => r.narration.trim().length > 0);
        if (validRows.length === 0) {
          const msg = 'Please enter at least one failure narration.';
          setError(msg);
          showToast(msg, getToastSeverity(msg));
          setLoading(false);
          return;
        }

        const batchDtos = validRows.map((r) => {
          const body: any = { functionId, narration: r.narration.trim() };
          if (role === 'effect') {
            body.severityRating = r.severityRating;
          }
          if (role === 'cause') {
            body.occurrenceRating = r.occurrenceRating;
            body.detectionRating = r.detectionRating;
            body.currentControlPrevention = r.currentControlPrevention.trim() || null;
            body.currentControlDetection = r.currentControlDetection.trim() || null;
            body.filterCode = r.filterCode.trim() || null;
          }
          return body;
        });

        const res = await fetch(`${API_BASE_URL}/structure-failures/batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(batchDtos),
        });

        if (!res.ok) {
          const msg = await parseApiError(res, 'Failed to add batch failures');
          throw new Error(msg);
        }
      }

      handleClose();
      onSuccess();
    } catch (e: any) {
      const msg = e.message || `Failed to ${editMode ? 'edit' : 'add'} failure`;
      setError(msg);
      showToast(msg, getToastSeverity(msg));
    } finally {
      setLoading(false);
    }
  };

  if (!role) return null;

  const roleTitle = role === 'effect' ? 'Effect' : role === 'mode' ? 'Mode' : 'Cause';

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={role === 'cause' && activeTab === 1 ? 'lg' : 'md'}
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
              {editMode ? 'Edit' : 'Add'} Failure {roleTitle}
            </Typography>
            <Box
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: '4px',
                fontSize: '0.675rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                bgcolor: role === 'effect' ? '#fee2e2' : role === 'mode' ? '#fef3c7' : '#ffedd5',
                color: role === 'effect' ? '#dc2626' : role === 'mode' ? '#d97706' : '#ea580c'
              }}
            >
              {roleTitle}
            </Box>
          </Box>
          <Typography sx={{ fontSize: '0.75rem', color: '#71717a', mt: 0.25 }}>
            Configure failure analysis element for AIAG-VDA 2019 quality chain
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small" sx={{ color: '#71717a', '&:hover': { bgcolor: '#f4f4f5' } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ px: 3, py: 2.5, bgcolor: '#ffffff' }}>
        {hierarchyChain && hierarchyChain.length > 0 ? (
          <HierarchyBreadcrumbs items={hierarchyChain} />
        ) : (
          /* Fallback Parent Function Context Banner */
          <Box
            sx={{
              p: 1.5,
              bgcolor: '#f8fafc',
              border: '1px solid #e4e4e7',
              borderRadius: '8px',
              mb: 2,
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#71717a', textTransform: 'uppercase', fontSize: '0.675rem', letterSpacing: '0.04em', display: 'block' }}>
              Associated Function:
            </Typography>
            <Typography variant="body2" sx={{ color: '#09090b', fontWeight: 600 }}>
              {functionNarration || '\u2014'}
            </Typography>
          </Box>
        )}

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
              Single Failure {roleTitle}
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
              Multiple Failure {roleTitle}s
            </Box>
          </Box>
        )}

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Single Mode or Edit Mode */}
        {(editMode || activeTab === 0) && (
          <Stack spacing={2}>
            {role === 'effect' ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: 2, alignItems: 'flex-start' }}>
                <TextFieldAny
                  label="Failure Effect Narration"
                  value={narration}
                  onChange={(e: any) => setNarration(e.target.value)}
                  multiline
                  rows={2}
                  fullWidth
                  size="small"
                  placeholder="Describe how this function fails (Effect)..."
                  autoFocus
                  InputLabelProps={{ shrink: true }}
                />
                <RatingDropdown
                  label="Severity (S) Rating"
                  ratingType="severity"
                  value={severityRating}
                  onChange={setSeverityRating}
                />
              </Box>
            ) : (
              <TextFieldAny
                label={`Failure ${roleTitle} Narration`}
                value={narration}
                onChange={(e: any) => setNarration(e.target.value)}
                multiline
                rows={3}
                fullWidth
                size="small"
                placeholder={`Describe how this function fails (${roleTitle})...`}
                autoFocus
                InputLabelProps={{ shrink: true }}
              />
            )}

            {role === 'cause' && (
              <Stack spacing={2}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Risk Ratings & Controls (Cause Level)
                </Typography>

                {/* ROW 1: Controls & Filter Code */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.8fr', gap: 2 }}>
                  <TextFieldAny
                    label="Prevention Control"
                    value={currentControlPrevention}
                    onChange={(e: any) => setCurrentControlPrevention(e.target.value)}
                    size="small"
                    fullWidth
                    placeholder="e.g. Preventive maintenance"
                    InputLabelProps={{ shrink: true }}
                  />

                  <TextFieldAny
                    label="Detection Control"
                    value={currentControlDetection}
                    onChange={(e: any) => setCurrentControlDetection(e.target.value)}
                    size="small"
                    fullWidth
                    placeholder="e.g. Vision camera inspection"
                    InputLabelProps={{ shrink: true }}
                  />

                  <TextFieldAny
                    label="Filter Code (Optional)"
                    value={filterCode}
                    onChange={(e: any) => setFilterCode(e.target.value)}
                    size="small"
                    fullWidth
                    placeholder="e.g. FC-01"
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>

                {/* ROW 2: Occurrence & Detection Ratings */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <RatingDropdown
                    label="Occurrence (O) Rating"
                    ratingType="occurrence"
                    value={occurrenceRating}
                    onChange={setOccurrenceRating}
                  />
                  <RatingDropdown
                    label="Detection (D) Rating"
                    ratingType="detection"
                    value={detectionRating}
                    onChange={setDetectionRating}
                  />
                </Box>
              </Stack>
            )}
          </Stack>
        )}

        {/* Multiple Mode */}
        {!editMode && activeTab === 1 && (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Enter multiple failure {roleTitle.toLowerCase()} entries in the spreadsheet table below. Click "Add Row" to append more entries.
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', border: '1px solid #e4e4e7', overflow: 'hidden', boxShadow: 'none' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#fafafa' }}>
                  <TableRow sx={{ bgcolor: '#fafafa', borderBottom: '1px solid #e4e4e7' }}>
                    <TableCell sx={{ color: '#71717a !important', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase', borderRight: '1px solid #e4e4e7', minWidth: 200, py: 1.25 }}>
                      {role === 'cause' ? 'Failure Cause Narration' : role === 'effect' ? 'Failure Effect Narration' : 'Failure Mode Narration'}
                    </TableCell>
                    {role === 'effect' && (
                      <TableCell sx={{ color: '#71717a !important', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase', borderRight: '1px solid #e4e4e7', width: 110, py: 1.25 }}>
                        SEV
                      </TableCell>
                    )}
                    {role === 'cause' && (
                      <>
                        <TableCell sx={{ color: '#71717a !important', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase', borderRight: '1px solid #e4e4e7', minWidth: 180, py: 1.25 }}>
                          Current Prevention Control
                        </TableCell>
                        <TableCell sx={{ color: '#71717a !important', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase', borderRight: '1px solid #e4e4e7', width: 90, py: 1.25 }}>
                          OCC
                        </TableCell>
                        <TableCell sx={{ color: '#71717a !important', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase', borderRight: '1px solid #e4e4e7', minWidth: 180, py: 1.25 }}>
                          Current Detection Control
                        </TableCell>
                        <TableCell sx={{ color: '#71717a !important', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase', borderRight: '1px solid #e4e4e7', width: 90, py: 1.25 }}>
                          DET
                        </TableCell>
                        <TableCell sx={{ color: '#71717a !important', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase', borderRight: '1px solid #e4e4e7', minWidth: 130, py: 1.25 }}>
                          Filter Code
                        </TableCell>
                      </>
                    )}
                    <TableCell sx={{ color: '#71717a !important', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase', width: 64, textAlign: 'center', py: 1.25 }}>
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, idx) => (
                    <TableRow key={idx} sx={{ bgcolor: idx % 2 === 0 ? '#ffffff' : '#fafafa', '&:hover': { bgcolor: '#f4f4f5' } }}>
                      {/* Narration Cell */}
                      <TableCell sx={{ p: 1, borderRight: '1px solid #e4e4e7', borderBottom: '1px solid #e4e4e7' }}>
                        <TextFieldAny
                          value={row.narration}
                          onChange={(e: any) => handleRowChange(idx, 'narration', e.target.value)}
                          placeholder={`Enter ${roleTitle.toLowerCase()}...`}
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

                      {/* Effect Severity Rating */}
                      {role === 'effect' && (
                        <TableCell sx={{ p: 1, borderRight: '1px solid #e4e4e7', borderBottom: '1px solid #e4e4e7' }}>
                          <RatingDropdown
                            ratingType="severity"
                            value={row.severityRating}
                            onChange={(val) => handleRowChange(idx, 'severityRating', val)}
                            size="small"
                          />
                        </TableCell>
                      )}

                      {/* Cause Ratings & Controls */}
                      {role === 'cause' && (
                        <>
                          <TableCell sx={{ p: 1, borderRight: '1px solid #e4e4e7', borderBottom: '1px solid #e4e4e7' }}>
                            <TextFieldAny
                              value={row.currentControlPrevention}
                              onChange={(e: any) => handleRowChange(idx, 'currentControlPrevention', e.target.value)}
                              placeholder="Prevention control..."
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
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ p: 1, borderRight: '1px solid #e4e4e7', borderBottom: '1px solid #e4e4e7' }}>
                            <RatingDropdown
                              ratingType="occurrence"
                              value={row.occurrenceRating}
                              onChange={(val) => handleRowChange(idx, 'occurrenceRating', val)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell sx={{ p: 1, borderRight: '1px solid #e4e4e7', borderBottom: '1px solid #e4e4e7' }}>
                            <TextFieldAny
                              value={row.currentControlDetection}
                              onChange={(e: any) => handleRowChange(idx, 'currentControlDetection', e.target.value)}
                              placeholder="Detection control..."
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
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ p: 1, borderRight: '1px solid #e4e4e7', borderBottom: '1px solid #e4e4e7' }}>
                            <RatingDropdown
                              ratingType="detection"
                              value={row.detectionRating}
                              onChange={(val) => handleRowChange(idx, 'detectionRating', val)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell sx={{ p: 1, borderRight: '1px solid #e4e4e7', borderBottom: '1px solid #e4e4e7' }}>
                            <TextFieldAny
                              value={row.filterCode}
                              onChange={(e: any) => handleRowChange(idx, 'filterCode', e.target.value)}
                              placeholder="Filter code..."
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
                                }
                              }}
                            />
                          </TableCell>
                        </>
                      )}

                      {/* Action Cell */}
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
          {loading ? (editMode ? 'Saving...' : 'Adding...') : (editMode ? 'Save Changes' : `Add Failure ${roleTitle}`)}
        </Button>
      </DialogActions>
    </Dialog>
  );
};