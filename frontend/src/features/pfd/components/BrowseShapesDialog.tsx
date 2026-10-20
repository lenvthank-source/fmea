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
import { Close, EditOutlined, WarningAmber } from '@mui/icons-material';
import {
  getPfdSymbol,
  isEngineeringSymbol,
  isManufacturingSymbolCompatible,
  PFD_SYMBOLS,
  resolveStepSymbol,
  syncFlowIcons,
  type PfdSymbol,
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
  onApply: (id: string | null, newStepType?: string, newMarkers?: { wip: boolean; reject: boolean }) => void;
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
  const [wipChecked, setWipChecked] = useState<boolean>(Boolean(flowIcons?.wip));
  const [rejectChecked, setRejectChecked] = useState<boolean>(Boolean(flowIcons?.reject));

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
      setWipChecked(Boolean(flowIcons?.wip));
      setRejectChecked(Boolean(flowIcons?.reject));
      setSearch('');
      setEnabled(categories);
    }
  }, [open, selectedId, engineeringSymbolId, stepType, flowIcons, kind, categories]);

  const visible = available.filter(
    (symbol) =>
      enabled.includes(symbol.category) &&
      [symbol.label, symbol.category, ...symbol.aliases].join(' ').toLowerCase().includes(search.toLowerCase().trim()),
  );

  const selectedSymbol = getPfdSymbol(activeTab === 'palette' ? mfgSelection : kind === 'engineering' ? engSelection : mfgSelection);

  const handleApply = () => {
    onApply(mfgSelection, currentStepType, { wip: wipChecked, reject: rejectChecked });
    if (onApplyEngineering) {
      onApplyEngineering(engSelection);
    }
    onClose();
  };

  const handleClear = () => {
    onApply(null, currentStepType, { wip: false, reject: false });
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
            {kind === 'engineering' ? 'Select Equipment Shape' : 'Manufacturing Activity Symbols'}
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
            <Tab value="palette" label="Manufacturing Symbols" sx={{ minHeight: 40, py: 1, textTransform: 'none', fontWeight: 600 }} />
            <Tab value="library" label="More Symbols & Libraries" sx={{ minHeight: 40, py: 1, textTransform: 'none', fontWeight: 600 }} />
          </Tabs>
        </Box>
      )}

      <DialogContent sx={{ minHeight: 0, px: { xs: 2, sm: 3 }, py: 2.5 }}>
        {activeTab === 'palette' && kind === 'manufacturing' ? (
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Primary Activity Symbol
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Select the primary manufacturing classification for this step.
              </Typography>
              <Box
                role="radiogroup"
                aria-label="Classic manufacturing activities"
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(auto-fill, minmax(140px, 1fr))' },
                  gap: 1.25,
                }}
              >
                {CLASSIC_ACTIVITIES.map((act) => {
                  const symbol = getPfdSymbol(act.symbolId) || getPfdSymbol(`manufacturing.${act.type}`);
                  const isSelected = currentStepType === act.type;
                  return (
                    <Button
                      key={act.type}
                      variant="outlined"
                      onClick={() => {
                        setCurrentStepType(act.type);
                        setMfgSelection(act.symbolId);
                      }}
                      sx={{
                        p: 1.25,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 0.75,
                        textTransform: 'none',
                        textAlign: 'center',
                        borderColor: isSelected ? 'primary.main' : 'divider',
                        bgcolor: isSelected ? 'action.selected' : 'background.paper',
                        borderWidth: isSelected ? 2 : 1,
                        color: 'text.primary',
                        borderRadius: 1.5,
                        '&:hover': {
                          borderColor: isSelected ? 'primary.main' : 'text.secondary',
                          bgcolor: isSelected ? 'action.selected' : 'action.hover',
                        },
                      }}
                    >
                      <PfdSymbolPreview symbol={symbol} size={44} />
                      <Typography variant="body2" sx={{ fontWeight: isSelected ? 700 : 500, fontSize: '0.8125rem' }}>
                        {act.label}
                      </Typography>
                    </Button>
                  );
                })}
              </Box>
            </Box>

            <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1.5, border: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Optional Route Markers
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Separate markers indicating inventory staging or nonconformance routing without modifying process classification.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControlLabel
                  control={<Checkbox size="small" checked={wipChecked} onChange={(e) => setWipChecked(e.target.checked)} />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <PfdSymbolPreview symbol={getPfdSymbol('marker.wip')} size={20} />
                      <Typography variant="body2">WIP (Work In Progress)</Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={<Checkbox size="small" checked={rejectChecked} onChange={(e) => setRejectChecked(e.target.checked)} />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <PfdSymbolPreview symbol={getPfdSymbol('marker.reject')} size={20} />
                      <Typography variant="body2">Reject Marker</Typography>
                    </Box>
                  }
                />
              </Stack>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button size="small" onClick={() => setActiveTab('library')} sx={{ textTransform: 'none' }}>
                More symbols & equipment libraries →
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
                Showing symbols compatible with <strong>{currentStepType}</strong>. Switch to the palette tab to change the primary activity.
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
        <Typography variant="caption" sx={{ mr: 'auto', maxWidth: '100%', overflowWrap: 'anywhere' }}>
          {selectedSymbol ? `Selected: ${selectedSymbol.label}` : 'Default classic symbol active'}
        </Typography>
        <Button onClick={handleClear} color="inherit">
          Reset to Default
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
  const manufacturing = resolveStepSymbol(step, 'manufacturing');
  const equipment = getPfdSymbol(step.engineeringSymbolId);
  void equipment;

  if (compact) {
    return (
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
        <Button
          disabled={disabled}
          size="small"
          variant="outlined"
          onClick={() => setOpenDialog(true)}
          aria-label={`Change activity symbol: currently ${manufacturing.symbol.label}`}
          sx={{
            gap: 1,
            px: 1,
            py: 0.5,
            minHeight: 34,
            textTransform: 'none',
            borderColor: 'divider',
            color: 'text.primary',
            borderRadius: 1.5,
            '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
          }}
        >
          <PfdSymbolPreview symbol={manufacturing.symbol} size={26} />
          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
            {manufacturing.symbol.label}
          </Typography>
          {manufacturing.annotations.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {manufacturing.annotations.map((a) => (
                <Chip
                  key={a}
                  size="small"
                  label={a.toUpperCase()}
                  color={a === 'wip' ? 'warning' : 'error'}
                  variant="outlined"
                  sx={{ height: 18, fontSize: '0.625rem', px: 0.5, fontWeight: 700 }}
                />
              ))}
            </Box>
          )}
          <EditOutlined sx={{ fontSize: 13, color: 'text.secondary', ml: 0.25 }} />
        </Button>

        {manufacturing.findings.length > 0 && (
          <Tooltip title={manufacturing.findings.join(' · ')} arrow>
            <Chip
              size="small"
              icon={<WarningAmber sx={{ fontSize: '13px !important' }} />}
              label="Needs review"
              color="warning"
              sx={{ height: 20, fontSize: '0.6875rem', cursor: 'pointer', fontWeight: 600 }}
              onClick={() => setOpenDialog(true)}
            />
          </Tooltip>
        )}

        <BrowseShapesDialog
          open={openDialog}
          kind="manufacturing"
          stepType={step.stepType}
          selectedId={step.manufacturingSymbolId}
          engineeringSymbolId={step.engineeringSymbolId}
          flowIcons={step.flowIcons}
          onClose={() => setOpenDialog(false)}
          onApply={(symbolId, newStepType, newMarkers) => {
            if (onAtomicChange) {
              const flowIcons = syncFlowIcons(step.flowIcons || {}, newStepType || step.stepType, newMarkers);
              onAtomicChange({
                stepType: newStepType || step.stepType,
                manufacturingSymbolId: symbolId,
                flowIcons,
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
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          disabled={disabled}
          size="small"
          variant="outlined"
          onClick={() => setOpenDialog(true)}
          aria-label="Choose manufacturing activity symbol"
          sx={{ gap: 1, px: 1.25, py: 0.75, minWidth: 0, textTransform: 'none', borderRadius: 1.5 }}
        >
          <PfdSymbolPreview symbol={manufacturing.symbol} size={32} />
          <Box sx={{ textAlign: 'left' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {manufacturing.symbol.label}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Manufacturing activity
            </Typography>
          </Box>
          <EditOutlined sx={{ fontSize: 14, color: 'text.secondary', ml: 0.5 }} />
        </Button>
      </Box>

      {manufacturing.annotations.length > 0 && (
        <Typography variant="caption" color="text.secondary">
          Route markers: {manufacturing.annotations.map((v) => (v === 'wip' ? 'WIP' : 'Reject')).join(', ')}.
        </Typography>
      )}

      {manufacturing.findings.length > 0 && (
        <Stack spacing={0.25}>
          {manufacturing.findings.map((f) => (
            <Typography key={f} variant="caption" color="warning.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <WarningAmber sx={{ fontSize: 13 }} /> {f}
            </Typography>
          ))}
        </Stack>
      )}

      <BrowseShapesDialog
        open={openDialog}
        kind="manufacturing"
        stepType={step.stepType}
        selectedId={step.manufacturingSymbolId}
        engineeringSymbolId={step.engineeringSymbolId}
        flowIcons={step.flowIcons}
        onClose={() => setOpenDialog(false)}
        onApply={(symbolId, newStepType, newMarkers) => {
          if (onAtomicChange) {
            const flowIcons = syncFlowIcons(step.flowIcons || {}, newStepType || step.stepType, newMarkers);
            onAtomicChange({
              stepType: newStepType || step.stepType,
              manufacturingSymbolId: symbolId,
              flowIcons,
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
