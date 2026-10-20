import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Close, EditOutlined } from '@mui/icons-material';
import {
  getPfdSymbol,
  isEngineeringSymbol,
  isManufacturingSymbolCompatible,
  PFD_SYMBOLS,
  resolveStepSymbol,
  syncFlowIcons,
  type PfdSymbol,
  FLOW_SYMBOL_DEFINITIONS,
  getActiveFlowSymbols,
  derivePrimaryStepType,
  getClassicManufacturingSymbol,
} from '../utils/pfdSymbols';

/** Registry-owned SVG only. Labels are React text, never interpreted as markup. */
export function PfdSymbolPreview({ symbol, size = 56 }: { symbol?: PfdSymbol; size?: number }) {
  if (!symbol) return null;
  return (
    <Box
      component="svg"
      aria-hidden="true"
      viewBox={symbol.viewBox}
      sx={{ width: size, height: size * 0.75, flexShrink: 0, color: 'text.primary' }}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: symbol.svg }}
    />
  );
}

export const CLASSIC_ACTIVITIES = [
  { type: 'operation', symbolId: 'manufacturing.classic.operation', label: 'Operation', desc: 'Produces, transforms or assembles' },
  { type: 'inspection', symbolId: 'manufacturing.classic.inspection', label: 'Inspection', desc: 'Verifies quality, dimensions or tolerances' },
  { type: 'transport', symbolId: 'manufacturing.classic.transport', label: 'Transport', desc: 'Moves material, parts or tooling' },
  { type: 'storage', symbolId: 'manufacturing.classic.storage', label: 'Storage', desc: 'Stores inventory or controlled WIP' },
  { type: 'decision', symbolId: 'manufacturing.classic.decision', label: 'Decision', desc: 'Branches process path based on check' },
  { type: 'rework', symbolId: 'manufacturing.classic.rework', label: 'Rework', desc: 'Corrects nonconforming component' },
  { type: 'combined', symbolId: 'manufacturing.classic.combined', label: 'Combined', desc: 'Simultaneous operation and inspection' },
];

export interface BrowseShapesDialogProps {
  open: boolean;
  onClose: () => void;
  onApply: (
    id: string | null,
    newStepType?: string,
    newMarkers?: { wip: boolean; reject: boolean },
    updatedFlowIcons?: Record<string, boolean>
  ) => void;
  selectedId?: string | null;
  engineeringSymbolId?: string | null;
  onApplyEngineering?: (id: string | null) => void;
  kind?: 'manufacturing' | 'engineering' | 'annotation';
  stepType?: string;
  flowIcons?: Record<string, boolean>;
}

