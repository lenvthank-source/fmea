import React, { useState, useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Checkbox,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
  Stack,
  RadioGroup,
  FormControlLabel as FCL,
  Radio,
  TablePagination,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  AutoAwesome as AutoMapIcon,
  Edit as EditIcon,
  CheckCircle as SaveIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  SelectAll as AddIcon,
  Deselect as RemoveIcon,
} from '@mui/icons-material';
import { dialogSelectMenuProps } from '../../../theme/muiSelectConfig';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export type PfmeaFieldKey =
  | 'processStep'
  | 'workElementName'
  | 'function'
  | 'failureMode'
  | 'failureEffect'
  | 'severity'
  | 'failureCause'
  | 'preventionControl'
  | 'occurrence'
  | 'detectionControl'
  | 'detection'
  | 'ap'
  | 'filterCode'
  | 'preventionAction'
  | 'detectionAction'
  | 'responsibilityTargetDate'
  | 'actionTakenCompletionDate'
  | 'revisedSeverity'
  | 'revisedOccurrence'
  | 'revisedDetection'
  | 'revisedAp'
  | 'status'
  | 'notes';

export interface ColumnMapping {
  [excelHeader: string]: PfmeaFieldKey | 'ignore';
}

export interface ParsedRow {
  [excelHeader: string]: string;
}

export interface DraftPfmeaRow {
  include: boolean;
  processStep: string;
  workElementName: string;
  function: string;
  failureMode: string;
  failureEffect: string;
  severity: number | null;
  failureCause: string;
  preventionControl: string;
  occurrence: number | null;
  detectionControl: string;
  detection: number | null;
  ap: string | null;
  filterCode: string;
  preventionAction: string;
  detectionAction: string;
  responsibility: string;
  targetDate: string;
  actionTaken: string;
  completionDate: string;
  revisedSeverity: number | null;
  revisedOccurrence: number | null;
  revisedDetection: number | null;
  revisedAp: string | null;
  status: string;
  notes: string;
  rawData: ParsedRow;
}

export interface PfmeaDiffResult {
  status: 'new' | 'update' | 'unchanged';
  draftRow?: DraftPfmeaRow;
  existingRowId?: string;
  fieldDiffs?: { field: string; old: string; new: string }[];
}

const FIELD_OPTIONS: { value: PfmeaFieldKey | 'ignore'; label: string }[] = [
  { value: 'processStep', label: '1. Structure / Process Step' },
  { value: 'workElementName', label: '1. Work Element (4M)' },
  { value: 'function', label: '2. Function / Requirement' },
  { value: 'failureMode', label: '3. Failure Mode' },
  { value: 'failureEffect', label: '3. Potential Effects' },
  { value: 'severity', label: '3. Severity (SEV 1-10)' },
  { value: 'failureCause', label: '3. Failure Causes' },
  { value: 'preventionControl', label: '4. Prevention Control' },
  { value: 'occurrence', label: '4. Occurrence (OCC 1-10)' },
  { value: 'detectionControl', label: '4. Detection Control' },
  { value: 'detection', label: '4. Detection (DET 1-10)' },
  { value: 'ap', label: '4. Action Priority (AP)' },
  { value: 'filterCode', label: '4. Filter Code / Special Char' },
  { value: 'preventionAction', label: '5. Prevention Action' },
  { value: 'detectionAction', label: '5. Detection Action' },
  { value: 'responsibilityTargetDate', label: '5. Responsibility & Target Date' },
  { value: 'actionTakenCompletionDate', label: '5. Action Taken & Date' },
  { value: 'revisedSeverity', label: '5. Revised SEV (1-10)' },
  { value: 'revisedOccurrence', label: '5. Revised OCC (1-10)' },
  { value: 'revisedDetection', label: '5. Revised DET (1-10)' },
  { value: 'revisedAp', label: '5. Revised AP' },
  { value: 'status', label: '5. Status' },
  { value: 'notes', label: '5. Remarks / Notes' },
  { value: 'ignore', label: '— Ignore —' },
];

