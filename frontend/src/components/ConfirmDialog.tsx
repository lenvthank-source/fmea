import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Stack, Box
} from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';

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
  open,
  onClose,
  onConfirm,
  title = 'Confirm deletion',
  message,
  detail,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  severity = 'warning',
  loading = false,
}) => {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 2.5,
            transform: 'translateY(-24px)', // Pops out closer to user's click focus
            boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.22), 0 0 1px 1px rgba(15, 23, 42, 0.08)',
            border: '1px solid #E2E8F0',
            overflow: 'hidden',
          },
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.25, pt: 2.5, pb: 1, px: 2.5 }}>
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            bgcolor: severity === 'error' ? '#FEE2E2' : '#FEF3C7',
            color: severity === 'error' ? '#DC2626' : '#D97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <WarningAmberRoundedIcon sx={{ fontSize: 18 }} />
        </Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '1.05rem', lineHeight: 1.3 }}>
          {title}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ px: 2.5, py: 1 }}>
        <Stack spacing={1}>
          <Typography variant="body2" sx={{ color: '#1E293B', fontWeight: 600, lineHeight: 1.5, fontSize: '0.92rem' }}>
            {message}
          </Typography>
          {detail && (
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', lineHeight: 1.4, fontSize: '0.82rem' }}>
              {detail}
            </Typography>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 2.5, pt: 1.5, pb: 2.25, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          size="small"
          color="inherit"
          sx={{
            fontWeight: 600,
            color: '#475569',
            px: 2,
            height: 32,
            '&:hover': { bgcolor: '#F1F5F9' },
          }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          size="small"
          color={severity === 'error' ? 'error' : 'warning'}
          sx={{
            fontWeight: 700,
            px: 2.5,
            height: 32,
            bgcolor: severity === 'error' ? '#DC2626' : '#D97706',
            '&:hover': { bgcolor: severity === 'error' ? '#B91C1C' : '#B45309' },
            boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
          }}
        >
          {loading ? 'Deleting…' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