export function BrowseShapesDialog({
  open,
  onClose,
  onApply,
  selectedId,
  engineeringSymbolId,
  onApplyEngineering,
  kind = 'manufacturing',
  stepType = 'operation',
  flowIcons,
}: BrowseShapesDialogProps) {
  const [activeTab, setActiveTab] = useState<'palette' | 'library'>(kind === 'manufacturing' ? 'palette' : 'library');
  const [currentStepType, setCurrentStepType] = useState<string>(stepType);
  const [mfgSelection, setMfgSelection] = useState<string | null>(selectedId || null);
  const [engSelection, setEngSelection] = useState<string | null>(engineeringSymbolId || null);
  const [activeIcons, setActiveIcons] = useState<Record<string, boolean>>({});

  const [search, setSearch] = useState('');
  const available = useMemo(
    () =>
      PFD_SYMBOLS.filter((symbol) =>
        kind === 'manufacturing'
          ? isManufacturingSymbolCompatible(symbol.id, currentStepType)
          : kind === 'engineering'
          ? isEngineeringSymbol(symbol.id)
          : ['basic', 'arrow', 'annotation'].includes(symbol.kind),
      ),
    [kind, currentStepType],
  );
  const categories = useMemo(() => [...new Set(available.map((symbol) => symbol.category))], [available]);
  const [enabled, setEnabled] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setActiveTab(kind === 'manufacturing' ? 'palette' : 'library');
      setCurrentStepType(stepType);
      setMfgSelection(selectedId || null);
      setEngSelection(engineeringSymbolId || null);
      setSearch('');
      setEnabled(categories);

      // Seed active icons from step flowIcons or stepType
      const initial: Record<string, boolean> = { ...(flowIcons || {}) };
      if (!Object.values(initial).some(Boolean)) {
        if (stepType === 'combined') {
          initial.oper = true;
          initial.insp = true;
        } else if (stepType === 'inspection') {
          initial.insp = true;
        } else if (stepType === 'transport') {
          initial.trans = true;
        } else if (stepType === 'storage') {
          initial.store = true;
        } else if (stepType === 'decision') {
          initial.decs = true;
        } else if (stepType === 'rework') {
          initial.rework = true;
        } else if (stepType === 'delay') {
          initial.wip = true;
        } else if (stepType === 'scrap') {
          initial.reject = true;
        } else {
          initial.oper = true;
        }
      }
      setActiveIcons(initial);
    }
  }, [open, selectedId, engineeringSymbolId, stepType, flowIcons, kind, categories]);

  const handleToggleIcon = (key: string) => {
    setActiveIcons((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = true;
      }
      return next;
    });
  };

  const visible = available.filter(
    (symbol) =>
      enabled.includes(symbol.category) &&
      [symbol.label, symbol.category, ...symbol.aliases].join(' ').toLowerCase().includes(search.toLowerCase().trim()),
  );

  const selectedCount = Object.values(activeIcons).filter(Boolean).length;
  const activeDefLabels = FLOW_SYMBOL_DEFINITIONS.filter((d) => activeIcons[d.key])
    .map((d) => d.name)
    .join(', ');

  const handleApply = () => {
    const derivedType = derivePrimaryStepType(activeIcons, currentStepType);
    const primarySymbol = getClassicManufacturingSymbol(derivedType);
    onApply(
      primarySymbol?.id || mfgSelection,
      derivedType,
      { wip: !!activeIcons.wip, reject: !!activeIcons.reject },
      activeIcons,
    );
    if (onApplyEngineering) {
      onApplyEngineering(engSelection);
    }
    onClose();
  };

  const handleClear = () => {
    const emptyIcons: Record<string, boolean> = {};
    setActiveIcons(emptyIcons);
    onApply(null, 'operation', { wip: false, reject: false }, emptyIcons);
    if (onApplyEngineering) {
      onApplyEngineering(null);
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="browse-pfd-shapes-title"
      sx={{ zIndex: 1400 }}
      slotProps={{
        paper: {
          sx: {
            maxHeight: '90dvh',
            m: { xs: 1, sm: 3 },
            width: { xs: 'calc(100% - 16px)', sm: '760px' },
            borderRadius: 2,
          },
        },
      }}
    >
      <DialogTitle
        id="browse-pfd-shapes-title"
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="h6" sx={{ fontSize: '1.125rem', fontWeight: 600 }}>
            {kind === 'engineering' ? 'Select Equipment Shape' : 'Process Flow Symbols (Multi-Select)'}
          </Typography>
        </Box>
        <IconButton aria-label="Close shape browser" onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      {kind === 'manufacturing' && (
        <Box sx={{ px: { xs: 2, sm: 3 }, borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            sx={{ minHeight: 40 }}
          >
            <Tab value="palette" label="Flow Symbols Palette" sx={{ minHeight: 40, py: 1, textTransform: 'none', fontWeight: 600 }} />
            <Tab value="library" label="More Symbols & Libraries" sx={{ minHeight: 40, py: 1, textTransform: 'none', fontWeight: 600 }} />
          </Tabs>
        </Box>
      )}

      <DialogContent sx={{ minHeight: 0, px: { xs: 2, sm: 3 }, py: 2.5 }}>
        {activeTab === 'palette' && kind === 'manufacturing' ? (
          <Stack spacing={2.5}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Process Flow Symbols (AIAG-VDA & ASME Process Chart Standard)
                </Typography>
                <Chip
                  size="small"
                  label="Multi-Select Allowed"
                  color="primary"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.6875rem', fontWeight: 700 }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Click to toggle one or more symbols representing all activities occurring in this step (e.g. Operation + Inspection).
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
                  gap: 1.25,
                }}
              >
                {FLOW_SYMBOL_DEFINITIONS.map((act) => {
                  const symbol = getPfdSymbol(act.symbolId);
                  const isSelected = !!activeIcons[act.key];
                  return (
                    <Button
                      key={act.key}
                      variant="outlined"
                      onClick={() => handleToggleIcon(act.key)}
                      sx={{
                        p: 1.25,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 0.5,
                        textTransform: 'none',
                        textAlign: 'center',
                        position: 'relative',
                        borderColor: isSelected ? 'primary.main' : 'divider',
                        bgcolor: isSelected ? 'action.selected' : 'background.paper',
                        borderWidth: isSelected ? 2 : 1,
                        color: 'text.primary',
                        borderRadius: 1.5,
                        transition: 'all 0.12s ease-in-out',
                        '&:hover': {
                          borderColor: isSelected ? 'primary.main' : 'text.secondary',
                          bgcolor: isSelected ? 'action.selected' : 'action.hover',
                          transform: 'translateY(-1px)',
                        },
                      }}
                    >
                      <PfdSymbolPreview symbol={symbol} size={40} />
                      <Typography variant="body2" sx={{ fontWeight: isSelected ? 700 : 500, fontSize: '0.8125rem' }}>
                        {act.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: isSelected ? 'primary.main' : 'text.secondary', fontSize: '0.7rem', fontWeight: 600 }}>
                        {act.short} {act.symbolChar}
                      </Typography>
                      {isSelected && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 6,
                            right: 6,
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.65rem',
                            fontWeight: 900,
                          }}
                        >
                          ✓
                        </Box>
                      )}
                    </Button>
                  );
                })}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button size="small" onClick={() => setActiveTab('library')} sx={{ textTransform: 'none' }}>
                Need specific machinery or equipment shapes? View library →
              </Button>
            </Box>
          </Stack>
        ) : (
          <Box>
            <TextField
              fullWidth
              autoFocus
              size="small"
              label="Find shapes and shape categories"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ mb: 2 }}
            />
            {kind === 'manufacturing' && (
              <Alert severity="info" sx={{ mb: 2, py: 0.5 }}>
                Showing symbols compatible with <strong>{currentStepType}</strong>. Switch to the palette tab to toggle process flow symbols.
              </Alert>
            )}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '190px minmax(0, 1fr)' }, gap: 2 }}>
              <Box
                component="aside"
                aria-label="Enabled shape libraries"
                sx={{
                  maxHeight: { xs: 120, sm: 380 },
                  overflowY: 'auto',
                  pr: 1,
                  borderRight: { sm: '1px solid' },
                  borderColor: 'divider',
                }}
              >
                <Typography variant="overline">Libraries</Typography>
                <Stack>
                  {categories.map((category) => (
                    <FormControlLabel
                      key={category}
                      sx={{ m: 0 }}
                      label={<Typography variant="body2">{category}</Typography>}
                      control={
                        <Checkbox
                          size="small"
                          checked={enabled.includes(category)}
                          onChange={(e) =>
                            setEnabled((prev) => (e.target.checked ? [...prev, category] : prev.filter((c) => c !== category)))
                          }
                        />
                      }
                    />
                  ))}
                </Stack>
              </Box>
              <Box sx={{ minWidth: 0, maxHeight: 380, overflowY: 'auto', pr: 0.5 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {visible.length} shapes · {kind === 'engineering' ? 'Equipment is visual; activity remains unchanged.' : 'Select a shape, then apply.'}
                </Typography>
                <Box
                  role="group"
                  aria-label="Available shapes"
                  sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 1 }}
                >
                  {visible.map((symbol) => {
                    const isSelected = (kind === 'engineering' ? engSelection : mfgSelection) === symbol.id;
                    return (
                      <Button
                        key={symbol.id}
                        aria-pressed={isSelected}
                        onClick={() => {
                          if (kind === 'engineering') setEngSelection(symbol.id);
                          else setMfgSelection(symbol.id);
                        }}
                        variant="outlined"
                        sx={{
                          minHeight: 90,
                          px: 1,
                          py: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0.5,
                          textTransform: 'none',
                          borderColor: isSelected ? 'primary.main' : 'divider',
                          bgcolor: isSelected ? 'action.selected' : 'transparent',
                          borderWidth: isSelected ? 2 : 1,
                          color: 'text.primary',
                        }}
                      >
                        <PfdSymbolPreview symbol={symbol} size={40} />
                        <Typography variant="caption" sx={{ lineHeight: 1.25, overflowWrap: 'anywhere' }}>
                          {symbol.label}
                        </Typography>
                      </Button>
                    );
                  })}
                </Box>
                {!visible.length && <Typography sx={{ py: 4 }}>No shapes match. Enable a library or change search.</Typography>}
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="caption" sx={{ mr: 'auto', maxWidth: '100%', overflowWrap: 'anywhere', fontWeight: 600 }}>
          {selectedCount > 0 ? `Selected (${selectedCount}): ${activeDefLabels}` : 'No flow symbols selected'}
        </Typography>
        <Button onClick={handleClear} color="inherit">
          Reset / Clear
        </Button>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button variant="contained" onClick={handleApply}>
          Apply Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function PfdStepSymbolFields({
  step,
  onChange,
  onAtomicChange,
  disabled = false,
  compact = false,
}: {
  step: {
    stepType: string;
    manufacturingSymbolId?: string | null;
    engineeringSymbolId?: string | null;
    flowIcons?: Record<string, boolean>;
  };
  onChange?: (field: 'manufacturingSymbolId' | 'engineeringSymbolId', value: string | null) => void;
  onAtomicChange?: (updates: {
    stepType?: string;
    manufacturingSymbolId?: string | null;
    engineeringSymbolId?: string | null;
    flowIcons?: Record<string, boolean>;
  }) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  const [openDialog, setOpenDialog] = useState(false);
  const activeSymbols = getActiveFlowSymbols(step.flowIcons || {});
  const manufacturing = resolveStepSymbol(step, 'manufacturing');

  if (compact) {
    return (
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', minWidth: 0 }}>
        <Button
          disabled={disabled}
          size="small"
          variant="outlined"
          onClick={() => setOpenDialog(true)}
          aria-label="Edit process flow symbols"
          sx={{
            gap: 0.75,
            px: 1,
            py: 0.4,
            minHeight: 32,
            textTransform: 'none',
            borderColor: 'divider',
            color: 'text.primary',
            borderRadius: 1.5,
            bgcolor: '#ffffff',
            '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
          }}
        >
          {activeSymbols.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 0.6 }}>
              {activeSymbols.map((item) => {
                const sym = getPfdSymbol(item.symbolId);
                const isMarker = item.category === 'marker';
                return (
                  <Tooltip key={item.key} title={item.name} arrow>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.4,
                        px: 0.6,
                        py: 0.2,
                        bgcolor: isMarker ? (item.key === 'wip' ? '#fef3c7' : '#fee2e2') : '#f8fafc',
                        border: '1px solid',
                        borderColor: isMarker ? (item.key === 'wip' ? '#f59e0b' : '#ef4444') : '#cbd5e1',
                        borderRadius: '4px',
                      }}
                    >
                      <PfdSymbolPreview symbol={sym} size={16} />
                      <Typography sx={{ fontSize: '0.725rem', fontWeight: 700, color: '#0f172a' }}>
                        {item.short}
                      </Typography>
                    </Box>
                  </Tooltip>
                );
              })}
            </Box>
          ) : (
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
              <PfdSymbolPreview symbol={manufacturing.symbol} size={20} />
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                {manufacturing.symbol.label}
              </Typography>
            </Box>
          )}
          <EditOutlined sx={{ fontSize: 13, color: 'text.secondary', ml: 0.25 }} />
        </Button>

        <BrowseShapesDialog
          open={openDialog}
          kind="manufacturing"
          stepType={step.stepType}
          selectedId={step.manufacturingSymbolId}
          engineeringSymbolId={step.engineeringSymbolId}
          flowIcons={step.flowIcons}
          onClose={() => setOpenDialog(false)}
          onApply={(symbolId, newStepType, newMarkers, updatedFlowIcons) => {
            const finalIcons = updatedFlowIcons || syncFlowIcons(step.flowIcons || {}, newStepType || step.stepType, newMarkers);
            if (onAtomicChange) {
              onAtomicChange({
                stepType: newStepType || step.stepType,
                manufacturingSymbolId: symbolId,
                flowIcons: finalIcons,
              });
            } else if (onChange) {
              onChange('manufacturingSymbolId', symbolId);
            }
          }}
          onApplyEngineering={(engId) => {
            if (onAtomicChange) {
              onAtomicChange({ engineeringSymbolId: engId });
            } else if (onChange) {
              onChange('engineeringSymbolId', engId);
            }
          }}
        />
      </Box>
    );
  }

  return (
    <Stack spacing={1}>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        <Button
          disabled={disabled}
          size="small"
          variant="outlined"
          onClick={() => setOpenDialog(true)}
          aria-label="Choose manufacturing activity symbols"
          sx={{ gap: 1, px: 1.25, py: 0.75, minWidth: 0, textTransform: 'none', borderRadius: 1.5 }}
        >
          {activeSymbols.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 0.75 }}>
              {activeSymbols.map((item) => {
                const sym = getPfdSymbol(item.symbolId);
                return (
                  <Box
                    key={item.key}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                      px: 0.75,
                      py: 0.25,
                      bgcolor: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                    }}
                  >
                    <PfdSymbolPreview symbol={sym} size={18} />
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
                      {item.name}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          ) : (
            <>
              <PfdSymbolPreview symbol={manufacturing.symbol} size={32} />
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {manufacturing.symbol.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Manufacturing activity
                </Typography>
              </Box>
            </>
          )}
          <EditOutlined sx={{ fontSize: 14, color: 'text.secondary', ml: 0.5 }} />
        </Button>
      </Box>

      {activeSymbols.length > 0 && (
        <Typography variant="caption" color="text.secondary">
          Active flow activities: {activeSymbols.map((s) => s.name).join(', ')}.
        </Typography>
      )}

      <BrowseShapesDialog
        open={openDialog}
        kind="manufacturing"
        stepType={step.stepType}
        selectedId={step.manufacturingSymbolId}
        engineeringSymbolId={step.engineeringSymbolId}
        flowIcons={step.flowIcons}
        onClose={() => setOpenDialog(false)}
        onApply={(symbolId, newStepType, newMarkers, updatedFlowIcons) => {
          const finalIcons = updatedFlowIcons || syncFlowIcons(step.flowIcons || {}, newStepType || step.stepType, newMarkers);
          if (onAtomicChange) {
            onAtomicChange({
              stepType: newStepType || step.stepType,
              manufacturingSymbolId: symbolId,
              flowIcons: finalIcons,
            });
          } else if (onChange) {
            onChange('manufacturingSymbolId', symbolId);
          }
        }}
        onApplyEngineering={(engId) => {
          if (onAtomicChange) {
            onAtomicChange({ engineeringSymbolId: engId });
          } else if (onChange) {
            onChange('engineeringSymbolId', engId);
          }
        }}
      />
    </Stack>
  );
}