const EXACT_HEADER_SYNONYMS: Record<PfmeaFieldKey, string[]> = {
  processStep: [
    'structure item',
    'structure / item',
    'structure/item',
    'process step',
    'operation',
    'operation description',
    'step name',
    'process item',
  ],
  workElementName: ['work element', '4m', 'man machine material', 'work element 4m'],
  function: [
    'function requirement focus element',
    'function / requirement focus element',
    'function requirement',
    'process function',
    'function',
    'requirement',
    'product characteristic focus element',
  ],
  failureMode: [
    'failure mode',
    'potential failure mode',
    'failure mode focus element',
    'failure mode / focus element',
  ],
  failureEffect: [
    'potential effects next higher element',
    'potential effects',
    'failure effect',
    'failure effects',
    'potential failure effects',
  ],
  severity: ['sev', 'severity', 's rating', 'severity rating'],
  failureCause: [
    'failure causes next lower element',
    'failure causes',
    'failure cause',
    'potential causes',
    'cause',
  ],
  preventionControl: [
    'current control prevention',
    'current prevention control',
    'prevention control',
    'prevention controls',
  ],
  occurrence: ['occ', 'occurrence', 'o rating', 'occurrence rating'],
  detectionControl: [
    'current control detection',
    'current detection control',
    'detection control',
    'detection controls',
  ],
  detection: ['det', 'detection', 'd rating', 'detection rating'],
  ap: ['ap', 'action priority'],
  filterCode: ['fc', 'filter code', 'classification', 'special char', 'class'],
  preventionAction: ['prevention action', 'preventive action', 'proposed prevention action'],
  detectionAction: ['detection action', 'proposed detection action'],
  responsibilityTargetDate: [
    'responsibility and target date',
    'responsibility target date',
    'responsibility & target date',
    'resp & target date',
    'responsibility',
    'target date',
  ],
  actionTakenCompletionDate: [
    'action taken and completion date',
    'action taken completion date',
    'action taken & completion date',
    'action taken',
    'completion date',
  ],
  revisedSeverity: ['sev revised', 'revised sev', 'after sev', 'sev after', 'revised s'],
  revisedOccurrence: ['occ revised', 'revised occ', 'after occ', 'occ after', 'revised o'],
  revisedDetection: ['det revised', 'revised det', 'after det', 'det after', 'revised d'],
  revisedAp: ['ap revised', 'revised ap', 'after ap', 'ap after'],
  status: ['status', 'action status', 'row status'],
  notes: ['remarks', 'notes', 'comments', 'remark'],
};

function normalizeHeader(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\s\/_]+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
}

function autoMapHeader(header: string): { target: PfmeaFieldKey | 'ignore'; confidence: 'auto' | 'manual' } {
  const norm = normalizeHeader(header);
  for (const [field, synonyms] of Object.entries(EXACT_HEADER_SYNONYMS)) {
    if (synonyms.some((s) => normalizeHeader(s) === norm)) {
      return { target: field as PfmeaFieldKey, confidence: 'auto' };
    }
  }
  return { target: 'ignore' as const, confidence: 'manual' };
}

