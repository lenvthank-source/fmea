import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider, createTheme, type Theme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

export type PaletteMode = 'system' | 'light' | 'dark';

interface ColorModeContextType {
  mode: PaletteMode;
  actualMode: 'light' | 'dark';
  setMode: (mode: PaletteMode) => void;
}

const ColorModeContext = createContext<ColorModeContextType>({
  mode: 'system',
  actualMode: 'light',
  setMode: () => {},
});

export const useColorMode = () => useContext(ColorModeContext);

export const ColorModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<PaletteMode>(() => {
    const saved = localStorage.getItem('fmeapex_theme_mode') as PaletteMode;
    return saved || 'system';
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState(() =>
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setMode = (newMode: PaletteMode) => {
    setModeState(newMode);
    localStorage.setItem('fmeapex_theme_mode', newMode);
  };

  const actualMode: 'light' | 'dark' = useMemo(() => {
    if (mode === 'system') {
      return systemPrefersDark ? 'dark' : 'light';
    }
    return mode;
  }, [mode, systemPrefersDark]);

  const theme: Theme = useMemo(() => {
    const isDark = actualMode === 'dark';

    return createTheme({
      palette: {
        mode: actualMode,
        primary: {
          main: isDark ? '#38BDF8' : '#0F172A',
          light: isDark ? '#7DD3FC' : '#334155',
          dark: isDark ? '#0284C7' : '#020617',
          contrastText: isDark ? '#0F172A' : '#ffffff',
        },
        secondary: {
          main: '#0D9488',
          light: '#2DD4BF',
          dark: '#0F766E',
          contrastText: '#ffffff',
        },
        background: {
          default: isDark ? '#090D16' : '#F8FAFC',
          paper: isDark ? '#111827' : '#ffffff',
        },
        text: {
          primary: isDark ? '#F8FAFC' : '#0F172A',
          secondary: isDark ? '#94A3B8' : '#475569',
          disabled: isDark ? '#64748B' : '#94A3B8',
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
        divider: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.08)',
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
              padding: '8px 16px',
              height: 36,
              fontSize: '0.875rem',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: 'none',
              '&:hover': {
                boxShadow: isDark ? '0 4px 14px rgba(56, 189, 248, 0.25)' : '0 4px 12px rgba(15, 23, 42, 0.12)',
                transform: 'translateY(-1px)',
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
              boxShadow: isDark
                ? '0 4px 20px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(255, 255, 255, 0.05)'
                : '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.06)',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(15, 23, 42, 0.08)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: isDark
                  ? '0 8px 24px rgba(0, 0, 0, 0.6), 0 0 15px rgba(13, 148, 136, 0.2)'
                  : '0 6px 12px rgba(15, 23, 42, 0.08), 0 16px 32px rgba(15, 23, 42, 0.12)',
              },
            },
          },
        },
        MuiTableCell: {
          styleOverrides: {
            root: {
              padding: '8px 12px',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.06)',
            },
            head: {
              fontWeight: 700,
              backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
              color: isDark ? '#F8FAFC' : '#0F172A',
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            },
          },
        },
      },
    });
  }, [actualMode]);

  return (
    <ColorModeContext.Provider value={{ mode, actualMode, setMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};
