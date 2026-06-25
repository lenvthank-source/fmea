import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2196f3',      // Slate blue
      light: '#64b5f6',
      dark: '#1976d2',
    },
    secondary: {
      main: '#00e5ff',      // Cyan/teal accent
      light: '#33ebff',
      dark: '#00a0b2',
    },
    background: {
      default: '#121214',   // Custom deep workspace gray
      paper: '#1e1e24',     // Custom card/table background
    },
    text: {
      primary: '#e3e3e8',
      secondary: '#a1a1aa',
    },
    error: {
      main: '#f44336',      // Severity high AP indicator
    },
    warning: {
      main: '#ff9800',      // Medium AP indicator
    },
    success: {
      main: '#4caf50',      // Low AP / resolved indicator
    },
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
      fontWeight: 600,
      letterSpacing: '0.5px',
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '0.2px',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundImage: 'none',
          boxShadow: '0 4px 20px 0 rgba(0,0,0,0.25)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '8px 16px',
          borderColor: '#2e2e36',
        },
        head: {
          fontWeight: 600,
          backgroundColor: '#1b1b21',
        },
      },
    },
  },
});
