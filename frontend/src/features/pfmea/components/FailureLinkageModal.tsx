import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Stack, Checkbox,
  CircularProgress, Alert,
  Grid, Collapse
} from '@mui/material';
import {
  Link as LinkIcon,
  KeyboardArrowRight as CollapseIcon,
  KeyboardArrowDown as ExpandIcon,
} from '@mui/icons-material';
import { API_BASE_URL } from '../../../config';
import { TREE_COLORS, TREE_ASSETS } from '../../shared/fmeaTreeStyles';

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
  parentName?: string;
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
  projectName?: string;
}

interface SvgLink {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

// Clean HD Tree Icon Helper
const TreeIcon: React.FC<{ iconSrc: string; size?: number }> = ({ iconSrc, size = 18 }) => (
  <Box
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      mr: 1,
      flexShrink: 0,
      width: size,
      height: size,
    }}
  >
    <Box
      component="img"
      src={iconSrc}
      alt="icon"
      sx={{
        width: size,
        height: size,
        objectFit: 'contain',
        imageRendering: '-webkit-optimize-contrast',
        filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.12))',
      }}
    />
  </Box>
);

export const FailureLinkageModal: React.FC<FailureLinkageModalProps> = ({
  open,
  onClose,
  failureModeId,
  token,
  onSuccess,
  projectName: propProjectName,
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
          color: TREE_COLORS.nodeText.process // Blue #1D4ED8
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
          color: TREE_COLORS.nodeText.function // Forest Green #15803D
        });
      }
    });

    setLinks(newLinks);
  };

  useEffect(() => {
    if (!open || !data) return;
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
    <Dialog open={open} onClose={onClose} maxWidth={false} slotProps={{ paper: { sx: { width: '96vw', height: '94vh', m: 'auto', borderRadius: 3 } } }}>
      {/* Dialog Header: Clean Professional Dark Slate */}
      <DialogTitle sx={{ bgcolor: '#0F172A', color: '#FFFFFF', px: 3, py: 2 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <LinkIcon sx={{ color: '#38BDF8', fontSize: '1.5rem' }} />
          <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'inherit', fontSize: '1.3rem' }}>
            Failure Linkage — Effects / Mode / Causes
          </Typography>
        </Stack>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: '#F8FAFC' }}>
        {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <CircularProgress />
          </Box>
        ) : data ? (
          <Grid container sx={{ flex: 1, height: '100%', overflow: 'hidden' }}>
            
            {/* LEFT PANE (~70% Width): Live Linkage Network Diagram */}
            <Grid size={8} sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3, position: 'relative', overflow: 'hidden', borderRight: '1px solid #E2E8F0' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: TREE_COLORS.nodeText.process, mb: 2, letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '1.05rem' }}>
                🔗 Failure Linkage Network Diagram
              </Typography>
              
              <Box ref={containerRef} sx={{ flex: 1, display: 'flex', width: '100%', position: 'relative', alignItems: 'center', justifyContent: 'space-between', zIndex: 2 }}>
                {/* SVG CONNECTOR LINES */}
                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
                  {links.map((link, idx) => {
                    const midX = (link.x1 + link.x2) / 2;
                    const d = `M ${link.x1} ${link.y1} C ${midX} ${link.y1}, ${midX} ${link.y2}, ${link.x2} ${link.y2}`;
                    return (
                      <g key={idx}>
                        <path d={d} stroke={link.color} strokeWidth="3" fill="none" opacity="0.15" />
                        <path d={d} stroke={link.color} strokeWidth="1.5" fill="none" opacity="0.85" />
                      </g>
                    );
                  })}
                </svg>

                {/* Left Side: Floating Selected Effects (Higher Level) */}
                <Stack spacing={2} sx={{ width: '32%', zIndex: 2, height: '100%', justifyContent: 'center', overflowY: 'auto', pr: 1 }}>
                  {selectedEffects.length === 0 ? (
                    <Box sx={{ p: 2, border: '1px dashed #CBD5E1', borderRadius: 2, textAlign: 'center', bgcolor: '#FFFFFF', opacity: 0.7 }}>
                      <Typography variant="caption" sx={{ fontSize: '0.9rem', color: 'text.secondary' }}>No higher level effects linked</Typography>
                    </Box>
                  ) : (
                    selectedEffects.map(eff => (
                      <Box
                        key={eff.id}
                        id={`selected-eff-${eff.id}`}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          borderLeft: `4px solid ${TREE_COLORS.nodeText.failure}`,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                        }}
                      >
                        <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: TREE_COLORS.nodeText.process, mb: 0.5 }}>
                          {propProjectName || eff.parentName || 'System Item'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.92rem', fontWeight: 600, color: TREE_COLORS.nodeText.function, mb: 0.5 }}>
                          {eff.function?.narration}
                        </Typography>
                        <Typography sx={{ fontSize: '1.0rem', fontWeight: 700, color: TREE_COLORS.nodeText.failure, wordBreak: 'break-word' }}>
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
                    width: '32%', 
                    zIndex: 2, 
                    p: 2.5, 
                    bgcolor: '#FFFFFF', 
                    border: '1px solid #E2E8F0',
                    borderTop: `4px solid ${TREE_COLORS.nodeText.process}`,
                    borderRadius: 2.5, 
                    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                    textAlign: 'center'
                  }}
                >
                  <Stack spacing={0.75} sx={{ alignItems: 'center' }}>
                    <TreeIcon iconSrc={TREE_ASSETS.processStep} size={28} />
                    <Typography sx={{ fontSize: '0.98rem', fontWeight: 700, color: TREE_COLORS.nodeText.process }}>
                      {data.mode.parentName || 'Process Step'}
                    </Typography>
                    <Typography sx={{ fontSize: '0.94rem', fontWeight: 600, color: TREE_COLORS.nodeText.function }}>
                      {data.mode.function?.narration}
                    </Typography>
                    <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: TREE_COLORS.nodeText.failure, wordBreak: 'break-word' }}>
                      {data.mode.narration}
                    </Typography>
                  </Stack>
                </Box>

                {/* Right Side: Floating Selected Causes (Lower Level) */}
                <Stack spacing={2} sx={{ width: '32%', zIndex: 2, height: '100%', justifyContent: 'center', overflowY: 'auto', pl: 1 }}>
                  {selectedCauses.length === 0 ? (
                    <Box sx={{ p: 2, border: '1px dashed #CBD5E1', borderRadius: 2, textAlign: 'center', bgcolor: '#FFFFFF', opacity: 0.7 }}>
                      <Typography variant="caption" sx={{ fontSize: '0.9rem', color: 'text.secondary' }}>No lower level causes linked</Typography>
                    </Box>
                  ) : (
                    selectedCauses.map(cause => (
                      <Box
                        key={cause.id}
                        id={`selected-cause-${cause.id}`}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          borderLeft: `4px solid ${TREE_COLORS.nodeText.workElem}`,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                        }}
                      >
                        <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: TREE_COLORS.nodeText.workElem, mb: 0.5 }}>
                          {cause.parentName || 'Work Element'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.92rem', fontWeight: 600, color: TREE_COLORS.nodeText.function, mb: 0.5 }}>
                          {cause.function?.narration}
                        </Typography>
                        <Typography sx={{ fontSize: '1.0rem', fontWeight: 700, color: TREE_COLORS.nodeText.failure, wordBreak: 'break-word' }}>
                          {cause.narration}
                        </Typography>
                      </Box>
                    ))
                  )}
                </Stack>
              </Box>
            </Grid>

            {/* RIGHT PANE (~30% Width): Dual Tree Selection Sidebar */}
            <Grid size={4} sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#FFFFFF' }}>
              
              {/* TOP SECTION: Connect Higher Level Failure (Effects) */}
              <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5, borderBottom: '1px solid #E2E8F0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: TREE_COLORS.nodeText.process, mb: 0.5, fontSize: '1.05rem' }}>
                  Connect Higher Level Failure
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, fontSize: '0.9rem' }}>
                  Selected Failure: <strong>{data.mode.narration}</strong>
                </Typography>

                {Object.keys(groupedEffects).length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.9rem' }}>
                    No higher level failure effects defined.
                  </Typography>
                ) : (
                  Object.entries(groupedEffects).map(([fnName, effects]) => {
                    const isExpanded = !!expandedGroups[fnName];
                    const parentName = propProjectName || effects[0]?.parentName || 'System Item';
                    return (
                      <Box key={fnName} sx={{ mb: 1.5 }}>
                        <Stack 
                          direction="row" 
                          spacing={0.5} 
                          onClick={() => toggleGroup(fnName)}
                          sx={{ cursor: 'pointer', alignItems: 'center', py: 0.5, px: 0.5, borderRadius: 1, '&:hover': { bgcolor: TREE_COLORS.hoverBg } }}
                        >
                          {isExpanded ? <ExpandIcon fontSize="small" sx={{ color: TREE_COLORS.chevron }} /> : <CollapseIcon fontSize="small" sx={{ color: TREE_COLORS.chevron }} />}
                          <TreeIcon iconSrc={TREE_ASSETS.processStep} size={20} />
                          <Typography sx={{ fontWeight: 700, color: TREE_COLORS.nodeText.process, fontSize: '0.95rem' }}>
                            {parentName}
                          </Typography>
                        </Stack>

                        <Collapse in={isExpanded}>
                          <Box sx={{ pl: 2.5, ml: 1, borderLeft: `1px solid ${TREE_COLORS.connectorLine}`, mt: 0.5 }}>
                            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', py: 0.25, mb: 0.5 }}>
                              <TreeIcon iconSrc={TREE_ASSETS.function} size={18} />
                              <Typography sx={{ fontWeight: 600, color: TREE_COLORS.nodeText.function, fontSize: '0.92rem' }}>
                                {fnName}
                              </Typography>
                            </Stack>

                            <Box sx={{ pl: 2.5, ml: 1, borderLeft: `1px solid ${TREE_COLORS.connectorLine}` }}>
                              {effects.map(effect => {
                                const isChecked = selectedEffectIds.includes(effect.id);
                                return (
                                  <Stack
                                    key={effect.id}
                                    direction="row"
                                    spacing={0.5}
                                    onClick={() => toggleEffect(effect.id)}
                                    sx={{
                                      cursor: 'pointer',
                                      alignItems: 'center',
                                      py: 0.5,
                                      px: 0.75,
                                      my: 0.25,
                                      borderRadius: 1,
                                      bgcolor: isChecked ? TREE_COLORS.selectedBg : 'transparent',
                                      borderLeft: isChecked ? `2px solid ${TREE_COLORS.nodeText.failure}` : '2px solid transparent',
                                      '&:hover': { bgcolor: TREE_COLORS.hoverBg }
                                    }}
                                  >
                                    <Checkbox checked={isChecked} size="small" sx={{ p: 0.25, color: TREE_COLORS.nodeText.failure, '&.Mui-checked': { color: TREE_COLORS.nodeText.failure } }} />
                                    <TreeIcon iconSrc={TREE_ASSETS.failure} size={18} />
                                    <Typography sx={{ fontWeight: 600, color: TREE_COLORS.nodeText.failure, fontSize: '0.95rem' }}>
                                      {effect.narration}
                                    </Typography>
                                  </Stack>
                                );
                              })}
                            </Box>
                          </Box>
                        </Collapse>
                      </Box>
                    );
                  })
                )}
              </Box>

              {/* BOTTOM SECTION: Connect Lower Level Failure (Causes) */}
              <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: TREE_COLORS.nodeText.workElem, mb: 1.5, fontSize: '1.05rem' }}>
                  Connect Lower Level Failure
                </Typography>

                {Object.keys(groupedCauses).length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.9rem' }}>
                    No lower level failure causes defined.
                  </Typography>
                ) : (
                  Object.entries(groupedCauses).map(([fnName, causes]) => {
                    const isExpanded = !!expandedGroups[fnName];
                    const parentName = causes[0]?.parentName || 'Work Element';
                    return (
                      <Box key={fnName} sx={{ mb: 1.5 }}>
                        <Stack 
                          direction="row" 
                          spacing={0.5} 
                          onClick={() => toggleGroup(fnName)}
                          sx={{ cursor: 'pointer', alignItems: 'center', py: 0.5, px: 0.5, borderRadius: 1, '&:hover': { bgcolor: TREE_COLORS.hoverBg } }}
                        >
                          {isExpanded ? <ExpandIcon fontSize="small" sx={{ color: TREE_COLORS.chevron }} /> : <CollapseIcon fontSize="small" sx={{ color: TREE_COLORS.chevron }} />}
                          <TreeIcon iconSrc={TREE_ASSETS.workElement} size={20} />
                          <Typography sx={{ fontWeight: 700, color: TREE_COLORS.nodeText.workElem, fontSize: '0.95rem' }}>
                            {parentName}
                          </Typography>
                        </Stack>

                        <Collapse in={isExpanded}>
                          <Box sx={{ pl: 2.5, ml: 1, borderLeft: `1px solid ${TREE_COLORS.connectorLine}`, mt: 0.5 }}>
                            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', py: 0.25, mb: 0.5 }}>
                              <TreeIcon iconSrc={TREE_ASSETS.function} size={18} />
                              <Typography sx={{ fontWeight: 600, color: TREE_COLORS.nodeText.function, fontSize: '0.92rem' }}>
                                {fnName}
                              </Typography>
                            </Stack>

                            <Box sx={{ pl: 2.5, ml: 1, borderLeft: `1px solid ${TREE_COLORS.connectorLine}` }}>
                              {causes.map(cause => {
                                const isChecked = selectedCauseIds.includes(cause.id);
                                return (
                                  <Stack
                                    key={cause.id}
                                    direction="row"
                                    spacing={0.5}
                                    onClick={() => toggleCause(cause.id)}
                                    sx={{
                                      cursor: 'pointer',
                                      alignItems: 'center',
                                      py: 0.5,
                                      px: 0.75,
                                      my: 0.25,
                                      borderRadius: 1,
                                      bgcolor: isChecked ? TREE_COLORS.selectedBg : 'transparent',
                                      borderLeft: isChecked ? `2px solid ${TREE_COLORS.nodeText.workElem}` : '2px solid transparent',
                                      '&:hover': { bgcolor: TREE_COLORS.hoverBg }
                                    }}
                                  >
                                    <Checkbox checked={isChecked} size="small" sx={{ p: 0.25, color: TREE_COLORS.nodeText.failure, '&.Mui-checked': { color: TREE_COLORS.nodeText.failure } }} />
                                    <TreeIcon iconSrc={TREE_ASSETS.failure} size={18} />
                                    <Typography sx={{ fontWeight: 600, color: TREE_COLORS.nodeText.failure, fontSize: '0.95rem' }}>
                                      {cause.narration}
                                    </Typography>
                                  </Stack>
                                );
                              })}
                            </Box>
                          </Box>
                        </Collapse>
                      </Box>
                    );
                  })
                )}
              </Box>

            </Grid>

          </Grid>
        ) : null}
      </DialogContent>
      
      {/* Dialog Footer Actions */}
      <DialogActions sx={{ px: 3, py: 1.5, borderTop: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1, fontWeight: 600 }}>
          {selectedEffectIds.length} effect(s) + {selectedCauseIds.length} cause(s) selected for linkage
        </Typography>
        <Button onClick={onClose} disabled={saving} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="error"
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <LinkIcon />}
          sx={{ fontWeight: 700, px: 3 }}
        >
          {saving ? 'Saving...' : 'Save Linkage'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
