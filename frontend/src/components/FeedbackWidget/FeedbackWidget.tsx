import React, { useState } from 'react';
import {
  Fab, Popover, Typography, TextField, Button, ToggleButtonGroup, ToggleButton,
  Snackbar, Alert, Zoom
} from '@mui/material';
import { Feedback as FeedbackIcon, Close as CloseIcon } from '@mui/icons-material';
import { useAuth } from '../../features/auth/AuthContext';
import { API_BASE_URL } from '../../config';

const FEEDBACK_TYPES = [
  { value: 'bug', label: '🐛 Bug' },
  { value: 'suggestion', label: '💡 Idea' },
  { value: 'frustration', label: '😤 Issue' },
  { value: 'praise', label: '🎉 Praise' },
];

export const FeedbackWidget: React.FC = () => {
  const { user, token } = useAuth();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [feedbackType, setFeedbackType] = useState('bug');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      await fetch(`${API_BASE_URL}/auth/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId: user?.id || null,
          userEmail: user?.email || null,
          isGuest: (user as any)?.isGuest || false,
          type: feedbackType,
          message: message.trim(),
          pageUrl: window.location.href,
          pageTitle: document.title,
          browserInfo: navigator.userAgent,
          screenSize: `${window.innerWidth}x${window.innerHeight}`,
        }),
      });
      setShowSuccess(true);
      setMessage('');
      setAnchorEl(null);
    } catch (err) {
      console.error('Feedback submission failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Zoom in>
        <Fab
          size="medium"
          onClick={(e) => setAnchorEl(anchorEl ? null : e.currentTarget)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            bgcolor: '#0D9488',
            color: 'white',
            zIndex: 1300,
            '&:hover': { bgcolor: '#0f766e' },
            animation: !anchorEl ? 'pulse 2s infinite' : 'none',
            '@keyframes pulse': {
              '0%': { boxShadow: '0 0 0 0 rgba(13, 148, 136, 0.4)' },
              '70%': { boxShadow: '0 0 0 10px rgba(13, 148, 136, 0)' },
              '100%': { boxShadow: '0 0 0 0 rgba(13, 148, 136, 0)' },
            },
          }}
        >
          {anchorEl ? <CloseIcon /> : <FeedbackIcon />}
        </Fab>
      </Zoom>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 340, borderRadius: 3, p: 2.5, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' } } }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>Send Feedback</Typography>
        
        <ToggleButtonGroup
          value={feedbackType}
          exclusive
          onChange={(_, val) => val && setFeedbackType(val)}
          size="small"
          fullWidth
          sx={{ mb: 2 }}
        >
          {FEEDBACK_TYPES.map((t) => (
            <ToggleButton key={t.value} value={t.value} sx={{ fontSize: '0.75rem', py: 0.5 }}>
              {t.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <TextField
          multiline rows={3} fullWidth
          placeholder="Tell us what's on your mind..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Button
          fullWidth variant="contained"
          disabled={!message.trim() || submitting}
          onClick={handleSubmit}
          sx={{ bgcolor: '#0D9488', '&:hover': { bgcolor: '#0f766e' }, textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
        >
          {submitting ? 'Sending...' : 'Submit Feedback'}
        </Button>
      </Popover>

      <Snackbar open={showSuccess} autoHideDuration={3000} onClose={() => setShowSuccess(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" variant="filled" sx={{ borderRadius: 2 }}>Thank you for your feedback! 🎉</Alert>
      </Snackbar>
    </>
  );
};
