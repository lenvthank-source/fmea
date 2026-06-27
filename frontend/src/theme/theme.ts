import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb',      // Slate/Royal blue
      light: '#60a5fa',
      dark: '#1d4ed8',
    },
    secondary: {
      main: '#0d9488',      // Teal accent
      light: '#2dd4bf',
      dark: '#0f766e',
    },
    background: {
      default: '#f8fafc',   // Soft Slate 50 background
      paper: '#ffffff',     // Card / container white background
    },
    text: {
      primary: '#0f172a',   // Slate 900
      secondary: '#475569', // Slate 600
    },
    error: {
      main: '#ef4444',      // Red indicator
    },
    warning: {
      main: '#f59e0b',      // Orange indicator
    },
    success: {
      main: '#10b981',      // Green indicator
    },
    divider: '#e2e8f0',     // Slate 200 border
  },
  typography: {
    fontFamily: [
      'Inter',
      'Outfit',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h5: {
      fontWeight: 700,
      letterSpacing: '-0.5px',
      color: '#0f172a',
    },
    h6: {
      fontWeight: 700,
      letterSpacing: '-0.2px',
      color: '#0f172a',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      borderRadius: 999,    // Make buttons pill/circle-styled by default
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999, // Circular bubble style buttons
          padding: '8px 20px',
          transition: 'all 0.2s ease-in-out',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
          '&:hover': {
            transform: 'scale(1.04)', // Bubble hover animation
            boxShadow: '0 10px 15px -3px rgba(37,99,235,0.15), 0 4px 6px -4px rgba(37,99,235,0.15)',
          },
          '&:active': {
            transform: 'scale(0.98)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
            transform: 'scale(1.04)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20, // Highly rounded boxes
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05), 0 1px 2px -1px rgba(0,0,0,0.05), 0 10px 15px -3px rgba(0,0,0,0.02)',
          border: '1px solid #e2e8f0',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px) scale(1.01)', // Micro-animation on hover
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.04), 0 8px 10px -6px rgba(0,0,0,0.04)',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 24, // Highly rounded dialog/modal popups
          padding: 8,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 14, // Highly rounded input fields
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '10px 16px',
          borderColor: '#e2e8f0', // Clean light border
        },
        head: {
          fontWeight: 700,
          backgroundColor: '#f1f5f9', // Slate 100 header
          color: '#334155',
        },
      },
    },
  },
});
