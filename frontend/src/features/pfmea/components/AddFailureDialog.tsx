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
} from '@mui/material';
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

const ROLE_LABELS: Record<
  string,
  { title: string; color: string; description: string }
> = {
  effect: {
    title: 'Add Failure Effect',
    color: '#b71c1c',
    description:
      'Higher-level failure associated with a project-level function',
  },
  mode: {
    title: 'Add Failure Mode',
    color: '#b71c1c',
    description: 'The specific failure being analyzed at process step level',
  },
  cause: {
    title: 'Add Failure Cause',
    color: '#b71c1c',
    description: 'Root cause of failure at work element level',
  },
};

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
  const [narration, setNarration] = useState('');
  const [severityRating, setSeverityRating] = useState<number | null>(null);
  const [occurrenceRating, setOccurrenceRating] = useState<number | null>(null);
  const [detectionRating, setDetectionRating] = useState<number | null>(null);
  const [currentControlPrevention, setCurrentControlPrevention] = useState('');
  const [currentControlDetection, setCurrentControlDetection] = useState('');
  const [filterCode, setFilterCode] = useState('');
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
      } else {
        setNarration('');
        setSeverityRating(null);
        setOccurrenceRating(null);
        setDetectionRating(null);
        setCurrentControlPrevention('');
        setCurrentControlDetection('');
        setFilterCode('');
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

  const handleSubmit = async () => {
    if (!narration.trim() || !role) return;
    if (!editMode && !functionId) return;
    setLoading(true);
    setError(null);
    try {
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
      handleClose();
      onSuccess();
    } catch (e: any) {
      setError(e.message || `Failed to ${editMode ? 'edit' : 'add'} failure`);
    } finally {
      setLoading(false);
    }
  };

  if (!role) return null;
  const meta = ROLE_LABELS[role];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{ bgcolor: meta.color, color: 'white', fontWeight: 'bold', py: 1.5 }}
      >
        {editMode ? 'Edit' : 'Add'} Failure {role === 'effect' ? 'Effect' : role === 'mode' ? 'Mode' : 'Cause'}
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        {/* Green context line showing the parent function */}
        <Box
          sx={{
            p: 1.5,
            bgcolor: '#e8f5e9',
            border: '1px solid #81c784',
            borderRadius: 2,
            mb: 2,
          }}
        >
          <Typography
            variant="caption"
            sx={{ fontWeight: 'bold', color: '#1b5e20', display: 'block' }}
          >
            Associated Function:
          </Typography>
          <Typography variant="body2" sx={{ color: '#1b5e20' }}>
            {functionNarration || '\u2014'}
          </Typography>
        </Box>

        {error && (
          <Box
            sx={{
              mb: 2,
              p: 1.5,
              bgcolor: '#fce4ec',
              borderRadius: 2,
              border: '1px solid #ef9a9a',
            }}
          >
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          </Box>
        )}

        <TextFieldAny
          label="Failure Narration"
          value={narration}
          onChange={(e: any) => setNarration(e.target.value)}
          multiline
          rows={3}
          fullWidth
          size="small"
          placeholder={`Describe the ${role}...`}
          sx={{ mb: 2 }}
          autoFocus
          InputLabelProps={{ shrink: true }}
        />

        {/* Window 2 (Effect): Severity rating only */}
        {role === 'effect' && (
          <RatingDropdown
            ratingType="severity"
            value={severityRating}
            onChange={setSeverityRating}
          />
        )}

        {/* Window 7 (Cause): Full control fields + O + D + filter */}
        {role === 'cause' && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Divider>
              <Typography variant="caption" color="text.secondary">
                Current Controls
              </Typography>
            </Divider>
            <TextFieldAny
              label="Current Control of Failure Prevention"
              value={currentControlPrevention}
              onChange={(e: any) => setCurrentControlPrevention(e.target.value)}
              size="small"
              fullWidth
              multiline
              rows={2}
              InputLabelProps={{ shrink: true }}
            />
            <RatingDropdown
              ratingType="occurrence"
              value={occurrenceRating}
              onChange={setOccurrenceRating}
            />
            <TextFieldAny
              label="Current Control of Failure Detection"
              value={currentControlDetection}
              onChange={(e: any) => setCurrentControlDetection(e.target.value)}
              size="small"
              fullWidth
              multiline
              rows={2}
              InputLabelProps={{ shrink: true }}
            />
            <RatingDropdown
              ratingType="detection"
              value={detectionRating}
              onChange={setDetectionRating}
            />
            <TextFieldAny
              label="Filter Code"
              value={filterCode}
              onChange={(e: any) => setFilterCode(e.target.value)}
              size="small"
              fullWidth
              placeholder="e.g. FC-01"
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading || !narration.trim()}
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
