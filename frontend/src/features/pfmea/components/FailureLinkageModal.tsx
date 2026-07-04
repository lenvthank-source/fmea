import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Stack, Checkbox,
  CircularProgress, Chip, Alert,
  Grid, Collapse
} from '@mui/material';
import {
  Link as LinkIcon,
  Warning as ModeIcon,
  FolderOpen as FolderIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
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

interface SvgLink {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
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

  // Tree collapse state
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Center pane coordinate calculation
  const containerRef = useRef<HTMLDivElement>(null);
  const [links, setLinks] = useState<SvgLink[]>([]);

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
        
        // Expand all by default
        const initExpanded: Record<string, boolean> = {};
        d.effects.forEach((eff: any) => {
          initExpanded[eff.function?.narration || ''] = true;
        });
        d.causes.forEach((cause: any) => {
          initExpanded[cause.function?.narration || ''] = true;
        });
        setExpandedGroups(initExpanded);
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

  const updateCoords = () => {
    if (!containerRef.current || !data) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const modeEl = document.getElementById('linkage-mode-box');
    if (!modeEl) return;

    const modeRect = modeEl.getBoundingClientRect();
    const modeLeftX = modeRect.left - containerRect.left;
    const modeRightX = modeRect.left - containerRect.left + modeRect.width;
    const modeY = modeRect.top - containerRect.top + modeRect.height / 2;

    const newLinks: SvgLink[] = [];

    // Checked Effects coordinates
    selectedEffects.forEach(eff => {
      const el = document.getElementById(`selected-eff-${eff.id}`);
      if (el) {
        const r = el.getBoundingClientRect();
        newLinks.push({
          x1: r.left - containerRect.left + r.width,
          y1: r.top - containerRect.top + r.height / 2,
          x2: modeLeftX,
          y2: modeY,
          color: '#ef4444' // red
        });
      }
    });

    // Checked Causes coordinates
    selectedCauses.forEach(cause => {
      const el = document.getElementById(`selected-cause-${cause.id}`);
      if (el) {
        const r = el.getBoundingClientRect();
        newLinks.push({
          x1: modeRightX,
          y1: modeY,
          x2: r.left - containerRect.left,
          y2: r.top - containerRect.top + r.height / 2,
          color: '#f97316' // orange
        });
      }
    });

    setLinks(newLinks);
  };

  useEffect(() => {
    if (!open || !data) return;
    
    // Calculate multiple times to catch animation frames settling
    updateCoords();
    const timers = [
      setTimeout(updateCoords, 50),
      setTimeout(updateCoords, 150),
      setTimeout(updateCoords, 350)
    ];

    window.addEventListener('resize', updateCoords);
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('resize', updateCoords);
    };
  }, [selectedEffectIds, selectedCauseIds, data, open]);

  // Group items by parent function
  const groupEffectsByFunction = () => {
    if (!data) return {};
    const grouped: Record<string, FailureItem[]> = {};
    data.effects.forEach(eff => {
      const fnName = eff.function?.narration || 'Uncategorized Function';
      if (!grouped[fnName]) grouped[fnName] = [];
      grouped[fnName].push(eff);
    });
    return grouped;
  };

  const groupCausesByFunction = () => {
    if (!data) return {};
    const grouped: Record<string, FailureItem[]> = {};
    data.causes.forEach(cause => {
      const fnName = cause.function?.narration || 'Uncategorized Function';
      if (!grouped[fnName]) grouped[fnName] = [];
      grouped[fnName].push(cause);
    });
    return grouped;
  };

  const groupedEffects = groupEffectsByFunction();
  const groupedCauses = groupCausesByFunction();

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth slotProps={{ paper: { sx: { height: '88vh', borderRadius: 3 } } }}>
      <DialogTitle sx={{ bgcolor: '#b71c1c', color: 'white', fontWeight: 'bold', px: 3, py: 2 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <LinkIcon />
          <Typography variant="h6" sx={{ fontWeight: 'bold', fontFamily: 'inherit' }}>
            Failure Linkage — Effects / Mode / Causes
          </Typography>
        </Stack>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: '#fafafa' }}>
        {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <CircularProgress />
          </Box>
        ) : data ? (
          <Grid container sx={{ flex: 1, height: '100%', overflow: 'hidden' }}>
            
            {/* LEFT COLUMN: Effects Tree */}
            <Grid size={4} sx={{ borderRight: '1px solid rgba(0,0,0,0.08)', height: '100%', overflow: 'auto', p: 3, bgcolor: '#ffffff' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#b71c1c', mb: 1.5, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Failure Effects (Higher Level)
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
                Double click or check box to link project level failure effects.
              </Typography>

              {Object.keys(groupedEffects).length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  No failure effects defined.
                </Typography>
              ) : (
                Object.entries(groupedEffects).map(([fnName, effects]) => {
                  const isExpanded = !!expandedGroups[fnName];
                  return (
                    <Box key={fnName} sx={{ mb: 2 }}>
                      <Stack 
                        direction="row" 
                        spacing={1} 
                        onClick={() => toggleGroup(fnName)}
                        sx={{ 
                          cursor: 'pointer', 
                          alignItems: 'center', 
                          p: 1, 
                          borderRadius: 1.5, 
                          bgcolor: '#f5f5f5',
                          border: '1px solid rgba(0,0,0,0.05)',
                          '&:hover': { bgcolor: '#eeeeee' }
                        }}
                      >
                        {isExpanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
                        <FolderIcon fontSize="small" sx={{ color: '#1b5e20' }} />
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1b5e20', fontSize: '0.85rem', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {fnName}
                        </Typography>
                      </Stack>

                      <Collapse in={isExpanded}>
                        <Box sx={{ pl: 2, borderLeft: '1px dashed rgba(0,0,0,0.15)', ml: 2, mt: 0.5 }}>
                          {effects.map(effect => {
                            const isChecked = selectedEffectIds.includes(effect.id);
                            return (
                              <Box
                                key={effect.id}
                                onClick={() => toggleEffect(effect.id)}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: 1.5,
                                  p: 1.5,
                                  mb: 0.5,
                                  borderRadius: 2,
                                  cursor: 'pointer',
                                  border: isChecked ? '2px solid #ef4444' : '1px solid rgba(0,0,0,0.05)',
                                  bgcolor: isChecked ? '#fef2f2' : '#ffffff',
                                  transition: 'all 0.15s ease',
                                  '&:hover': { bgcolor: '#fef2f2' }
                                }}
                              >
                                <Checkbox
                                  checked={isChecked}
                                  size="small"
                                  color="error"
                                  sx={{ p: 0, mt: 0.25 }}
                                />
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem', color: isChecked ? '#b71c1c' : 'text.primary' }}>
                                    {effect.narration}
                                  </Typography>
                                  {effect.severityRating && (
                                    <Chip label={`S: ${effect.severityRating}`} size="small"
                                      sx={{ height: 16, fontSize: '0.65rem', mt: 0.5, bgcolor: '#fce4ec', color: '#b71c1c', fontWeight: 'bold' }} />
                                  )}
                                </Box>
                              </Box>
                            );
                          })}
                        </Box>
                      </Collapse>
                    </Box>
                  );
                })
              )}
            </Grid>

            {/* CENTER COLUMN: Live Linkage Visualization */}
            <Grid size={4} sx={{ borderRight: '1px solid rgba(0,0,0,0.08)', height: '100%', display: 'flex', flexDirection: 'column', p: 3, position: 'relative', overflow: 'hidden' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', mb: 2, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                🔗 Linkage Tree Preview
              </Typography>
              
              <Box ref={containerRef} sx={{ flex: 1, display: 'flex', width: '100%', position: 'relative', alignItems: 'center', justifyContent: 'space-between', zIndex: 2 }}>
                {/* SVG CONNECTOR LINES */}
                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
                  {links.map((link, idx) => {
                    const midX = (link.x1 + link.x2) / 2;
                    // Bezier Curve
                    const d = `M ${link.x1} ${link.y1} C ${midX} ${link.y1}, ${midX} ${link.y2}, ${link.x2} ${link.y2}`;
                    return (
                      <g key={idx}>
                        {/* Glow path */}
                        <path
                          d={d}
                          stroke={link.color}
                          strokeWidth="5"
                          fill="none"
                          opacity="0.15"
                        />
                        {/* Core path */}
                        <path
                          d={d}
                          stroke={link.color}
                          strokeWidth="2"
                          fill="none"
                          opacity="0.75"
                        />
                        {/* Dashed marching ants animation */}
                        <path
                          d={d}
                          stroke="#ffffff"
                          strokeWidth="2"
                          strokeDasharray="4,4"
                          fill="none"
                          style={{
                            animation: 'march 20s linear infinite',
                          }}
                        />
                      </g>
                    );
                  })}
                </svg>

                <style>{`
                  @keyframes march {
                    to {
                      stroke-dashoffset: -1000;
                    }
                  }
                  @keyframes boxSlideInLeft {
                    from { opacity: 0; transform: translateX(-30px); }
                    to { opacity: 1; transform: translateX(0); }
                  }
                  @keyframes boxSlideInRight {
                    from { opacity: 0; transform: translateX(30px); }
                    to { opacity: 1; transform: translateX(0); }
                  }
                `}</style>

                {/* Left Side: Floating Selected Effects */}
                <Stack spacing={1.5} sx={{ width: '38%', zIndex: 2, height: '100%', justifyContent: 'center', overflowY: 'auto', pr: 0.5 }}>
                  {selectedEffects.length === 0 ? (
                    <Box sx={{ p: 2, border: '1px dashed rgba(0,0,0,0.15)', borderRadius: 2, textAlign: 'center', bgcolor: '#ffffff', opacity: 0.6 }}>
                      <Typography variant="caption" color="text.secondary">No effects linked</Typography>
                    </Box>
                  ) : (
                    selectedEffects.map(eff => (
                      <Box
                        key={eff.id}
                        id={`selected-eff-${eff.id}`}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          border: '2px solid #ef4444',
                          bgcolor: '#fef2f2',
                          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.12)',
                          animation: 'boxSlideInLeft 0.25s ease-out forwards'
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.75rem', color: '#b71c1c', mb: 0.5 }}>
                          EFFECT
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 600, wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {eff.narration}
                        </Typography>
                      </Box>
                    ))
                  )}
                </Stack>

                {/* Center: Selected MODE (Fixed Anchor) */}
                <Box 
                  id="linkage-mode-box"
                  sx={{ 
                    width: '20%', 
                    zIndex: 2, 
                    p: 2, 
                    bgcolor: '#fff3e0', 
                    border: '3px solid #ff6d00', 
                    borderRadius: 3, 
                    boxShadow: '0 6px 20px rgba(255, 109, 0, 0.2)',
                    textAlign: 'center'
                  }}
                >
                  <Stack spacing={0.5} sx={{ alignItems: 'center' }}>
                    <ModeIcon sx={{ color: '#e65100', fontSize: '1.4rem' }} />
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#e65100', tracking: '0.5px' }}>
                      MODE
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem', wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {data.mode.narration}
                    </Typography>
                  </Stack>
                </Box>

                {/* Right Side: Floating Selected Causes */}
                <Stack spacing={1.5} sx={{ width: '38%', zIndex: 2, height: '100%', justifyContent: 'center', overflowY: 'auto', pl: 0.5 }}>
                  {selectedCauses.length === 0 ? (
                    <Box sx={{ p: 2, border: '1px dashed rgba(0,0,0,0.15)', borderRadius: 2, textAlign: 'center', bgcolor: '#ffffff', opacity: 0.6 }}>
                      <Typography variant="caption" color="text.secondary">No causes linked</Typography>
                    </Box>
                  ) : (
                    selectedCauses.map(cause => (
                      <Box
                        key={cause.id}
                        id={`selected-cause-${cause.id}`}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          border: '2px solid #f97316',
                          bgcolor: '#fff7ed',
                          boxShadow: '0 4px 12px rgba(249, 115, 22, 0.12)',
                          animation: 'boxSlideInRight 0.25s ease-out forwards'
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.75rem', color: '#e65100', mb: 0.5 }}>
                          CAUSE
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 600, wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {cause.narration}
                        </Typography>
                      </Box>
                    ))
                  )}
                </Stack>
              </Box>
            </Grid>

            {/* RIGHT COLUMN: Causes Tree */}
            <Grid size={4} sx={{ height: '100%', overflow: 'auto', p: 3, bgcolor: '#ffffff' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#e65100', mb: 1.5, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Failure Causes (Lower Level)
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
                Double click or check box to link work element failure causes.
              </Typography>

              {Object.keys(groupedCauses).length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  No failure causes defined for this process step.
                </Typography>
              ) : (
                Object.entries(groupedCauses).map(([fnName, causes]) => {
                  const isExpanded = !!expandedGroups[fnName];
                  return (
                    <Box key={fnName} sx={{ mb: 2 }}>
                      <Stack 
                        direction="row" 
                        spacing={1} 
                        onClick={() => toggleGroup(fnName)}
                        sx={{ 
                          cursor: 'pointer', 
                          alignItems: 'center', 
                          p: 1, 
                          borderRadius: 1.5, 
                          bgcolor: '#f5f5f5',
                          border: '1px solid rgba(0,0,0,0.05)',
                          '&:hover': { bgcolor: '#eeeeee' }
                        }}
                      >
                        {isExpanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
                        <FolderIcon fontSize="small" sx={{ color: '#0d47a1' }} />
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0d47a1', fontSize: '0.85rem', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {fnName}
                        </Typography>
                      </Stack>

                      <Collapse in={isExpanded}>
                        <Box sx={{ pl: 2, borderLeft: '1px dashed rgba(0,0,0,0.15)', ml: 2, mt: 0.5 }}>
                          {causes.map(cause => {
                            const isChecked = selectedCauseIds.includes(cause.id);
                            return (
                              <Box
                                key={cause.id}
                                onClick={() => toggleCause(cause.id)}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: 1.5,
                                  p: 1.5,
                                  mb: 0.5,
                                  borderRadius: 2,
                                  cursor: 'pointer',
                                  border: isChecked ? '2px solid #f97316' : '1px solid rgba(0,0,0,0.05)',
                                  bgcolor: isChecked ? '#fff7ed' : '#ffffff',
                                  transition: 'all 0.15s ease',
                                  '&:hover': { bgcolor: '#fff7ed' }
                                }}
                              >
                                <Checkbox
                                  checked={isChecked}
                                  size="small"
                                  sx={{ p: 0, mt: 0.25, color: '#f97316', '&.Mui-checked': { color: '#f97316' } }}
                                />
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem', color: isChecked ? '#e65100' : 'text.primary' }}>
                                    {cause.narration}
                                  </Typography>
                                  <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
                                    {cause.occurrenceRating && (
                                      <Chip
                                        label={`O: ${cause.occurrenceRating}`}
                                        size="small"
                                        sx={{ height: 16, fontSize: '0.65rem', bgcolor: '#fff3e0', color: '#e65100', fontWeight: 'bold' }}
                                      />
                                    )}
                                    {cause.detectionRating && (
                                      <Chip
                                        label={`D: ${cause.detectionRating}`}
                                        size="small"
                                        sx={{ height: 16, fontSize: '0.65rem', bgcolor: '#fff3e0', color: '#e65100', fontWeight: 'bold' }}
                                      />
                                    )}
                                  </Stack>
                                </Box>
                              </Box>
                            );
                          })}
                        </Box>
                      </Collapse>
                    </Box>
                  );
                })
              )}
            </Grid>

          </Grid>
        ) : null}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(0,0,0,0.08)', bgcolor: '#ffffff' }}>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1, fontWeight: 'bold' }}>
          {selectedEffectIds.length} effect(s) + {selectedCauseIds.length} cause(s) selected for linkage
        </Typography>
        <Button onClick={onClose} disabled={saving} color="inherit" sx={{ fontWeight: 'bold' }}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="error"
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <LinkIcon />}
          sx={{ fontWeight: 'bold' }}
        >
          {saving ? 'Saving...' : 'Save Linkage'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
