import React, { createContext, useContext, useMemo } from 'react';
import { ThemeProvider, createTheme, type Theme } from '@mui/material/styles';
import { StyledEngineProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

export type PaletteMode = 'light';

interface ColorModeContextType {
  mode: PaletteMode;
  actualMode: 'light';
  setMode: (mode: PaletteMode) => void;
}

const ColorModeContext = createContext<ColorModeContextType>({
  mode: 'light',
  actualMode: 'light',
  setMode: () => {},
});

export const useColorMode = () => useContext(ColorModeContext);

export const ColorModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme: Theme = useMemo(() => {
    return createTheme({
      palette: {
        mode: 'light',
        primary: {
          main: '#0F172A',     // Slate 900
          light: '#334155',
          dark: '#020617',
          contrastText: '#ffffff',
        },
        secondary: {
          main: '#0D9488',     // Teal 600
          light: '#2DD4BF',
          dark: '#0F766E',
          contrastText: '#ffffff',
        },
        background: {
          default: '#F8FAFC', // Slate 50
          paper: '#ffffff',
        },
        text: {
          primary: '#0F172A',   // High-contrast Slate 900
          secondary: '#475569', // Muted Slate 600
          disabled: '#94A3B8',
        },
        error: {
          main: '#EF4444',
        },
        warning: {
          main: '#F59E0B',
        },
        success: {
          main: '#10B981',
        },
        divider: 'rgba(15, 23, 42, 0.08)',
      },
      typography: {
        fontFamily: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'].join(','),
        h1: { fontWeight: 800, letterSpacing: '-1px' },
        h2: { fontWeight: 800, letterSpacing: '-0.5px' },
        h3: { fontWeight: 700, letterSpacing: '-0.3px' },
        h4: { fontWeight: 700 },
        h5: { fontWeight: 700 },
        h6: { fontWeight: 700 },
        button: { textTransform: 'none', fontWeight: 600, borderRadius: 8 },
      },
      components: {
        MuiTextField: { defaultProps: { size: 'small' } },
        MuiFormControl: { defaultProps: { size: 'small' } },
        MuiButton: {
          defaultProps: { size: 'small' },
          styleOverrides: {
            root: {
              borderRadius: 8,
              padding: '7px 15px',
              height: 36,
              fontSize: '0.875rem',
              fontWeight: 600,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: 'none',
              '&:hover': {
                transform: 'translateY(-1px)',
              },
            },
            outlined: {
              backgroundColor: 'rgba(255, 255, 255, 0.75)',
              backdropFilter: 'blur(8px)',
              borderColor: 'rgba(15, 23, 42, 0.14)',
              color: '#0F172A',
              '&:hover': {
                backgroundColor: 'rgba(248, 250, 252, 0.95)',
                borderColor: '#0D9488',
                color: '#0D9488',
                boxShadow: '0 4px 14px rgba(13, 148, 136, 0.12)',
              },
            },
            contained: {
              backdropFilter: 'blur(8px)',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.08)',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(15, 23, 42, 0.15)',
              },
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.06)',
              border: '1px solid rgba(15, 23, 42, 0.08)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 12px rgba(15, 23, 42, 0.08), 0 16px 32px rgba(15, 23, 42, 0.12)',
              },
            },
          },
        },
        MuiTableCell: {
          styleOverrides: {
            root: {
              padding: '8px 12px',
              borderColor: 'rgba(15, 23, 42, 0.06)',
            },
            head: {
              fontWeight: 700,
              backgroundColor: '#F1F5F9',
              color: '#0F172A',
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            },
          },
        },
      },
    });
  }, []);

  return (
    <ColorModeContext.Provider value={{ mode: 'light', actualMode: 'light', setMode: () => {} }}>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </StyledEngineProvider>
    </ColorModeContext.Provider>
  );
};
