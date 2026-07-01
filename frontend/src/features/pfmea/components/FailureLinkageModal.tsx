import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Stack, Checkbox,
  CircularProgress, Chip, Divider, Alert,
  Grid
} from '@mui/material';
import { Link as LinkIcon, Warning as ModeIcon } from '@mui/icons-material';
import { API_BASE_URL } from '../../../config';

interface FailureItem {
  id: string;
  narration: string;
  role: string;
  severityRating?: number | null;
  occurrenceRating?: number | null;
  detectionRating?: number | null;
  isLinked?: boolean;
  function: { narration: string; parentType: string };
  isCurrentlyLinked?: boolean;
}

interface CandidateData {
  mode: FailureItem;
  effects: FailureItem[];
  causes: FailureItem[];
  linkedEffectIds: string[];
  linkedCauseIds: string[];
}

interface FailureLinkageModalProps {
  open: boolean;
  onClose: () => void;
  failureModeId: string | null;
  token: string;
  onSuccess: () => void;
}

export const FailureLinkageModal: React.FC<FailureLinkageModalProps> = ({
  open,
  onClose,
  failureModeId,
  token,
  onSuccess,
}) => {
  const [data, setData] = useState<CandidateData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEffectIds, setSelectedEffectIds] = useState<string[]>([]);
  const [selectedCauseIds, setSelectedCauseIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open || !failureModeId || !token) return;
    setLoading(true);
    setError(null);
    fetch(`${API_BASE_URL}/failure-modes/${failureModeId}/linkage-candidates`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => { if (!r.ok) throw new Error('Failed to load linkage candidates'); return r.json(); })
      .then(d => {
        setData(d);
        setSelectedEffectIds(d.linkedEffectIds || []);
        setSelectedCauseIds(d.linkedCauseIds || []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [open, failureModeId, token]);

  const toggleEffect = (id: string) => {
    setSelectedEffectIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleCause = (id: string) => {
    setSelectedCauseIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    if (!failureModeId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/failure-modes/${failureModeId}/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ effectIds: selectedEffectIds, causeIds: selectedCauseIds }),
      });
      if (!res.ok) throw new Error('Failed to save links');
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const selectedEffects = data?.effects.filter(e => selectedEffectIds.includes(e.id)) || [];
  const selectedCauses = data?.causes.filter(c => selectedCauseIds.includes(c.id)) || [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth slotProps={{ paper: { sx: { height: '85vh' } } }}>
      <DialogTitle sx={{ bgcolor: '#b71c1c', color: 'white', fontWeight: 'bold' }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <LinkIcon />
          <span>Failure Linkage — Effects / Mode / Causes</span>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
        {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <CircularProgress />
          </Box>
        ) : data ? (
          <Grid container sx={{ flex: 1, height: '100%', overflow: 'hidden' }}>
            {/* LEFT PANE: Effects */}
            <Grid size={4} sx={{ borderRight: '2px solid #eee', height: '100%', overflow: 'auto', p: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#b71c1c', mb: 1.5 }}>
                FAILURE EFFECTS ({data.effects.length})
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Higher-level failures from project functions. Check to link.
              </Typography>
              {data.effects.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  No project-level failure effects defined yet.
                </Typography>
              ) : (
                data.effects.map(effect => (
                  <Box
                    key={effect.id}
                    sx={{
                      mb: 1, p: 1.5, borderRadius: 2, cursor: 'pointer',
                      border: selectedEffectIds.includes(effect.id) ? '2px solid #b71c1c' : '1px solid rgba(0,0,0,0.1)',
                      bgcolor: selectedEffectIds.includes(effect.id) ? '#fce4ec' : '#fff',
                      transition: 'all 0.15s ease',
                      '&:hover': { bgcolor: '#fce4ec' }
                    }}
                    onClick={() => toggleEffect(effect.id)}
                  >
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                      <Checkbox
                        checked={selectedEffectIds.includes(effect.id)}
                        size="small"
                        color="error"
                        sx={{ p: 0, mt: 0.25 }}
                      />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                          {effect.narration}
                        </Typography>
                        {effect.severityRating && (
                          <Chip label={`S: ${effect.severityRating}`} size="small"
                            sx={{ height: 16, fontSize: '0.65rem', mt: 0.5, bgcolor: '#fce4ec', color: '#b71c1c' }} />
                        )}
                      </Box>
                    </Stack>
                  </Box>
                ))
              )}
            </Grid>

            {/* CENTER PANE: Selected Mode + preview */}
            <Grid size={4} sx={{ borderRight: '2px solid #eee', height: '100%', overflow: 'auto', p: 2, bgcolor: '#fafafa' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#b71c1c', mb: 1.5 }}>
                FAILURE MODE (Selected)
              </Typography>
              <Box sx={{ p: 2, bgcolor: '#fff3e0', border: '2px solid #ff6d00', borderRadius: 2, mb: 2 }}>
                <Stack direction="row" spacing={1} sx={{ mb: 0.5, alignItems: 'center' }}>
                  <ModeIcon sx={{ color: '#e65100', fontSize: '1rem' }} />
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#e65100', fontSize: '0.8rem' }}>MODE</Typography>
                </Stack>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{data.mode.narration}</Typography>
              </Box>

              <Divider sx={{ mb: 2 }}><Typography variant="caption" color="text.secondary">Linked Effects</Typography></Divider>
              {selectedEffects.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.8rem' }}>
                  Check effects on the left →
                </Typography>
              ) : selectedEffects.map(e => (
                <Chip
                  key={e.id}
                  label={e.narration.slice(0, 35) + (e.narration.length > 35 ? '...' : '')}
                  size="small"
                  color="error"
                  variant="outlined"
                  sx={{ mb: 0.5, mr: 0.5, maxWidth: '100%' }}
                />
              ))}

              <Divider sx={{ my: 2 }}><Typography variant="caption" color="text.secondary">Linked Causes</Typography></Divider>
              {selectedCauses.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.8rem' }}>
                  Check causes on the right →
                </Typography>
              ) : selectedCauses.map(c => (
                <Chip
                  key={c.id}
                  label={c.narration.slice(0, 35) + (c.narration.length > 35 ? '...' : '')}
                  size="small"
                  color="warning"
                  variant="outlined"
                  sx={{ mb: 0.5, mr: 0.5, maxWidth: '100%' }}
                />
              ))}
            </Grid>

            {/* RIGHT PANE: Causes */}
            <Grid size={4} sx={{ height: '100%', overflow: 'auto', p: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#e65100', mb: 1.5 }}>
                FAILURE CAUSES ({data.causes.length})
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Work element failures — same process step only.
              </Typography>
              {data.causes.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  No causes defined for this process step yet.
                </Typography>
              ) : (
                data.causes.map(cause => (
                  <Box
                    key={cause.id}
                    sx={{
                      mb: 1, p: 1.5, borderRadius: 2, cursor: 'pointer',
                      border: selectedCauseIds.includes(cause.id) ? '2px solid #e65100' : '1px solid rgba(0,0,0,0.1)',
                      bgcolor: selectedCauseIds.includes(cause.id) ? '#fff3e0' : '#fff',
                      transition: 'all 0.15s ease',
                      '&:hover': { bgcolor: '#fff3e0' }
                    }}
                    onClick={() => toggleCause(cause.id)}
                  >
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                      <Checkbox
                        checked={selectedCauseIds.includes(cause.id)}
                        size="small"
                        sx={{ p: 0, mt: 0.25, color: '#e65100', '&.Mui-checked': { color: '#e65100' } }}
                      />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                          {cause.narration}
                        </Typography>
                        <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
                          {cause.occurrenceRating && (
                            <Chip
                              label={`O: ${cause.occurrenceRating}`}
                              size="small"
                              sx={{ height: 16, fontSize: '0.65rem', bgcolor: '#fff3e0', color: '#e65100' }}
                            />
                          )}
                          {cause.detectionRating && (
                            <Chip
                              label={`D: ${cause.detectionRating}`}
                              size="small"
                              sx={{ height: 16, fontSize: '0.65rem', bgcolor: '#fff3e0', color: '#e65100' }}
                            />
                          )}
                        </Stack>
                      </Box>
                    </Stack>
                  </Box>
                ))
              )}
            </Grid>
          </Grid>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #eee' }}>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
          {selectedEffectIds.length} effect(s) + {selectedCauseIds.length} cause(s) selected
        </Typography>
        <Button onClick={onClose} disabled={saving} color="inherit">Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="error"
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <LinkIcon />}
        >
          {saving ? 'Saving...' : 'Save Linkage'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
