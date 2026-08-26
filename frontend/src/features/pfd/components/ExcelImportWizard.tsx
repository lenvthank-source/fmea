import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  Alert,
  FormControl,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel as FCL,
  RadioGroup,
  Radio,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  Paper,
  Chip,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Download as DownloadIcon,
  AutoAwesome as AutoMapIcon,
  Visibility as PreviewIcon,
  Save as SaveIcon,
  Info as InfoIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { API_BASE_URL } from '../../../config';
import { getPfdIconMeta } from '../utils/pfdIconMap';

interface ProcessStep {
  id: string;
  stepNumber: string;
  name: string;
  stepType: string;
  incomingVariation?: string[];
  specialCharacteristics?: string;
  flowIcons?: Record<string, boolean>;
  machinesEquipmentDocs?: string[];
  desiredOutcome?: string | string[];
  processCharacteristics?: string | string[];
}

type PfdFieldKey = 
  | 'stepNumberName' 
  | 'incomingVariation' 
  | 'specialCharacteristics' 
  | 'flowIcon:trans'
  | 'flowIcon:recArea'
  | 'flowIcon:store'
  | 'flowIcon:wip'
  | 'flowIcon:oper'
  | 'flowIcon:insp'
  | 'flowIcon:decs'
  | 'flowIcon:rework'
  | 'flowIcon:reject'
  | 'machinesEquipmentDocs'
  | 'desiredOutcome'
  | 'processCharacteristics';

interface ColumnMapping {
  [excelHeader: string]: PfdFieldKey | 'ignore';
}

interface ParsedRow {
  [excelHeader: string]: string;
}

interface DraftStep {
  include: boolean;
  stepNumber: string;
  name: string;
  incomingVariation: string;  // multiline string
  specialCharacteristics: string;
  flowIcons: Record<string, boolean>;
  machinesEquipmentDocs: string;  // multiline string
  desiredOutcome: string;  // multiline string
  processCharacteristics: string;  // multiline string
  rawData: ParsedRow;  // original for reference
}

interface DiffResult {
  status: 'new' | 'update' | 'unchanged' | 'missing';
  draftStep?: DraftStep;
  existingStep?: ProcessStep;
  fieldDiffs?: { field: string; old: string; new: string }[];
}

const FIELD_OPTIONS: { value: PfdFieldKey | 'ignore'; label: string }[] = [
  { value: 'stepNumberName', label: 'Step # & Name (split)' },
  { value: 'incomingVariation', label: 'Incoming Source of Variation' },
  { value: 'specialCharacteristics', label: 'Special Char. Class' },
  { value: 'flowIcon:trans', label: 'Flow: TRANS. (⇨)' },
  { value: 'flowIcon:recArea', label: 'Flow: STORE Rec. Area (▼)' },
  { value: 'flowIcon:store', label: 'Flow: STORE Main (▼)' },
  { value: 'flowIcon:wip', label: 'Flow: WIP @Line (▲)' },
  { value: 'flowIcon:oper', label: 'Flow: OPER. (◯)' },
  { value: 'flowIcon:insp', label: 'Flow: INSP. (□)' },
  { value: 'flowIcon:decs', label: 'Flow: DECS. (◇)' },
  { value: 'flowIcon:rework', label: 'Flow: REWORK (Ⓡ)' },
  { value: 'flowIcon:reject', label: 'Flow: REJECT (✕)' },
  { value: 'machinesEquipmentDocs', label: 'Machines / Equipment / Docs' },
  { value: 'desiredOutcome', label: 'Desired Outcome / Product Chars' },
  { value: 'processCharacteristics', label: 'Process Characteristics' },
  { value: 'ignore', label: '— Ignore —' },
];

const EXACT_HEADER_SYNONYMS: Record<PfdFieldKey, string[]> = {
  stepNumberName: [
    'process # & description',
    'process # and description',
    'process #&description',
    'process no & description',
  ],
  incomingVariation: [
    'incoming source of variation',
    'incoming variation',
    'incoming source of variation(s)',
  ],
  specialCharacteristics: [
    'special char. class',
    'special character class',
    'special characteristics class',
    'special char class',
  ],
  'flowIcon:trans': ['trans.', 'trans', 'transport', 'transportation'],
  'flowIcon:recArea': [
    'store recieving area',
    'store receiving area',
    'recieving area',
    'receiving area',
    'rec. area',
  ],
  'flowIcon:store': [
    'store main store',
    'main store',
    'store main',
    'store',
  ],
  'flowIcon:wip': ['wip @line', 'wip @ line', 'wip'],
  'flowIcon:oper': ['oper.', 'oper', 'operation'],
  'flowIcon:insp': ['insp.', 'insp', 'inspection'],
  'flowIcon:decs': ['decs.', 'decs', 'decision'],
  'flowIcon:rework': ['rework'],
  'flowIcon:reject': ['reject'],
  machinesEquipmentDocs: [
    'machine(s) / equipment(s) used/ documents',
    'machines / equipment / docs',
    'machines/equipment/docs',
    'machine(s)/equipment(s)/documents',
    'machines equipment docs',
  ],
  desiredOutcome: [
    'desired outcome / product characteristics',
    'desired outcome/product characteristics',
    'desired outcome',
    'product description / desired outcome',
  ],
  processCharacteristics: ['process characteristics'],
};

