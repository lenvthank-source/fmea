import React, { createContext, useContext } from "react";
import { ThemeProvider, StyledEngineProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { theme } from "./theme";

export type PaletteMode = "light";
interface ColorModeContextType {
  mode: PaletteMode;
  actualMode: "light";
  setMode: (mode: PaletteMode) => void;
}
const ColorModeContext = createContext<ColorModeContextType>({
  mode: "light",
  actualMode: "light",
  setMode: () => {},
});
export const useColorMode = () => useContext(ColorModeContext);
export const ColorModeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <ColorModeContext.Provider
    value={{ mode: "light", actualMode: "light", setMode: () => {} }}
  >
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </StyledEngineProvider>
  </ColorModeContext.Provider>
);
