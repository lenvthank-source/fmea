import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Stack, Box, Alert,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DeleteIcon from '@mui/icons-material/Delete';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  detail?: string;
  confirmText?: string;
  cancelText?: string;
  severity?: 'warning' | 'error';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open, onClose, onConfirm, title = 'Confirm deletion', message, detail, confirmText = 'Delete', cancelText = 'Cancel', severity = 'warning', loading = false,
}) => {
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <DialogTitle sx={{ display: 'flex', gap: 1.5, alignItems: 'center', pb: 1 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: severity === 'error' ? 'error.light' : 'warning.light', display: 'flex', alignItems: 'center', justifyContent: 'center', color: severity === 'error' ? 'error.main' : 'warning.main' }}>
          <WarningAmberIcon />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>{title}</Typography>
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 2 }}>
        <Stack spacing={1.5}>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>{message}</Typography>
          {detail && <Alert severity={severity} sx={{ fontSize: '0.9rem' }}>{detail}</Alert>}
          <Typography variant="caption" color="text.secondary">This action is permanent and cannot be undone.</Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} disabled={loading} color="inherit" sx={{ fontWeight: 600 }}>{cancelText}</Button>
        <Button onClick={onConfirm} disabled={loading} variant="contained" color={severity === 'error' ? 'error' : 'warning'} startIcon={<DeleteIcon />} sx={{ fontWeight: 700 }}>
          {loading ? 'Deleting…' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
