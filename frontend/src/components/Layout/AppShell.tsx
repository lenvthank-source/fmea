import React, { useState, useEffect } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, IconButton, Avatar, Menu, MenuItem, Tooltip, Collapse, Divider, Chip
} from '@mui/material';
import {
  Folder as FolderIcon,
  Assignment as AssignmentIcon,
  AdminPanelSettings as AdminIcon,
  AccountTree as PfdIcon,
  Assessment as PfmeaIcon,
  ListAlt as CpIcon,
  ArrowBack as BackIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Build as DfmeaIcon,
  Link as LinkageIcon,
  AssignmentTurnedIn as ActionsIcon,
  ExpandLess,
  ExpandMore,
  FiberManualRecord as BulletIcon
} from '@mui/icons-material';
import { useAuth } from '../../features/auth/AuthContext';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import { useResponsive } from '../../hooks/useResponsive';
import { FeedbackWidget } from '../FeedbackWidget/FeedbackWidget';

export const AppShell: React.FC = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { isSmallScreen } = useResponsive();
  const [collapsedState, setCollapsedState] = useState<boolean | null>(null);

  const collapsed = collapsedState !== null 
    ? collapsedState 
    : (isSmallScreen || localStorage.getItem('sidebar-collapsed') === 'true');

  const [projectName, setProjectName] = useState<string>('');
  const [pfmeaOpen, setPfmeaOpen] = useState(true);
  const [dfmeaOpen, setDfmeaOpen] = useState(false);
  const [autohideEnabled, setAutohideEnabled] = useState<boolean>(true);

  const handleMouseEnter = () => {
    // Left bar auto-hide is enabled, but auto-unhide is disabled.
    // Unhide is performed intentionally via the bottom toggle button.
  };

  const handleMouseLeave = () => {
    if (!autohideEnabled) return;
    setCollapsedState(true);
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Toggle collapse and persist
  const handleToggleCollapse = () => {
    setCollapsedState(prev => {
      const current = prev !== null 
        ? prev 
        : (isSmallScreen || localStorage.getItem('sidebar-collapsed') === 'true');
      const next = !current;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  };

  // Extract projectId if inside a project workspace path
  const match = location.pathname.match(/\/(?:app\/)?projects\/([^/]+)/);
  const projectId = match && match[1] !== 'projects' ? match[1] : null;
  const showAppBar = !projectId;

  // Fetch project details when inside a project
  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId || !token) {
        setProjectName('');
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setProjectName(data.partName ? `${data.partName} (${data.orgPartNumber || 'N/A'})` : (data.name || 'Untitled'));
          if (data.uiSettings) {
            try {
              const parsed = typeof data.uiSettings === 'string' ? JSON.parse(data.uiSettings) : data.uiSettings;
              setAutohideEnabled(parsed.autohideSidebar !== false);
            } catch {
              setAutohideEnabled(true);
            }
          } else {
            setAutohideEnabled(true);
          }
        }
      } catch (err) {
        console.error('Failed to load project details', err);
      }
    };
    fetchProject();
  }, [projectId, token]);

  const globalMenuItems = [
    { text: 'Projects', icon: <FolderIcon />, path: '/app/projects' },
    { text: 'My Actions', icon: <AssignmentIcon />, path: '/app/actions' },
    { text: 'Administration', icon: <AdminIcon />, path: '/app/admin', permission: 'admin.users' },
  ];

  const drawerWidth = collapsed ? 64 : 240;

  const isActive = (path: string) => {
    return location.pathname === path || (path.includes('?') && `${location.pathname}${location.search}`.startsWith(path));
  };

  const renderListItem = (item: { text: string; icon: React.ReactNode; path: string; isChild?: boolean }) => {
    const active = isActive(item.path);
    const content = (
      <ListItemButton
        onClick={() => navigate(item.path)}
        selected={active}
        sx={{
          mx: collapsed ? 0.5 : 1,
          borderRadius: 2,
          mb: 0.5,
          pl: item.isChild ? (collapsed ? 1.5 : 4) : 2,
          pr: 2,
          py: 1,
          minHeight: 40,
          position: 'relative',
          justifyContent: collapsed ? 'center' : 'initial',
          '&.Mui-selected': {
            bgcolor: 'rgba(1, 105, 111, 0.08)',
            '& .MuiListItemIcon-root': {
              color: 'primary.main',
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0,
              top: '15%',
              bottom: '15%',
              width: 3,
              borderRadius: '0 4px 4px 0',
              backgroundColor: 'primary.main',
            },
            '&:hover': {
              bgcolor: 'rgba(1, 105, 111, 0.12)',
            },
          },
          '&:hover': {
            bgcolor: 'rgba(40, 37, 29, 0.04)',
          },
        }}
      >
        <ListItemIcon sx={{
          color: active ? 'primary.main' : 'text.secondary',
          minWidth: collapsed ? 0 : 32,
          justifyContent: 'center',
        }}>
          {item.icon}
        </ListItemIcon>
        {!collapsed && (
          <ListItemText
            primary={
              <Typography sx={{
                fontSize: item.isChild ? '0.825rem' : '0.875rem',
                fontWeight: active ? 600 : 500,
                color: active ? 'primary.main' : 'text.primary',
              }}>
                {item.text}
              </Typography>
            }
          />
        )}
      </ListItemButton>
    );

    if (collapsed) {
      return (
        <Tooltip title={item.text} placement="right" arrow key={item.text}>
          <ListItem disablePadding sx={{ display: 'block' }}>
            {content}
          </ListItem>
        </Tooltip>
      );
    }

    return (
      <ListItem disablePadding key={item.text} sx={{ display: 'block' }}>
        {content}
      </ListItem>
    );
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default', flexDirection: 'column' }}>
      <AppBar
        position={showAppBar ? "static" : "fixed"}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'background.paper',
          borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
          boxShadow: 'none',
          display: showAppBar ? 'block' : 'none'
        }}
      >
        <Toolbar>
          <IconButton
            onClick={handleToggleCollapse}
            edge="start"
            sx={{ mr: 2, color: 'text.secondary' }}
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 'bold', color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
            <span style={{ fontSize: '1.25rem', letterSpacing: '-0.5px' }}>FMEApex</span>
          </Typography>

          {user && (
            <div>
              <IconButton onClick={handleMenu} sx={{ p: 0 }}>
                <Avatar sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold', width: 32, height: 32, fontSize: '0.875rem' }}>
                  {user.name[0].toUpperCase()}
                </Avatar>
              </IconButton>
                {(user as any)?.isGuest && (
                  <Chip label="Guest" size="small" sx={{ ml: 1, bgcolor: '#f59e0b', color: 'white', fontWeight: 600, fontSize: '0.7rem', height: 22 }} />
                )}
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
                <MenuItem disabled sx={{ py: 1.5 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{user.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                  </Box>
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => { handleClose(); logout(); navigate('/'); }} sx={{ py: 1, fontWeight: 500, color: 'error.main' }}>
                  Sign Out
                </MenuItem>
              </Menu>
            </div>
          )}
        </Toolbar>
      </AppBar>
      <Box sx={{ display: 'flex', flexGrow: 1, flexDirection: 'row', width: '100%', minHeight: 0 }}>
        <Drawer
          variant="permanent"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: drawerWidth,
              boxSizing: 'border-box',
              bgcolor: 'background.paper',
              borderRight: '1px solid rgba(40, 37, 29, 0.1)',
              transition: collapsed
                ? 'width 0.45s cubic-bezier(0.4, 0, 0.2, 1)'
                : 'width 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
              overflowX: 'hidden',
            },
          }}
        >
          {showAppBar && <Toolbar />}
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', overflow: 'hidden' }}>
            <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
              {/* Project Header section */}
              {projectId && projectName && !collapsed && (
                <Box sx={{ px: 2, py: 1.5, mb: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Current Project
                  </Typography>
                  <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700, color: 'text.primary', mt: 0.5 }}>
                    {projectName}
                  </Typography>
                </Box>
              )}

              <List>
                {projectId ? (
                  <>
                    {renderListItem({ text: 'Back to Projects', icon: <BackIcon />, path: '/app/projects' })}
                    <Divider sx={{ my: 1, mx: 1.5 }} />
                    
                    {renderListItem({ text: 'Process Flow (PFD)', icon: <PfdIcon />, path: `/app/projects/${projectId}/pfd` })}
                    
                    {/* PFMEA collapsible item */}
                    <ListItem disablePadding sx={{ display: 'block' }}>
                      <ListItemButton
                        onClick={() => {
                          if (collapsed) {
                            navigate(`/app/projects/${projectId}/pfmea`);
                          } else {
                            setPfmeaOpen(!pfmeaOpen);
                          }
                        }}
                        sx={{
                          mx: collapsed ? 0.5 : 1,
                          borderRadius: 2,
                          mb: 0.5,
                          pl: 2,
                          pr: 2,
                          py: 1,
                          minHeight: 40,
                          justifyContent: collapsed ? 'center' : 'space-between',
                          '&:hover': { bgcolor: 'rgba(40, 37, 29, 0.04)' }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <ListItemIcon sx={{ color: 'text.secondary', minWidth: collapsed ? 0 : 32, justifyContent: 'center' }}>
                            <PfmeaIcon />
                          </ListItemIcon>
                          {!collapsed && (
                            <ListItemText
                              primary={
                                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'text.primary' }}>
                                  PFMEA
                                </Typography>
                              }
                            />
                          )}
                        </Box>
                        {!collapsed && (pfmeaOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />)}
                      </ListItemButton>
                      
                      <Collapse in={pfmeaOpen && !collapsed} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                          {renderListItem({ text: 'Tree View', icon: <BulletIcon sx={{ fontSize: 6 }} />, path: `/app/projects/${projectId}/pfmea?tab=tree`, isChild: true })}
                          {renderListItem({ text: 'Report View', icon: <BulletIcon sx={{ fontSize: 6 }} />, path: `/app/projects/${projectId}/pfmea?tab=table`, isChild: true })}
                        </List>
                      </Collapse>
                    </ListItem>

                    {/* DFMEA collapsible item */}
                    <ListItem disablePadding sx={{ display: 'block' }}>
                      <ListItemButton
                        onClick={() => {
                          if (collapsed) {
                            navigate(`/app/projects/${projectId}/dfmea`);
                          } else {
                            setDfmeaOpen(!dfmeaOpen);
                          }
                        }}
                        sx={{
                          mx: collapsed ? 0.5 : 1,
                          borderRadius: 2,
                          mb: 0.5,
                          pl: 2,
                          pr: 2,
                          py: 1,
                          minHeight: 40,
                          justifyContent: collapsed ? 'center' : 'space-between',
                          '&:hover': { bgcolor: 'rgba(40, 37, 29, 0.04)' }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <ListItemIcon sx={{ color: 'text.secondary', minWidth: collapsed ? 0 : 32, justifyContent: 'center' }}>
                            <DfmeaIcon />
                          </ListItemIcon>
                          {!collapsed && (
                            <ListItemText
                              primary={
                                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'text.primary' }}>
                                  DFMEA
                                </Typography>
                              }
                            />
                          )}
                        </Box>
                        {!collapsed && (dfmeaOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />)}
                      </ListItemButton>
                      
                      <Collapse in={dfmeaOpen && !collapsed} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                          {renderListItem({ text: 'Tree View', icon: <BulletIcon sx={{ fontSize: 6 }} />, path: `/app/projects/${projectId}/dfmea?tab=tree`, isChild: true })}
                          {renderListItem({ text: 'Report View', icon: <BulletIcon sx={{ fontSize: 6 }} />, path: `/app/projects/${projectId}/dfmea?tab=table`, isChild: true })}
                        </List>
                      </Collapse>
                    </ListItem>

                    {renderListItem({ text: 'Control Plan', icon: <CpIcon />, path: `/app/projects/${projectId}/control-plan` })}
                    {renderListItem({ text: 'Action Tracker', icon: <ActionsIcon />, path: `/app/actions?projectId=${projectId}` })}
                    {renderListItem({ text: 'Linkage Map', icon: <LinkageIcon />, path: `/app/projects/${projectId}/linkage` })}
                    {renderListItem({ text: 'Project Settings', icon: <SettingsIcon />, path: `/app/projects/${projectId}/settings` })}
                  </>
                ) : (
                  globalMenuItems.map((item) => renderListItem(item))
                )}
              </List>
            </Box>

            {/* Sidebar manual toggle button */}
            <Box 
              sx={{ 
                p: 1.5, 
                display: 'flex', 
                justifyContent: collapsed ? 'center' : 'flex-end',
                borderTop: '1px solid rgba(40, 37, 29, 0.08)',
                bgcolor: 'background.paper'
              }}
            >
              <IconButton 
                onClick={handleToggleCollapse} 
                size="small" 
                sx={{ 
                  border: '1px solid rgba(40, 37, 29, 0.15)', 
                  borderRadius: 1.5,
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: 'rgba(40, 37, 29, 0.04)' }
                }}
              >
                {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
              </IconButton>
            </Box>
          </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, minWidth: 0 }}>
        <Outlet />
      </Box>
    </Box>
      <FeedbackWidget />
  </Box>
  );
};
