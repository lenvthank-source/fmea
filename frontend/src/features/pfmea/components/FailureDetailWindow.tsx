import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Stack, Chip, Tabs, Tab,
  CircularProgress, IconButton, Table, TableBody,
  TableCell, TableHead, TableRow, Tooltip, Alert, TextField
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import { API_BASE_URL } from '../../../config';

interface LinkAction {
  id: string;
  description: string;
  targetDate?: string;
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

  // Add action state
  const [addActionLinkId, setAddActionLinkId] = useState<string | null>(null);
  const [actionDesc, setActionDesc] = useState('');
  const [actionDate, setActionDate] = useState('');
  const [actionRemark, setActionRemark] = useState('');
  const [addingAction, setAddingAction] = useState(false);

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

  const handleAddAction = async (linkId: string) => {
    if (!actionDesc.trim()) return;
    setAddingAction(true);
    try {
      const res = await fetch(`${API_BASE_URL}/failure-links/${linkId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          description: actionDesc.trim(),
          targetDate: actionDate || undefined,
          remarks: actionRemark || undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to add action');
      setAddActionLinkId(null);
      setActionDesc('');
      setActionDate('');
      setActionRemark('');
      loadData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAddingAction(false);
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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { height: '80vh' } }}>
      <DialogTitle sx={{ bgcolor: '#b71c1c', color: 'white', py: 1.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Failure Mode Detail</Typography>
            {data && (
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                {data.mode.narration}
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
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
                        justifyContent="space-between"
                        alignItems="flex-start"
                        sx={{ p: 1.5, bgcolor: '#fff3e0', borderBottom: '1px solid rgba(0,0,0,0.08)' }}
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
                          <Tooltip title="Add Action">
                            <IconButton size="small" color="warning" onClick={() => setAddActionLinkId(entry.linkId)}>
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Unlink Cause">
                            <IconButton size="small" color="error" onClick={() => handleUnlink(entry.linkId)}>
                              <LinkIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Stack>

                      {/* Add Action inline form */}
                      {addActionLinkId === entry.linkId && (
                        <Box sx={{ p: 1.5, bgcolor: '#fffde7', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                          <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#f57f17', display: 'block', mb: 1 }}>
                            New Action
                          </Typography>
                          <Stack spacing={1}>
                            <TextField
                              size="small"
                              fullWidth
                              label="Description"
                              value={actionDesc}
                              onChange={e => setActionDesc(e.target.value)}
                            />
                            <Stack direction="row" spacing={1}>
                              <TextField
                                size="small"
                                type="date"
                                label="Target Date"
                                value={actionDate}
                                onChange={e => setActionDate(e.target.value)}
                                slotProps={{ inputLabel: { shrink: true } }}
                                sx={{ flex: 1 }}
                              />
                              <TextField
                                size="small"
                                label="Remarks"
                                value={actionRemark}
                                onChange={e => setActionRemark(e.target.value)}
                                sx={{ flex: 2 }}
                              />
                            </Stack>
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Button size="small" onClick={() => setAddActionLinkId(null)} color="inherit">Cancel</Button>
                              <Button
                                size="small"
                                variant="contained"
                                color="warning"
                                disabled={!actionDesc.trim() || addingAction}
                                onClick={() => handleAddAction(entry.linkId)}
                              >
                                {addingAction ? <CircularProgress size={14} color="inherit" /> : 'Add'}
                              </Button>
                            </Stack>
                          </Stack>
                        </Box>
                      )}

                      {/* Nested Actions */}
                      {entry.actions.map(action => (
                        <Box
                          key={action.id}
                          sx={{ p: 1.5, pl: 3, borderBottom: '1px dashed rgba(0,0,0,0.06)', bgcolor: '#fffde7' }}
                        >
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
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
                            <IconButton size="small" color="error" onClick={() => handleDeleteAction(action.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
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
    </Dialog>
  );
};
