export const dialogSelectMenuProps = {
  anchorOrigin: { vertical: 'bottom', horizontal: 'left' } as const,
  transformOrigin: { vertical: 'top', horizontal: 'left' } as const,
  getContentAnchorEl: null,
  PaperProps: { sx: { mt: 0.5, zIndex: 1500 } },
};

export const dialogSelectProps = {
  SelectProps: { MenuProps: dialogSelectMenuProps },
};