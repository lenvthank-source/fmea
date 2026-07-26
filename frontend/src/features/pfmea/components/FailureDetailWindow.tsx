import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Stack, Chip, Tabs, Tab,
  CircularProgress, IconButton, Table, TableBody,
  TableCell, TableHead, TableRow, Tooltip, Alert, TextField,
  Grid, MenuItem
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Link as LinkIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { API_BASE_URL } from '../../../config';

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
    severityRating?: number | null;
    occurrenceRating?: number | null;
    detectionRating?: number | null;
    filterCode?: string | null;
    function: { narration: string };
  };
  actions: LinkAction[];
}

interface ModeData {
  mode: { id: string; narration: string; isLinked: boolean; function: { narration: string } };
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
}

export const FailureDetailWindow: React.FC<FailureDetailWindowProps> = ({
  open,
  onClose,
  failureModeId,
  token,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [data, setData] = useState<ModeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add action modal state matching user reference screenshot
  const [actionModalLinkId, setActionModalLinkId] = useState<string | null>(null);
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
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

  const openActionModal = (linkId: string, causeNarration: string) => {
    setActionModalLinkId(linkId);
    setEditingActionId(null);
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
  };

  const openEditActionModal = (linkId: string, causeNarration: string, action: LinkAction) => {
    setActionModalLinkId(linkId);
    setEditingActionId(action.id);
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
  };

  const submitActionModal = async () => {
    if (!actionModalLinkId) return;
    try {
      const url = editingActionId
        ? `${API_BASE_URL}/link-actions/${editingActionId}`
        : `${API_BASE_URL}/failure-links/${actionModalLinkId}/actions`;
      const method = editingActionId ? 'PATCH' : 'POST';

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
      if (!res.ok) throw new Error('Failed to save action');
      setActionModalLinkId(null);
      setEditingActionId(null);
      loadData();
      onRefresh();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const loadData = () => {
    if (!failureModeId || !token) return;
    setLoading(true);
    setError(null);
    fetch(`${API_BASE_URL}/failure-modes/${failureModeId}/links`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => { if (!r.ok) throw new Error('Failed to load failure details'); return r.json(); })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (open) loadData();
  }, [open, failureModeId]);

  const handleUnlink = async (linkId: string) => {
    try {
      await fetch(`${API_BASE_URL}/failure-links/${linkId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadData();
      onRefresh();
    } catch {
      setError('Failed to unlink');
    }
  };

  const handleDeleteAction = async (actionId: string) => {
    if (!confirm('Delete this action?')) return;
    try {
      await fetch(`${API_BASE_URL}/link-actions/${actionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadData();
    } catch {
      setError('Failed to delete action');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth slotProps={{ paper: { sx: { height: '80vh', borderRadius: 3 } } }}>
      <DialogTitle sx={{ bgcolor: '#0F172A', color: '#FFFFFF', py: 1.5 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Failure Mode Detail</Typography>
            {data && (
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                {data.mode.narration}
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            {data && data.highestSeverity > 0 && (
              <Chip
                label={`Highest Severity: ${data.highestSeverity}`}
                sx={{
                  bgcolor: data.highestSeverity >= 8 ? '#ff1744' : data.highestSeverity >= 5 ? '#ff6d00' : '#ffc400',
                  color: 'white', fontWeight: 'bold', fontSize: '0.75rem'
                }}
              />
            )}
            <IconButton onClick={onClose} sx={{ color: 'white' }} size="small"><CloseIcon /></IconButton>
          </Stack>
        </Stack>
      </DialogTitle>

      <Box sx={{ borderBottom: '1px solid #eee', bgcolor: '#fafafa' }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ minHeight: 40 }}>
          <Tab label={`Effects (${data?.effects.length || 0})`} sx={{ minHeight: 40, fontWeight: 600 }} />
          <Tab label={`Causes (${data?.causes.length || 0})`} sx={{ minHeight: 40, fontWeight: 600 }} />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 2 }}>
        {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
        ) : data ? (
          <>
            {/* EFFECTS TAB */}
            {activeTab === 0 && (
              <Box>
                {data.effects.length === 0 ? (
                  <Typography color="text.secondary" sx={{ fontStyle: 'italic', mt: 2, textAlign: 'center' }}>
                    No effects linked yet.
                  </Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#fce4ec' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>Narration</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: 80 }}>Severity</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: 100 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.effects.map(entry => (
                        <TableRow key={entry.linkId}>
                          <TableCell>
                            <Typography variant="body2">{entry.failure.narration}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              fn: {entry.failure.function.narration}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {entry.failure.severityRating ? (
                              <Chip label={entry.failure.severityRating} size="small" color="error" />
                            ) : '—'}
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Unlink">
                              <IconButton size="small" color="error" onClick={() => handleUnlink(entry.linkId)}>
                                <LinkIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Box>
            )}

            {/* CAUSES TAB */}
            {activeTab === 1 && (
              <Box>
                {data.causes.length === 0 ? (
                  <Typography color="text.secondary" sx={{ fontStyle: 'italic', mt: 2, textAlign: 'center' }}>
                    No causes linked yet.
                  </Typography>
                ) : (
                  data.causes.map(entry => (
                    <Box key={entry.linkId} sx={{ mb: 2, border: '1px solid rgba(0,0,0,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                      {/* Cause header row */}
                      <Stack
                        direction="row"
                        sx={{ p: 1.5, bgcolor: '#fff3e0', borderBottom: '1px solid rgba(0,0,0,0.08)', justifyContent: 'space-between', alignItems: 'flex-start' }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{entry.failure.narration}</Typography>
                          <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                            {entry.failure.occurrenceRating && (
                              <Chip
                                label={`O: ${entry.failure.occurrenceRating}`}
                                size="small"
                                sx={{ height: 16, fontSize: '0.65rem', bgcolor: '#fff3e0', color: '#e65100' }}
                              />
                            )}
                            {entry.failure.detectionRating && (
                              <Chip
                                label={`D: ${entry.failure.detectionRating}`}
                                size="small"
                                sx={{ height: 16, fontSize: '0.65rem', bgcolor: '#fff3e0', color: '#e65100' }}
                              />
                            )}
                            {entry.failure.filterCode && (
                              <Chip
                                label={entry.failure.filterCode}
                                size="small"
                                variant="outlined"
                                sx={{ height: 16, fontSize: '0.65rem' }}
                              />
                            )}
                          </Stack>
                        </Box>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Unlink Cause">
                            <IconButton size="small" color="error" onClick={() => handleUnlink(entry.linkId)}>
                              <LinkIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Stack>

                      {/* Nested Actions */}
                      {entry.actions.map(action => (
                        <Box
                          key={action.id}
                          sx={{ p: 1.5, pl: 3, borderBottom: '1px dashed rgba(0,0,0,0.06)', bgcolor: '#fffde7' }}
                        >
                          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: 500 }}>
                                {action.description}
                              </Typography>
                              <Stack direction="row" spacing={0.5} sx={{ mt: 0.25 }}>
                                <Chip
                                  label={action.status}
                                  size="small"
                                  sx={{
                                    height: 14, fontSize: '0.6rem', fontWeight: 'bold',
                                    bgcolor: action.status === 'completed' ? '#e8f5e9' : action.status === 'closed' ? '#eeeeee' : '#fff9c4',
                                    color: action.status === 'completed' ? '#1b5e20' : action.status === 'closed' ? '#616161' : '#f57f17'
                                  }}
                                />
                                {action.targetDate && (
                                  <Typography variant="caption" color="text.secondary">
                                    Due: {new Date(action.targetDate).toLocaleDateString()}
                                  </Typography>
                                )}
                                {action.remarks && (
                                  <Typography variant="caption" color="text.secondary">— {action.remarks}</Typography>
                                )}
                              </Stack>
                            </Box>
                            <Stack direction="row" spacing={0.5}>
                              <Tooltip title="Edit Action">
                                <IconButton size="small" color="primary" onClick={() => openEditActionModal(entry.linkId, entry.failure.narration, action)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Action">
                                <IconButton size="small" color="error" onClick={() => handleDeleteAction(action.id)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </Stack>
                        </Box>
                      ))}
                    </Box>
                  ))
                )}
              </Box>
            )}
          </>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.5, borderTop: '1px solid #eee' }}>
        <Button onClick={onClose} variant="outlined" color="inherit">Close</Button>
      </DialogActions>

      {/* ADD ACTION DIALOG (MATCHING REFERENCE SCREENSHOT) */}
      <Dialog
        open={Boolean(actionModalLinkId)}
        onClose={() => setActionModalLinkId(null)}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 2, p: 1 } } }}
      >
        <DialogTitle sx={{ py: 1.5, px: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Add Action</Typography>
          <IconButton size="small" onClick={() => setActionModalLinkId(null)}><CloseIcon /></IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary', fontWeight: 600 }}>
            Cause : <span style={{ color: '#111827', fontWeight: 700 }}>{actionModalCauseName}</span>
          </Typography>

          <Stack spacing={2}>
            {/* Prevention Action(s) */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Typography variant="body2" sx={{ width: 160, fontWeight: 700, pt: 1 }}>
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
              <Typography variant="body2" sx={{ width: 160, fontWeight: 700, pt: 1 }}>
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
              <Typography variant="body2" sx={{ width: 160, fontWeight: 700, pt: 1 }}>
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

            {/* Grid for Dates & After Action S/O/D Ratings */}
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
                    <IconButton size="small" onClick={() => setActionForm(f => ({ ...f, targetDate: '' }))} sx={{ bgcolor: '#0284c7', color: '#fff', '&:hover': { bgcolor: '#0369a1' } }}>
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
                    <IconButton size="small" onClick={() => setActionForm(f => ({ ...f, completionDate: '' }))} sx={{ bgcolor: '#0284c7', color: '#fff', '&:hover': { bgcolor: '#0369a1' } }}>
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
                      placeholder="Name or team..."
                      value={actionForm.responsiblePerson}
                      onChange={(e) => setActionForm(f => ({ ...f, responsiblePerson: e.target.value }))}
                      sx={{ flexGrow: 1 }}
                    />
                    <Button size="small" variant="contained" sx={{ bgcolor: '#0284c7', textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
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
                    </TextField>
                  </Box>
                </Stack>
              </Grid>

              {/* Right Column: After Action S/O/D Ratings */}
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
                    <Button size="small" variant="contained" sx={{ bgcolor: '#0284c7', textTransform: 'none', fontWeight: 700, fontSize: '0.75rem' }}>
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
                    <Button size="small" variant="contained" sx={{ bgcolor: '#0284c7', textTransform: 'none', fontWeight: 700, fontSize: '0.75rem' }}>
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
                    <Button size="small" variant="contained" sx={{ bgcolor: '#0284c7', textTransform: 'none', fontWeight: 700, fontSize: '0.75rem' }}>
                      Guideline
                    </Button>
                  </Box>
                </Stack>
              </Grid>
            </Grid>

            {/* Remarks */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
              <Typography variant="body2" sx={{ width: 160, fontWeight: 700 }}>
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

        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'flex-end', gap: 1 }}>
          <Button variant="contained" onClick={submitActionModal} sx={{ bgcolor: '#0284c7', px: 4, fontWeight: 700 }}>
            Save
          </Button>
          <Button variant="contained" onClick={() => setActionModalLinkId(null)} sx={{ bgcolor: '#0284c7', px: 4, fontWeight: 700 }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};
