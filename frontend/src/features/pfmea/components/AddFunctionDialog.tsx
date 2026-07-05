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
} from '@mui/material';
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
  const [narration, setNarration] = useState('');
  const [location, setLocation] = useState<'your_plant' | 'ship_to' | 'end_user'>('your_plant');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (editMode) {
        setNarration(initialNarration);
        setLocation(initialLocation);
      } else {
        setNarration('');
        setLocation('your_plant');
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

  const handleSubmit = async () => {
    if (!narration.trim() || !parentType) return;
    if (!editMode && !parentId) return;
    setLoading(true);
    setError(null);
    try {
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
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{ bgcolor: '#0F172A', color: 'white', fontWeight: 'bold', py: 1.5 }}
      >
        {editMode ? 'Edit' : 'Add'} Function / Requirement — {PARENT_LABELS[parentType]}
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
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
            <FormLabel
              component="legend"
              sx={{ fontWeight: 'bold', fontSize: '0.875rem', mb: 0.5 }}
            >
              Location
            </FormLabel>
            <RadioGroup
              row
              value={location}
              onChange={(e) => setLocation(e.target.value as typeof location)}
            >
              <FormControlLabel
                value="your_plant"
                control={<Radio size="small" />}
                label="Your Plant"
              />
              <FormControlLabel
                value="ship_to"
                control={<Radio size="small" />}
                label="Ship To Plant"
              />
              <FormControlLabel
                value="end_user"
                control={<Radio size="small" />}
                label="End User"
              />
            </RadioGroup>
          </FormControl>
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
          color="primary"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? (editMode ? 'Saving...' : 'Adding...') : 'OK'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
