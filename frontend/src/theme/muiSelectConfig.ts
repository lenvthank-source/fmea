export const dialogSelectMenuProps = {
  anchorOrigin: { vertical: 'bottom', horizontal: 'left' } as const,
  transformOrigin: { vertical: 'top', horizontal: 'left' } as const,
  PaperProps: {
    sx: {
      maxHeight: 280,
      mt: 0.5,
      zIndex: 2000,
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      borderRadius: 2,
    },
  },
};

export const dialogSelectProps = {
  SelectProps: { MenuProps: dialogSelectMenuProps },
};