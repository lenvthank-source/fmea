import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  TextField,
  Drawer,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Divider,
  Tooltip,
  Grid,
  Card,
  CardContent,
  ToggleButton,
  ToggleButtonGroup,
  Avatar
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  GetApp as GetAppIcon,
  Launch as LaunchIcon,
  ViewWeek as KanbanIcon,
  TableChart as TableIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { useAuth } from '../auth/AuthContext';
import { calculateAP } from '../pfmea/utils/apCalculator';
import { API_BASE_URL } from '../../config';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Project {
  id: string;
  name: string;
}

interface ProcessStep {
  id: string;
  stepNumber: string;
  name: string;
}

interface PfmeaRow {
  id: string;
  processStep: ProcessStep;
  severity: number;
  occurrence: number;
  detection: number;
  ap: string | null;
}

interface FmeaLink {
  id: string;
  fmeaType: string;
  fmeaRowId: string;
  beforeSeverity: number;
  beforeOccurrence: number;
  beforeDetection: number;
  beforeAp: string | null;
  afterSeverity: number | null;
  afterOccurrence: number | null;
  afterDetection: number | null;
  afterAp: string | null;
  pfmeaRow?: PfmeaRow;
}

interface Evidence {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  description: string | null;
  uploadedById: string;
  uploader: {
    id: string;
    name: string;
  };
}

interface ActionItem {
  id: string;
  description: string;
  actionType: string;
  priority: string;
  status: string;
  dueDate: string;
  completionNotes: string | null;
  closedAt: string | null;
  ownerId: string;
  owner: User;
  creator: User;
  project: Project;
  fmeaLinks: FmeaLink[];
  evidences: Evidence[];
}