function normalizeHeader(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\s\/]+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
}

function autoMapHeader(header: string): { target: PfdFieldKey | 'ignore'; confidence: 'auto' | 'manual' } {
  const norm = normalizeHeader(header);
  for (const [field, synonyms] of Object.entries(EXACT_HEADER_SYNONYMS)) {
    if (synonyms.some((s) => normalizeHeader(s) === norm)) {
      return { target: field as PfdFieldKey, confidence: 'auto' };
    }
  }
  return { target: 'ignore' as const, confidence: 'manual' };
}

function parseStepNumberAndName(cell: string): { stepNumber: string; name: string } {
  const trimmed = cell.trim();
  const match = trimmed.match(/^(\w+\d+)\s+(.+)$/);
  if (match) {
    return { stepNumber: match[1], name: match[2] };
  }
  return { stepNumber: '', name: trimmed };
}

function joinMultiline(arr: string[]): string {
  return arr.filter(Boolean).join('\n');
}

function splitMultiline(str: string): string[] {
  return str.split('\n').map((s) => s.trim()).filter(Boolean);
}

function getFieldValue(step: DraftStep, field: PfdFieldKey): string {
  switch (field) {
    case 'stepNumberName':
      return `${step.stepNumber} ${step.name}`.trim();
    case 'incomingVariation':
      return step.incomingVariation;
    case 'specialCharacteristics':
      return step.specialCharacteristics;
    case 'machinesEquipmentDocs':
      return step.machinesEquipmentDocs;
    case 'desiredOutcome':
      return step.desiredOutcome;
    case 'processCharacteristics':
      return step.processCharacteristics;
    default:
      if (field.startsWith('flowIcon:')) {
        const key = field.split(':')[1];
        return step.flowIcons[key] ? '✓' : '';
      }
      return '';
  }
}

function stepsEqual(a: DraftStep, b: ProcessStep, field: PfdFieldKey): boolean {
  if (field.startsWith('flowIcon:')) {
    const key = field.split(':')[1];
    return !!a.flowIcons[key] === !!b.flowIcons?.[key];
  }
  const aVal = getFieldValue(a, field).toLowerCase();
  let bVal: string;
  switch (field) {
    case 'stepNumberName':
      bVal = `${b.stepNumber} ${b.name}`.trim().toLowerCase();
      break;
    case 'incomingVariation':
      bVal = Array.isArray(b.incomingVariation) ? joinMultiline(b.incomingVariation).toLowerCase() : (b.incomingVariation || '').toLowerCase();
      break;
    case 'specialCharacteristics':
      bVal = (b.specialCharacteristics || '').toLowerCase();
      break;
    case 'machinesEquipmentDocs':
      bVal = Array.isArray(b.machinesEquipmentDocs) ? joinMultiline(b.machinesEquipmentDocs).toLowerCase() : (b.machinesEquipmentDocs || '').toLowerCase();
      break;
    case 'desiredOutcome':
      bVal = Array.isArray(b.desiredOutcome) ? joinMultiline(b.desiredOutcome).toLowerCase() : (b.desiredOutcome || '').toLowerCase();
      break;
    case 'processCharacteristics':
      bVal = Array.isArray(b.processCharacteristics) ? joinMultiline(b.processCharacteristics).toLowerCase() : (b.processCharacteristics || '').toLowerCase();
      break;
    default:
      return false;
  }
  return aVal === bVal;
}

interface ExcelImportWizardProps {
  open: boolean;
  onClose: () => void;
  revisionId: string | null;
  existingSteps: ProcessStep[];
  token: string | null;
  onImportSuccess: () => void;
}

