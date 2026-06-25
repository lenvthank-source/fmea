import React from 'react';
import { Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemButton, ListItemIcon, ListItemText, IconButton, Avatar, Menu, MenuItem, Divider } from '@mui/material';
import { Folder as FolderIcon, Assignment as AssignmentIcon, AdminPanelSettings as AdminIcon, Logout as LogoutIcon, AccountTree as PfdIcon, Assessment as PfmeaIcon, ListAlt as CpIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import { useAuth } from '../../features/auth/AuthContext';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

const drawerWidth = 240;

export const AppShell: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
    navigate('/login');
  };

  // Extract projectId if inside a project workspace path
  const match = location.pathname.match(/\/projects\/([^/]+)/);
  const projectId = match && match[1] !== 'projects' ? match[1] : null;

  const globalMenuItems = [
    { text: 'Projects', icon: <FolderIcon />, path: '/projects' },
    { text: 'My Actions', icon: <AssignmentIcon />, path: '/actions' },
    { text: 'Administration', icon: <AdminIcon />, path: '/admin', permission: 'admin.users' },
  ];

  const projectMenuItems = [
    { text: 'Back to Projects', icon: <BackIcon />, path: '/projects' },
    { text: 'Process Flow (PFD)', icon: <PfdIcon />, path: `/projects/${projectId}/pfd` },
    { text: 'Process FMEA', icon: <PfmeaIcon />, path: `/projects/${projectId}/pfmea` },
    { text: 'Control Plan', icon: <CpIcon />, path: `/projects/${projectId}/control-plan` },
  ];

  const menuItems = projectId ? projectMenuItems : globalMenuItems;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'background.paper',
          borderBottom: '1px solid #2e2e36',
          boxShadow: 'none',
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 'bold', color: 'primary.main' }}>
            APEX FMEA Workspace
          </Typography>

          {user && (
            <div>
              <IconButton onClick={handleMenu} sx={{ p: 0 }}>
                <Avatar sx={{ bgcolor: 'secondary.main', color: 'background.default', fontWeight: 'bold' }}>
                  {user.name[0].toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem disabled>
                  <Box>
                    <Typography variant="subtitle2">{user.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                  </Box>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </div>
          )}
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: 'background.paper',
            borderRight: '1px solid #2e2e36',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', mt: 2 }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  selected={location.pathname === item.path}
                  sx={{
                    mx: 1,
                    borderRadius: 2,
                    mb: 0.5,
                    '&.Mui-selected': {
                      bgcolor: 'primary.dark',
                      '&:hover': {
                        bgcolor: 'primary.main',
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: location.pathname === item.path ? 'primary.contrastText' : 'text.secondary' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    sx={{ color: location.pathname === item.path ? 'primary.contrastText' : 'text.primary' }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Outlet />
      </Box>
    </Box>
  );
};
