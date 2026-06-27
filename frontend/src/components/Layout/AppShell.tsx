import React, { useState } from 'react';
import { Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemButton, ListItemIcon, ListItemText, IconButton, Avatar, Menu, MenuItem } from '@mui/material';
import {
  Folder as FolderIcon,
  Assignment as AssignmentIcon,
  AdminPanelSettings as AdminIcon,
  AccountTree as PfdIcon,
  Assessment as PfmeaIcon,
  ListAlt as CpIcon,
  ArrowBack as BackIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
} from '@mui/icons-material';
import { useAuth } from '../../features/auth/AuthContext';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

export const AppShell: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
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
    { text: 'Project Settings', icon: <SettingsIcon />, path: `/projects/${projectId}/settings` },
  ];

  const menuItems = projectId ? projectMenuItems : globalMenuItems;
  const drawerWidth = collapsed ? 72 : 240;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'background.paper',
          borderBottom: '1px solid #e2e8f0',
          boxShadow: 'none',
        }}
      >
        <Toolbar>
          <IconButton
            onClick={() => setCollapsed(!collapsed)}
            edge="start"
            sx={{ mr: 2, color: 'text.secondary' }}
          >
            {collapsed ? <MenuIcon /> : <ChevronLeftIcon />}
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 'bold', color: 'primary.main' }}>
            APEX FMEA Workspace
          </Typography>

          {user && (
            <div>
              <IconButton onClick={handleMenu} sx={{ p: 0 }}>
                <Avatar sx={{ bgcolor: 'secondary.main', color: 'white', fontWeight: 'bold' }}>
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
            borderRight: '1px solid #e2e8f0',
            transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            overflowX: 'hidden',
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
                    mx: collapsed ? 1 : 1.5,
                    borderRadius: collapsed ? '50%' : 3,
                    mb: 0.5,
                    aspectRatio: collapsed ? '1/1' : 'auto',
                    justifyContent: collapsed ? 'center' : 'initial',
                    p: collapsed ? '10px' : '8px 16px',
                    transition: 'all 0.15s ease-in-out',
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      '& .MuiListItemIcon-root': {
                        color: 'primary.contrastText',
                      },
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                    },
                    '&:hover': {
                      transform: 'scale(1.03)',
                    },
                  }}
                >
                  <ListItemIcon sx={{
                    color: location.pathname === item.path ? 'primary.contrastText' : 'text.secondary',
                    minWidth: collapsed ? 0 : 36,
                    justifyContent: 'center',
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={
                        <Typography sx={{
                          fontSize: '0.9rem',
                          fontWeight: location.pathname === item.path ? 600 : 500,
                          color: location.pathname === item.path ? 'primary.contrastText' : 'text.primary'
                        }}>
                          {item.text}
                        </Typography>
                      }
                    />
                  )}
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