export const ExcelImportWizard: React.FC<ExcelImportWizardProps> = ({
  open,
  onClose,
  revisionId,
  existingSteps,
  token,
  onImportSuccess,
}) => {
  // const { token: authToken } = useAuth(); // unused, using props token
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<{ headers: string[]; rows: ParsedRow[] } | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [draftSteps, setDraftSteps] = useState<DraftStep[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [mode, setMode] = useState<'build' | 'update'>('build');
  const [diffResults, setDiffResults] = useState<DiffResult[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, status: '' });
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const handleClose = () => {
    setActiveStep(0);
    setFile(null);
    setParsedData(null);
    setColumnMapping({});
    setDraftSteps([]);
    setSelectedRows(new Set());
    setMode('build');
    setDiffResults([]);
    setError(null);
    setPage(0);
    onClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith('.xlsx') && !f.name.endsWith('.xls')) {
      setError('Please select an Excel file (.xlsx or .xls)');
      return;
    }
    setError(null);
    setFile(f);
    setActiveStep(1);
    try {
      const arrayBuffer = await f.arrayBuffer();
      const ExcelJS = await import('exceljs');
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(arrayBuffer);
      const ws = wb.worksheets[0];
      if (!ws) throw new Error('No worksheet found');

      const headers: string[] = [];
      const rows: ParsedRow[] = [];
      let headerRowIndex = -1;
      let maxHeaderScore = 0;

      // Scan first 15 rows to find header row
      for (let r = 1; r <= Math.min(15, ws.rowCount); r++) {
        const row = ws.getRow(r);
        let score = 0;
        const rowHeaders: string[] = [];
        row.eachCell((cell, col) => {
          const val = cell.text || String(cell.value || '');
          rowHeaders[col - 1] = val;
          if (val.trim()) score++;
        });
        if (score > maxHeaderScore) {
          maxHeaderScore = score;
          headers.length = 0;
          headers.push(...rowHeaders);
          headerRowIndex = r;
        }
      }

      if (headerRowIndex === -1 || headers.length === 0) {
        throw new Error('Could not detect header row');
      }

      // Parse data rows
      for (let r = headerRowIndex + 1; r <= ws.rowCount; r++) {
        const row = ws.getRow(r);
        const rowData: ParsedRow = {};
        let hasData = false;
        row.eachCell((cell, col) => {
          const header = headers[col - 1] || `Column ${col}`;
          const val = cell.text || String(cell.value || '');
          if (val.trim()) hasData = true;
          rowData[header] = val;
        });
        if (hasData) rows.push(rowData);
      }

      setParsedData({ headers, rows });
      // Auto-map columns
      const autoMapping: ColumnMapping = {};
      for (const h of headers) {
        const { target } = autoMapHeader(h);
        autoMapping[h] = target;
      }
      setColumnMapping(autoMapping);
    } catch (err: any) {
      setError(err.message || 'Failed to parse Excel file');
      setActiveStep(0);
    }
  };

  const handleMappingChange = (header: string, value: PfdFieldKey | 'ignore') => {
    setColumnMapping((prev) => ({ ...prev, [header]: value }));
  };

  const buildDraftSteps = useCallback(() => {
    if (!parsedData) return;
    const { headers, rows } = parsedData;
    const steps: DraftStep[] = rows.map((row) => {
      const stepNumberNameHeader = headers.find((h) => columnMapping[h] === 'stepNumberName');
      const stepNumberNameCell = stepNumberNameHeader ? row[stepNumberNameHeader] || '' : '';
      const { stepNumber, name } = parseStepNumberAndName(stepNumberNameCell);

      const step: DraftStep = {
        include: true,
        stepNumber,
        name,
        incomingVariation: '',
        specialCharacteristics: '',
        flowIcons: {
          trans: false, recArea: false, store: false, wip: false,
          oper: false, insp: false, decs: false, rework: false, reject: false,
        },
        machinesEquipmentDocs: '',
        desiredOutcome: '',
        processCharacteristics: '',
        rawData: row,
      };

      for (const h of headers) {
        const target = columnMapping[h];
        const val = row[h] || '';
        if (!val) continue;
        switch (target) {
          case 'stepNumberName':
            // already handled
            break;
          case 'incomingVariation':
            step.incomingVariation = val;
            break;
          case 'specialCharacteristics':
            step.specialCharacteristics = val;
            break;
          case 'machinesEquipmentDocs':
            step.machinesEquipmentDocs = val;
            break;
          case 'desiredOutcome':
            step.desiredOutcome = val;
            break;
          case 'processCharacteristics':
            step.processCharacteristics = val;
            break;
          default:
            if (target.startsWith('flowIcon:')) {
              const key = target.split(':')[1] as keyof typeof step.flowIcons;
              step.flowIcons[key] = true;
            }
            break;
        }
      }
      return step;
    });
    setDraftSteps(steps);
    // Select all by default
    const allSelected = new Set(steps.map((_, i) => i));
    setSelectedRows(allSelected);
  }, [parsedData, columnMapping]);

  useEffect(() => {
    if (parsedData && activeStep === 2) {
      buildDraftSteps();
    }
  }, [parsedData, columnMapping, activeStep, buildDraftSteps]);

  useEffect(() => {
    if (mode === 'update' && activeStep === 3 && draftSteps.length > 0 && revisionId) {
      computeDiff();
    }
  }, [mode, activeStep, draftSteps, revisionId]);

  const computeDiff = () => {
    if (!revisionId) return;
    const existingByStepNum = new Map<string, ProcessStep>();
    for (const s of existingSteps) {
      if (s.stepNumber) existingByStepNum.set(s.stepNumber, s);
    }
    const existingByName = new Map<string, ProcessStep>();
    for (const s of existingSteps) {
      if (s.name) existingByName.set(s.name.toLowerCase(), s);
    }

    const results: DiffResult[] = [];
    const matchedExisting = new Set<string>();

    for (let i = 0; i < draftSteps.length; i++) {
      const draft = draftSteps[i];
      const stepNum = draft.stepNumber;
      const name = draft.name.toLowerCase();

      let match: ProcessStep | undefined;
      if (stepNum && existingByStepNum.has(stepNum)) {
        match = existingByStepNum.get(stepNum);
      } else if (existingByName.has(name)) {
        match = existingByName.get(name);
      }

      if (!match) {
        results.push({ status: 'new', draftStep: draft });
      } else {
        matchedExisting.add(match.id);
        const fieldDiffs: DiffResult['fieldDiffs'] = [];
        const fields: PfdFieldKey[] = [
          'stepNumberName', 'incomingVariation', 'specialCharacteristics',
          'machinesEquipmentDocs', 'desiredOutcome', 'processCharacteristics',
          'flowIcon:trans', 'flowIcon:recArea', 'flowIcon:store', 'flowIcon:wip',
          'flowIcon:oper', 'flowIcon:insp', 'flowIcon:decs', 'flowIcon:rework', 'flowIcon:reject',
        ];
        for (const f of fields) {
          if (!stepsEqual(draft, match, f)) {
            const oldVal = getExistingFieldValue(match, f);
            const newVal = getFieldValue(draft, f);
            if (oldVal !== newVal) {
              fieldDiffs.push({ field: f, old: oldVal, new: newVal });
            }
          }
        }
        if (fieldDiffs.length > 0) {
          results.push({ status: 'update', draftStep: draft, existingStep: match, fieldDiffs });
        } else {
          results.push({ status: 'unchanged', draftStep: draft, existingStep: match });
        }
      }
    }

    // Add missing (existing but not in Excel)
    for (const s of existingSteps) {
      if (!matchedExisting.has(s.id)) {
        results.push({ status: 'missing', existingStep: s });
      }
    }

    setDiffResults(results);
  };

  function getExistingFieldValue(step: ProcessStep, field: PfdFieldKey): string {
    switch (field) {
      case 'stepNumberName':
        return `${step.stepNumber} ${step.name}`.trim();
      case 'incomingVariation':
        return Array.isArray(step.incomingVariation) ? joinMultiline(step.incomingVariation) : (step.incomingVariation || '');
      case 'specialCharacteristics':
        return step.specialCharacteristics || '';
      case 'machinesEquipmentDocs':
        return Array.isArray(step.machinesEquipmentDocs) ? joinMultiline(step.machinesEquipmentDocs) : (step.machinesEquipmentDocs || '');
      case 'desiredOutcome':
        return Array.isArray(step.desiredOutcome) ? joinMultiline(step.desiredOutcome) : (step.desiredOutcome || '');
      case 'processCharacteristics':
        return Array.isArray(step.processCharacteristics) ? joinMultiline(step.processCharacteristics) : (step.processCharacteristics || '');
      default:
        if (field.startsWith('flowIcon:')) {
          const key = field.split(':')[1];
          return step.flowIcons?.[key] ? '✓' : '';
        }
        return '';
    }
  }

  const handleModeChange = (m: 'build' | 'update') => {
    setMode(m);
    if (m === 'update' && !revisionId) {
      setError('No PFD revision available for update mode');
    }
  };

  const toggleRowSelection = (idx: number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === getVisibleSteps().length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(getVisibleSteps().map((_, i) => i)));
    }
  };

  const getVisibleSteps = () => {
    const start = page * rowsPerPage;
    return draftSteps.slice(start, start + rowsPerPage);
  };

  const handleImport = async () => {
    if (!revisionId) return;
    const toImport = getVisibleSteps().filter((_, i) => selectedRows.has(i + page * rowsPerPage));
    if (toImport.length === 0) return;

    setImporting(true);
    setImportProgress({ current: 0, total: toImport.length, status: 'Preparing...' });
    setError(null);

    try {
      if (mode === 'build') {
        // Batch create
        const batchDtos = toImport.map((s) => ({
          stepNumber: s.stepNumber,
          name: s.name,
          stepType: 'operation',
          incomingVariation: s.incomingVariation ? splitMultiline(s.incomingVariation) : [],
          specialCharacteristics: s.specialCharacteristics || null,
          flowIcons: s.flowIcons,
          machinesEquipmentDocs: s.machinesEquipmentDocs ? splitMultiline(s.machinesEquipmentDocs) : [],
          desiredOutcome: s.desiredOutcome || null,
          processCharacteristics: s.processCharacteristics || null,
        }));

        setImportProgress({ current: 0, total: batchDtos.length, status: 'Creating steps...' });
        const res = await fetch(`${API_BASE_URL}/revisions/${revisionId}/pfd-steps/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(batchDtos),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Batch create failed');
        }
      } else {
        // Update existing + create new
        const newSteps = diffResults.filter(
          (d) => d.status === 'new' && d.draftStep && selectedRows.has(diffResults.indexOf(d))
        );
        const updateSteps = diffResults.filter(
          (d) => d.status === 'update' && d.draftStep && d.existingStep && selectedRows.has(diffResults.indexOf(d))
        );

        setImportProgress({ current: 0, total: newSteps.length + updateSteps.length, status: 'Creating new steps...' });
        for (let i = 0; i < newSteps.length; i++) {
          const s = newSteps[i].draftStep!;
          setImportProgress({ current: i + 1, total: newSteps.length + updateSteps.length, status: `Creating step ${s.stepNumber || s.name}...` });
          const dto = {
            stepNumber: s.stepNumber,
            name: s.name,
            stepType: 'operation',
            incomingVariation: s.incomingVariation ? splitMultiline(s.incomingVariation) : [],
            specialCharacteristics: s.specialCharacteristics || null,
            flowIcons: s.flowIcons,
            machinesEquipmentDocs: s.machinesEquipmentDocs ? splitMultiline(s.machinesEquipmentDocs) : [],
            desiredOutcome: s.desiredOutcome || null,
            processCharacteristics: s.processCharacteristics || null,
          };
          const res = await fetch(`${API_BASE_URL}/revisions/${revisionId}/pfd-steps`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(dto),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(`Failed to create ${s.stepNumber || s.name}: ${err.message}`);
          }
        }

        for (let i = 0; i < updateSteps.length; i++) {
          const s = updateSteps[i];
          setImportProgress({ current: newSteps.length + i + 1, total: newSteps.length + updateSteps.length, status: `Updating step ${s.existingStep?.stepNumber}...` });
          const dto = {
            stepNumber: s.draftStep!.stepNumber,
            name: s.draftStep!.name,
            stepType: 'operation',
            incomingVariation: s.draftStep!.incomingVariation ? splitMultiline(s.draftStep!.incomingVariation) : [],
            specialCharacteristics: s.draftStep!.specialCharacteristics || null,
            flowIcons: s.draftStep!.flowIcons,
            machinesEquipmentDocs: s.draftStep!.machinesEquipmentDocs ? splitMultiline(s.draftStep!.machinesEquipmentDocs) : [],
            desiredOutcome: s.draftStep!.desiredOutcome || null,
            processCharacteristics: s.draftStep!.processCharacteristics || null,
          };
          const res = await fetch(`${API_BASE_URL}/pfd-steps/${s.existingStep!.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(dto),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(`Failed to update ${s.existingStep?.stepNumber}: ${err.message}`);
          }
        }
      }

      setImportProgress((p) => ({ ...p, status: 'Done!' }));
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

  const downloadTemplate = async () => {
    try {
      const ExcelJS = await import('exceljs');
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('PFD Import Template');

      const headers = [
        'Process # & Description',
        'Incoming source of variation',
        'Special Char. Class',
        'TRANS.',
        'STORE Recieving Area',
        'STORE Main Store',
        'WIP @Line',
        'OPER.',
        'INSP.',
        'DECS.',
        'REWORK',
        'REJECT',
        'Machine(s) / Equipment(s) used/ Documents',
        'Desired outcome / Product characteristics',
        'Process characteristics',
      ];

      ws.addRow(headers);
      // Style header
      ws.getRow(1).font = { bold: true };
      ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
      for (let c = 1; c <= headers.length; c++) {
        ws.getCell(1, c).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        ws.getCell(1, c).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      }

      // Add example row
      ws.addRow([
        'OP10 Drill core hole',
        'Raw material hardness variation\nFixture wear',
        'SC',
        '✓',
        '',
        '',
        '',
        '✓',
        '✓',
        '',
        '',
        '',
        'CNC Drilling Machine D-01\nDrill Bit Ø10mm',
        'Hole diameter Ø10.0 ± 0.1mm\nSurface finish Ra 3.2',
        'Spindle speed 1200 RPM\nFeed rate 0.15 mm/rev',
      ]);

      // Style data rows
      for (let r = 2; r <= 2; r++) {
        for (let c = 1; c <= headers.length; c++) {
          ws.getCell(r, c).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          ws.getCell(r, c).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
        }
      }

      ws.columns = headers.map(() => ({ width: 25 }));

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PFD_Import_Template_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Template download failed:', err);
      setError('Failed to generate template');
    }
  };

  const stepLabels = [
    'Upload File',
    'Map Columns',
    'Select Rows',
    mode === 'build' ? 'Confirm Import' : 'Diff Preview',
    'Import',
  ];

  const stepContents = [
    // Step 1: Upload
    (
      <Stack spacing={3} sx={{ mt: 2 }}>
        <Alert severity="info" sx={{ mb: 1 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <InfoIcon fontSize="small" />
            <Typography variant="body2">
              Upload an Excel file (.xlsx) containing PFD data. 
              The first row should contain headers matching the template.
            </Typography>
          </Stack>
        </Alert>
        <Box sx={{ border: '2px dashed #cbd5e1', borderRadius: 2, p: 4, textAlign: 'center', cursor: 'pointer' }}>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            id="import-file-input"
          />
          <label htmlFor="import-file-input" style={{ cursor: 'pointer', display: 'block' }}>
            <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Drag & drop or click to select .xlsx file
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Max 300 rows recommended. Larger files will be paginated.
            </Typography>
          </label>
        </Box>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={downloadTemplate}
          disabled={!!(file || parsedData)}
          sx={{ mt: 1 }}
        >
          Download Template
        </Button>
        {file && (
          <Alert severity="success">
            <Typography variant="body2">
              <strong>{file.name}</strong> ({Math.round(file.size / 1024)} KB) — Ready to parse
            </Typography>
          </Alert>
        )}
      </Stack>
    ),
    // Step 2: Map Columns
    (
      <Stack spacing={3} sx={{ mt: 2, maxHeight: 600, overflow: 'auto' }}>
        <Alert severity="info" sx={{ mb: 1 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <InfoIcon fontSize="small" />
            <Typography variant="body2">
              Map Excel columns to PFD fields. Auto-mapped columns show <Chip label="auto" size="small" color="success" variant="outlined" />.
              Use dropdown to correct any mismatches.
            </Typography>
          </Stack>
        </Alert>
        {parsedData && (
          <TableContainer component={Paper} sx={{ maxHeight: 450, overflow: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell style={{ minWidth: 300, fontWeight: 'bold' }}>Excel Column (Detected)</TableCell>
                  <TableCell style={{ minWidth: 250, fontWeight: 'bold' }}>Map To</TableCell>
                  <TableCell style={{ width: 80, fontWeight: 'bold', textAlign: 'center' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {parsedData.headers.map((header) => {
                  const { confidence } = autoMapHeader(header);
                  return (
                    <TableRow key={header} sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{header}</Typography>
                        <Typography variant="caption" color="text.secondary">{parsedData!.rows[0]?.[header] || '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" fullWidth sx={{ minWidth: 220 }}>
                          <Select
                            value={columnMapping[header] || 'ignore'}
                            onChange={(e) => handleMappingChange(header, e.target.value as PfdFieldKey | 'ignore')}
                            label="Map To"
                          >
                            {FIELD_OPTIONS.map((opt) => (
                              <MenuItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={confidence === 'auto' ? 'Auto' : 'Manual'}
                          size="small"
                          color={confidence === 'auto' ? 'success' : 'default'}
                          variant="outlined"
                          icon={confidence === 'auto' ? <AutoMapIcon fontSize="small" /> : <EditIcon fontSize="small" />}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>
    ),
    // Step 3: Select Rows
    (
      <Stack spacing={3} sx={{ mt: 2 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Select rows to import ({selectedRows.size} of {draftSteps.length} selected)
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={toggleSelectAll}
            startIcon={selectedRows.size === getVisibleSteps().length ? <RemoveIcon /> : <AddIcon />}
          >
            {selectedRows.size === getVisibleSteps().length ? 'Deselect All' : 'Select All Visible'}
          </Button>
        </Box>
        <RadioGroup value={mode} onChange={(e) => handleModeChange(e.target.value as 'build' | 'update')} row sx={{ mb: 1 }}>
          <FCL value="build" control={<Radio />} label="Build New PFD" labelPlacement="end" />
          <FCL value="update" control={<Radio />} label="Update Existing PFD (Diff)" labelPlacement="end" disabled={!revisionId} />
        </RadioGroup>
        {mode === 'update' && !revisionId && (
          <Alert severity="warning">No PFD revision available. Switch to Build New mode.</Alert>
        )}
        <Alert severity="info" sx={{ mb: 1 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <PreviewIcon fontSize="small" />
            <Typography variant="body2">
              {mode === 'build' 
                ? 'All selected rows will create new PFD steps.' 
                : 'Selected rows will be compared against existing PFD. New steps created, updates applied per row.'}
            </Typography>
          </Stack>
        </Alert>
        {draftSteps.length > 0 && (
          <TableContainer component={Paper} sx={{ maxHeight: 500, overflow: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell style={{ width: 50 }}>
                    <Checkbox
                      checked={getVisibleSteps().length > 0 && getVisibleSteps().every((_, i) => selectedRows.has(i + page * rowsPerPage))}
                      indeterminate={selectedRows.size > 0 && selectedRows.size < getVisibleSteps().length}
                      onChange={toggleSelectAll}
                    />
                  </TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}>Step #</TableCell>
                  <TableCell style={{ minWidth: 200, fontWeight: 'bold' }}>Process Description</TableCell>
                  <TableCell style={{ minWidth: 180, fontWeight: 'bold' }}>Incoming Variation</TableCell>
                  <TableCell style={{ minWidth: 100, fontWeight: 'bold' }}>Spec. Class</TableCell>
                  <TableCell style={{ minWidth: 130, fontWeight: 'bold', textAlign: 'center' }}>Flow Symbols</TableCell>
                  <TableCell style={{ minWidth: 180, fontWeight: 'bold' }}>Machines/Equipment/Docs</TableCell>
                  <TableCell style={{ minWidth: 200, fontWeight: 'bold' }}>Desired Outcome</TableCell>
                  <TableCell style={{ minWidth: 180, fontWeight: 'bold' }}>Process Characteristics</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getVisibleSteps().map((step, idx) => {
                  const globalIdx = idx + page * rowsPerPage;
                  const isSelected = selectedRows.has(globalIdx);
                  const icons = step.flowIcons;
                  const activeKeys = Object.keys(icons).filter((k) => icons[k]);
                  const symbolsText = activeKeys.length > 0
                    ? activeKeys.map((k) => {
                        const m = getPfdIconMeta(k);
                        return `${m.sym} ${m.short}`;
                      }).join(', ')
                    : '—';
                  return (
                    <TableRow
                      key={globalIdx}
                      hover
                      selected={isSelected}
                      onClick={() => toggleRowSelection(globalIdx)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Checkbox checked={isSelected} onClick={(e) => e.stopPropagation()} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{step.stepNumber || '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{step.name || '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">{step.incomingVariation || '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{step.specialCharacteristics || '—'}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{symbolsText}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">{step.machinesEquipmentDocs || '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">{step.desiredOutcome || '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">{step.processCharacteristics || '—'}</Typography>
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
          count={draftSteps.length}
          page={page}
          onPageChange={(_: unknown, p: number) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[25, 50, 100]}
        />
      </Stack>
    ),
    // Step 4: Diff Preview (update) or Confirm (build)
    mode === 'build' ? (
      <Stack spacing={3} sx={{ mt: 2 }}>
        <Alert severity="info">
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <InfoIcon fontSize="small" />
            <Typography variant="body2">
              {draftSteps.filter((_, i) => selectedRows.has(i)).length} new steps will be created.
            </Typography>
          </Stack>
        </Alert>
        <TableContainer component={Paper} sx={{ maxHeight: 400, overflow: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell style={{ fontWeight: 'bold' }}>Step #</TableCell>
                <TableCell style={{ minWidth: 200, fontWeight: 'bold' }}>Process Description</TableCell>
                <TableCell style={{ minWidth: 100, fontWeight: 'bold' }}>Spec. Class</TableCell>
                <TableCell style={{ minWidth: 130, fontWeight: 'bold', textAlign: 'center' }}>Flow Symbols</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {draftSteps
                .filter((_, i) => selectedRows.has(i))
                .map((step) => (
                  <TableRow key={step.stepNumber || step.name}>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{step.stepNumber || 'Auto'}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{step.name}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{step.specialCharacteristics || '—'}</Typography></TableCell>
                    <TableCell align="center">
                      {Object.entries(step.flowIcons).filter(([, v]) => v).map(([k]) => {
                        const m = getPfdIconMeta(k);
                        return <span key={k} style={{ marginRight: 4 }}>{m.sym} {m.short}</span>;
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
    ) : (
      <Stack spacing={3} sx={{ mt: 2 }}>
        {error && <Alert severity="error">{error}</Alert>}
        {diffResults.length === 0 && (
          <Alert severity="info">No existing PFD steps to compare against.</Alert>
        )}
        <Box sx={{ display: 'flex', gap: 2, mb: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Diff Summary:</Typography>
          <Chip label={`New: ${diffResults.filter((d) => d.status === 'new').length}`} color="success" size="small" variant="outlined" />
          <Chip label={`Update: ${diffResults.filter((d) => d.status === 'update').length}`} color="warning" size="small" variant="outlined" />
          <Chip label={`Unchanged: ${diffResults.filter((d) => d.status === 'unchanged').length}`} color="default" size="small" variant="outlined" />
          <Chip label={`Missing: ${diffResults.filter((d) => d.status === 'missing').length}`} color="error" size="small" variant="outlined" />
        </Box>
        {diffResults.length > 0 && (
          <TableContainer component={Paper} sx={{ maxHeight: 500, overflow: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell style={{ width: 50 }}>
                    <Checkbox
                      checked={diffResults.length > 0 && diffResults.every((d, i) => d.status !== 'missing' && selectedRows.has(i))}
                      indeterminate={selectedRows.size > 0 && selectedRows.size < diffResults.filter((d) => d.status !== 'missing').length}
                      onChange={toggleSelectAll}
                    />
                  </TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell style={{ minWidth: 80, fontWeight: 'bold' }}>Step #</TableCell>
                  <TableCell style={{ minWidth: 200, fontWeight: 'bold' }}>Process Description</TableCell>
                  <TableCell style={{ minWidth: 100, fontWeight: 'bold' }}>Spec. Class</TableCell>
                  <TableCell style={{ minWidth: 130, fontWeight: 'bold', textAlign: 'center' }}>Flow Symbols</TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}>Changes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {diffResults.map((result, idx) => {
                  if (result.status === 'missing') {
                    return (
                      <TableRow key={`missing-${idx}`} sx={{ opacity: 0.5 }}>
                        <TableCell><Checkbox disabled /></TableCell>
                        <TableCell>
                          <Chip label="Missing" color="error" size="small" variant="outlined" />
                        </TableCell>
                        <TableCell><Typography variant="body2">{result.existingStep?.stepNumber}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{result.existingStep?.name}</Typography></TableCell>
                        <TableCell><Typography variant="body2">{result.existingStep?.specialCharacteristics || '—'}</Typography></TableCell>
                        <TableCell align="center"><Typography variant="body2" color="text.secondary">—</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">Exists in PFD but not in Excel</Typography></TableCell>
                      </TableRow>
                    );
                  }
                  const draft = result.draftStep!;
                  const isSelected = selectedRows.has(idx);
                  const icons = draft.flowIcons;
                  const activeKeys = Object.keys(icons).filter((k) => icons[k]);
                  const symbolsText = activeKeys.length > 0
                    ? activeKeys.map((k) => {
                        const m = getPfdIconMeta(k);
                        return `${m.sym} ${m.short}`;
                      }).join(', ')
                    : '—';
                  return (
                    <TableRow key={idx} hover selected={isSelected} onClick={() => toggleRowSelection(idx)} sx={{ cursor: 'pointer' }}>
                      <TableCell>
                        <Checkbox checked={isSelected} onClick={(e) => e.stopPropagation()} />
                      </TableCell>
                      <TableCell>
                        {result.status === 'new' && <Chip label="New" color="success" size="small" />}
                        {result.status === 'update' && <Chip label="Update" color="warning" size="small" />}
                        {result.status === 'unchanged' && <Chip label="Unchanged" color="default" size="small" variant="outlined" />}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{draft.stepNumber || 'Auto'}</Typography>
                      </TableCell>
                      <TableCell><Typography variant="body2">{draft.name}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{draft.specialCharacteristics || '—'}</Typography></TableCell>
                      <TableCell align="center"><Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{symbolsText}</Typography></TableCell>
                      <TableCell>
                        {result.fieldDiffs && result.fieldDiffs.length > 0 && (
                          <Stack spacing={0.25}>
                            {result.fieldDiffs.map((fd) => (
                              <Chip
                                key={fd.field}
                                label={`${fd.field}: "${fd.old}" → "${fd.new}"`}
                                size="small"
                                color="warning"
                                variant="outlined"
                                sx={{ maxWidth: 300 }}
                              />
                            ))}
                          </Stack>
                        )}
                        {result.fieldDiffs?.length === 0 && (
                          <Typography variant="body2" color="text.secondary">No changes</Typography>
                        )}
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
          count={diffResults.length}
          page={page}
          onPageChange={(_: unknown, p: number) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[25, 50, 100]}
        />
      </Stack>
    ),
    // Step 5: Import
    (
      <Stack spacing={3} sx={{ mt: 2, alignItems: 'center' }}>
        {error && <Alert severity="error">{error}</Alert>}
        <CircularProgress size={80} variant="determinate" value={importing ? (importProgress.current / importProgress.total) * 100 : 0} thickness={6} />
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          {importing ? `Importing... ${importProgress.current} / ${importProgress.total}` : 'Ready to Import'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          {importing ? importProgress.status : `${getVisibleSteps().filter((_, i) => selectedRows.has(i + page * rowsPerPage)).length} steps selected for ${mode === 'build' ? 'creation' : 'import'}`}
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
            >
              {mode === 'build' ? 'Create Steps' : 'Apply Changes'}
            </Button>
          </Stack>
        )}
        {importing && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{importProgress.status}</Typography>}
      </Stack>
    ),
  ];

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      fullWidth
      sx={{ '& .MuiDialog-paper': { width: '95vw', maxWidth: '1400px', maxHeight: '95vh', overflow: 'hidden' } }}
    >
      <DialogTitle sx={{ fontWeight: 'bold', px: 3, pt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <UploadIcon sx={{ color: 'primary.main', fontSize: '1.5rem' }} />
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.3rem' }}>
            Import PFD from Excel
          </Typography>
        </Stack>
        <Chip label={mode === 'build' ? 'Build New' : 'Update Existing'} color="primary" size="small" variant="outlined" />
      </DialogTitle>
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: '#F8FAFC' }}>
        {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}
        <Box sx={{ p: 3, flex: 1, overflow: 'auto' }}>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
            {stepLabels.map((label, idx) => (
              <Step key={idx} completed={idx < activeStep}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
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
          >
            {mode === 'build' ? 'Create Steps' : 'Apply Changes'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );

  function canProceed(step: number): boolean {
    switch (step) {
      case 0: return !!file;
      case 1: return parsedData !== null;
      case 2: return draftSteps.length > 0 && selectedRows.size > 0;
      case 3: return selectedRows.size > 0;
      default: return true;
    }
  }
};