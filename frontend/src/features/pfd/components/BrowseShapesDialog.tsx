import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, Stack, TextField, Typography } from '@mui/material';
import { Close } from '@mui/icons-material';
import { getPfdSymbol, isEngineeringSymbol, isManufacturingSymbolCompatible, PFD_SYMBOLS, resolveStepSymbol, type PfdSymbol } from '../utils/pfdSymbols';

/** Registry-owned SVG only. Labels are React text, never interpreted as markup. */
export function PfdSymbolPreview({ symbol, size = 56 }: { symbol?: PfdSymbol; size?: number }) {
  if (!symbol) return null;
  return <Box component="svg" aria-hidden="true" viewBox={symbol.viewBox} sx={{ width: size, height: size * .75, flexShrink: 0, color: 'text.primary' }}
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: symbol.svg }} />;
}
export interface BrowseShapesDialogProps {
  open: boolean; onClose: () => void; onApply: (id: string | null) => void;
  selectedId?: string | null; kind?: 'manufacturing' | 'engineering' | 'annotation'; stepType?: string;
}
export function BrowseShapesDialog({ open, onClose, onApply, selectedId, kind = 'engineering', stepType = 'operation' }: BrowseShapesDialogProps) {
  const [search, setSearch] = useState('');
  const [selection, setSelection] = useState<string | null>(selectedId || null);
  const available = useMemo(() => PFD_SYMBOLS.filter(symbol => kind === 'manufacturing'
    ? isManufacturingSymbolCompatible(symbol.id, stepType)
    : kind === 'engineering' ? isEngineeringSymbol(symbol.id) : ['basic', 'arrow', 'annotation'].includes(symbol.kind)), [kind, stepType]);
  const categories = useMemo(() => [...new Set(available.map(symbol => symbol.category))], [available]);
  const [enabled, setEnabled] = useState<string[]>([]);
  useEffect(() => { if (open) { setSearch(''); setSelection(selectedId || null); setEnabled(categories); } }, [open, selectedId, categories]);
  const visible = available.filter(symbol => enabled.includes(symbol.category) && [symbol.label, symbol.category, ...symbol.aliases].join(' ').toLowerCase().includes(search.toLowerCase().trim()));
  const selected = getPfdSymbol(selection);
  return <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth aria-labelledby="browse-pfd-shapes-title" sx={{ zIndex: 1400 }} slotProps={{ paper: { sx: { maxHeight: '90dvh', m: { xs: 1, sm: 3 }, width: { xs: 'calc(100% - 16px)' } } } }}>
    <DialogTitle id="browse-pfd-shapes-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>Browse shapes<IconButton aria-label="Close shape browser" onClick={onClose}><Close /></IconButton></DialogTitle>
    <DialogContent sx={{ minHeight: 0, px: { xs: 2, sm: 3 } }}>
      <TextField fullWidth autoFocus size="small" label="Find shapes and shape categories" value={search} onChange={event => setSearch(event.target.value)} sx={{ mb: 2 }} />
      {kind === 'manufacturing' && <Alert severity="info" sx={{ mb: 2 }}>Showing symbols compatible with {stepType}. Change the activity type in the step editor to choose another activity.</Alert>}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '190px minmax(0, 1fr)' }, gap: 2 }}>
        <Box component="aside" aria-label="Enabled shape libraries" sx={{ maxHeight: { xs: 140, sm: 420 }, overflowY: 'auto', pr: 1, borderRight: { sm: '1px solid' }, borderColor: 'divider' }}>
          <Typography variant="overline">Libraries</Typography>
          <Stack>{categories.map(category => <FormControlLabel key={category} sx={{ m: 0 }} label={<Typography variant="body2">{category}</Typography>} control={<Checkbox size="small" checked={enabled.includes(category)} onChange={event => setEnabled(previous => event.target.checked ? [...previous, category] : previous.filter(item => item !== category))} />} />)}</Stack>
        </Box>
        <Box sx={{ minWidth: 0, maxHeight: 420, overflowY: 'auto', pr: .5 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{visible.length} shapes · {kind === 'engineering' ? 'Equipment is a visual selection; the manufacturing activity stays unchanged.' : 'Select a shape, then apply.'}</Typography>
          <Box role="group" aria-label="Available shapes" sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(112px, 1fr))', gap: 1 }}>
            {visible.map(symbol => <Button key={symbol.id} aria-pressed={selection === symbol.id} onClick={() => setSelection(symbol.id)} variant="outlined" sx={{ minHeight: 96, px: 1, py: 1.25, display: 'flex', flexDirection: 'column', gap: .5, textTransform: 'none', borderColor: selection === symbol.id ? 'primary.main' : 'divider', bgcolor: selection === symbol.id ? 'action.selected' : 'transparent', borderWidth: selection === symbol.id ? 2 : 1, color: 'text.primary' }}><PfdSymbolPreview symbol={symbol} /><Typography variant="caption" sx={{ lineHeight: 1.25, overflowWrap: 'anywhere' }}>{symbol.label}</Typography></Button>)}
          </Box>
          {!visible.length && <Typography sx={{ py: 4 }}>No shapes match. Enable a library or change the search.</Typography>}
        </Box>
      </Box>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2, flexWrap: 'wrap', gap: 1 }}>
      <Typography variant="caption" sx={{ mr: 'auto', maxWidth: '100%', overflowWrap: 'anywhere' }}>{selected?.label || 'No explicit symbol selected'}</Typography>
      <Button onClick={() => { onApply(null); onClose(); }}>Clear selection</Button>
      <Button onClick={onClose}>Cancel</Button>
      <Button variant="contained" disabled={!selection || !available.some(symbol => symbol.id === selection)} onClick={() => { onApply(selection); onClose(); }}>Apply shape</Button>
    </DialogActions>
  </Dialog>;
}

