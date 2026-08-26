import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert } from '@mui/material';

type ToastSeverity = 'error' | 'warning' | 'info';

interface ToastContextType {
  showToast: (message: string, severity?: ToastSeverity) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = (): ToastContextType => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

// Helper to classify backend messages: locked/draft/permission => warning else error
export const getToastSeverity = (message: string): ToastSeverity => {
  const lower = (message || '').toLowerCase();
  if (
    lower.includes('locked') ||
    lower.includes('draft') ||
    lower.includes('permission') ||
    lower.includes('forbidden') ||
    lower.includes('not have access') ||
    lower.includes('cannot modify')
  ) {
    return 'warning';
  }
  return 'error';
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<ToastSeverity>('error');

  const showToast = useCallback((msg: string, sev: ToastSeverity = 'error') => {
    if (!msg) return;
    setMessage(msg);
    setSeverity(sev);
    setOpen(true);
  }, []);

  const showError = useCallback((msg: string) => showToast(msg, getToastSeverity(msg)), [showToast]);
  const showWarning = useCallback((msg: string) => showToast(msg, 'warning'), [showToast]);

  const handleClose = (_: unknown, reason?: string) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  return (
    <ToastContext.Provider value={{ showToast, showError, showWarning }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={severity === 'error' ? 7000 : 6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setOpen(false)}
          severity={severity}
          variant="filled"
          sx={{ width: '100%', borderRadius: 2, fontWeight: 600 }}
        >
          {message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
};
