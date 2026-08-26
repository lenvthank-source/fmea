import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Stack, Checkbox,
  CircularProgress, Alert,
  Grid, Collapse, Tooltip, IconButton
} from '@mui/material';
import {
  Link as LinkIcon,
  KeyboardArrowRight as CollapseIcon,
  KeyboardArrowDown as ExpandIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  CropFree as CropFreeIcon,
} from '@mui/icons-material';
import { API_BASE_URL } from '../../../config';
import { TREE_COLORS, TREE_ASSETS } from '../../shared/fmeaTreeStyles';
import { useToast, getToastSeverity } from '../../../components/Toast/ToastProvider';
import { parseApiError } from '../../../lib/api';

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
  const { showToast } = useToast();
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

  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    let newZoom = zoom;
    if (e.deltaY < 0) {
      newZoom = Math.min(zoom * zoomFactor, 2.5);
    } else {
      newZoom = Math.max(zoom / zoomFactor, 0.3);
    }
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (containerRect) {
      const cursorX = e.clientX - containerRect.left - panX;
      const cursorY = e.clientY - containerRect.top - panY;
      const newPanX = e.clientX - containerRect.left - cursorX * (newZoom / zoom);
      const newPanY = e.clientY - containerRect.top - cursorY * (newZoom / zoom);
      setPanX(newPanX);
      setPanY(newPanY);
    }
    setZoom(newZoom);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanX(e.clientX - dragStart.x);
    setPanY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  useEffect(() => {
    if (!open || !failureModeId || !token) return;
    setLoading(true);
    setError(null);
    fetch(`${API_BASE_URL}/failure-modes/${failureModeId}/linkage-candidates`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async r => { if (!r.ok) { const msg = await parseApiError(r, 'Failed to load linkage candidates'); throw new Error(msg); } return r.json(); })
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
      .catch((e: any) => { const msg = e.message || 'Failed to load linkage candidates'; setError(msg); showToast(msg, getToastSeverity(msg)); })
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
      if (!res.ok) {
        const msg = await parseApiError(res, 'Failed to save links');
        throw new Error(msg);
      }
      onSuccess();
      onClose();
    } catch (e: any) {
      const msg = e.message || 'Failed to save links';
      setError(msg);
      showToast(msg, getToastSeverity(msg));
    } finally {
      setSaving(false);
    }
  };

  const selectedEffects = data?.effects.filter(e => selectedEffectIds.includes(e.id)) || [];
  const selectedCauses = data?.causes.filter(c => selectedCauseIds.includes(c.id)) || [];

  const hasFittedRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const updateCoords = useCallback(() => {
    if (!containerRef.current || !data) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const modeEl = document.getElementById('linkage-mode-box');
    if (!modeEl) return;

    const modeRect = modeEl.getBoundingClientRect();
    const modeLeftX = (modeRect.left - containerRect.left - panX) / zoom;
    const modeRightX = (modeRect.right - containerRect.left - panX) / zoom;
    const modeY = (modeRect.top + modeRect.height / 2 - containerRect.top - panY) / zoom;

    const newLinks: SvgLink[] = [];

    // Checked Effects coordinates: right edge of effect card to left edge of mode box
    selectedEffects.forEach(eff => {
      const el = document.getElementById(`selected-eff-${eff.id}`);
      if (el) {
        const r = el.getBoundingClientRect();
        newLinks.push({
          x1: (r.right - containerRect.left - panX) / zoom,
          y1: (r.top + r.height / 2 - containerRect.top - panY) / zoom,
          x2: modeLeftX,
          y2: modeY,
          color: TREE_COLORS.nodeText.process // Blue #1D4ED8
        });
      }
    });

    // Checked Causes coordinates: right edge of mode box to left edge of cause card
    selectedCauses.forEach(cause => {
      const el = document.getElementById(`selected-cause-${cause.id}`);
      if (el) {
        const r = el.getBoundingClientRect();
        newLinks.push({
          x1: modeRightX,
          y1: modeY,
          x2: (r.left - containerRect.left - panX) / zoom,
          y2: (r.top + r.height / 2 - containerRect.top - panY) / zoom,
          color: TREE_COLORS.nodeText.function // Forest Green #15803D
        });
      }
    });

    setLinks(newLinks);
  }, [data, selectedEffects, selectedCauses, zoom, panX, panY]);

  // Fit to view once when data loads
  const fitToView = useCallback(() => {
    if (!containerRef.current || !data) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    const elements: DOMRect[] = [];
    selectedEffects.forEach(eff => {
      const el = document.getElementById(`selected-eff-${eff.id}`);
      if (el) elements.push(el.getBoundingClientRect());
    });
    selectedCauses.forEach(cause => {
      const el = document.getElementById(`selected-cause-${cause.id}`);
      if (el) elements.push(el.getBoundingClientRect());
    });
    const modeEl = document.getElementById('linkage-mode-box');
    if (modeEl) elements.push(modeEl.getBoundingClientRect());

    if (elements.length === 0) return;

    const minX = Math.min(...elements.map(e => e.left - containerRect.left));
    const minY = Math.min(...elements.map(e => e.top - containerRect.top));
    const maxX = Math.max(...elements.map(e => e.right - containerRect.left));
    const maxY = Math.max(...elements.map(e => e.bottom - containerRect.top));

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const padding = 32;

    if (contentWidth <= 0 || contentHeight <= 0) return;

    const scaleX = (containerWidth - padding * 2) / contentWidth;
    const scaleY = (containerHeight - padding * 2) / contentHeight;
    const newZoom = Math.min(scaleX, scaleY, 1);

    const newPanX = (containerWidth - contentWidth * newZoom) / 2 - minX * newZoom;
    const newPanY = (containerHeight - contentHeight * newZoom) / 2 - minY * newZoom;

    setZoom(prev => (Math.abs(prev - newZoom) > 0.01 ? newZoom : prev));
    setPanX(prev => (Math.abs(prev - newPanX) > 1 ? newPanX : prev));
    setPanY(prev => (Math.abs(prev - newPanY) > 1 ? newPanY : prev));
  }, [data, selectedEffects, selectedCauses]);

  // One-time fit when opened or when data first loads
  useEffect(() => {
    if (!open || !data) return;
    if (hasFittedRef.current) return;
    const id = requestAnimationFrame(() => {
      fitToView();
      hasFittedRef.current = true;
      requestAnimationFrame(() => updateCoords());
    });
    return () => cancelAnimationFrame(id);
  }, [open, data, fitToView, updateCoords]);

  useEffect(() => {
    hasFittedRef.current = false;
    if (!open) setLinks([]);
  }, [open]);

  // Recompute connectors when selection changes
  useEffect(() => {
    if (!open || !data) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      updateCoords();
    });
    const t1 = setTimeout(() => requestAnimationFrame(() => updateCoords()), 100);
    const t2 = setTimeout(() => requestAnimationFrame(() => updateCoords()), 350);
    const onResize = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => updateCoords());
    };
    window.addEventListener('resize', onResize);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', onResize);
    };
  }, [selectedEffectIds, selectedCauseIds, data, open, updateCoords]);

  useEffect(() => {
    if (!open || !data) return;
    if (hasFittedRef.current) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => updateCoords());
    }
  }, [zoom, panX, panY, open, data, updateCoords]);

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
      {/* Dialog Header */}
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
            
            {/* LEFT PANE (~68% Width): 3-Column Live Linkage Network Diagram */}
            <Grid
              size={{ xs: 12, md: 8 }}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                p: 3,
                position: 'relative',
                overflow: 'hidden',
                bgcolor: '#F8FAFC',
                borderRight: '3px solid #94A3B8', // Bolder Sharp Slate Divider
                boxShadow: 'inset -5px 0 12px rgba(15, 23, 42, 0.05)',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, zIndex: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: TREE_COLORS.nodeText.process, letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '1.05rem' }}>
                  🔗 Failure Linkage Network Diagram
                </Typography>
                {/* Zoom Toolbar */}
                <Box sx={{ display: 'flex', gap: 0.5, bgcolor: '#FFFFFF', p: 0.5, borderRadius: 2, border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                  <Tooltip title="Zoom In">
                    <IconButton size="small" onClick={() => setZoom(z => Math.min(z + 0.15, 2.5))} sx={{ p: 0.5 }}>
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Zoom Out">
                    <IconButton size="small" onClick={() => setZoom(z => Math.max(z - 0.15, 0.3))} sx={{ p: 0.5 }}>
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={`Reset Zoom: ${Math.round(zoom * 100)}%`}>
                    <IconButton size="small" onClick={handleResetZoom} sx={{ p: 0.5 }}>
                      <CropFreeIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              
              <Box
                ref={containerRef}
                sx={{
                  flex: 1,
                  display: 'flex',
                  width: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                }}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
              >
                {/* Transform wrapper for zoom/pan: 3-column flex layout */}
                <Box
                  sx={{
                    transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
                    transformOrigin: '0 0',
                    width: '100%',
                    minHeight: '100%',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'relative',
                    p: 2,
                    gap: 3,
                  }}
                >
                  {/* SVG CONNECTOR LINES */}
                  <svg
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      pointerEvents: 'none',
                      zIndex: 1,
                      overflow: 'visible',
                    }}
                  >
                    {links.map((link, idx) => {
                      const midX = (link.x1 + link.x2) / 2;
                      const d = `M ${link.x1} ${link.y1} C ${midX} ${link.y1}, ${midX} ${link.y2}, ${link.x2} ${link.y2}`;
                      return (
                        <g key={idx}>
                          <path d={d} stroke={link.color} strokeWidth="4" fill="none" opacity="0.18" />
                          <path d={d} stroke={link.color} strokeWidth="2" fill="none" opacity="0.9" />
                        </g>
                      );
                    })}
                  </svg>

                  {/* Left Column (30% Width): Floating Selected Effects (Higher Level) */}
                  <Stack
                    spacing={2}
                    sx={{
                      width: '30%',
                      minWidth: 220,
                      zIndex: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                    }}
                  >
                    {selectedEffects.length === 0 ? (
                      <Box sx={{ p: 2.5, border: '1.5px dashed #CBD5E1', borderRadius: 2.5, textAlign: 'center', bgcolor: '#FFFFFF', opacity: 0.8 }}>
                        <Typography variant="caption" sx={{ fontSize: '0.9rem', color: 'text.secondary', fontWeight: 600 }}>
                          No higher level effects linked
                        </Typography>
                      </Box>
                    ) : (
                      selectedEffects.map(eff => (
                        <Box
                          key={eff.id}
                          id={`selected-eff-${eff.id}`}
                          sx={{
                            p: 2,
                            borderRadius: 2.5,
                            bgcolor: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            borderLeft: `4px solid ${TREE_COLORS.nodeText.failure}`,
                            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                            transition: 'transform 0.15s ease',
                            '&:hover': { transform: 'translateX(2px)' },
                          }}
                        >
                          <Typography sx={{ fontSize: '0.92rem', fontWeight: 700, color: TREE_COLORS.nodeText.process, mb: 0.5 }}>
                            {propProjectName || eff.parentName || 'System Item'}
                          </Typography>
                          <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: TREE_COLORS.nodeText.function, mb: 0.5 }}>
                            {eff.function?.narration}
                          </Typography>
                          <Typography sx={{ fontSize: '0.98rem', fontWeight: 700, color: TREE_COLORS.nodeText.failure, wordBreak: 'break-word' }}>
                            {eff.narration}
                          </Typography>
                        </Box>
                      ))
                    )}
                  </Stack>

                  {/* Center Column (32% Width): Selected MODE (Fixed Focal Anchor) */}
                  <Box 
                    id="linkage-mode-box"
                    sx={{ 
                      width: '32%',
                      minWidth: 240,
                      zIndex: 2, 
                      p: 2.5, 
                      bgcolor: '#FFFFFF', 
                      border: '1px solid #CBD5E1',
                      borderTop: `5px solid ${TREE_COLORS.nodeText.process}`,
                      borderRadius: 3, 
                      boxShadow: '0 6px 20px rgba(15, 23, 42, 0.08)',
                      textAlign: 'center',
                    }}
                  >
                    <Stack spacing={0.75} sx={{ alignItems: 'center' }}>
                      <TreeIcon iconSrc={TREE_ASSETS.processStep} size={30} />
                      <Typography sx={{ fontSize: '1.0rem', fontWeight: 800, color: TREE_COLORS.nodeText.process }}>
                        {data.mode.parentName || 'Process Step'}
                      </Typography>
                      <Typography sx={{ fontSize: '0.92rem', fontWeight: 600, color: TREE_COLORS.nodeText.function }}>
                        {data.mode.function?.narration}
                      </Typography>
                      <Typography sx={{ fontSize: '1.08rem', fontWeight: 800, color: TREE_COLORS.nodeText.failure, wordBreak: 'break-word', mt: 0.5 }}>
                        {data.mode.narration}
                      </Typography>
                    </Stack>
                  </Box>

                  {/* Right Column (30% Width): Floating Selected Causes (Lower Level) */}
                  <Stack
                    spacing={2}
                    sx={{
                      width: '30%',
                      minWidth: 220,
                      zIndex: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                    }}
                  >
                    {selectedCauses.length === 0 ? (
                      <Box sx={{ p: 2.5, border: '1.5px dashed #CBD5E1', borderRadius: 2.5, textAlign: 'center', bgcolor: '#FFFFFF', opacity: 0.8 }}>
                        <Typography variant="caption" sx={{ fontSize: '0.9rem', color: 'text.secondary', fontWeight: 600 }}>
                          No lower level causes linked
                        </Typography>
                      </Box>
                    ) : (
                      selectedCauses.map(cause => (
                        <Box
                          key={cause.id}
                          id={`selected-cause-${cause.id}`}
                          sx={{
                            p: 2,
                            borderRadius: 2.5,
                            bgcolor: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            borderLeft: `4px solid ${TREE_COLORS.nodeText.workElem}`,
                            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                            transition: 'transform 0.15s ease',
                            '&:hover': { transform: 'translateX(-2px)' },
                          }}
                        >
                          <Typography sx={{ fontSize: '0.92rem', fontWeight: 700, color: TREE_COLORS.nodeText.workElem, mb: 0.5 }}>
                            {cause.parentName || 'Work Element'}
                          </Typography>
                          <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: TREE_COLORS.nodeText.function, mb: 0.5 }}>
                            {cause.function?.narration}
                          </Typography>
                          <Typography sx={{ fontSize: '0.98rem', fontWeight: 700, color: TREE_COLORS.nodeText.failure, wordBreak: 'break-word' }}>
                            {cause.narration}
                          </Typography>
                        </Box>
                      ))
                    )}
                  </Stack>
                </Box>
              </Box>
            </Grid>

            {/* RIGHT PANE (~32% Width): Dual Tree Selection Sidebar */}
            <Grid
              size={{ xs: 12, md: 4 }}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: '#FFFFFF',
                borderLeft: '1px solid #E2E8F0',
              }}
            >
              {/* TOP SECTION: Connect Higher Level Failure (Effects) */}
              <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5, borderBottom: '3px solid #CBD5E1', bgcolor: '#FFFFFF' }}>
                <Box sx={{ p: 1.25, px: 1.5, mb: 1.5, borderRadius: 2, bgcolor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: TREE_COLORS.nodeText.process, fontSize: '1.0rem' }}>
                    🔗 Higher Level Failure (Effects)
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.82rem', mt: 0.25 }}>
                    Link failure effects to: <strong>{data.mode.narration}</strong>
                  </Typography>
                </Box>

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
                          sx={{ cursor: 'pointer', alignItems: 'center', py: 0.5, px: 0.5, borderRadius: 1.5, '&:hover': { bgcolor: TREE_COLORS.hoverBg } }}
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
                                      borderRadius: 1.5,
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
              <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5, bgcolor: '#FFFFFF' }}>
                <Box sx={{ p: 1.25, px: 1.5, mb: 1.5, borderRadius: 2, bgcolor: '#FFFBEB', border: '1px solid #FDE68A' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: TREE_COLORS.nodeText.workElem, fontSize: '1.0rem' }}>
                    🔗 Lower Level Failure (Causes)
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.82rem', mt: 0.25 }}>
                    Link root causes triggering: <strong>{data.mode.narration}</strong>
                  </Typography>
                </Box>

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
                          sx={{ cursor: 'pointer', alignItems: 'center', py: 0.5, px: 0.5, borderRadius: 1.5, '&:hover': { bgcolor: TREE_COLORS.hoverBg } }}
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
                                      borderRadius: 1.5,
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