export function PfdStepSymbolFields({ step, onChange, disabled = false, compact = false }: {
  step: { stepType: string; manufacturingSymbolId?: string | null; engineeringSymbolId?: string | null; flowIcons?: Record<string, boolean> };
  onChange: (field: 'manufacturingSymbolId' | 'engineeringSymbolId', value: string | null) => void; disabled?: boolean; compact?: boolean;
}) {
  const [kind, setKind] = useState<'manufacturing' | 'engineering' | null>(null);
  const manufacturing = resolveStepSymbol(step, 'manufacturing');
  const equipment = getPfdSymbol(step.engineeringSymbolId);
  return <Stack spacing={compact ? .5 : 1}>
    <Box sx={{ display: 'flex', gap: .75, flexWrap: 'wrap' }}>
      <Button disabled={disabled} size="small" variant="outlined" onClick={() => setKind('manufacturing')} aria-label="Choose manufacturing symbol" sx={{ gap: .5, minWidth: 0, textTransform: 'none', flex: compact ? 1 : undefined }}><PfdSymbolPreview symbol={manufacturing.symbol} size={32} /><Typography variant="caption">{manufacturing.symbol.label}{manufacturing.legacy ? ' · legacy' : ''}</Typography></Button>
      <Button disabled={disabled} size="small" variant="outlined" onClick={() => setKind('engineering')} aria-label="Choose engineering symbol" sx={{ gap: .5, minWidth: 0, textTransform: 'none', flex: compact ? 1 : undefined }}><PfdSymbolPreview symbol={equipment} size={32} /><Typography variant="caption">{equipment?.label || 'Equipment symbol'}</Typography></Button>
    </Box>
    {manufacturing.annotations.length > 0 && <Typography variant="caption" color="text.secondary">Legacy annotations: {manufacturing.annotations.map(value => value === 'wip' ? 'WIP' : 'Reject').join(', ')}. Retained; review routing separately.</Typography>}
    {manufacturing.findings.map(finding => <Typography key={finding} variant="caption" color="warning.main">{finding}</Typography>)}
    <BrowseShapesDialog open={!!kind} kind={kind || 'manufacturing'} stepType={step.stepType} selectedId={kind === 'engineering' ? step.engineeringSymbolId : step.manufacturingSymbolId} onClose={() => setKind(null)} onApply={id => onChange(kind === 'engineering' ? 'engineeringSymbolId' : 'manufacturingSymbolId', id)} />
  </Stack>;
}
