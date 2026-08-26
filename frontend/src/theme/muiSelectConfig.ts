export const dialogSelectMenuProps = {
  anchorOrigin: { vertical: 'bottom', horizontal: 'left' } as const,
  transformOrigin: { vertical: 'top', horizontal: 'left' } as const,
  autoFocus: false,
  disableAutoFocusItem: true,
  disableScrollLock: true,
  PaperProps: {
    sx: {
      maxHeight: 220,
      mt: 0.5,
      zIndex: 9999,
      overflowY: 'auto',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.18), 0 8px 10px -6px rgba(0, 0, 0, 0.12)',
      borderRadius: 2,
    },
  },
  slotProps: {
    paper: {
      sx: {
        maxHeight: 220,
        mt: 0.5,
        zIndex: 9999,
        overflowY: 'auto',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.18), 0 8px 10px -6px rgba(0, 0, 0, 0.12)',
        borderRadius: 2,
      },
    },
  },
};

export const dialogSelectProps = {
  SelectProps: { MenuProps: dialogSelectMenuProps },
};