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
  CollectionsBookmark as RepositoryIcon,
  ExpandLess,
  ExpandMore,
  FiberManualRecord as BulletIcon,
  NotificationsNone as BellIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useAuth } from '../../features/auth/AuthContext';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import { useResponsive } from '../../hooks/useResponsive';
import { FeedbackWidget } from '../FeedbackWidget/FeedbackWidget';
import { ThemeToggle } from '../ThemeToggle/ThemeToggle';

export const AppShell: React.FC = () => {
  const { user, token, logout, hasPermission } = useAuth();
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
    { text: 'Work Element Repository', icon: <RepositoryIcon />, path: '/app/repository' },
    { text: 'My Actions', icon: <AssignmentIcon />, path: '/app/actions' },
    { text: 'Administration', icon: <AdminIcon />, path: '/app/admin', permission: 'admin.config' },
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
          borderRadius: '6px',
          mb: 0.5,
          pl: item.isChild ? (collapsed ? 1.5 : 3.5) : 1.5,
          pr: 1.5,
          py: 0.75,
          minHeight: 36,
          position: 'relative',
          justifyContent: collapsed ? 'center' : 'initial',
          '&.Mui-selected': {
            bgcolor: '#f4f4f5',
            '& .MuiListItemIcon-root': {
              color: '#09090b',
            },
            '&:hover': {
              bgcolor: '#ececeb',
            },
          },
          '&:hover': {
            bgcolor: '#f4f4f5',
          },
        }}
      >
        <ListItemIcon sx={{
          color: active ? '#09090b' : '#71717a',
          minWidth: collapsed ? 0 : 28,
          justifyContent: 'center',
          '& .MuiSvgIcon-root': { fontSize: 18 }
        }}>
          {item.icon}
        </ListItemIcon>
        {!collapsed && (
          <ListItemText
            primary={
              <Typography sx={{
                fontSize: item.isChild ? '0.8rem' : '0.825rem',
                fontWeight: active ? 650 : 500,
                color: active ? '#09090b' : '#71717a',
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
          borderBottom: '1px solid #e4e4e7',
          boxShadow: 'none',
          display: showAppBar ? 'block' : 'none'
        }}
      >
        <Toolbar sx={{ minHeight: '52px !important', height: '52px', px: { xs: 1.5, sm: 2 } }}>
          <IconButton
            onClick={handleToggleCollapse}
            edge="start"
            size="small"
            sx={{ mr: 1.5, color: '#71717a', '&:hover': { bgcolor: '#f4f4f5' } }}
          >
            {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: { xs: 1, md: 0 }, mr: 3 }}>
            <Typography variant="subtitle1" noWrap component="div" sx={{ fontWeight: 800, color: '#09090b', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <span style={{ color: '#ff682c', fontWeight: 900 }}>/</span> FMEApex
            </Typography>
            <span style={{ fontSize: '0.725rem', fontWeight: 600, color: '#71717a', backgroundColor: '#f4f4f5', padding: '2px 8px', borderRadius: '6px', border: '1px solid #e4e4e7' }}>
              Quality Workspace
            </span>
          </Box>

          {/* Center search box (Shadcn style) */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, flexGrow: 1, maxWidth: 360, mr: 'auto' }}>
            <Box 
              onClick={() => navigate('/app/projects')}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                width: '100%', 
                height: 32, 
                px: 1.5, 
                borderRadius: '6px', 
                bgcolor: '#f4f4f5', 
                border: '1px solid #e4e4e7',
                cursor: 'pointer',
                color: '#71717a',
                fontSize: '0.8rem',
                '&:hover': { borderColor: '#d4d4d8', bgcolor: '#ececeb' }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SearchIcon sx={{ fontSize: 16, color: '#a1a1aa' }} />
                <span>Search programs, causes...</span>
              </Box>
              <kbd style={{ fontSize: '0.65rem', backgroundColor: '#ffffff', padding: '1px 5px', borderRadius: '4px', border: '1px solid #e4e4e7', color: '#71717a' }}>⌘K</kbd>
            </Box>
          </Box>

          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title="Notifications">
                <IconButton size="small" sx={{ color: '#71717a', '&:hover': { bgcolor: '#f4f4f5' } }}>
                  <BellIcon sx={{ fontSize: 19 }} />
                </IconButton>
              </Tooltip>

              <ThemeToggle />

              <IconButton onClick={handleMenu} size="small" sx={{ p: 0.5 }}>
                <Avatar sx={{ bgcolor: '#09090b', color: 'white', fontWeight: 'bold', width: 28, height: 28, fontSize: '0.775rem' }}>
                  {user.name[0].toUpperCase()}
                </Avatar>
              </IconButton>
              {(user as any)?.isGuest && (
                <Chip label="Guest" size="small" sx={{ ml: 0.5, bgcolor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontWeight: 650, fontSize: '0.675rem', height: 20 }} />
              )}
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                sx={{
                  mt: 1,
                  '& .MuiPaper-root': {
                    borderRadius: '8px',
                    border: '1px solid #e4e4e7',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    minWidth: 200,
                  }
                }}
              >
                <MenuItem disabled sx={{ py: 1, opacity: '1 !important' }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#09090b', fontSize: '0.85rem' }}>{user.name}</Typography>
                    <Typography variant="caption" sx={{ color: '#71717a', fontSize: '0.75rem' }}>{user.email}</Typography>
                  </Box>
                </MenuItem>
                <Divider sx={{ my: 0.5, borderColor: '#f4f4f5' }} />
                <MenuItem onClick={() => { handleClose(); navigate('/app/projects'); }} sx={{ fontSize: '0.825rem', py: 0.75 }}>
                  Quality Projects
                </MenuItem>
                <MenuItem onClick={() => { handleClose(); navigate('/app/admin'); }} sx={{ fontSize: '0.825rem', py: 0.75 }}>
                  Admin Settings
                </MenuItem>
                <Divider sx={{ my: 0.5, borderColor: '#f4f4f5' }} />
                <MenuItem onClick={() => { handleClose(); logout(); navigate('/'); }} sx={{ py: 0.75, fontWeight: 600, color: '#ef4444', fontSize: '0.825rem' }}>
                  Sign Out
                </MenuItem>
              </Menu>
            </Box>
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
              borderRight: '1px solid #e4e4e7',
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
                          borderRadius: '6px',
                          mb: 0.5,
                          pl: 1.5,
                          pr: 1.5,
                          py: 0.75,
                          minHeight: 36,
                          justifyContent: collapsed ? 'center' : 'space-between',
                          '&:hover': { bgcolor: '#f4f4f5' }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <ListItemIcon sx={{ color: '#71717a', minWidth: collapsed ? 0 : 28, justifyContent: 'center', '& .MuiSvgIcon-root': { fontSize: 18 } }}>
                            <PfmeaIcon />
                          </ListItemIcon>
                          {!collapsed && (
                            <ListItemText
                              primary={
                                <Typography sx={{ fontSize: '0.825rem', fontWeight: 600, color: '#09090b' }}>
                                  PFMEA
                                </Typography>
                              }
                            />
                          )}
                        </Box>
                        {!collapsed && (pfmeaOpen ? <ExpandLess fontSize="small" sx={{ fontSize: 18, color: '#71717a' }} /> : <ExpandMore fontSize="small" sx={{ fontSize: 18, color: '#71717a' }} />)}
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
                          borderRadius: '6px',
                          mb: 0.5,
                          pl: 1.5,
                          pr: 1.5,
                          py: 0.75,
                          minHeight: 36,
                          justifyContent: collapsed ? 'center' : 'space-between',
                          '&:hover': { bgcolor: '#f4f4f5' }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <ListItemIcon sx={{ color: '#71717a', minWidth: collapsed ? 0 : 28, justifyContent: 'center', '& .MuiSvgIcon-root': { fontSize: 18 } }}>
                            <DfmeaIcon />
                          </ListItemIcon>
                          {!collapsed && (
                            <ListItemText
                              primary={
                                <Typography sx={{ fontSize: '0.825rem', fontWeight: 600, color: '#09090b' }}>
                                  DFMEA
                                </Typography>
                              }
                            />
                          )}
                        </Box>
                        {!collapsed && (dfmeaOpen ? <ExpandLess fontSize="small" sx={{ fontSize: 18, color: '#71717a' }} /> : <ExpandMore fontSize="small" sx={{ fontSize: 18, color: '#71717a' }} />)}
                      </ListItemButton>
                      
                      <Collapse in={dfmeaOpen && !collapsed} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                          {renderListItem({ text: 'Tree View', icon: <BulletIcon sx={{ fontSize: 6 }} />, path: `/app/projects/${projectId}/dfmea?tab=tree`, isChild: true })}
                          {renderListItem({ text: 'Report View', icon: <BulletIcon sx={{ fontSize: 6 }} />, path: `/app/projects/${projectId}/dfmea?tab=table`, isChild: true })}
                        </List>
                      </Collapse>
                    </ListItem>

                    {renderListItem({ text: 'Control Plan', icon: <CpIcon />, path: `/app/projects/${projectId}/control-plan` })}
                    {renderListItem({ text: 'Project Settings', icon: <SettingsIcon />, path: `/app/projects/${projectId}/settings` })}
                  </>
                ) : (
                  globalMenuItems
                    .filter((item) => !item.permission || hasPermission(item.permission))
                    .map((item) => renderListItem(item))
                )}
              </List>
            </Box>

            {/* Sidebar manual toggle button */}
            <Box 
              sx={{ 
                p: 1.5, 
                display: 'flex', 
                justifyContent: collapsed ? 'center' : 'flex-end',
                borderTop: '1px solid #e4e4e7',
                bgcolor: 'background.paper'
              }}
            >
              <IconButton 
                onClick={handleToggleCollapse} 
                size="small" 
                sx={{ 
                  border: '1px solid #e4e4e7', 
                  borderRadius: '6px',
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: '#f4f4f5' }
                }}
              >
                {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
              </IconButton>
            </Box>
          </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 1.5, sm: 2, md: 2.5 }, minWidth: 0, bgcolor: '#fbfbfb' }}>
        <Outlet />
      </Box>
    </Box>
      <FeedbackWidget />
  </Box>
  );
};
