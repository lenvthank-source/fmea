import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Box, Typography, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Alert } from '@mui/material';
import { BugReport as BugIcon } from '@mui/icons-material';
import { API_BASE_URL } from '../../config';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  userMessage: string;
  submitting: boolean;
  submitted: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    userMessage: '',
    submitting: false,
    submitted: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      userMessage: '',
      submitting: false,
      submitted: false,
    });
    window.location.href = '/';
  };

  private handleSubmit = async () => {
    const { error, errorInfo, userMessage } = this.state;
    this.setState({ submitting: true });

    try {
      const token = localStorage.getItem('token');
      // Simple parse JWT helper inside widget
      let userId: string | null = null;
      let userEmail: string | null = null;
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userId = payload.sub || null;
          userEmail = payload.email || null;
        } catch (e) {
          // Token decode error
        }
      }

      await fetch(`${API_BASE_URL}/auth/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId,
          userEmail,
          type: 'bug',
          message: `Application Error Report: ${userMessage.trim() || 'No user comment provided'}`,
          pageUrl: window.location.href,
          pageTitle: document.title,
          errorMessage: error?.message || 'Unknown Error',
          errorStack: error?.stack || null,
          browserInfo: navigator.userAgent,
          screenSize: `${window.innerWidth}x${window.innerHeight}`,
          metadata: {
            componentStack: errorInfo?.componentStack || null,
          },
        }),
      });

      this.setState({ submitted: true });
    } catch (err) {
      console.error('Failed to submit error feedback:', err);
    } finally {
      this.setState({ submitting: false });
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Dialog
          open={true}
          maxWidth="sm"
          fullWidth
          slotProps={{ paper: { sx: { borderRadius: 4, p: 1 } } }}
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pt: 3 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
              <BugIcon />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Something went wrong</Typography>
          </DialogTitle>

          <DialogContent sx={{ pb: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              An unexpected error has occurred in the application. Please help us fix it by describing what you were doing when this happened.
            </Typography>

            {this.state.submitted ? (
              <Alert severity="success" sx={{ borderRadius: 2, mb: 1 }}>
                Thank you! The error report has been logged and sent to our engineering team. 🎉
              </Alert>
            ) : (
              <TextField
                autoFocus
                multiline
                rows={3}
                fullWidth
                label="What were you doing when the error occurred?"
                placeholder="e.g. 'I clicked the export to PDF button inside PFD Workspace...'"
                value={this.state.userMessage}
                onChange={(e) => this.setState({ userMessage: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            )}
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3, pt: 2, justifyContent: 'space-between' }}>
            <Button
              onClick={this.handleReset}
              variant="outlined"
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
            >
              Go to Home Page
            </Button>
            {!this.state.submitted && (
              <Button
                onClick={this.handleSubmit}
                variant="contained"
                disabled={this.state.submitting}
                sx={{ bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' }, textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
              >
                {this.state.submitting ? 'Sending...' : 'Send Error Report'}
              </Button>
            )}
          </DialogActions>
        </Dialog>
      );
    }

    return this.props.children;
  }
}