function extractDateAndText(val: string): { text: string; date: string } {
  const trimmed = (val || '').trim();
  if (!trimmed) return { text: '', date: '' };
  const dateMatch = trimmed.match(/(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/);
  if (dateMatch) {
    const date = dateMatch[1];
    const text = trimmed.replace(date, '').replace(/[\n\r,;-]+/g, ' ').trim();
    return { text, date };
  }
  return { text: trimmed, date: '' };
}

interface PfmeaExcelImportWizardProps {
  open: boolean;
  onClose: () => void;
  revisionId: string;
  onImportSuccess: () => void;
  token: string | null;
}

export const PfmeaExcelImportWizard: React.FC<PfmeaExcelImportWizardProps> = ({
  open,
  onClose,
  revisionId,
  onImportSuccess,
  token,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<{ headers: string[]; rows: ParsedRow[] } | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [mode, setMode] = useState<'build' | 'update'>('build');
  const [draftRows, setDraftRows] = useState<DraftPfmeaRow[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number; status: string }>({ current: 0, total: 0, status: '' });
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const stepLabels = ['Upload File', 'Map Columns', 'Select Rows', 'Diff Preview', 'Import'];

  const resetState = () => {
    setActiveStep(0);
    setFile(null);
    setParsedData(null);
    setColumnMapping({});
    setDraftRows([]);
    setSelectedRows(new Set());
    setImporting(false);
    setError(null);
    setPage(0);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // 1. File Upload & Parse
  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const processFile = async (f: File) => {
    setFile(f);
    setError(null);
    try {
      const rows: ParsedRow[] = [];

      const arrayBuffer = await f.arrayBuffer();

      // Read workbook using XLSX (SheetJS)
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const rawRows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' });
      if (!rawRows || rawRows.length === 0) {
        throw new Error('Excel sheet is empty');
      }

      // Scan rows to find best candidate header row
      let headerRowIndex = 0;
      let maxKeywordMatches = 0;
      const keywords = ['structure', 'function', 'failure', 'mode', 'effect', 'cause', 'sev', 'occ', 'det', 'prevention', 'detection', 'ap'];

      for (let r = 0; r < Math.min(15, rawRows.length); r++) {
        const row = rawRows[r];
        if (!Array.isArray(row)) continue;
        const rowStr = row.map((c) => String(c).toLowerCase()).join(' ');
        const matches = keywords.filter((k) => rowStr.includes(k)).length;
        if (matches > maxKeywordMatches) {
          maxKeywordMatches = matches;
          headerRowIndex = r;
        }
      }

      const rawHeaders = (rawRows[headerRowIndex] || []).map((h: any, idx: number) => {
        const s = String(h || '').trim();
        return s || `Column_${idx + 1}`;
      });

      // Filter non-empty unique headers
      const cleanHeaders: string[] = [];
      const colIndices: number[] = [];
      rawHeaders.forEach((h: string, idx: number) => {
        let name = h;
        let count = 1;
        while (cleanHeaders.includes(name)) {
          name = `${h}_${count++}`;
        }
        cleanHeaders.push(name);
        colIndices.push(idx);
      });

      // Parse data rows with forward-fill for merged parent cells
      let lastProcessStep = '';
      let lastFunction = '';
      let lastFailureMode = '';
      let lastFailureEffect = '';
      let lastSeverity: any = null;

      for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
        const rowData = rawRows[r];
        if (!Array.isArray(rowData)) continue;
        const isBlank = rowData.every((c) => String(c || '').trim() === '');
        if (isBlank) continue;

        const rowObj: ParsedRow = {};
        colIndices.forEach((colIdx, hIdx) => {
          rowObj[cleanHeaders[hIdx]] = String(rowData[colIdx] || '').trim();
        });

        // Forward fill logic
        const pStepHeader = cleanHeaders.find((h) => autoMapHeader(h).target === 'processStep');
        const fnHeader = cleanHeaders.find((h) => autoMapHeader(h).target === 'function');
        const fmHeader = cleanHeaders.find((h) => autoMapHeader(h).target === 'failureMode');
        const feHeader = cleanHeaders.find((h) => autoMapHeader(h).target === 'failureEffect');
        const sevHeader = cleanHeaders.find((h) => autoMapHeader(h).target === 'severity');

        if (pStepHeader) {
          if (rowObj[pStepHeader]) lastProcessStep = rowObj[pStepHeader];
          else if (lastProcessStep) rowObj[pStepHeader] = lastProcessStep;
        }
        if (fnHeader) {
          if (rowObj[fnHeader]) lastFunction = rowObj[fnHeader];
          else if (lastFunction) rowObj[fnHeader] = lastFunction;
        }
        if (fmHeader) {
          if (rowObj[fmHeader]) lastFailureMode = rowObj[fmHeader];
          else if (lastFailureMode) rowObj[fmHeader] = lastFailureMode;
        }
        if (feHeader) {
          if (rowObj[feHeader]) lastFailureEffect = rowObj[feHeader];
          else if (lastFailureEffect) rowObj[feHeader] = lastFailureEffect;
        }
        if (sevHeader) {
          if (rowObj[sevHeader]) lastSeverity = rowObj[sevHeader];
          else if (lastSeverity) rowObj[sevHeader] = lastSeverity;
        }

        rows.push(rowObj);
      }

      if (rows.length === 0) {
        throw new Error('No data rows found below header row');
      }

      setParsedData({ headers: cleanHeaders, rows });

      // Auto map
      const autoMap: ColumnMapping = {};
      for (const h of cleanHeaders) {
        autoMap[h] = autoMapHeader(h).target;
      }
      setColumnMapping(autoMap);
    } catch (err: any) {
      console.error('PFMEA parse error:', err);
      setError(err.message || 'Failed to parse Excel file');
      setActiveStep(0);
    }
  };

  const handleMappingChange = (header: string, val: PfmeaFieldKey | 'ignore') => {
    setColumnMapping((prev) => ({ ...prev, [header]: val }));
  };

  // Build draft rows from parsedData and columnMapping
  const buildDraftRows = useCallback(() => {
    if (!parsedData) return;
    const { headers, rows } = parsedData;

    const draftList: DraftPfmeaRow[] = rows.map((row) => {
      const draft: DraftPfmeaRow = {
        include: true,
        processStep: '',
        workElementName: '',
        function: '',
        failureMode: '',
        failureEffect: '',
        severity: null,
        failureCause: '',
        preventionControl: '',
        occurrence: null,
        detectionControl: '',
        detection: null,
        ap: null,
        filterCode: '',
        preventionAction: '',
        detectionAction: '',
        responsibility: '',
        targetDate: '',
        actionTaken: '',
        completionDate: '',
        revisedSeverity: null,
        revisedOccurrence: null,
        revisedDetection: null,
        revisedAp: null,
        status: 'Open',
        notes: '',
        rawData: row,
      };

      for (const h of headers) {
        const target = columnMapping[h];
        const val = (row[h] || '').trim();
        if (!val || target === 'ignore') continue;

        switch (target) {
          case 'processStep':
            draft.processStep = val;
            break;
          case 'workElementName':
            draft.workElementName = val;
            break;
          case 'function':
            draft.function = val;
            break;
          case 'failureMode':
            draft.failureMode = val;
            break;
          case 'failureEffect':
            draft.failureEffect = val;
            break;
          case 'severity':
            draft.severity = parseInt(val, 10) || null;
            break;
          case 'failureCause':
            draft.failureCause = val;
            break;
          case 'preventionControl':
            draft.preventionControl = val;
            break;
          case 'occurrence':
            draft.occurrence = parseInt(val, 10) || null;
            break;
          case 'detectionControl':
            draft.detectionControl = val;
            break;
          case 'detection':
            draft.detection = parseInt(val, 10) || null;
            break;
          case 'ap':
            draft.ap = val.toUpperCase();
            break;
          case 'filterCode':
            draft.filterCode = val;
            break;
          case 'preventionAction':
            draft.preventionAction = val;
            break;
          case 'detectionAction':
            draft.detectionAction = val;
            break;
          case 'responsibilityTargetDate': {
            const { text, date } = extractDateAndText(val);
            draft.responsibility = text;
            draft.targetDate = date;
            break;
          }
          case 'actionTakenCompletionDate': {
            const { text, date } = extractDateAndText(val);
            draft.actionTaken = text;
            draft.completionDate = date;
            break;
          }
          case 'revisedSeverity':
            draft.revisedSeverity = parseInt(val, 10) || null;
            break;
          case 'revisedOccurrence':
            draft.revisedOccurrence = parseInt(val, 10) || null;
            break;
          case 'revisedDetection':
            draft.revisedDetection = parseInt(val, 10) || null;
            break;
          case 'revisedAp':
            draft.revisedAp = val.toUpperCase();
            break;
          case 'status':
            draft.status = val;
            break;
          case 'notes':
            draft.notes = val;
            break;
        }
      }

      return draft;
    });

    // Clean step names if empty
    let nextAutoStep = 10;
    draftList.forEach((r) => {
      if (!r.processStep) {
        r.processStep = `OP${nextAutoStep}`;
        nextAutoStep += 10;
      }
    });

    setDraftRows(draftList);
    setSelectedRows(new Set(draftList.map((_, i) => i)));
  }, [parsedData, columnMapping]);

  useEffect(() => {
    if (parsedData && activeStep === 2) {
      buildDraftRows();
    }
  }, [parsedData, columnMapping, activeStep, buildDraftRows]);

  const toggleRowSelection = (idx: number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === draftRows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(draftRows.map((_, i) => i)));
    }
  };

  // Import Submission
  const handleImport = async () => {
    if (!revisionId) return;
    const toImport = draftRows.filter((_, i) => selectedRows.has(i));
    if (toImport.length === 0) return;

    setImporting(true);
    setImportProgress({ current: 0, total: toImport.length, status: 'Preparing import payload...' });
    setError(null);

    try {
      const payload = {
        rows: toImport.map((r) => ({
          processStep: r.processStep,
          workElementName: r.workElementName || null,
          function: r.function || null,
          failureMode: r.failureMode || null,
          failureEffect: r.failureEffect || null,
          severity: r.severity,
          failureCause: r.failureCause || null,
          preventionControl: r.preventionControl || null,
          occurrence: r.occurrence,
          detectionControl: r.detectionControl || null,
          detection: r.detection,
          ap: r.ap,
          filterCode: r.filterCode || null,
          preventionAction: r.preventionAction || null,
          detectionAction: r.detectionAction || null,
          responsibility: r.responsibility || null,
          targetDate: r.targetDate || null,
          actionTaken: r.actionTaken || null,
          completionDate: r.completionDate || null,
          revisedSeverity: r.revisedSeverity,
          revisedOccurrence: r.revisedOccurrence,
          revisedDetection: r.revisedDetection,
          revisedAp: r.revisedAp,
          status: r.status || 'Open',
          notes: r.notes || null,
        })),
        mode,
      };

      setImportProgress({ current: 0, total: toImport.length, status: 'Creating & synchronizing PFMEA rows...' });
      const res = await fetch(`${API_BASE_URL}/revisions/${revisionId}/pfmea-rows/batch-import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'PFMEA batch import failed');
      }

      setImportProgress({ current: toImport.length, total: toImport.length, status: 'Done!' });
      setTimeout(() => {
        onImportSuccess();
        handleClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const visibleDraftRows = draftRows.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  const stepContents = [
    // Step 0: Upload File
    (
      <Stack spacing={3} sx={{ alignItems: 'center', justifyContent: 'center', p: 4, flex: 1 }}>
        <Box
          onDrop={handleFileDrop}
          onDragOver={(e) => e.preventDefault()}
          sx={{
            border: '2px dashed #94A3B8',
            borderRadius: 3,
            p: 6,
            width: '100%',
            maxWidth: 600,
            textAlign: 'center',
            bgcolor: '#FFFFFF',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': { borderColor: 'primary.main', bgcolor: '#F0FDF4' },
          }}
          onClick={() => document.getElementById('pfmea-excel-file-input')?.click()}
        >
          <UploadIcon sx={{ fontSize: 56, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
            Drag & Drop your PFMEA Excel file
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Supports AIAG-VDA 2019 format (.xlsx, .xls)
          </Typography>
          <Button variant="contained" component="span" sx={{ fontWeight: 700 }}>
            Browse File
          </Button>
          <input id="pfmea-excel-file-input" type="file" accept=".xlsx,.xls" hidden onChange={handleFileInput} />
        </Box>
        {file && (
          <Alert severity="success" sx={{ width: '100%', maxWidth: 600, fontWeight: 600 }}>
            {file.name} ({Math.round(file.size / 1024)} KB) — Ready to map columns
          </Alert>
        )}
      </Stack>
    ),

    // Step 1: Map Columns
    (
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>
            Map Excel columns to 22 AIAG-VDA PFMEA fields. Forward-fill handles merged rows automatically.
          </Typography>
        </Box>
        {parsedData && (
          <TableContainer component={Paper} variant="outlined" sx={{ flex: 1, maxHeight: 'calc(92vh - 240px)', overflow: 'auto', borderRadius: 2, border: '1px solid #CBD5E1' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow sx={{ bgcolor: '#F1F5F9' }}>
                  <TableCell sx={{ minWidth: 280, fontWeight: 700, bgcolor: '#F1F5F9', borderRight: '1px solid #CBD5E1' }}>Excel Header (Detected)</TableCell>
                  <TableCell sx={{ minWidth: 280, fontWeight: 700, bgcolor: '#F1F5F9', borderRight: '1px solid #CBD5E1' }}>Map to PFMEA Field</TableCell>
                  <TableCell sx={{ width: 90, fontWeight: 700, bgcolor: '#F1F5F9', textAlign: 'center' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {parsedData.headers.map((h) => {
                  const { confidence } = autoMapHeader(h);
                  return (
                    <TableRow key={h} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                      <TableCell sx={{ borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>{h}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>Sample: {parsedData.rows[0]?.[h] || '—'}</Typography>
                      </TableCell>
                      <TableCell sx={{ borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
                        <FormControl size="small" fullWidth sx={{ minWidth: 240 }}>
                          <Select
                            value={columnMapping[h] || 'ignore'}
                            onChange={(e) => handleMappingChange(h, e.target.value as PfmeaFieldKey | 'ignore')}
                            MenuProps={{ ...dialogSelectMenuProps, autoFocus: false, disableAutoFocusItem: true }}
                          >
                            {FIELD_OPTIONS.map((opt) => (
                              <MenuItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell align="center" sx={{ borderBottom: '1px solid #E2E8F0' }}>
                        <Chip
                          label={confidence === 'auto' ? 'Auto' : 'Manual'}
                          size="small"
                          color={confidence === 'auto' ? 'success' : 'default'}
                          variant="outlined"
                          icon={confidence === 'auto' ? <AutoMapIcon fontSize="small" /> : <EditIcon fontSize="small" />}
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    ),

    // Step 2: Select Rows
    (
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        {error && <Alert severity="error" sx={{ mb: 1, py: 0.5 }}>{error}</Alert>}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <RadioGroup value={mode} onChange={(e) => setMode(e.target.value as 'build' | 'update')} row>
              <FCL value="build" control={<Radio size="small" />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Build New PFMEA</Typography>} />
              <FCL value="update" control={<Radio size="small" />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Append / Update Existing</Typography>} />
            </RadioGroup>
            <Chip label={`${selectedRows.size} of ${draftRows.length} rows selected`} size="small" sx={{ fontWeight: 700, bgcolor: '#EFF6FF', color: '#1D4ED8' }} />
          </Stack>
          <Button
            variant="outlined"
            size="small"
            onClick={toggleSelectAll}
            startIcon={selectedRows.size === draftRows.length ? <RemoveIcon /> : <AddIcon />}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {selectedRows.size === draftRows.length ? 'Deselect All' : 'Select All'}
          </Button>
        </Box>
        {draftRows.length > 0 && (
          <TableContainer component={Paper} variant="outlined" sx={{ flex: 1, maxHeight: 'calc(92vh - 240px)', overflow: 'auto', borderRadius: 2, border: '1px solid #CBD5E1' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow sx={{ bgcolor: '#F1F5F9' }}>
                  <TableCell sx={{ width: 50, borderRight: '1px solid #CBD5E1', borderBottom: '2px solid #CBD5E1', bgcolor: '#F1F5F9' }}>
                    <Checkbox
                      checked={draftRows.length > 0 && selectedRows.size === draftRows.length}
                      indeterminate={selectedRows.size > 0 && selectedRows.size < draftRows.length}
                      onChange={toggleSelectAll}
                    />
                  </TableCell>
                  <TableCell sx={{ minWidth: 160, fontWeight: 700, bgcolor: '#F1F5F9', borderRight: '1px solid #CBD5E1' }}>Process Step</TableCell>
                  <TableCell sx={{ minWidth: 200, fontWeight: 700, bgcolor: '#F1F5F9', borderRight: '1px solid #CBD5E1' }}>Function</TableCell>
                  <TableCell sx={{ minWidth: 180, fontWeight: 700, bgcolor: '#F1F5F9', borderRight: '1px solid #CBD5E1' }}>Failure Mode</TableCell>
                  <TableCell sx={{ minWidth: 180, fontWeight: 700, bgcolor: '#F1F5F9', borderRight: '1px solid #CBD5E1' }}>Potential Effect</TableCell>
                  <TableCell sx={{ width: 60, fontWeight: 700, bgcolor: '#F1F5F9', textAlign: 'center', borderRight: '1px solid #CBD5E1' }}>S</TableCell>
                  <TableCell sx={{ minWidth: 180, fontWeight: 700, bgcolor: '#F1F5F9', borderRight: '1px solid #CBD5E1' }}>Failure Cause</TableCell>
                  <TableCell sx={{ minWidth: 160, fontWeight: 700, bgcolor: '#F1F5F9', borderRight: '1px solid #CBD5E1' }}>Prevention Ctrl</TableCell>
                  <TableCell sx={{ width: 60, fontWeight: 700, bgcolor: '#F1F5F9', textAlign: 'center', borderRight: '1px solid #CBD5E1' }}>O</TableCell>
                  <TableCell sx={{ minWidth: 160, fontWeight: 700, bgcolor: '#F1F5F9', borderRight: '1px solid #CBD5E1' }}>Detection Ctrl</TableCell>
                  <TableCell sx={{ width: 60, fontWeight: 700, bgcolor: '#F1F5F9', textAlign: 'center', borderRight: '1px solid #CBD5E1' }}>D</TableCell>
                  <TableCell sx={{ width: 60, fontWeight: 700, bgcolor: '#F1F5F9', textAlign: 'center', borderRight: '1px solid #CBD5E1' }}>AP</TableCell>
                  <TableCell sx={{ minWidth: 160, fontWeight: 700, bgcolor: '#F1F5F9', borderRight: '1px solid #CBD5E1' }}>Prevention Action</TableCell>
                  <TableCell sx={{ minWidth: 140, fontWeight: 700, bgcolor: '#F1F5F9', borderRight: '1px solid #CBD5E1' }}>Responsibility & Date</TableCell>
                  <TableCell sx={{ minWidth: 90, fontWeight: 700, bgcolor: '#F1F5F9' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleDraftRows.map((row, idx) => {
                  const globalIdx = idx + page * rowsPerPage;
                  const isSelected = selectedRows.has(globalIdx);
                  return (
                    <TableRow key={globalIdx} hover selected={isSelected} onClick={() => toggleRowSelection(globalIdx)} sx={{ cursor: 'pointer' }}>
                      <TableCell sx={{ borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
                        <Checkbox checked={isSelected} onClick={(e) => e.stopPropagation()} />
                      </TableCell>
                      <TableCell sx={{ borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>{row.processStep || '—'}</Typography>
                      </TableCell>
                      <TableCell sx={{ borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
                        <Typography variant="body2">{row.function || '—'}</Typography>
                      </TableCell>
                      <TableCell sx={{ borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#991B1B' }}>{row.failureMode || '—'}</Typography>
                      </TableCell>
                      <TableCell sx={{ borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
                        <Typography variant="body2" color="text.secondary">{row.failureEffect || '—'}</Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.severity ?? '—'}</Typography>
                      </TableCell>
                      <TableCell sx={{ borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
                        <Typography variant="body2" color="text.secondary">{row.failureCause || '—'}</Typography>
                      </TableCell>
                      <TableCell sx={{ borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
                        <Typography variant="body2" color="text.secondary">{row.preventionControl || '—'}</Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.occurrence ?? '—'}</Typography>
                      </TableCell>
                      <TableCell sx={{ borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
                        <Typography variant="body2" color="text.secondary">{row.detectionControl || '—'}</Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.detection ?? '—'}</Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
                        {row.ap && (
                          <Chip
                            label={row.ap}
                            size="small"
                            sx={{
                              height: 20,
                              fontWeight: 800,
                              fontSize: '0.7rem',
                              bgcolor: row.ap === 'H' ? '#FEE2E2' : row.ap === 'M' ? '#FEF3C7' : '#DCFCE7',
                              color: row.ap === 'H' ? '#DC2626' : row.ap === 'M' ? '#D97706' : '#16A34A',
                            }}
                          />
                        )}
                        {!row.ap && '—'}
                      </TableCell>
                      <TableCell sx={{ borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
                        <Typography variant="body2">{row.preventionAction || '—'}</Typography>
                      </TableCell>
                      <TableCell sx={{ borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                          {row.responsibility ? `${row.responsibility} ${row.targetDate ? `(${row.targetDate})` : ''}` : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #E2E8F0' }}>
                        <Chip label={row.status || 'Open'} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.75rem' }} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <TablePagination
          component="div"
          count={draftRows.length}
          page={page}
          onPageChange={(_: unknown, p: number) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[25, 50, 100]}
          sx={{ borderTop: '1px solid #E2E8F0', minHeight: 40 }}
        />
      </Box>
    ),

    // Step 3: Diff Preview (Summary)
    (
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>Import Summary:</Typography>
            <Chip label={`${draftRows.filter((_, i) => selectedRows.has(i)).length} rows ready for import`} color="primary" sx={{ fontWeight: 700 }} />
          </Stack>
        </Box>
        <TableContainer component={Paper} variant="outlined" sx={{ flex: 1, maxHeight: 'calc(92vh - 240px)', overflow: 'auto', borderRadius: 2, border: '1px solid #CBD5E1' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F1F5F9' }}>
                <TableCell sx={{ fontWeight: 700, color: '#0F172A', bgcolor: '#F1F5F9', borderRight: '1px solid #CBD5E1' }}>Process Step</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#0F172A', bgcolor: '#F1F5F9', borderRight: '1px solid #CBD5E1' }}>Function</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#0F172A', bgcolor: '#F1F5F9', borderRight: '1px solid #CBD5E1' }}>Failure Mode</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#0F172A', bgcolor: '#F1F5F9', borderRight: '1px solid #CBD5E1' }}>Cause</TableCell>
                <TableCell sx={{ width: 60, fontWeight: 700, color: '#0F172A', bgcolor: '#F1F5F9', textAlign: 'center', borderRight: '1px solid #CBD5E1' }}>S</TableCell>
                <TableCell sx={{ width: 60, fontWeight: 700, color: '#0F172A', bgcolor: '#F1F5F9', textAlign: 'center', borderRight: '1px solid #CBD5E1' }}>O</TableCell>
                <TableCell sx={{ width: 60, fontWeight: 700, color: '#0F172A', bgcolor: '#F1F5F9', textAlign: 'center', borderRight: '1px solid #CBD5E1' }}>D</TableCell>
                <TableCell sx={{ width: 60, fontWeight: 700, color: '#0F172A', bgcolor: '#F1F5F9', textAlign: 'center' }}>AP</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {draftRows.filter((_, i) => selectedRows.has(i)).slice(0, 100).map((r, idx) => (
                <TableRow key={idx} hover>
                  <TableCell sx={{ borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}><Typography variant="body2" sx={{ fontWeight: 700 }}>{r.processStep}</Typography></TableCell>
                  <TableCell sx={{ borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}><Typography variant="body2">{r.function}</Typography></TableCell>
                  <TableCell sx={{ borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}><Typography variant="body2" sx={{ fontWeight: 600, color: '#991B1B' }}>{r.failureMode}</Typography></TableCell>
                  <TableCell sx={{ borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}><Typography variant="body2">{r.failureCause}</Typography></TableCell>
                  <TableCell align="center" sx={{ borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>{r.severity ?? '—'}</TableCell>
                  <TableCell align="center" sx={{ borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>{r.occurrence ?? '—'}</TableCell>
                  <TableCell align="center" sx={{ borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>{r.detection ?? '—'}</TableCell>
                  <TableCell align="center" sx={{ borderBottom: '1px solid #E2E8F0' }}>
                    {r.ap ? (
                      <Chip
                        label={r.ap}
                        size="small"
                        sx={{
                          height: 20,
                          fontWeight: 800,
                          fontSize: '0.7rem',
                          bgcolor: r.ap === 'H' ? '#FEE2E2' : r.ap === 'M' ? '#FEF3C7' : '#DCFCE7',
                          color: r.ap === 'H' ? '#DC2626' : r.ap === 'M' ? '#D97706' : '#16A34A',
                        }}
                      />
                    ) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    ),

    // Step 4: Import
    (
      <Stack spacing={3} sx={{ mt: 4, alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <CircularProgress size={80} variant="determinate" value={importing ? (importProgress.current / importProgress.total) * 100 : 0} thickness={6} />
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center', fontWeight: 700 }}>
          {importing ? `Importing... ${importProgress.current} / ${importProgress.total}` : 'Ready to Import'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          {importing ? importProgress.status : `${draftRows.filter((_, i) => selectedRows.has(i)).length} PFMEA rows selected for import`}
        </Typography>
        {!importing && (
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button variant="outlined" onClick={handleClose} disabled={importing}>Cancel</Button>
            <Button
              variant="contained"
              size="large"
              startIcon={<SaveIcon />}
              onClick={handleImport}
              disabled={selectedRows.size === 0 || importing}
              sx={{ fontWeight: 700, px: 4 }}
            >
              Apply Import
            </Button>
          </Stack>
        )}
        {importing && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{importProgress.status}</Typography>}
      </Stack>
    ),
  ];

  function canProceed(step: number): boolean {
    switch (step) {
      case 0: return !!file && parsedData !== null;
      case 1: return parsedData !== null;
      case 2: return draftRows.length > 0 && selectedRows.size > 0;
      case 3: return selectedRows.size > 0;
      default: return true;
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      fullWidth
      sx={{ '& .MuiDialog-paper': { width: '96vw', maxWidth: '1600px', height: '92vh', maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' } }}
    >
      <DialogTitle sx={{ fontWeight: 'bold', px: 3, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <UploadIcon sx={{ color: 'primary.main', fontSize: '1.4rem' }} />
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.2rem' }}>
            Import PFMEA from Excel (AIAG-VDA 2019)
          </Typography>
        </Stack>
        {activeStep >= 2 && (
          <Chip label={mode === 'build' ? 'Build New' : 'Append / Update'} color="primary" size="small" variant="outlined" sx={{ fontWeight: 700, bgcolor: '#FFFFFF' }} />
        )}
      </DialogTitle>
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', bgcolor: '#F8FAFC' }}>
        {error && <Alert severity="error" sx={{ m: 1.5, py: 0.5 }}>{error}</Alert>}
        <Box sx={{ px: 3, pt: 1.5, pb: 1, borderBottom: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 0 }}>
            {stepLabels.map((label, idx) => (
              <Step key={idx} completed={idx < activeStep}>
                <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: '0.8rem', mt: 0.25 } }}>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
        <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {stepContents[activeStep]}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5, borderTop: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
        {activeStep > 0 && (
          <Button onClick={() => setActiveStep(activeStep - 1)} startIcon={<ArrowBackIcon />} disabled={importing}>
            Back
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        {activeStep < stepLabels.length - 1 && !importing && (
          <Button onClick={() => setActiveStep(activeStep + 1)} endIcon={<ArrowForwardIcon />} disabled={importing || !canProceed(activeStep)}>
            Next
          </Button>
        )}
        {activeStep === stepLabels.length - 1 && !importing && selectedRows.size > 0 && (
          <Button
            variant="contained"
            size="large"
            startIcon={<SaveIcon />}
            onClick={handleImport}
            sx={{ fontWeight: 700 }}
          >
            Apply Import
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
