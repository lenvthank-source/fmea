import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Stack, Chip,
  CircularProgress, IconButton, Table, TableBody,
  TableCell, TableHead, TableRow, Tooltip, Alert, TextField,
  Grid, MenuItem, Paper, TableContainer
} from '@mui/material';
import {
  Close as CloseIcon,
  Link as LinkIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { API_BASE_URL } from '../../../config';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { useToast, getToastSeverity } from '../../../components/Toast/ToastProvider';
import { parseApiError } from '../../../lib/api';
import { calculateAP } from '../utils/apCalculator';

interface LinkAction {
  id: string;
  description: string;
  preventionAction?: string | null;
  detectionAction?: string | null;
  actionTaken?: string | null;
  targetDate?: string | null;
  completionDate?: string | null;
  responsiblePerson?: string | null;
  revisedSeverity?: number | null;
  revisedOccurrence?: number | null;
  revisedDetection?: number | null;
  remarks?: string | null;
  status: string;
}

interface LinkedEntry {
  linkId: string;
  failure: {
    id: string;
    narration: string;
    role: string;
    severityRating?: number | null;
    occurrenceRating?: number | null;
    detectionRating?: number | null;
    currentControlPrevention?: string | null;
    currentControlDetection?: string | null;
    filterCode?: string | null;
    function: { id: string; narration: string; parentType: string; parentId: string };
  };
  actions: LinkAction[];
}

interface ModeData {
  mode: {
    id: string;
    narration: string;
    isLinked: boolean;
    function: { id: string; narration: string; parentType: string; parentId: string };
  };
  effects: LinkedEntry[];
  causes: LinkedEntry[];
  highestSeverity: number;
}

interface FailureDetailWindowProps {
  open: boolean;
  onClose: () => void;
  failureModeId: string | null;
  token: string;
  onRefresh: () => void;
  projectName?: string;
}

export const FailureDetailWindow: React.FC<FailureDetailWindowProps> = ({
  open,
  onClose,
  failureModeId,
  token,
  onRefresh,
  projectName
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState(1); // Default to Causes tab (matching Image 2)
  const [data, setData] = useState<ModeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selection state
  const [selectedCauseId, setSelectedCauseId] = useState<string | null>(null);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);

  // Inline editing for prevention and detection controls
  const [editingControls, setEditingControls] = useState<{ [failureId: string]: { prevention: string; detection: string; dirty?: boolean } }>({});
  const [savingControlId, setSavingControlId] = useState<string | null>(null);

  // Edit Cause modal state
  const [editCauseModalOpen, setEditCauseModalOpen] = useState(false);
  const [editCauseForm, setEditCauseForm] = useState({
    id: '',
    narration: '',
    occurrenceRating: '',
    detectionRating: '',
    filterCode: '',
    currentControlPrevention: '',
    currentControlDetection: '',
  });

  // Add/Edit action modal state matching Image 3
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionModalLinkId, setActionModalLinkId] = useState<string | null>(null);
  const [editingAction, setEditingAction] = useState<LinkAction | null>(null);
  const [actionModalCauseName, setActionModalCauseName] = useState<string>('');
  const [actionForm, setActionForm] = useState({
    preventionAction: '',
    detectionAction: '',
    actionTaken: '',
    targetDate: '',
    completionDate: '',
    responsiblePerson: '',
    status: 'Open',
    revisedSeverity: '',
    revisedOccurrence: '',
    revisedDetection: '',
    remarks: '',
  });

  // Guideline Dialog state
  const [guidelineOpen, setGuidelineOpen] = useState(false);
  const [guidelineType, setGuidelineType] = useState<'severity' | 'occurrence' | 'detection'>('severity');
  const [guidelineScales, setGuidelineScales] = useState<{ severity: any[]; occurrence: any[]; detection: any[] }>({
    severity: [],
    occurrence: [],
    detection: [],
  });

  // Confirm dialog state
  const [confirmState, setConfirmState] = useState<{ open: boolean; title: string; message: string; detail?: string; onConfirm: () => void } | null>(null);

  const loadData = async () => {
    if (!failureModeId || !token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/failure-modes/${failureModeId}/links`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const msg = await parseApiError(res, 'Failed to load failure details');
        throw new Error(msg);
      }
      const fetched = await res.json();
      setData(fetched);

      // Initialize control values
      const controlsMap: { [failureId: string]: { prevention: string; detection: string } } = {};
      fetched.causes.forEach((c: LinkedEntry) => {
        controlsMap[c.failure.id] = {
          prevention: c.failure.currentControlPrevention || '',
          detection: c.failure.currentControlDetection || '',
        };
      });
      setEditingControls(controlsMap);

      // Select first cause by default if none selected
      if (fetched.causes.length > 0 && !selectedCauseId) {
        setSelectedCauseId(fetched.causes[0].failure.id);
      }
    } catch (e: any) {
      const msg = e.message || 'Failed to load failure details';
      setError(msg);
      showToast(msg, getToastSeverity(msg));
    } finally {
      setLoading(false);
    }
  };

  const fetchRatingScales = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/rating-scales`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setGuidelineScales(json);
      }
    } catch (err) {
      console.error('Failed to load rating scales', err);
    }
  };

  useEffect(() => {
    if (open) {
      loadData();
      fetchRatingScales();
    }
  }, [open, failureModeId]);

  // Save inline prevention/detection controls
  const handleSaveControls = async (failureId: string) => {
    const controls = editingControls[failureId];
    if (!controls) return;
    setSavingControlId(failureId);
    try {
      const res = await fetch(`${API_BASE_URL}/structure-failures/${failureId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentControlPrevention: controls.prevention || null,
          currentControlDetection: controls.detection || null,
        }),
      });
      if (!res.ok) {
        const msg = await parseApiError(res, 'Failed to save controls');
        throw new Error(msg);
      }
      setEditingControls(prev => ({
        ...prev,
        [failureId]: { ...prev[failureId], dirty: false },
      }));
      showToast('Controls updated successfully', 'success');
      onRefresh();
    } catch (e: any) {
      const msg = e.message || 'Failed to save controls';
      showToast(msg, getToastSeverity(msg));
    } finally {
      setSavingControlId(null);
    }
  };

  // Unlink Cause/Effect
  const doUnlink = async (linkId: string) => {
    setConfirmState(null);
    try {
      const res = await fetch(`${API_BASE_URL}/failure-links/${linkId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const msg = await parseApiError(res, 'Failed to unlink failure');
        throw new Error(msg);
      }
      showToast('Failure unlinked successfully', 'success');
      loadData();
      onRefresh();
    } catch (e: any) {
      const msg = e.message || 'Failed to unlink';
      showToast(msg, getToastSeverity(msg));
    }
  };

  const handleUnlink = (linkId: string) => {
    setConfirmState({
      open: true,
      title: 'Unlink Failure',
      message: 'Are you sure you want to unlink this failure? Associated actions will also be unlinked.',
      detail: 'This action cannot be undone.',
      onConfirm: () => doUnlink(linkId),
    });
  };

  // Open Edit Cause Dialog
  const handleOpenEditCause = () => {
    const selectedEntry = data?.causes.find(c => c.failure.id === selectedCauseId);
    if (!selectedEntry) return;
    setEditCauseForm({
      id: selectedEntry.failure.id,
      narration: selectedEntry.failure.narration,
      occurrenceRating: selectedEntry.failure.occurrenceRating ? String(selectedEntry.failure.occurrenceRating) : '',
      detectionRating: selectedEntry.failure.detectionRating ? String(selectedEntry.failure.detectionRating) : '',
      filterCode: selectedEntry.failure.filterCode || '',
      currentControlPrevention: editingControls[selectedEntry.failure.id]?.prevention || selectedEntry.failure.currentControlPrevention || '',
      currentControlDetection: editingControls[selectedEntry.failure.id]?.detection || selectedEntry.failure.currentControlDetection || '',
    });
    setEditCauseModalOpen(true);
  };

  const handleSaveEditCause = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/structure-failures/${editCauseForm.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          narration: editCauseForm.narration,
          occurrenceRating: editCauseForm.occurrenceRating ? Number(editCauseForm.occurrenceRating) : null,
          detectionRating: editCauseForm.detectionRating ? Number(editCauseForm.detectionRating) : null,
          filterCode: editCauseForm.filterCode || null,
          currentControlPrevention: editCauseForm.currentControlPrevention || null,
          currentControlDetection: editCauseForm.currentControlDetection || null,
        }),
      });
      if (!res.ok) {
        const msg = await parseApiError(res, 'Failed to update cause');
        throw new Error(msg);
      }
      setEditCauseModalOpen(false);
      showToast('Cause updated successfully', 'success');
      loadData();
      onRefresh();
    } catch (e: any) {
      const msg = e.message || 'Failed to update cause';
      showToast(msg, getToastSeverity(msg));
    }
  };

  // Add / Edit Action Handlers
  const openAddActionModal = (linkId: string, causeNarration: string) => {
    setActionModalLinkId(linkId);
    setEditingAction(null);
    setActionModalCauseName(causeNarration);
    setActionForm({
      preventionAction: '',
      detectionAction: '',
      actionTaken: '',
      targetDate: '',
      completionDate: '',
      responsiblePerson: '',
      status: 'Open',
      revisedSeverity: '',
      revisedOccurrence: '',
      revisedDetection: '',
      remarks: '',
    });
    setActionModalOpen(true);
  };

  const openEditActionModal = (linkId: string, causeNarration: string, action: LinkAction) => {
    setActionModalLinkId(linkId);
    setEditingAction(action);
    setActionModalCauseName(causeNarration);
    setActionForm({
      preventionAction: action.preventionAction || action.description || '',
      detectionAction: action.detectionAction || '',
      actionTaken: action.actionTaken || '',
      targetDate: action.targetDate ? action.targetDate.split('T')[0] : '',
      completionDate: action.completionDate ? action.completionDate.split('T')[0] : '',
      responsiblePerson: action.responsiblePerson || '',
      status: action.status || 'Open',
      revisedSeverity: action.revisedSeverity ? String(action.revisedSeverity) : '',
      revisedOccurrence: action.revisedOccurrence ? String(action.revisedOccurrence) : '',
      revisedDetection: action.revisedDetection ? String(action.revisedDetection) : '',
      remarks: action.remarks || '',
    });
    setActionModalOpen(true);
  };

  const submitActionModal = async () => {
    if (!actionModalLinkId) return;
    try {
      const url = editingAction
        ? `${API_BASE_URL}/link-actions/${editingAction.id}`
        : `${API_BASE_URL}/failure-links/${actionModalLinkId}/actions`;
      const method = editingAction ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          description: actionForm.preventionAction || actionForm.detectionAction || actionForm.actionTaken || 'Action Item',
          preventionAction: actionForm.preventionAction || undefined,
          detectionAction: actionForm.detectionAction || undefined,
          actionTaken: actionForm.actionTaken || undefined,
          targetDate: actionForm.targetDate || undefined,
          completionDate: actionForm.completionDate || undefined,
          responsiblePerson: actionForm.responsiblePerson || undefined,
          status: actionForm.status,
          revisedSeverity: actionForm.revisedSeverity ? Number(actionForm.revisedSeverity) : undefined,
          revisedOccurrence: actionForm.revisedOccurrence ? Number(actionForm.revisedOccurrence) : undefined,
          revisedDetection: actionForm.revisedDetection ? Number(actionForm.revisedDetection) : undefined,
          remarks: actionForm.remarks || undefined,
        }),
      });
      if (!res.ok) {
        const msg = await parseApiError(res, 'Failed to save action');
        throw new Error(msg);
      }
      setActionModalOpen(false);
      showToast(editingAction ? 'Action updated' : 'Action created', 'success');
      loadData();
      onRefresh();
    } catch (e: any) {
      const msg = e.message || 'Failed to save action';
      showToast(msg, getToastSeverity(msg));
    }
  };

  // Delete Action
  const doDeleteAction = async (actionId: string) => {
    setConfirmState(null);
    try {
      const res = await fetch(`${API_BASE_URL}/link-actions/${actionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const msg = await parseApiError(res, 'Failed to delete action');
        throw new Error(msg);
      }
      showToast('Action deleted', 'success');
      setSelectedActionId(null);
      loadData();
    } catch (e: any) {
      const msg = e.message || 'Failed to delete action';
      showToast(msg, getToastSeverity(msg));
    }
  };

  const handleDeleteAction = (actionId: string) => {
    setConfirmState({
      open: true,
      title: 'Delete Action',
      message: 'Are you sure you want to delete this action?',
      onConfirm: () => doDeleteAction(actionId),
    });
  };

  // Open Rating Guidelines
  const handleOpenGuideline = (type: 'severity' | 'occurrence' | 'detection') => {
    setGuidelineType(type);
    setGuidelineOpen(true);
  };

  const selectedCauseEntry = data?.causes.find(c => c.failure.id === selectedCauseId);
  const selectedActionItem = selectedCauseEntry?.actions.find(a => a.id === selectedActionId);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            height: '88vh',
            borderRadius: '14px',
            border: '1px solid #e4e4e7',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.18)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }
        }
      }}
    >
      {/* ── BREADCRUMB HEADER (Shadcn Theme) ── */}
      <Box sx={{ px: 3, py: 2, bgcolor: '#ffffff', borderBottom: '1px solid #f4f4f5', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b', fontSize: '1.1rem' }}>
              Failure Details
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', mt: 0.5 }}>
              {projectName || 'Process Item'}
            </Typography>

            {/* PS (Process Step) */}
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 0.5 }}>
              <Chip
                size="small"
                label="PS"
                sx={{ height: 18, bgcolor: '#2563eb', color: '#fff', fontWeight: 800, fontSize: '0.65rem', borderRadius: 0.5 }}
              />
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#1d4ed8' }}>
                {data?.mode?.function?.parentId || 'Process Step'}
              </Typography>
            </Stack>

            {/* Function */}
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 0.5, pl: 2 }}>
              <Chip
                size="small"
                label="ƒ"
                sx={{ height: 18, bgcolor: '#16a34a', color: '#fff', fontWeight: 800, fontSize: '0.75rem', borderRadius: 0.5 }}
              />
              <Typography variant="body2" sx={{ color: '#15803d', fontWeight: 600 }}>
                {data?.mode?.function?.narration || 'Function'}
              </Typography>
            </Stack>

            {/* Failure Mode & Highest Severity */}
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 0.5, pl: 4 }}>
              <Chip
                size="small"
                label="F"
                sx={{ height: 18, bgcolor: '#dc2626', color: '#fff', fontWeight: 800, fontSize: '0.75rem', borderRadius: 0.5 }}
              />
              <Typography variant="body2" sx={{ color: '#b91c1c', fontWeight: 800 }}>
                {data?.mode?.narration || 'Failure Mode'}
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ display: 'block', mt: 0.25, pl: 7, fontWeight: 700, color: '#475569' }}>
              Highest Severity : {data?.highestSeverity || '—'}
            </Typography>
          </Box>

          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* ── TABS: EFFECTS | CAUSES (Segmented Pill Bar) ── */}
      <Box sx={{ px: 3, py: 1.25, bgcolor: '#fafafa', borderBottom: '1px solid #e4e4e7', flexShrink: 0 }}>
        <Box sx={{ display: 'inline-flex', p: '3px', bgcolor: '#f4f4f5', borderRadius: '8px', border: '1px solid #e4e4e7' }}>
          <Box
            onClick={() => setActiveTab(0)}
            sx={{
              px: 2,
              py: 0.6,
              borderRadius: '6px',
              cursor: 'pointer',
              bgcolor: activeTab === 0 ? '#ffffff' : 'transparent',
              color: activeTab === 0 ? '#09090b' : '#71717a',
              fontWeight: activeTab === 0 ? 700 : 500,
              fontSize: '0.8rem',
              boxShadow: activeTab === 0 ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            Effects
            <Chip
              label={data?.effects.length || 0}
              size="small"
              sx={{ height: 18, fontSize: '0.625rem', fontWeight: 700, bgcolor: activeTab === 0 ? '#fee2e2' : '#e4e4e7', color: activeTab === 0 ? '#dc2626' : '#71717a' }}
            />
          </Box>
          <Box
            onClick={() => setActiveTab(1)}
            sx={{
              px: 2,
              py: 0.6,
              borderRadius: '6px',
              cursor: 'pointer',
              bgcolor: activeTab === 1 ? '#ffffff' : 'transparent',
              color: activeTab === 1 ? '#09090b' : '#71717a',
              fontWeight: activeTab === 1 ? 700 : 500,
              fontSize: '0.8rem',
              boxShadow: activeTab === 1 ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            Causes & Actions
            <Chip
              label={data?.causes.length || 0}
              size="small"
              sx={{ height: 18, fontSize: '0.625rem', fontWeight: 700, bgcolor: activeTab === 1 ? '#ffedd5' : '#e4e4e7', color: activeTab === 1 ? '#ea580c' : '#71717a' }}
            />
          </Box>
        </Box>
      </Box>

      {/* ── DIALOG CONTENT ── */}
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', flexGrow: 1, overflowY: 'auto' }}>
        {error && <Alert severity="error" onClose={() => setError(null)} sx={{ m: 2 }}>{error}</Alert>}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <CircularProgress />
          </Box>
        ) : data ? (
          <>
            {/* ──── EFFECTS TAB ──── */}
            {activeTab === 0 && (
              <Box sx={{ p: 2 }}>
                {data.effects.length === 0 ? (
                  <Typography color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', mt: 4 }}>
                    No effects linked yet.
                  </Typography>
                ) : (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#fafafa' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800, color: '#0f172a' }}>Effect Description</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: '#0f172a' }}>Function</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: '#0f172a', width: 80, textAlign: 'center' }}>SEV</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: '#0f172a', width: 100, textAlign: 'center' }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.effects.map(entry => (
                          <TableRow key={entry.linkId} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{entry.failure.narration}</TableCell>
                            <TableCell sx={{ color: 'text.secondary' }}>{entry.failure.function.narration}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              {entry.failure.severityRating ? (
                                <Chip label={entry.failure.severityRating} size="small" color="error" sx={{ fontWeight: 800 }} />
                              ) : '—'}
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Tooltip title="Unlink Effect">
                                <IconButton size="small" color="error" onClick={() => handleUnlink(entry.linkId)}>
                                  <LinkIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}

            {/* ──── CAUSES TAB (MATCHING IMAGE 2) ──── */}
            {activeTab === 1 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* TOOLBAR BUTTONS */}
                <Box
                  sx={{
                    p: 1,
                    px: 2,
                    bgcolor: '#f1f5f9',
                    borderBottom: '1px solid #cbd5e1',
                    display: 'flex',
                    gap: 1,
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    flexShrink: 0
                  }}
                >
                  <Button
                    size="small"
                    variant="contained"
                    disabled={!selectedCauseEntry}
                    onClick={handleOpenEditCause}
                    sx={{ bgcolor: '#0284c7', textTransform: 'none', fontWeight: 700, fontSize: '0.78rem' }}
                  >
                    Edit Cause
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    disabled={!selectedCauseEntry}
                    onClick={() => selectedCauseEntry && handleUnlink(selectedCauseEntry.linkId)}
                    sx={{ bgcolor: '#0284c7', textTransform: 'none', fontWeight: 700, fontSize: '0.78rem' }}
                  >
                    Link/Unlink Cause
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    disabled={!selectedCauseEntry}
                    onClick={() => selectedCauseEntry && openAddActionModal(selectedCauseEntry.linkId, selectedCauseEntry.failure.narration)}
                    sx={{ bgcolor: '#0284c7', textTransform: 'none', fontWeight: 700, fontSize: '0.78rem' }}
                  >
                    Add Action
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    disabled={!selectedActionItem || !selectedCauseEntry}
                    onClick={() => selectedActionItem && selectedCauseEntry && openEditActionModal(selectedCauseEntry.linkId, selectedCauseEntry.failure.narration, selectedActionItem)}
                    sx={{
                      bgcolor: selectedActionItem ? '#0284c7' : '#94a3b8',
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.78rem'
                    }}
                  >
                    Edit Action
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    disabled={!selectedActionItem}
                    onClick={() => selectedActionItem && handleDeleteAction(selectedActionItem.id)}
                    sx={{
                      bgcolor: selectedActionItem ? '#dc2626' : '#94a3b8',
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.78rem'
                    }}
                  >
                    Delete Action
                  </Button>
                </Box>

                {/* CAUSES TABLE (MATCHING IMAGE 2) */}
                <Box sx={{ p: 2, flexGrow: 1, overflowY: 'auto' }}>
                  {data.causes.length === 0 ? (
                    <Typography color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', mt: 4 }}>
                      No causes linked yet.
                    </Typography>
                  ) : (
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden' }}>
                      <Table size="small">
                        {/* Causes Main Table Header */}
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#38bdf8' }}>
                            <TableCell sx={{ fontWeight: 800, color: '#0f172a', width: '22%' }}>Cause Description</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: '#0f172a', width: '25%' }}>Prevention Control</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: '#0f172a', width: '6%', textAlign: 'center' }}>OCC</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: '#0f172a', width: '25%' }}>Detection Control</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: '#0f172a', width: '6%', textAlign: 'center' }}>DET</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: '#0f172a', width: '6%', textAlign: 'center' }}>AP</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: '#0f172a', width: '10%', textAlign: 'center' }}>FC</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {data.causes.map(entry => {
                            const isSelected = selectedCauseId === entry.failure.id;
                            const ap = calculateAP(data.highestSeverity, entry.failure.occurrenceRating, entry.failure.detectionRating);
                            const controls = editingControls[entry.failure.id] || {
                              prevention: entry.failure.currentControlPrevention || '',
                              detection: entry.failure.currentControlDetection || '',
                            };

                            return (
                              <React.Fragment key={entry.linkId}>
                                {/* Primary Cause Row */}
                                <TableRow
                                  onClick={() => setSelectedCauseId(entry.failure.id)}
                                  sx={{
                                    bgcolor: isSelected ? 'rgba(56, 189, 248, 0.08)' : '#ffffff',
                                    cursor: 'pointer',
                                    borderLeft: isSelected ? '4px solid #0284c7' : 'none',
                                    '&:hover': { bgcolor: 'rgba(56, 189, 248, 0.04)' }
                                  }}
                                >
                                  {/* Cause Description */}
                                  <TableCell sx={{ fontWeight: 600, verticalAlign: 'top', py: 1.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <Typography sx={{ fontWeight: 700, color: '#64748b' }}>—</Typography>
                                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                                        {entry.failure.narration}
                                      </Typography>
                                    </Box>
                                  </TableCell>

                                  {/* Prevention Control (Editable inline) */}
                                  <TableCell sx={{ verticalAlign: 'top', py: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <TextField
                                        size="small"
                                        fullWidth
                                        multiline
                                        rows={1}
                                        value={controls.prevention}
                                        placeholder="Enter prevention control..."
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setEditingControls(prev => ({
                                            ...prev,
                                            [entry.failure.id]: { ...prev[entry.failure.id], prevention: val, dirty: true }
                                          }));
                                        }}
                                        onBlur={() => {
                                          if (editingControls[entry.failure.id]?.dirty) {
                                            handleSaveControls(entry.failure.id);
                                          }
                                        }}
                                        sx={{ '& .MuiInputBase-input': { fontSize: '0.85rem' } }}
                                      />
                                      {editingControls[entry.failure.id]?.dirty && (
                                        <IconButton
                                          size="small"
                                          color="primary"
                                          onClick={() => handleSaveControls(entry.failure.id)}
                                          disabled={savingControlId === entry.failure.id}
                                        >
                                          {savingControlId === entry.failure.id ? <CircularProgress size={16} /> : <CheckIcon fontSize="small" />}
                                        </IconButton>
                                      )}
                                    </Box>
                                  </TableCell>

                                  {/* OCC */}
                                  <TableCell sx={{ textAlign: 'center', fontWeight: 800, verticalAlign: 'top', py: 1.5 }}>
                                    {entry.failure.occurrenceRating || '—'}
                                  </TableCell>

                                  {/* Detection Control (Editable inline) */}
                                  <TableCell sx={{ verticalAlign: 'top', py: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <TextField
                                        size="small"
                                        fullWidth
                                        multiline
                                        rows={1}
                                        value={controls.detection}
                                        placeholder="Enter detection control..."
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setEditingControls(prev => ({
                                            ...prev,
                                            [entry.failure.id]: { ...prev[entry.failure.id], detection: val, dirty: true }
                                          }));
                                        }}
                                        onBlur={() => {
                                          if (editingControls[entry.failure.id]?.dirty) {
                                            handleSaveControls(entry.failure.id);
                                          }
                                        }}
                                        sx={{ '& .MuiInputBase-input': { fontSize: '0.85rem' } }}
                                      />
                                      {editingControls[entry.failure.id]?.dirty && (
                                        <IconButton
                                          size="small"
                                          color="primary"
                                          onClick={() => handleSaveControls(entry.failure.id)}
                                          disabled={savingControlId === entry.failure.id}
                                        >
                                          {savingControlId === entry.failure.id ? <CircularProgress size={16} /> : <CheckIcon fontSize="small" />}
                                        </IconButton>
                                      )}
                                    </Box>
                                  </TableCell>

                                  {/* DET */}
                                  <TableCell sx={{ textAlign: 'center', fontWeight: 800, verticalAlign: 'top', py: 1.5 }}>
                                    {entry.failure.detectionRating || '—'}
                                  </TableCell>

                                  {/* AP */}
                                  <TableCell sx={{ textAlign: 'center', verticalAlign: 'top', py: 1.5 }}>
                                    {ap ? (
                                      <Chip
                                        label={ap}
                                        size="small"
                                        sx={{
                                          height: 20,
                                          fontWeight: 800,
                                          fontSize: '0.75rem',
                                          bgcolor: ap === 'H' ? '#fee2e2' : ap === 'M' ? '#fef3c7' : '#dcfce7',
                                          color: ap === 'H' ? '#991b1b' : ap === 'M' ? '#92400e' : '#166534'
                                        }}
                                      />
                                    ) : '—'}
                                  </TableCell>

                                  {/* FC */}
                                  <TableCell sx={{ textAlign: 'center', verticalAlign: 'top', py: 1.5 }}>
                                    {entry.failure.filterCode || '—'}
                                  </TableCell>
                                </TableRow>

                                {/* Nested Actions Sub-Table (Matching Image 2) */}
                                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                  <TableCell colSpan={7} sx={{ p: 0, borderBottom: '2px solid #cbd5e1' }}>
                                    <TableContainer>
                                      <Table size="small">
                                        <TableHead>
                                          <TableRow sx={{ bgcolor: '#e2e8f0' }}>
                                            <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>Prevention Action</TableCell>
                                            <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>Detection Action</TableCell>
                                            <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>Responsible Person</TableCell>
                                            <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>Target Date</TableCell>
                                            <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>Status</TableCell>
                                            <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>Action Taken</TableCell>
                                            <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>Completion Date</TableCell>
                                            <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', textAlign: 'center' }}>Sev</TableCell>
                                            <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', textAlign: 'center' }}>OCC</TableCell>
                                            <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', textAlign: 'center' }}>DET</TableCell>
                                            <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', textAlign: 'center' }}>AP</TableCell>
                                            <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>Remarks</TableCell>
                                          </TableRow>
                                        </TableHead>
                                        <TableBody>
                                          {entry.actions.length === 0 ? (
                                            <TableRow>
                                              <TableCell colSpan={12} sx={{ textAlign: 'center', color: 'text.secondary', fontStyle: 'italic', py: 1 }}>
                                                No corrective actions added for this cause. Click "Add Action" above.
                                              </TableCell>
                                            </TableRow>
                                          ) : (
                                            entry.actions.map(action => {
                                              const isActionSelected = selectedActionId === action.id;
                                              const revAp = calculateAP(action.revisedSeverity, action.revisedOccurrence, action.revisedDetection);

                                              return (
                                                <TableRow
                                                  key={action.id}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedCauseId(entry.failure.id);
                                                    setSelectedActionId(action.id);
                                                  }}
                                                  sx={{
                                                    bgcolor: isActionSelected ? '#fef08a' : '#ffffff',
                                                    cursor: 'pointer',
                                                    '&:hover': { bgcolor: isActionSelected ? '#fde047' : '#f8fafc' }
                                                  }}
                                                >
                                                  <TableCell sx={{ fontSize: '0.8rem', fontWeight: 500 }}>{action.preventionAction || action.description || '—'}</TableCell>
                                                  <TableCell sx={{ fontSize: '0.8rem' }}>{action.detectionAction || '—'}</TableCell>
                                                  <TableCell sx={{ fontSize: '0.8rem' }}>{action.responsiblePerson || '—'}</TableCell>
                                                  <TableCell sx={{ fontSize: '0.8rem' }}>{action.targetDate ? new Date(action.targetDate).toLocaleDateString() : '—'}</TableCell>
                                                  <TableCell sx={{ fontSize: '0.8rem' }}>
                                                    <Chip
                                                      label={action.status || 'Open'}
                                                      size="small"
                                                      sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                                                    />
                                                  </TableCell>
                                                  <TableCell sx={{ fontSize: '0.8rem' }}>{action.actionTaken || '—'}</TableCell>
                                                  <TableCell sx={{ fontSize: '0.8rem' }}>{action.completionDate ? new Date(action.completionDate).toLocaleDateString() : '—'}</TableCell>
                                                  <TableCell sx={{ fontSize: '0.8rem', textAlign: 'center' }}>{action.revisedSeverity || '—'}</TableCell>
                                                  <TableCell sx={{ fontSize: '0.8rem', textAlign: 'center' }}>{action.revisedOccurrence || '—'}</TableCell>
                                                  <TableCell sx={{ fontSize: '0.8rem', textAlign: 'center' }}>{action.revisedDetection || '—'}</TableCell>
                                                  <TableCell sx={{ fontSize: '0.8rem', textAlign: 'center' }}>{revAp || '—'}</TableCell>
                                                  <TableCell sx={{ fontSize: '0.8rem' }}>{action.remarks || '—'}</TableCell>
                                                </TableRow>
                                              );
                                            })
                                          )}
                                        </TableBody>
                                      </Table>
                                    </TableContainer>
                                  </TableCell>
                                </TableRow>
                              </React.Fragment>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              </Box>
            )}
          </>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.5, borderTop: '1px solid #eee' }}>
        <Button onClick={onClose} variant="outlined" color="inherit">Close</Button>
      </DialogActions>

      {/* ── EDIT CAUSE MODAL ── */}
      <Dialog
        open={editCauseModalOpen}
        onClose={() => setEditCauseModalOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: '12px',
              border: '1px solid #e4e4e7',
              boxShadow: '0 20px 40px -8px rgba(0,0,0,0.12)',
              p: 0,
              overflow: 'hidden'
            }
          }
        }}
      >
        <DialogTitle sx={{ px: 3, py: 2, borderBottom: '1px solid #f4f4f5', bgcolor: '#ffffff', color: '#09090b', fontWeight: 700, fontSize: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Edit Cause
          <IconButton onClick={() => setEditCauseModalOpen(false)} size="small" sx={{ color: '#71717a' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2.5, mt: 1 }}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Cause Description *"
              value={editCauseForm.narration}
              onChange={(e) => setEditCauseForm(f => ({ ...f, narration: e.target.value }))}
            />
            <Grid container spacing={2}>
              <Grid size={6}>
                <TextField
                  fullWidth
                  select
                  label="Occurrence (OCC) [1-10]"
                  value={editCauseForm.occurrenceRating}
                  onChange={(e) => setEditCauseForm(f => ({ ...f, occurrenceRating: e.target.value }))}
                >
                  <MenuItem value="">—</MenuItem>
                  {[1,2,3,4,5,6,7,8,9,10].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={6}>
                <TextField
                  fullWidth
                  select
                  label="Detection (DET) [1-10]"
                  value={editCauseForm.detectionRating}
                  onChange={(e) => setEditCauseForm(f => ({ ...f, detectionRating: e.target.value }))}
                >
                  <MenuItem value="">—</MenuItem>
                  {[1,2,3,4,5,6,7,8,9,10].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>
            <TextField
              fullWidth
              label="Prevention Control"
              value={editCauseForm.currentControlPrevention}
              onChange={(e) => setEditCauseForm(f => ({ ...f, currentControlPrevention: e.target.value }))}
            />
            <TextField
              fullWidth
              label="Detection Control"
              value={editCauseForm.currentControlDetection}
              onChange={(e) => setEditCauseForm(f => ({ ...f, currentControlDetection: e.target.value }))}
            />
            <TextField
              fullWidth
              label="Filter Code (FC)"
              value={editCauseForm.filterCode}
              onChange={(e) => setEditCauseForm(f => ({ ...f, filterCode: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="contained" onClick={handleSaveEditCause} sx={{ bgcolor: '#0284c7' }}>Save</Button>
          <Button variant="outlined" onClick={() => setEditCauseModalOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* ── ADD / EDIT ACTION DIALOG (Shadcn Theme) ── */}
      <Dialog
        open={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: '12px',
              border: '1px solid #e4e4e7',
              boxShadow: '0 20px 40px -8px rgba(0,0,0,0.12)',
              p: 0,
              overflow: 'hidden'
            }
          }
        }}
      >
        <DialogTitle sx={{ px: 3, py: 2, borderBottom: '1px solid #f4f4f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#ffffff' }}>
          <Box>
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#09090b' }}>
              {editingAction ? 'Edit Corrective Action' : 'Add Corrective Action'}
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: '#71717a' }}>
              Step 6 Optimization: Preventive/Detection controls & revised S/O/D ratings
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setActionModalOpen(false)} sx={{ color: '#71717a', '&:hover': { bgcolor: '#f4f4f5' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary', fontWeight: 600 }}>
            Cause : <span style={{ color: '#111827', fontWeight: 700 }}>{actionModalCauseName}</span>
          </Typography>

          <Stack spacing={2}>
            {/* Prevention Action(s) */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Typography variant="body2" sx={{ width: 170, fontWeight: 700, pt: 1 }}>
                Prevention Action(s) :
              </Typography>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                value={actionForm.preventionAction}
                onChange={(e) => setActionForm(f => ({ ...f, preventionAction: e.target.value }))}
                placeholder="Enter prevention action details..."
              />
            </Box>

            {/* Detection Action */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Typography variant="body2" sx={{ width: 170, fontWeight: 700, pt: 1 }}>
                Detection Action :
              </Typography>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                value={actionForm.detectionAction}
                onChange={(e) => setActionForm(f => ({ ...f, detectionAction: e.target.value }))}
                placeholder="Enter detection action details..."
              />
            </Box>

            {/* Action Taken */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Typography variant="body2" sx={{ width: 170, fontWeight: 700, pt: 1 }}>
                Action Taken :
              </Typography>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                value={actionForm.actionTaken}
                onChange={(e) => setActionForm(f => ({ ...f, actionTaken: e.target.value }))}
                placeholder="Enter actions taken..."
              />
            </Box>

            {/* Grid for Dates & After Action S/O/D Ratings (Image 3) */}
            <Grid container spacing={2.5} sx={{ mt: 1 }}>
              {/* Left Column: Dates & Responsibility */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={2}>
                  {/* Target Date */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ width: 140, fontWeight: 700 }}>
                      Target Date :
                    </Typography>
                    <TextField
                      type="date"
                      size="small"
                      value={actionForm.targetDate}
                      onChange={(e) => setActionForm(f => ({ ...f, targetDate: e.target.value }))}
                      sx={{ flexGrow: 1 }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => setActionForm(f => ({ ...f, targetDate: '' }))}
                      sx={{ bgcolor: '#0284c7', color: '#fff', '&:hover': { bgcolor: '#0369a1' } }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  {/* Completion Date */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ width: 140, fontWeight: 700 }}>
                      Completion Date :
                    </Typography>
                    <TextField
                      type="date"
                      size="small"
                      value={actionForm.completionDate}
                      onChange={(e) => setActionForm(f => ({ ...f, completionDate: e.target.value }))}
                      sx={{ flexGrow: 1 }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => setActionForm(f => ({ ...f, completionDate: '' }))}
                      sx={{ bgcolor: '#0284c7', color: '#fff', '&:hover': { bgcolor: '#0369a1' } }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  {/* Responsible Person */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ width: 140, fontWeight: 700 }}>
                      Responsible Person :
                    </Typography>
                    <TextField
                      size="small"
                      placeholder="Enter name or team..."
                      value={actionForm.responsiblePerson}
                      onChange={(e) => setActionForm(f => ({ ...f, responsiblePerson: e.target.value }))}
                      sx={{ flexGrow: 1 }}
                    />
                    <Button
                      size="small"
                      variant="contained"
                      sx={{ bgcolor: '#0284c7', textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                    >
                      Add/Edit Core Team
                    </Button>
                  </Box>

                  {/* Status */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ width: 140, fontWeight: 700 }}>
                      Status :
                    </Typography>
                    <TextField
                      select
                      size="small"
                      value={actionForm.status}
                      onChange={(e) => setActionForm(f => ({ ...f, status: e.target.value }))}
                      sx={{ width: 180 }}
                    >
                      <MenuItem value="Open">Open</MenuItem>
                      <MenuItem value="In Progress">In Progress</MenuItem>
                      <MenuItem value="Completed">Completed</MenuItem>
                      <MenuItem value="Verified">Verified</MenuItem>
                      <MenuItem value="Closed">Closed</MenuItem>
                      <MenuItem value="Cancelled">Cancelled</MenuItem>
                    </TextField>
                  </Box>
                </Stack>
              </Grid>

              {/* Right Column: After Action S/O/D Ratings (Image 3) */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, textAlign: 'center', color: '#0f172a' }}>
                  After Action
                </Typography>

                <Stack spacing={2}>
                  {/* Severity (S) */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ width: 110, fontWeight: 700 }}>
                      Severity (S) :
                    </Typography>
                    <TextField
                      select
                      size="small"
                      value={actionForm.revisedSeverity}
                      onChange={(e) => setActionForm(f => ({ ...f, revisedSeverity: e.target.value }))}
                      sx={{ width: 80 }}
                    >
                      <MenuItem value="">—</MenuItem>
                      {[1,2,3,4,5,6,7,8,9,10].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                    </TextField>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleOpenGuideline('severity')}
                      sx={{ bgcolor: '#0284c7', textTransform: 'none', fontWeight: 700, fontSize: '0.75rem' }}
                    >
                      Guideline
                    </Button>
                  </Box>

                  {/* Occurrence (O) */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ width: 110, fontWeight: 700 }}>
                      Occurrence (O) :
                    </Typography>
                    <TextField
                      select
                      size="small"
                      value={actionForm.revisedOccurrence}
                      onChange={(e) => setActionForm(f => ({ ...f, revisedOccurrence: e.target.value }))}
                      sx={{ width: 80 }}
                    >
                      <MenuItem value="">—</MenuItem>
                      {[1,2,3,4,5,6,7,8,9,10].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                    </TextField>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleOpenGuideline('occurrence')}
                      sx={{ bgcolor: '#0284c7', textTransform: 'none', fontWeight: 700, fontSize: '0.75rem' }}
                    >
                      Guideline
                    </Button>
                  </Box>

                  {/* Detection (D) */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ width: 110, fontWeight: 700 }}>
                      Detection (D) :
                    </Typography>
                    <TextField
                      select
                      size="small"
                      value={actionForm.revisedDetection}
                      onChange={(e) => setActionForm(f => ({ ...f, revisedDetection: e.target.value }))}
                      sx={{ width: 80 }}
                    >
                      <MenuItem value="">—</MenuItem>
                      {[1,2,3,4,5,6,7,8,9,10].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                    </TextField>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleOpenGuideline('detection')}
                      sx={{ bgcolor: '#0284c7', textTransform: 'none', fontWeight: 700, fontSize: '0.75rem' }}
                    >
                      Guideline
                    </Button>
                  </Box>
                </Stack>
              </Grid>
            </Grid>

            {/* Remarks */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
              <Typography variant="body2" sx={{ width: 170, fontWeight: 700 }}>
                Remarks :
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={actionForm.remarks}
                onChange={(e) => setActionForm(f => ({ ...f, remarks: e.target.value }))}
                placeholder="Enter remarks..."
              />
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #f4f4f5', bgcolor: '#fafafa', justifyContent: 'flex-end', gap: 1 }}>
          <Button
            size="small"
            onClick={() => setActionModalOpen(false)}
            sx={{
              color: '#71717a',
              fontSize: '0.8125rem',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: '6px',
              border: '1px solid #e4e4e7',
              bgcolor: '#ffffff',
              px: 2.5,
              '&:hover': { bgcolor: '#f4f4f5', borderColor: '#d4d4d8' }
            }}
          >
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={submitActionModal}
            sx={{
              bgcolor: '#09090b',
              color: '#ffffff',
              fontSize: '0.8125rem',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: '6px',
              px: 3,
              boxShadow: 'none',
              '&:hover': { bgcolor: '#27272a', boxShadow: 'none' }
            }}
          >
            Save Action
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── GUIDELINE REFERENCE DIALOG (Shadcn Theme) ── */}
      <Dialog
        open={guidelineOpen}
        onClose={() => setGuidelineOpen(false)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: '12px',
              border: '1px solid #e4e4e7',
              boxShadow: '0 20px 40px -8px rgba(0,0,0,0.12)',
              p: 0,
              overflow: 'hidden'
            }
          }
        }}
      >
        <DialogTitle sx={{ px: 3, py: 2, borderBottom: '1px solid #f4f4f5', bgcolor: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#09090b' }}>
              Rating Criteria: {guidelineType === 'severity' ? 'Severity (S)' : guidelineType === 'occurrence' ? 'Occurrence (O)' : 'Detection (D)'}
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: '#71717a' }}>
              AIAG-VDA 2019 standard evaluation scale [1-10]
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setGuidelineOpen(false)} sx={{ color: '#71717a', '&:hover': { bgcolor: '#f4f4f5' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f1f5f9' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, width: 80 }}>Rating</TableCell>
                <TableCell sx={{ fontWeight: 800, width: 200 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Criteria</TableCell>
                <TableCell sx={{ fontWeight: 800, width: 90, textAlign: 'center' }}>Select</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(guidelineScales[guidelineType] || []).map((scale: any) => (
                <TableRow key={scale.value} hover>
                  <TableCell sx={{ fontWeight: 800 }}>
                    <Chip label={scale.value} size="small" sx={{ bgcolor: scale.color || '#64748b', color: '#fff', fontWeight: 800 }} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{scale.label}</TableCell>
                  <TableCell sx={{ fontSize: '0.85rem' }}>{scale.criteria}</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        if (guidelineType === 'severity') setActionForm(f => ({ ...f, revisedSeverity: String(scale.value) }));
                        if (guidelineType === 'occurrence') setActionForm(f => ({ ...f, revisedOccurrence: String(scale.value) }));
                        if (guidelineType === 'detection') setActionForm(f => ({ ...f, revisedDetection: String(scale.value) }));
                        setGuidelineOpen(false);
                      }}
                      sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem' }}
                    >
                      Use {scale.value}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      {/* ── CONFIRM DIALOG ── */}
      {confirmState && (
        <ConfirmDialog
          open={confirmState.open}
          onClose={() => setConfirmState(null)}
          onConfirm={confirmState.onConfirm}
          title={confirmState.title}
          message={confirmState.message}
          detail={confirmState.detail}
          severity="warning"
        />
      )}
    </Dialog>
  );
};
