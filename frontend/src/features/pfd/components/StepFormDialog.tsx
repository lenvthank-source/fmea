import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Grid, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface StepFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  stepToEdit?: any;
}

const STEP_TYPES = [
  { value: 'operation', label: 'Operation (◯)' },
  { value: 'inspection', label: 'Inspection (□)' },
  { value: 'transport', label: 'Transport (⇨)' },
  { value: 'storage', label: 'Storage (▽)' },
  { value: 'delay', label: 'Delay (D)' },
  { value: 'rework', label: 'Rework (R)' },
  { value: 'decision', label: 'Decision (◇)' },
];

export const StepFormDialog: React.FC<StepFormDialogProps> = ({ open, onClose, onSave, stepToEdit }) => {
  const [stepNumber, setStepNumber] = useState('');
  const [name, setName] = useState('');
  const [stepType, setStepType] = useState('operation');
  const [inputs, setInputs] = useState('');
  const [outputs, setOutputs] = useState('');
  const [resources, setResources] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (stepToEdit) {
      setStepNumber(stepToEdit.stepNumber);
      setName(stepToEdit.name);
      setStepType(stepToEdit.stepType);
      setInputs(stepToEdit.inputs || '');
      setOutputs(stepToEdit.outputs || '');
      setResources(stepToEdit.resources || '');
    } else {
      setStepNumber('');
      setName('');
      setStepType('operation');
      setInputs('');
      setOutputs('');
      setResources('');
    }
  }, [stepToEdit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        stepNumber,
        name,
        stepType,
        inputs: inputs || null,
        outputs: outputs || null,
        resources: resources || null,
      });
      onClose();
    } catch (err) {
      // handled by parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={(_, reason) => { if (reason !== 'backdropClick') onClose(); }} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{stepToEdit ? 'Edit Process Step' : 'Add Process Step'}</span>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid size={4}>
              <TextField
                fullWidth
                label="Step Number"
                placeholder="e.g. OP 10"
                variant="outlined"
                margin="normal"
                value={stepNumber}
                onChange={(e) => setStepNumber(e.target.value)}
                required
              />
            </Grid>
            <Grid size={8}>
              <TextField
                fullWidth
                label="Step Name"
                placeholder="e.g. Drilling outer bracket holes"
                variant="outlined"
                margin="normal"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            select
            label="Step Type"
            value={stepType}
            onChange={(e) => setStepType(e.target.value)}
            variant="outlined"
            margin="normal"
            required
          >
            {STEP_TYPES.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            label="Process Inputs"
            placeholder="e.g. Raw bracket, 10mm drill bit"
            variant="outlined"
            margin="normal"
            value={inputs}
            onChange={(e) => setInputs(e.target.value)}
          />

          <TextField
            fullWidth
            label="Process Outputs"
            placeholder="e.g. Bracket with drilled holes"
            variant="outlined"
            margin="normal"
            value={outputs}
            onChange={(e) => setOutputs(e.target.value)}
          />

          <TextField
            fullWidth
            label="Resources / Machinery"
            placeholder="e.g. CNC Drilling Station A"
            variant="outlined"
            margin="normal"
            value={resources}
            onChange={(e) => setResources(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Saving...' : 'Save Step'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
