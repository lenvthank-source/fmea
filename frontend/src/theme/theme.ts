import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#01696F',      // Teal primary accent
      light: '#028087',
      dark: '#004F53',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#006494',      // Special Characteristics Blue
      light: '#0083c2',
      dark: '#004769',
    },
    background: {
      default: '#F7F6F2',   // Warm off-white
      paper: '#ffffff',
    },
    text: {
      primary: '#28251D',   // Dark warm text
      secondary: '#7A7974', // Muted text
      disabled: '#BAB9B4',  // Faint text
    },
    error: {
      main: '#A13544',      // Semantic Red (High AP)
    },
    warning: {
      main: '#D19900',      // Semantic Amber (Medium AP)
    },
    success: {
      main: '#437A22',      // Semantic Green (Low AP)
    },
    divider: 'rgba(40, 37, 29, 0.1)', // Alpha-blended dark border
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
      fontWeight: 600,
      letterSpacing: '-0.3px',
      color: '#28251D',
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '-0.1px',
      color: '#28251D',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
      borderRadius: 8,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          height: 36,
          fontSize: '0.875rem',
          transition: 'all 0.15s ease-in-out',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            transform: 'none',
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
          boxShadow: '0 1px 2px rgba(40, 37, 29, 0.06), 0 4px 12px rgba(40, 37, 29, 0.08)',
          border: '1px solid rgba(40, 37, 29, 0.1)',
          transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 4px 6px rgba(40, 37, 29, 0.08), 0 12px 24px rgba(40, 37, 29, 0.12)',
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
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          height: 40,
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#01696F',
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
          borderColor: 'rgba(40, 37, 29, 0.08)',
        },
        head: {
          fontWeight: 600,
          backgroundColor: '#F7F6F2',
          color: '#28251D',
          fontSize: '0.85rem',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        },
      },
    },
  },
});
