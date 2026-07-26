import React from 'react';
import { ToggleButtonGroup, ToggleButton, Tooltip } from '@mui/material';
import { LightMode, DarkMode, SettingsBrightness } from '@mui/icons-material';
import { useColorMode, type PaletteMode } from '../../theme/ColorModeContext';

export const ThemeToggle: React.FC = () => {
  const { mode, setMode } = useColorMode();

  const handleModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: PaletteMode | null,
  ) => {
    if (newMode !== null) {
      setMode(newMode);
    }
  };

  return (
    <ToggleButtonGroup
      value={mode}
      exclusive
      onChange={handleModeChange}
      aria-label="theme mode toggle"
      size="small"
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 2,
        p: '2px',
        border: '1px solid',
        borderColor: 'divider',
        '& .MuiToggleButton-root': {
          border: 'none',
          borderRadius: 1.5,
          px: 1.2,
          py: 0.5,
          color: 'text.secondary',
          '&.Mui-selected': {
            bgcolor: 'secondary.main',
            color: '#ffffff',
            '&:hover': {
              bgcolor: 'secondary.dark',
            },
          },
        },
      }}
    >
      <ToggleButton value="light" aria-label="light mode">
        <Tooltip title="Light Theme">
          <LightMode fontSize="small" />
        </Tooltip>
      </ToggleButton>

      <ToggleButton value="system" aria-label="system default">
        <Tooltip title="System Default">
          <SettingsBrightness fontSize="small" />
        </Tooltip>
      </ToggleButton>

      <ToggleButton value="dark" aria-label="dark mode">
        <Tooltip title="Dark Theme">
          <DarkMode fontSize="small" />
        </Tooltip>
      </ToggleButton>
    </ToggleButtonGroup>
  );
};
