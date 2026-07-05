import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0F172A',      // Slate 900 primary
      light: '#334155',     // Slate 700
      dark: '#020617',      // Slate 950
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0D9488',      // Teal 600 secondary accent
      light: '#2DD4BF',     // Teal 400
      dark: '#0F766E',      // Teal 700
      contrastText: '#ffffff',
    },
    background: {
      default: '#F8FAFC',   // Slate 50 (very soft on the eyes)
      paper: '#ffffff',
    },
    text: {
      primary: '#0F172A',   // Slate 900
      secondary: '#475569', // Slate 600
      disabled: '#94A3B8',  // Slate 400
    },
    error: {
      main: '#EF4444',      // Soft Red 500
    },
    warning: {
      main: '#F59E0B',      // Soft Amber 500
    },
    success: {
      main: '#10B981',      // Soft Emerald 500
    },
    divider: 'rgba(15, 23, 42, 0.08)', // Alpha-blended slate border
  },
  typography: {
    fontFamily: [
      'Inter',
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
      letterSpacing: '-0.3px',
      color: '#0F172A',
    },
    h6: {
      fontWeight: 700,
      letterSpacing: '-0.1px',
      color: '#0F172A',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      borderRadius: 8,
    },
  },
  components: {
    // Force inputs and form controls to default to small size globally to ensure compact 40px height
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
    },
    MuiFormControl: {
      defaultProps: {
        size: 'small',
      },
    },
    MuiButton: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          height: 36,
          fontSize: '0.875rem',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.12)',
            transform: 'scale(1.02) translateY(-1px)',
          },
          '&:active': {
            transform: 'scale(0.97) translateY(0)',
            boxShadow: 'none',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.06)',
          border: '1px solid rgba(15, 23, 42, 0.08)',
          transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 6px 12px rgba(15, 23, 42, 0.08), 0 16px 32px rgba(15, 23, 42, 0.12)',
            transform: 'translateY(-3px)',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          padding: 8,
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
        },
      },
    },
    MuiOutlinedInput: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          // height is removed to allow layout engines to scale padding correctly
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#0D9488', // Teal accent border on focus
            borderWidth: '2px',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 600,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '12px 16px',
          borderColor: 'rgba(15, 23, 42, 0.06)',
        },
        head: {
          fontWeight: 600,
          backgroundColor: '#F1F5F9', // Slate 100
          color: '#0F172A',
          fontSize: '0.85rem',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        },
      },
    },
  },
});
