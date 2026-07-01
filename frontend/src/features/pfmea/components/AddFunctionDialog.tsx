import React, { useState } from 'react';
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
}) => {
  const [narration, setNarration] = useState('');
  const [location, setLocation] = useState<'your_plant' | 'ship_to' | 'end_user'>('your_plant');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setNarration('');
    setLocation('your_plant');
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!narration.trim() || !parentType || !parentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/structure-functions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId,
          parentType,
          parentId,
          narration: narration.trim(),
          location: parentType === 'project' ? location : 'your_plant',
        }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.message || 'Failed to add function');
      }
      handleClose();
      onSuccess();
    } catch (e: any) {
      setError(e.message || 'Failed to add function');
    } finally {
      setLoading(false);
    }
  };

  if (!parentType) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{ bgcolor: '#1b5e20', color: 'white', fontWeight: 'bold', py: 1.5 }}
      >
        Add Function / Requirement \u2014 {PARENT_LABELS[parentType]}
      </DialogTitle>
      <DialogContent sx={{ pt: 2.5 }}>
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
        <TextField
          label="Function / Requirement Narration"
          value={narration}
          onChange={(e) => setNarration(e.target.value)}
          multiline
          rows={3}
          fullWidth
          size="small"
          placeholder="Describe what this element should accomplish..."
          sx={{ mb: 2 }}
          autoFocus
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
          sx={{ bgcolor: '#1b5e20', '&:hover': { bgcolor: '#2e7d32' } }}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? 'Adding...' : 'OK'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
