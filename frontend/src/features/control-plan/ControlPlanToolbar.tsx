import { useState } from 'react';
import {
  Box, Button, Chip, Collapse, Divider, IconButton, Menu, MenuItem,
  Popover, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import {
  ExpandMore, InfoOutlined, MoreHoriz, FileDownloadOutlined,
  LinkOutlined, FactCheckOutlined, SaveOutlined,
} from '@mui/icons-material';

interface RevisionOption {
  id: string;
  revisionNumber: string;
  status: string;
}

interface SourceOption extends RevisionOption {
  type: string;
}

export interface ControlPlanToolbarProps {
  projectName: string;
  revisionId: string;
  revisions: RevisionOption[];
  phase: string;
  safeLaunch: boolean;
  version: number;
  dirty: boolean;
  busy: boolean;
  writable: boolean;
  canEdit: boolean;
  canFork: boolean;
  canSubmit: boolean;
  canApprove: boolean;
  canReviewDecision: boolean;
  operationCount: number;
  controlCount: number;
  sources: SourceOption[];
  baselines: { revisionId: string; type: string }[];
  sourceRevisionId: string;
  sourcesExpanded: boolean;
  validating: boolean;
  exportingPdf: boolean;
  onRevisionChange: (id: string) => void;
  onSave: () => void;
  onDetails: () => void;
  onFork: () => void;
  onReload: () => void;
  onImport: (file: File) => void;
  onExportXlsx: () => void;
  onExportPdf: () => void;
  onExportJson: () => void;
  onPrint: () => void;
  onValidate: () => void;
  onReadiness: () => void;
  onSubmit: () => void;
  onApprove: () => void;
  onReviewDecision: () => void;
  onToggleSources: () => void;
  onSourceChange: (id: string) => void;
  onPreview: () => void;
}

const phaseLabels: Record<string, string> = {
  prototype: 'Prototype', 'pre-launch': 'Pre-launch', production: 'Production',
};
const statusLabel = (status: string) => status.replaceAll('_', ' ');

/** One compact command surface for the plan, with secondary tasks disclosed on demand. */
export function ControlPlanToolbar(props: ControlPlanToolbarProps) {
  const [exportAnchor, setExportAnchor] = useState<HTMLElement | null>(null);
  const [reviewAnchor, setReviewAnchor] = useState<HTMLElement | null>(null);
  const [moreAnchor, setMoreAnchor] = useState<HTMLElement | null>(null);
  const [infoAnchor, setInfoAnchor] = useState<HTMLElement | null>(null);
  const savedActionsDisabled = props.busy || props.dirty || !props.revisionId;
  const run = (close: () => void, action: () => void) => { close(); action(); };

  return (
    <Box sx={{ p: { xs: 1.25, sm: 1.5 }, pb: '0 !important', minWidth: 0 }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap' }}>
        <Box sx={{ minWidth: 0, flex: '1 1 160px' }}>
          <Typography component="h1" sx={{ fontSize: { xs: 22, sm: 25 }, lineHeight: 1.2, fontWeight: 800, letterSpacing: '-.03em' }}>
            Control Plan
          </Typography>
          {props.projectName && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', overflowWrap: 'anywhere' }}>{props.projectName}</Typography>}
        </Box>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 0.75, flexWrap: 'wrap', minWidth: 0, maxWidth: '100%' }}>
          <Button size="small" variant="outlined" startIcon={<FactCheckOutlined />} endIcon={<ExpandMore />} onClick={e => setReviewAnchor(e.currentTarget)} aria-haspopup="menu" aria-controls={reviewAnchor ? 'cp-review-menu' : undefined} aria-expanded={!!reviewAnchor}>
            Review
          </Button>
          <Button size="small" startIcon={<FileDownloadOutlined />} endIcon={<ExpandMore />} disabled={props.busy} onClick={e => setExportAnchor(e.currentTarget)} aria-haspopup="menu" aria-controls={exportAnchor ? 'cp-export-menu' : undefined} aria-expanded={!!exportAnchor}>
            Export
          </Button>
          <Tooltip title="Plan options">
            <IconButton size="small" aria-label="Plan options" aria-haspopup="menu" aria-expanded={!!moreAnchor} aria-controls={moreAnchor ? 'cp-options-menu' : undefined} onClick={e => setMoreAnchor(e.currentTarget)}><MoreHoriz /></IconButton>
          </Tooltip>
          {props.canEdit && (
            <Button
              size="small"
              variant="contained"
              startIcon={<SaveOutlined />}
              disabled={!props.writable || (!props.dirty && props.version > 0) || props.busy}
              onClick={props.onSave}
            >
              {props.busy ? 'Working…' : props.version === 0 ? 'Save initial plan' : 'Save changes'}
            </Button>
          )}
        </Stack>
      </Stack>

      <Stack direction="row" sx={{ mt: 1.25, gap: 1, alignItems: 'center', flexWrap: 'wrap', pb: 1.25 }}>
        <TextField size="small" select label="Revision" value={props.revisionId} disabled={props.busy} onChange={e => props.onRevisionChange(e.target.value)} sx={{ width: { xs: '100%', sm: 175 }, maxWidth: '100%', '& .MuiInputBase-root': { fontSize: 13 } }}>
          {props.revisions.map(revision => <MenuItem key={revision.id} value={revision.id}>{revision.revisionNumber} · {statusLabel(revision.status)}</MenuItem>)}
        </TextField>
        <Chip size="small" variant="outlined" label={phaseLabels[props.phase] || 'Phase not set'} sx={{ height: 23, fontSize: 11 }} />
        {props.safeLaunch && <Chip size="small" label="Safe Launch" sx={{ height: 23, fontSize: 11 }} />}
        <Typography variant="caption" color="text.secondary">{props.operationCount} {props.operationCount === 1 ? 'operation' : 'operations'} · {props.controlCount} {props.controlCount === 1 ? 'control' : 'controls'}</Typography>
        <Typography role="status" aria-live="polite" variant="caption" sx={{ color: props.dirty ? '#816729' : 'text.secondary', fontWeight: props.dirty ? 700 : 400 }}>
          {props.dirty ? 'Unsaved changes' : props.version > 0 ? 'Saved' : 'Not saved'}{!props.writable && !props.busy ? ' · Read only' : ''}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button size="small" startIcon={<LinkOutlined />} endIcon={<ExpandMore sx={{ transform: props.sourcesExpanded ? 'rotate(180deg)' : undefined }} />} aria-expanded={props.sourcesExpanded} aria-controls="cp-source-panel" onClick={props.onToggleSources}>
          {props.baselines.length ? `Sources (${props.baselines.length})` : 'Link sources'}
        </Button>
        <Tooltip title="Requirement profile information">
          <IconButton size="small" aria-label="Requirement profile information" aria-expanded={!!infoAnchor} onClick={e => setInfoAnchor(e.currentTarget)}><InfoOutlined fontSize="small" /></IconButton>
        </Tooltip>
      </Stack>

      <Collapse in={props.sourcesExpanded}>
        <Box id="cp-source-panel" sx={{ p: 1.25, mb: 1, bgcolor: '#f5f6ef', borderRadius: 1.5, border: '1px solid #e3e4db' }}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <TextField size="small" select label="Source revision" value={props.sourceRevisionId} onChange={e => props.onSourceChange(e.target.value)} sx={{ width: { xs: '100%', sm: 250 }, maxWidth: '100%' }}>
              {props.sources.map(source => <MenuItem key={source.id} value={source.id}>{source.type} · {source.revisionNumber} · {statusLabel(source.status)}</MenuItem>)}
            </TextField>
            <Button size="small" variant="outlined" disabled={!props.writable || savedActionsDisabled || !props.sourceRevisionId} onClick={props.onPreview}>Preview changes</Button>
            <Typography variant="caption" color="text.secondary">{props.dirty ? 'Save your changes before comparing sources.' : 'Preview and review source changes before applying.'}</Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', overflowWrap: 'anywhere' }}>
            Baselines: {props.baselines.length ? props.baselines.map(baseline => {
              const source = props.sources.find(item => item.id === baseline.revisionId);
              return `${baseline.type} · ${source?.revisionNumber ?? baseline.revisionId}`;
            }).join('; ') : 'None selected'}
          </Typography>
        </Box>
      </Collapse>

      <Menu id="cp-export-menu" anchorEl={exportAnchor} open={!!exportAnchor} onClose={() => setExportAnchor(null)}>
        <MenuItem onClick={() => run(() => setExportAnchor(null), props.onExportXlsx)}>Excel workbook (.xlsx)</MenuItem>
        <MenuItem disabled={props.exportingPdf || savedActionsDisabled} onClick={() => run(() => setExportAnchor(null), props.onExportPdf)}>PDF document</MenuItem>
        <MenuItem onClick={() => run(() => setExportAnchor(null), props.onExportJson)}>JSON document</MenuItem>
        <Divider />
        <MenuItem onClick={() => run(() => setExportAnchor(null), props.onPrint)}>Print view</MenuItem>
      </Menu>
      <Menu id="cp-review-menu" anchorEl={reviewAnchor} open={!!reviewAnchor} onClose={() => setReviewAnchor(null)}>
        <MenuItem disabled={savedActionsDisabled || props.validating} onClick={() => run(() => setReviewAnchor(null), props.onValidate)}>{props.validating ? 'Validating…' : 'Validate profile'}</MenuItem>
        <MenuItem disabled={savedActionsDisabled} onClick={() => run(() => setReviewAnchor(null), props.onReadiness)}>Check revision readiness</MenuItem>
        {props.canSubmit && <MenuItem disabled={savedActionsDisabled} onClick={() => run(() => setReviewAnchor(null), props.onSubmit)}>Submit for review</MenuItem>}
        {props.canApprove && <MenuItem disabled={savedActionsDisabled} onClick={() => run(() => setReviewAnchor(null), props.onApprove)}>Approve plan</MenuItem>}
        {props.canReviewDecision && <MenuItem disabled={savedActionsDisabled} onClick={() => run(() => setReviewAnchor(null), props.onReviewDecision)}>Review decision</MenuItem>}
      </Menu>
      <Menu id="cp-options-menu" anchorEl={moreAnchor} open={!!moreAnchor} onClose={() => setMoreAnchor(null)}>
        <MenuItem onClick={() => run(() => setMoreAnchor(null), props.onDetails)}>Plan details</MenuItem>
        {props.canEdit && <MenuItem disabled={!props.canFork || props.dirty || props.busy} onClick={() => run(() => setMoreAnchor(null), props.onFork)}>New phase / revision</MenuItem>}
        {props.canEdit && <MenuItem component="label" disabled={!props.writable || props.busy}>
          Import document
          <input type="file" hidden accept=".json,.xlsx" onChange={event => {
            const file = event.target.files?.[0];
            setMoreAnchor(null);
            if (file) props.onImport(file);
            event.target.value = '';
          }} />
        </MenuItem>}
        <Divider />
        <MenuItem disabled={props.busy} onClick={() => run(() => setMoreAnchor(null), props.onReload)}>Reload saved revision</MenuItem>
      </Menu>
      <Popover open={!!infoAnchor} anchorEl={infoAnchor} onClose={() => setInfoAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Box sx={{ p: 2, maxWidth: 340 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Requirement profile</Typography>
          <Typography variant="body2">Automotive baseline. Customer requirements must be configured explicitly. Complete handbook conformity has not been independently verified.</Typography>
        </Box>
      </Popover>
    </Box>
  );
}