export const ActionsDashboard: React.FC = () => {
  const { token } = useAuth();
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [tabFilter, setTabFilter] = useState<'assigned' | 'all-project'>('assigned');
  const [viewMode, setViewMode] = useState<'table' | 'kanban' | 'calendar'>('table');
  
  // Status filtering state
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Loading / Error / Success states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<ActionItem | null>(null);
  
  // Drawer edit state
  const [editStatus, setEditStatus] = useState<string>('');
  const [editPriority, setEditPriority] = useState<string>('');
  const [editOwnerId, setEditOwnerId] = useState<string>('');
  const [editCompletionNotes, setEditCompletionNotes] = useState<string>('');
  
  // Risk ratings edit state
  const [editSeverity, setEditSeverity] = useState<number | ''>('');
  const [editOccurrence, setEditOccurrence] = useState<number | ''>('');
  const [editDetection, setEditDetection] = useState<number | ''>('');
  
  // Real-time calculated AP
  const [calculatedAfterAp, setCalculatedAfterAp] = useState<string | null>(null);

  // Evidence upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDescription, setUploadDescription] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const ratingOptions = Array.from({ length: 10 }, (_, i) => i + 1);

  // Fetch initial configuration (projects & users)
  useEffect(() => {
    const loadConfig = async () => {
      try {
        // Fetch projects
        const projRes = await fetch(`${API_BASE_URL}/projects`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (projRes.ok) {
          const projData = await projRes.json();
          setProjects(projData);
        }

        // Fetch users in tenant
        const userRes = await fetch(`${API_BASE_URL}/auth/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          setUsers(userData);
        }
      } catch (err) {
        console.error('Failed to load initial configuration', err);
      }
    };

    if (token) {
      loadConfig();
    }
  }, [token]);

  // Fetch Action items based on project and tab filter
  const fetchActions = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API_BASE_URL}/actions`;
      
      // If we want project level actions (either for all project actions, or filtering assigned)
      if (tabFilter === 'all-project' && selectedProjectId !== 'all') {
        url = `${API_BASE_URL}/projects/${selectedProjectId}/actions`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to retrieve action items');
      }

      const data = await response.json();
      
      // If project filter is set in "My Assigned" mode, do local client filtering
      if (tabFilter === 'assigned' && selectedProjectId !== 'all') {
        setActions(data.filter((item: ActionItem) => item.project.id === selectedProjectId));
      } else {
        setActions(data);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading actions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchActions();
    }
  }, [token, selectedProjectId, tabFilter]);

  // Auto-calculate AP in real-time when edit severity/occurrence/detection change
  useEffect(() => {
    if (editSeverity !== '' && editOccurrence !== '' && editDetection !== '') {
      const ap = calculateAP(editSeverity, editOccurrence, editDetection);
      setCalculatedAfterAp(ap);
    } else {
      setCalculatedAfterAp(null);
    }
  }, [editSeverity, editOccurrence, editDetection]);

  // Open the action details drawer
  const handleOpenDrawer = (action: ActionItem) => {
    setSelectedAction(action);
    setEditStatus(action.status);
    setEditPriority(action.priority);
    setEditOwnerId(action.ownerId);
    setEditCompletionNotes(action.completionNotes || '');
    
    // Parse existing "after" ratings if present
    const mainLink = action.fmeaLinks[0];
    if (mainLink) {
      setEditSeverity(mainLink.afterSeverity !== null ? mainLink.afterSeverity : '');
      setEditOccurrence(mainLink.afterOccurrence !== null ? mainLink.afterOccurrence : '');
      setEditDetection(mainLink.afterDetection !== null ? mainLink.afterDetection : '');
    } else {
      setEditSeverity('');
      setEditOccurrence('');
      setEditDetection('');
    }

    setUploadFile(null);
    setUploadDescription('');
    setUploadError(null);
    setDrawerOpen(true);
  };

  // Close the drawer
  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedAction(null);
  };

  // Trigger Save Action PATCH
  const handleSaveAction = async () => {
    if (!selectedAction) return;
    setError(null);
    setSuccess(null);
    
    const requestBody: any = {
      status: editStatus,
      priority: editPriority,
      ownerId: editOwnerId,
      completionNotes: editCompletionNotes,
    };

    // Include ratings if status indicates completeness
    if (['completed', 'verified', 'closed'].includes(editStatus)) {
      if (editSeverity !== '') requestBody.afterSeverity = Number(editSeverity);
      if (editOccurrence !== '') requestBody.afterOccurrence = Number(editOccurrence);
      if (editDetection !== '') requestBody.afterDetection = Number(editDetection);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/actions/${selectedAction.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to update action');
      }

      setSuccess('Action item updated successfully.');
      handleCloseDrawer();
      await fetchActions();
    } catch (err: any) {
      setError(err.message || 'Failed to save action updates.');
    }
  };

  // Trigger Evidence file upload
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAction || !uploadFile) return;

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', uploadFile);
    if (uploadDescription) {
      formData.append('description', uploadDescription);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/actions/${selectedAction.id}/evidence`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to upload evidence file');
      }

      const newEvidence = await response.json();

      // Update drawer state to show the uploaded file immediately
      if (selectedAction) {
        const updatedAction = {
          ...selectedAction,
          evidences: [...selectedAction.evidences, newEvidence],
        };
        setSelectedAction(updatedAction);
        
        // Also update local list so it stays in sync
        setActions((prev) =>
          prev.map((item) => (item.id === selectedAction.id ? updatedAction : item))
        );
      }

      setUploadFile(null);
      setUploadDescription('');
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload evidence.');
    } finally {
      setUploading(false);
    }
  };

  // Trigger Evidence deletion
  const handleDeleteEvidence = async (evidenceId: string) => {
    if (!window.confirm('Are you sure you want to delete this evidence file?')) return;
    setUploadError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/evidence/${evidenceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete evidence file');
      }

      // Update drawer state
      if (selectedAction) {
        const updatedAction = {
          ...selectedAction,
          evidences: selectedAction.evidences.filter((ev) => ev.id !== evidenceId),
        };
        setSelectedAction(updatedAction);

        // Update local list
        setActions((prev) =>
          prev.map((item) => (item.id === selectedAction.id ? updatedAction : item))
        );
      }
    } catch (err: any) {
      setUploadError(err.message || 'Failed to delete evidence file.');
    }
  };

  // Status Chip formatting
  const getStatusChip = (status: string) => {
    switch (status) {
      case 'open':
        return <Chip label="Open" size="small" variant="outlined" sx={{ borderColor: 'text.secondary', color: 'text.secondary' }} />;
      case 'in_progress':
        return <Chip label="In Progress" size="small" color="primary" sx={{ fontWeight: 'bold' }} />;
      case 'completed':
        return <Chip label="Completed" size="small" color="warning" sx={{ fontWeight: 'bold' }} />;
      case 'verified':
        return <Chip label="Verified" size="small" color="success" sx={{ fontWeight: 'bold' }} />;
      case 'closed':
        return <Chip label="Closed" size="small" color="success" variant="outlined" sx={{ fontWeight: 'bold' }} />;
      case 'cancelled':
        return <Chip label="Cancelled" size="small" color="error" variant="outlined" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  // Priority Chip formatting
  const getPriorityChip = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Chip label="High" size="small" color="error" variant="outlined" sx={{ fontWeight: 'bold' }} />;
      case 'medium':
        return <Chip label="Medium" size="small" color="warning" variant="outlined" sx={{ fontWeight: 'bold' }} />;
      case 'low':
        return <Chip label="Low" size="small" color="success" variant="outlined" sx={{ fontWeight: 'bold' }} />;
      default:
        return <Chip label={priority} size="small" variant="outlined" />;
    }
  };

  // AP Chip helper
  const getApChip = (ap: string | null) => {
    if (!ap) return <Chip label="—" size="small" variant="outlined" />;
    switch (ap) {
      case 'H':
        return <Chip label="H" size="small" color="error" sx={{ fontWeight: 'bold', width: 28, height: 20 }} />;
      case 'M':
        return <Chip label="M" size="small" color="warning" sx={{ fontWeight: 'bold', width: 28, height: 20 }} />;
      case 'L':
        return <Chip label="L" size="small" color="success" sx={{ fontWeight: 'bold', width: 28, height: 20 }} />;
      default:
        return <Chip label={ap} size="small" />;
    }
  };

  // Filter actions based on status filter
  const filteredActions = actions.filter((action) => {
    if (statusFilter === 'all') return true;
    return action.status === statusFilter;
  });

  return (
    <Box sx={{ maxWidth: '1440px', mx: 'auto', px: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header Section */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Actions & Corrective Actions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Step 6 of the Quality Workflow: Manage assigned tasks, track risk reduction, and verify evidence.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          {/* View mode toggle */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, val) => val && setViewMode(val)}
            size="small"
          >
            <Tooltip title="Table View">
              <ToggleButton value="table">
                <TableIcon fontSize="small" />
              </ToggleButton>
            </Tooltip>
            <Tooltip title="Kanban View">
              <ToggleButton value="kanban">
                <KanbanIcon fontSize="small" />
              </ToggleButton>
            </Tooltip>
            <Tooltip title="Calendar View">
              <ToggleButton value="calendar">
                <CalendarIcon fontSize="small" />
              </ToggleButton>
            </Tooltip>
          </ToggleButtonGroup>

          {/* Project selector filter */}
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Project</InputLabel>
            <Select
              value={selectedProjectId}
              label="Filter by Project"
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              <MenuItem value="all">All Projects</MenuItem>
              {projects.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <IconButton onClick={fetchActions} disabled={loading} color="primary" sx={{ border: '1px solid rgba(40, 37, 29, 0.1)' }}>
            <RefreshIcon />
          </IconButton>
        </Stack>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Tabs & Sub-filters */}
      <Box sx={{ display: 'flex', borderBottom: '1px solid #2e2e36', mb: 3, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Stack direction="row" spacing={1}>
          <Button
            variant={tabFilter === 'assigned' ? 'contained' : 'text'}
            onClick={() => setTabFilter('assigned')}
            color="primary"
            sx={{ px: 3, py: 1, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
          >
            My Assigned Actions
          </Button>
          <Button
            variant={tabFilter === 'all-project' ? 'contained' : 'text'}
            onClick={() => setTabFilter('all-project')}
            disabled={selectedProjectId === 'all'}
            color="primary"
            sx={{ px: 3, py: 1, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
          >
            All Project Actions
          </Button>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ pb: 1 }}>
          {['all', 'open', 'in_progress', 'completed', 'verified', 'closed', 'cancelled'].map((st) => (
            <Chip
              key={st}
              label={st.toUpperCase().replace('_', ' ')}
              onClick={() => setStatusFilter(st)}
              variant={statusFilter === st ? 'filled' : 'outlined'}
              color={statusFilter === st ? 'primary' : 'default'}
              size="small"
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Stack>
      </Box>

      {/* Content Area */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : viewMode === 'table' ? (
        <TableContainer component={Paper} sx={{ border: '1px solid rgba(40, 37, 29, 0.1)', borderRadius: 3, bgcolor: 'background.paper', boxShadow: 'none' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F7F6F2' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Action Description</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Project</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Priority</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Due Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Assigned To</TableCell>
                <TableCell sx={{ fontWeight: 'bold', align: 'center' }}>FMEA Before</TableCell>
                <TableCell sx={{ fontWeight: 'bold', align: 'center' }}>FMEA After</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Manage</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredActions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No action items match the active filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredActions.map((action) => {
                  const mainLink = action.fmeaLinks[0];
                  return (
                    <TableRow key={action.id} sx={{ '&:hover': { bgcolor: 'rgba(40, 37, 29, 0.01)' } }}>
                      {/* Action Description */}
                      <TableCell sx={{ maxWidth: 280 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {action.description}
                        </Typography>
                        {action.actionType && (
                          <Chip
                            label={action.actionType.toUpperCase()}
                            size="small"
                            variant="outlined"
                            sx={{ mt: 0.5, fontSize: '0.65rem', height: 18 }}
                          />
                        )}
                      </TableCell>
                      
                      {/* Project */}
                      <TableCell>{action.project.name}</TableCell>

                      {/* Priority */}
                      <TableCell>{getPriorityChip(action.priority)}</TableCell>

                      {/* Status */}
                      <TableCell>{getStatusChip(action.status)}</TableCell>

                      {/* Due Date */}
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(action.dueDate).toLocaleDateString()}
                        </Typography>
                      </TableCell>

                      {/* Assigned To */}
                      <TableCell sx={{ minWidth: 140 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {action.owner.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {action.owner.email}
                        </Typography>
                      </TableCell>

                      {/* FMEA Before */}
                      <TableCell align="center">
                        {mainLink ? (
                          <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'center', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                              ({mainLink.beforeSeverity},{mainLink.beforeOccurrence},{mainLink.beforeDetection})
                            </Typography>
                            {getApChip(mainLink.beforeAp)}
                          </Stack>
                        ) : '—'}
                      </TableCell>

                      {/* FMEA After */}
                      <TableCell align="center">
                        {mainLink && mainLink.afterSeverity ? (
                          <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'center', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                              ({mainLink.afterSeverity},{mainLink.afterOccurrence},{mainLink.afterDetection})
                            </Typography>
                            {getApChip(mainLink.afterAp)}
                          </Stack>
                        ) : (
                          <Typography variant="caption" color="text.secondary">Pending</Typography>
                        )}
                      </TableCell>

                      {/* Open Details button */}
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => handleOpenDrawer(action)} color="primary">
                          <LaunchIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : viewMode === 'kanban' ? (
        <Grid container spacing={2}>
          {['open', 'in_progress', 'completed', 'verified', 'closed'].map((status) => {
            const colActions = filteredActions.filter((a) => a.status === status);
            return (
              <Grid size={{ xs: 12, sm: 6, md: 2.4 }} key={status}>
                <Paper sx={{ p: 2, bgcolor: '#F7F6F2', border: '1px solid rgba(40, 37, 29, 0.08)', borderRadius: 3, minHeight: 500, boxShadow: 'none' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, textTransform: 'uppercase', color: 'text.secondary', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{status.replace('_', ' ')}</span>
                    <Chip label={colActions.length} size="small" sx={{ height: 18, fontSize: '0.7rem' }} />
                  </Typography>
                  <Stack spacing={1.5}>
                    {colActions.map((action) => (
                      <Card key={action.id} sx={{ border: '1px solid rgba(40, 37, 29, 0.08)', borderRadius: 2, boxShadow: 'none', bgcolor: 'background.paper' }}>
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: 40 }}>
                            {action.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                            Project: {action.project.name}
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                            <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: 'primary.main', color: 'white' }}>
                              {action.owner.name[0].toUpperCase()}
                            </Avatar>
                            <IconButton size="small" onClick={() => handleOpenDrawer(action)} color="primary">
                              <LaunchIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                    {colActions.length === 0 && (
                      <Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block', py: 4 }}>
                        No items
                      </Typography>
                    )}
                  </Stack>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        /* Calendar Schedule View */
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredActions.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center', border: '1px solid rgba(40, 37, 29, 0.1)', borderRadius: 3, boxShadow: 'none' }}>
              <Typography color="text.secondary">No actions scheduled.</Typography>
            </Paper>
          ) : (
            Object.entries(
              filteredActions.reduce<Record<string, any[]>>((acc, action) => {
                const dateStr = new Date(action.dueDate).toLocaleDateString(undefined, {
                  weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                });
                if (!acc[dateStr]) acc[dateStr] = [];
                acc[dateStr].push(action);
                return acc;
              }, {})
            ).map(([dateLabel, dateActions]) => (
              <Paper key={dateLabel} sx={{ p: 2.5, border: '1px solid rgba(40, 37, 29, 0.08)', borderRadius: 3, boxShadow: 'none' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
                  {dateLabel}
                </Typography>
                <Grid container spacing={2}>
                  {dateActions.map((action) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={action.id}>
                      <Card sx={{ border: '1px solid rgba(40, 37, 29, 0.08)', borderRadius: 2, boxShadow: 'none' }}>
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                            {action.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                            Project: {action.project.name}
                          </Typography>
                          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                            <Chip label={action.status.toUpperCase()} size="small" variant="outlined" />
                            <IconButton size="small" onClick={() => handleOpenDrawer(action)} color="primary">
                              <LaunchIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            ))
          )}
        </Box>
      )}

      {/* Details & Verification Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleCloseDrawer}
      >
        {selectedAction && (
          <Box sx={{ width: { xs: '100%', sm: 600 }, p: 3, bgcolor: 'background.paper', borderLeft: '1px solid rgba(40, 37, 29, 0.1)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Drawer Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  Action Item Details
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ID: {selectedAction.id}
                </Typography>
              </Box>
              <IconButton onClick={handleCloseDrawer}>
                <CloseIcon />
              </IconButton>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Scrollable Content Area */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
              <Stack spacing={3}>
                {/* Description Textarea */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Action Task / Description
                  </Typography>
                  <Typography variant="body2" sx={{ p: 2, bgcolor: '#F7F6F2', borderRadius: 1.5, border: '1px solid rgba(40, 37, 29, 0.08)' }}>
                    {selectedAction.description}
                  </Typography>
                </Box>

                {/* Linked FMEA Context (Step, Failure Mode, Before ratings) */}
                {selectedAction.fmeaLinks.length > 0 && selectedAction.fmeaLinks[0].pfmeaRow && (
                  <Box sx={{ p: 2, bgcolor: 'rgba(33, 150, 243, 0.05)', borderRadius: 2, border: '1px dashed rgba(33, 150, 243, 0.3)' }}>
                    <Typography variant="subtitle2" color="primary.light" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center' }}>
                      Associated FMEA Row Context
                    </Typography>
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5, mt: 0.5 }}>
                      <Box sx={{ gridColumn: 'span 2' }}>
                        <Typography variant="caption" color="text.secondary">Process Step:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {selectedAction.fmeaLinks[0].pfmeaRow.processStep.stepNumber} - {selectedAction.fmeaLinks[0].pfmeaRow.processStep.name}
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">Original S/O/D Rating:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          ({selectedAction.fmeaLinks[0].beforeSeverity}, {selectedAction.fmeaLinks[0].beforeOccurrence}, {selectedAction.fmeaLinks[0].beforeDetection})
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">Before Action Priority (AP):</Typography>
                        <Box sx={{ mt: 0.5 }}>{getApChip(selectedAction.fmeaLinks[0].beforeAp)}</Box>
                      </Box>
                    </Box>
                  </Box>
                )}

                {/* Action Properties Form */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Task Parameters
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                    {/* Status Dropdown */}
                    <Box>
                      <FormControl fullWidth size="small">
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={editStatus}
                          label="Status"
                          onChange={(e) => setEditStatus(e.target.value)}
                        >
                          <MenuItem value="open">Open</MenuItem>
                          <MenuItem value="in_progress">In Progress</MenuItem>
                          <MenuItem value="completed">Completed</MenuItem>
                          <MenuItem value="verified">Verified</MenuItem>
                          <MenuItem value="closed">Closed</MenuItem>
                          <MenuItem value="cancelled">Cancelled</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>

                    {/* Priority Dropdown */}
                    <Box>
                      <FormControl fullWidth size="small">
                        <InputLabel>Priority</InputLabel>
                        <Select
                          value={editPriority}
                          label="Priority"
                          onChange={(e) => setEditPriority(e.target.value)}
                        >
                          <MenuItem value="high">High</MenuItem>
                          <MenuItem value="medium">Medium</MenuItem>
                          <MenuItem value="low">Low</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>

                    {/* Owner Dropdown */}
                    <Box sx={{ gridColumn: 'span 2' }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Assigned Owner</InputLabel>
                        <Select
                          value={editOwnerId}
                          label="Assigned Owner"
                          onChange={(e) => setEditOwnerId(e.target.value)}
                        >
                          {users.map((u) => (
                            <MenuItem key={u.id} value={u.id}>
                              {u.name} ({u.email})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  </Box>
                </Box>

                {/* Verification & Risk Optimization section (S/O/D Reduction) */}
                {['completed', 'verified', 'closed'].includes(editStatus) && (
                  <Box sx={{ p: 2, bgcolor: '#F7F6F2', borderRadius: 2, border: '1px solid rgba(40, 37, 29, 0.08)' }}>
                    <Typography variant="subtitle2" color="warning.main" sx={{ fontWeight: 'bold', mb: 2 }}>
                      Risk Optimization & After-Ratings
                    </Typography>
                    
                    <Stack spacing={2}>
                      <TextField
                        label="Action Completion / Optimization Notes"
                        multiline
                        rows={3}
                        value={editCompletionNotes}
                        onChange={(e) => setEditCompletionNotes(e.target.value)}
                        placeholder="Explain what steps were taken to prevent or detect the failure mode..."
                        fullWidth
                        size="small"
                      />

                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Assign optimized S/O/D ratings (1-10) to evaluate effectiveness:
                      </Typography>

                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                        {/* After Severity */}
                        <Box>
                          <FormControl fullWidth size="small">
                            <InputLabel>After S</InputLabel>
                            <Select
                              value={editSeverity}
                              label="After S"
                              onChange={(e) => setEditSeverity(!e.target.value ? '' : Number(e.target.value))}
                            >
                              <MenuItem value="">—</MenuItem>
                              {ratingOptions.map((val) => (
                                <MenuItem key={val} value={val}>{val}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>

                        {/* After Occurrence */}
                        <Box>
                          <FormControl fullWidth size="small">
                            <InputLabel>After O</InputLabel>
                            <Select
                              value={editOccurrence}
                              label="After O"
                              onChange={(e) => setEditOccurrence(!e.target.value ? '' : Number(e.target.value))}
                            >
                              <MenuItem value="">—</MenuItem>
                              {ratingOptions.map((val) => (
                                <MenuItem key={val} value={val}>{val}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>

                        {/* After Detection */}
                        <Box>
                          <FormControl fullWidth size="small">
                            <InputLabel>After D</InputLabel>
                            <Select
                              value={editDetection}
                              label="After D"
                              onChange={(e) => setEditDetection(!e.target.value ? '' : Number(e.target.value))}
                            >
                              <MenuItem value="">—</MenuItem>
                              {ratingOptions.map((val) => (
                                <MenuItem key={val} value={val}>{val}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>
                      </Box>

                      {/* Realtime AP recalculation badge */}
                      {calculatedAfterAp && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, p: 1, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Calculated After Action Priority (AP):
                          </Typography>
                          {getApChip(calculatedAfterAp)}
                        </Box>
                      )}
                    </Stack>
                  </Box>
                )}

                {/* Evidence Attachments Section */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Verification Evidence (Attachments)
                  </Typography>

                  {/* List of evidence */}
                  {selectedAction.evidences.length === 0 ? (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                      No files uploaded as evidence. Upload files (PDFs, reports, checklists) below to verify effectiveness.
                    </Typography>
                  ) : (
                    <Stack spacing={1} sx={{ mb: 2 }}>
                      {selectedAction.evidences.map((ev) => (
                        <Box
                          key={ev.id}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            p: 1.5,
                            bgcolor: '#F7F6F2',
                            borderRadius: 1,
                            border: '1px solid rgba(40, 37, 29, 0.08)',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                              <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                                {ev.fileName}
                              </Typography>
                              {ev.description && (
                                <Typography variant="caption" color="text.secondary" noWrap>
                                  {ev.description}
                                </Typography>
                              )}
                              <Typography variant="caption" color="text.secondary">
                                {(ev.fileSize / 1024).toFixed(1)} KB | Uploaded by {ev.uploader.name}
                              </Typography>
                            </Box>
                          </Box>

                          <Stack direction="row" spacing={0.5}>
                            <IconButton
                              size="small"
                              component="a"
                              href={ev.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              color="primary"
                              title="Download File"
                            >
                              <GetAppIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteEvidence(ev.id)}
                              title="Delete Evidence"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  )}

                  {/* Upload new evidence form */}
                  <Box component="form" onSubmit={handleFileUpload} sx={{ mt: 1, p: 2, border: '1px dashed #2e2e36', borderRadius: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                      Upload New Evidence
                    </Typography>
                    
                    {uploadError && (
                      <Alert severity="error" sx={{ mb: 1.5 }}>
                        {uploadError}
                      </Alert>
                    )}

                    <Stack spacing={1.5}>
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<CloudUploadIcon />}
                        size="small"
                        color="secondary"
                        fullWidth
                      >
                        {uploadFile ? uploadFile.name : 'Choose File'}
                        <input
                          type="file"
                          hidden
                          onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                          required
                        />
                      </Button>

                      <TextField
                        label="Description / Label"
                        placeholder="e.g. Test Report, Certificate"
                        value={uploadDescription}
                        onChange={(e) => setUploadDescription(e.target.value)}
                        size="small"
                        fullWidth
                      />

                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        size="small"
                        disabled={!uploadFile || uploading}
                        fullWidth
                      >
                        {uploading ? <CircularProgress size={16} color="inherit" /> : 'Upload Evidence'}
                      </Button>
                    </Stack>
                  </Box>
                </Box>
              </Stack>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Save / Actions Footer */}
            <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
              <Button onClick={handleCloseDrawer} color="inherit">
                Close
              </Button>
              <Button onClick={handleSaveAction} variant="contained" color="primary">
                Save Changes
              </Button>
            </Stack>
          </Box>
        )}
      </Drawer>
    </Box>
  );
};
