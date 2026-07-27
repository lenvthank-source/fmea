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
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Alert,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { RatingDropdown } from './RatingDropdown';
import { API_BASE_URL } from '../../../config';

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
}) => {
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
          const e = await res.json();
          throw new Error(e.message || `Failed to ${editMode ? 'edit' : 'add'} failure`);
        }
      } else {
        // Multiple mode batch submit
        const validRows = rows.filter((r) => r.narration.trim().length > 0);
        if (validRows.length === 0) {
          setError('Please enter at least one failure narration.');
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
          const e = await res.json();
          throw new Error(e.message || 'Failed to add batch failures');
        }
      }

      handleClose();
      onSuccess();
    } catch (e: any) {
      setError(e.message || `Failed to ${editMode ? 'edit' : 'add'} failure`);
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
      maxWidth="md"
      fullWidth
      sx={{ '& .MuiDialog-paper': { borderTop: '4px solid #d32f2f' } }}
    >
      <DialogTitle sx={{ color: '#d32f2f', fontWeight: 'bold', pt: 2.5, pb: 1 }}>
        {editMode ? 'Edit' : 'Add'} Failure {roleTitle}
      </DialogTitle>
      <DialogContent>
        {/* Parent Function Context Banner */}
        <Box
          sx={{
            p: 1.5,
            bgcolor: 'rgba(15, 23, 42, 0.04)',
            border: '1px solid rgba(15, 23, 42, 0.08)',
            borderRadius: 2,
            mb: 2,
            mt: 1,
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary', display: 'block' }}>
            Associated Function:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
            {functionNarration || '\u2014'}
          </Typography>
        </Box>

        {!editMode && (
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
              <Tab label={`Single Failure ${roleTitle}`} />
              <Tab label={`Multiple Failure ${roleTitle}s`} />
            </Tabs>
          </Box>
        )}

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Single Mode or Edit Mode */}
        {(editMode || activeTab === 0) && (
          <Stack spacing={2}>
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

            {role === 'effect' && (
              <RatingDropdown
                label="Severity (S) Rating"
                ratingType="severity"
                value={severityRating}
                onChange={setSeverityRating}
              />
            )}

            {role === 'cause' && (
              <Stack spacing={2}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Risk Ratings & Controls (Cause Level)
                </Typography>

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

                <TextFieldAny
                  label="Prevention Control"
                  value={currentControlPrevention}
                  onChange={(e: any) => setCurrentControlPrevention(e.target.value)}
                  size="small"
                  fullWidth
                  placeholder="e.g. Preventive maintenance, Error proofing fixture"
                  InputLabelProps={{ shrink: true }}
                />

                <TextFieldAny
                  label="Detection Control"
                  value={currentControlDetection}
                  onChange={(e: any) => setCurrentControlDetection(e.target.value)}
                  size="small"
                  fullWidth
                  placeholder="e.g. Vision camera inspection, 100% check"
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
              </Stack>
            )}
          </Stack>
        )}

        {/* Multiple Mode */}
        {!editMode && activeTab === 1 && (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Enter multiple failure {roleTitle.toLowerCase()} entries. Expand each card to enter S/O/D ratings and controls.
            </Typography>

            {rows.map((row, idx) => (
              <Accordion key={idx} defaultExpanded variant="outlined" sx={{ bgcolor: '#ffffff' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Failure {roleTitle} #{idx + 1}: {row.narration.trim() || '(Empty narration)'}
                    </Typography>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveRow(idx);
                      }}
                      disabled={rows.length <= 1}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 1 }}>
                  <Stack spacing={2}>
                    <TextFieldAny
                      label={`Failure ${roleTitle} Narration`}
                      value={row.narration}
                      onChange={(e: any) => handleRowChange(idx, 'narration', e.target.value)}
                      multiline
                      rows={2}
                      fullWidth
                      size="small"
                      placeholder={`Describe failure ${roleTitle.toLowerCase()}...`}
                      InputLabelProps={{ shrink: true }}
                    />

                    {role === 'effect' && (
                      <RatingDropdown
                        label="Severity (S) Rating"
                        ratingType="severity"
                        value={row.severityRating}
                        onChange={(val) => handleRowChange(idx, 'severityRating', val)}
                      />
                    )}

                    {role === 'cause' && (
                      <Stack spacing={2}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                          <RatingDropdown
                            label="Occurrence (O) Rating"
                            ratingType="occurrence"
                            value={row.occurrenceRating}
                            onChange={(val) => handleRowChange(idx, 'occurrenceRating', val)}
                          />
                          <RatingDropdown
                            label="Detection (D) Rating"
                            ratingType="detection"
                            value={row.detectionRating}
                            onChange={(val) => handleRowChange(idx, 'detectionRating', val)}
                          />
                        </Box>

                        <TextFieldAny
                          label="Prevention Control"
                          value={row.currentControlPrevention}
                          onChange={(e: any) => handleRowChange(idx, 'currentControlPrevention', e.target.value)}
                          size="small"
                          fullWidth
                          placeholder="e.g. Error proofing fixture"
                          InputLabelProps={{ shrink: true }}
                        />

                        <TextFieldAny
                          label="Detection Control"
                          value={row.currentControlDetection}
                          onChange={(e: any) => handleRowChange(idx, 'currentControlDetection', e.target.value)}
                          size="small"
                          fullWidth
                          placeholder="e.g. Vision camera inspection"
                          InputLabelProps={{ shrink: true }}
                        />

                        <TextFieldAny
                          label="Filter Code"
                          value={row.filterCode}
                          onChange={(e: any) => handleRowChange(idx, 'filterCode', e.target.value)}
                          size="small"
                          fullWidth
                          placeholder="e.g. FC-01"
                          InputLabelProps={{ shrink: true }}
                        />
                      </Stack>
                    )}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            ))}

            <Button
              startIcon={<AddIcon />}
              variant="outlined"
              size="small"
              onClick={handleAddRow}
              sx={{ alignSelf: 'flex-start' }}
            >
              Add Another Failure {roleTitle}
            </Button>
          </Stack>
        )}
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
          color="error"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? (editMode ? 'Saving...' : 'Adding...') : 'OK'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
