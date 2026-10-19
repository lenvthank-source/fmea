import { createTheme } from "@mui/material/styles";

/** Shared with the homepage's ivory, graphite, orange, and contextual green palette. */
export const qualityColors = {
  canvas: "#faf9f6",
  surface: "#ffffff",
  ink: "#242621",
  muted: "#65685f",
  border: "#e3e4db",
  orange: "#ff682c",
  orangeText: "#ad4823",
  green: "#45664c",
  softGreen: "#eff2e8",
};
const heading = {
  fontFamily: '"Plus Jakarta Sans", Inter, sans-serif',
  fontWeight: 600,
  letterSpacing: "-0.04em",
  color: qualityColors.ink,
};
export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: qualityColors.ink,
      light: "#42453b",
      dark: "#161914",
      contrastText: "#ffffff",
    },
    secondary: {
      main: qualityColors.orangeText,
      light: "#ff8c5e",
      dark: "#8d3617",
      contrastText: "#ffffff",
    },
    background: { default: qualityColors.canvas, paper: qualityColors.surface },
    text: {
      primary: qualityColors.ink,
      secondary: qualityColors.muted,
      disabled: "#858a7b",
    },
    divider: qualityColors.border,
    error: { main: "#dc2626" },
    warning: { main: "#b45309" },
    success: { main: "#15803d" },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: heading,
    h2: heading,
    h3: heading,
    h4: heading,
    h5: heading,
    h6: heading,
    button: {
      textTransform: "none",
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ":focus-visible": { outline: "3px solid #ad4823", outlineOffset: 3 },
        "@media (prefers-reduced-motion: reduce)": {
          "*, *::before, *::after": {
            scrollBehavior: "auto !important",
            transitionDuration: "0s !important",
            animationDuration: "0s !important",
          },
        },
      },
    },
    MuiTextField: { defaultProps: { size: "small" } },
    MuiFormControl: { defaultProps: { size: "small" } },
    MuiButton: {
      defaultProps: { size: "small", disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "8px 16px",
          minHeight: 36,
          fontSize: "0.8rem",
          boxShadow: "none",
          transition: "background-color .2s, border-color .2s",
          "&:hover": { boxShadow: "none" },
        },
        outlined: {
          borderColor: qualityColors.border,
          "&:hover": { borderColor: "#a9b19a", backgroundColor: "#f1f3eb" },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
        outlined: { borderColor: qualityColors.border },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: `1px solid ${qualityColors.border}`,
          boxShadow: "0 2px 6px #24262104",
          transition: "border-color .2s, box-shadow .2s",
          "&:hover": {
            borderColor: "#b9c5aa",
            boxShadow: "0 8px 25px #414e2d0a",
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          border: `1px solid ${qualityColors.border}`,
          boxShadow: "0 25px 60px #24262126",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: "#fff",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: qualityColors.border,
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#a9b19a",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: qualityColors.ink,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, fontWeight: 600, fontSize: "0.7rem" },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: "8px 12px",
          borderColor: qualityColors.border,
          fontSize: "0.8rem",
        },
        head: {
          fontWeight: 600,
          backgroundColor: "#f3f4ed",
          color: qualityColors.muted,
          fontSize: "0.72rem",
          letterSpacing: "0.03em",
        },
      },
    },
    MuiTab: { styleOverrides: { root: { textTransform: "none" } } },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: qualityColors.ink, borderRadius: 6 },
      },
    },
  },
});
