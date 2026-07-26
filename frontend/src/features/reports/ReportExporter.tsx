import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  RadioGroup, FormControlLabel, Radio, TextField, Stack, Typography,
  FormControl, FormLabel, MenuItem, Select, InputLabel, Box, Card,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Grid, IconButton, Tooltip
} from '@mui/material';
import {
  Download as DownloadIcon, Print as PrintIcon, Close as CloseIcon,
  Visibility as PreviewIcon
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { API_BASE_URL } from '../../config';
import { getPfdIconMeta } from '../pfd/utils/pfdIconMap';
import * as XLSX from 'xlsx';

interface ReportExporterProps {
  open: boolean;
  onClose: () => void;
  docType: 'PFD' | 'PFMEA' | 'DFMEA' | 'CONTROL_PLAN';
  projectName: string;
  data: any[];
  steps?: any[];
}

export const ReportExporter: React.FC<ReportExporterProps> = ({
  open,
  onClose,
  docType,
  projectName,
  data,
  steps
}) => {
  const { token } = useAuth();
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<any>(null);

  const [exportMode, setExportMode] = useState<'options' | 'preview'>('options');
  const [paperSize, setPaperSize] = useState<'A3' | 'A2' | 'A1' | 'A0'>('A3');
  const [watermarkOption, setWatermarkOption] = useState<'none' | 'draft' | 'confidential' | 'custom'>('none');
  const [customWatermark, setCustomWatermark] = useState('');

  // Fetch project details for document header
  useEffect(() => {
    if (open && projectId && token) {
      fetch(`${API_BASE_URL}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Failed to load project details');
        })
        .then(data => setProject(data))
        .catch(err => console.error('Error fetching project for exporter:', err));
    }
  }, [open, projectId, token]);

  const renderPdfList = (val: any) => {
    if (!val) return '—';
    let arr: any[] = [];
    if (Array.isArray(val)) {
      arr = val;
    } else if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        arr = Array.isArray(parsed) ? parsed : [val];
      } catch {
        arr = val.includes('\n') ? val.split('\n') : [val];
      }
    } else {
      arr = [String(val)];
    }
    if (arr.length === 0) return '—';
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        {arr.map((item, idx) => {
          const text = typeof item === 'object' ? item.name || '' : String(item);
          return <Typography key={idx} variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.35 }}>{text}</Typography>;
        })}
      </Box>
    );
  };

  const getWatermarkText = (): string => {
    if (watermarkOption === 'none') return '';
    if (watermarkOption === 'draft') return 'DRAFT';
    if (watermarkOption === 'confidential') return 'CONFIDENTIAL';
    return customWatermark;
  };

  const getDocTypeName = () => {
    switch (docType) {
      case 'PFD': return 'Process Flow Diagram (PFD)';
      case 'PFMEA': return 'Process Failure Mode & Effects Analysis (PFMEA)';
      case 'CONTROL_PLAN': return 'Process Control Plan (CP)';
      case 'DFMEA': return 'Design Failure Mode & Effects Analysis (DFMEA)';
      default: return docType;
    }
  };

  const getDerivedDocNumber = () => {
    const partNo = project?.orgPartNumber || '—';
    if (docType === 'PFD') return `PFD${partNo}`;
    if (docType === 'PFMEA') return `PFMEA${partNo}`;
    if (docType === 'DFMEA') return `DFMEA${partNo}`;
    if (docType === 'CONTROL_PLAN') return `CP${partNo}`;
    return partNo;
  };

  const getStatusLabel = () => {
    return (project?.documentTypes?.[0] || 'Prototype').toUpperCase();
  };

  // Excel generation
  const handleExportExcel = async () => {
    const wmText = getWatermarkText();
    await generateExcel(wmText);
    onClose();
  };

  const generateExcel = async (_watermark: string) => {
    const formatExcelList = (val: any): string => {
      if (!val) return '—';
      let arr: any[] = [];
      if (Array.isArray(val)) {
        arr = val;
      } else if (typeof val === 'string') {
        try {
          const parsed = JSON.parse(val);
          arr = Array.isArray(parsed) ? parsed : [val];
        } catch {
          arr = val.includes('\n') ? val.split('\n') : [val];
        }
      } else {
        arr = [String(val)];
      }

      if (arr.length === 0) return '—';
      return arr.map(item => {
        const itemVal = typeof item === 'object' ? (item.name || '') : String(item);
        return itemVal
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
      }).join('<br style="mso-data-placement:same-cell;"/>');
    };

    const getApStyleClass = (ap: string | undefined): string => {
      if (!ap) return '';
      const cleanAp = ap.trim().toUpperCase();
      if (cleanAp === 'HIGH' || cleanAp === 'H') return 'class="ap-high"';
      if (cleanAp === 'MEDIUM' || cleanAp === 'M') return 'class="ap-medium"';
      if (cleanAp === 'LOW' || cleanAp === 'L') return 'class="ap-low"';
      return '';
    };

    let headers: string[] = [];
    let tableRowsHtml = '';

    const stepSpans: number[] = [];
    const funcSpans: number[] = [];
    const reqSpans: number[] = [];

    if (docType === 'PFMEA' || docType === 'DFMEA') {
      let i = 0;
      while (i < data.length) {
        let stepCount = 1;
        const currentStepId = data[i].processStepId;
        while (i + stepCount < data.length && data[i + stepCount].processStepId === currentStepId) {
          stepCount++;
        }
        stepSpans[i] = stepCount;
        for (let k = 1; k < stepCount; k++) stepSpans[i + k] = 0;

        let j = i;
        const stepEnd = i + stepCount;
        while (j < stepEnd) {
          let funcCount = 1;
          const currentFuncsStr = data[j].functions?.map((f: any) => f.name).join('|') || '';
          while (j + funcCount < stepEnd && (data[j + funcCount].functions?.map((f: any) => f.name).join('|') || '') === currentFuncsStr) {
            funcCount++;
          }
          funcSpans[j] = funcCount;
          for (let k = 1; k < funcCount; k++) funcSpans[j + k] = 0;

          let r = j;
          const funcEnd = j + funcCount;
          while (r < funcEnd) {
            let reqCount = 1;
            const currentReqsStr = data[r].requirements?.map((req: any) => req.name).join('|') || '';
            while (r + reqCount < funcEnd && (data[r + reqCount].requirements?.map((req: any) => req.name).join('|') || '') === currentReqsStr) {
              reqCount++;
            }
            reqSpans[r] = reqCount;
            for (let k = 1; k < reqCount; k++) reqSpans[r + k] = 0;
            r += reqCount;
          }
          j += funcCount;
        }
        i += stepCount;
      }
    } else if (docType === 'CONTROL_PLAN' || docType === 'PFD') {
      let i = 0;
      while (i < data.length) {
        let stepCount = 1;
        const currentStepId = data[i].processStepId || data[i].id;
        while (i + stepCount < data.length && (data[i + stepCount].processStepId || data[i + stepCount].id) === currentStepId) {
          stepCount++;
        }
        stepSpans[i] = stepCount;
        for (let k = 1; k < stepCount; k++) stepSpans[i + k] = 0;
        i += stepCount;
      }
    }

    if (docType === 'PFD') {
      // ============================================================
      // ExcelJS-based PFD export with full professional formatting
      // ============================================================
      const ExcelJS = await import('exceljs');
      const wb = new ExcelJS.Workbook();
      wb.creator = 'PFD System';
      wb.created = new Date();

      // -- CONFIG --
      const FONT = 'Calibri';
      const BORDER_THIN: Partial<import('exceljs').Border> = { style: 'thin' as const, color: { argb: 'FF000000' } };
      const BORDER_THICK: Partial<import('exceljs').Border> = { style: 'medium' as const, color: { argb: 'FF000000' } };
      const HEADER_FILL: import('exceljs').FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
      const COL_WIDTHS = [9, 22, 26, 10, 20, 26, 30, 30];
      const CENTERED_COLS = [0, 3]; // Step #, Spec Class

      const allBorders = (style: Partial<import('exceljs').Border> = BORDER_THIN): Partial<import('exceljs').Borders> => ({
        top: style, left: style, bottom: style, right: style
      });

      const stripNum = (s: string) => s.replace(/^\d+[\.)\-]\s*/, '');
      const arrToText = (arr: any): string => {
        if (!arr) return '';
        if (Array.isArray(arr)) {
          const items = arr.map(x => typeof x === 'object' ? (x.name || '') : String(x));
          return items.length > 0 ? items.map((x, i) => `${i + 1}. ${stripNum(x)}`).join('\n') : '';
        }
        if (typeof arr === 'string') {
          try {
            const parsed = JSON.parse(arr);
            if (Array.isArray(parsed)) return arrToText(parsed);
          } catch { /* not JSON */ }
          return arr;
        }
        return String(arr);
      };

      const ws = wb.addWorksheet('PFD', {
        pageSetup: {
          orientation: 'landscape',
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0,
          margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 }
        }
      });
      ws.columns = COL_WIDTHS.map(width => ({ width }));

      // ---- TITLE BLOCK (Rows 1-3) ----
      ws.mergeCells('A1:H1');
      const titleCell = ws.getCell('A1');
      titleCell.value = project?.organisationName?.toUpperCase() || 'PADMINI VNA MECHATRONICS PRIVATE LIMITED';
      titleCell.font = { name: FONT, size: 14, bold: true };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getRow(1).height = 22;

      ws.mergeCells('A2:H2');
      const subtitleCell = ws.getCell('A2');
      subtitleCell.value = 'Process Flow Diagram (PFD)';
      subtitleCell.font = { name: FONT, size: 12, bold: true };
      subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getRow(2).height = 20;

      ws.mergeCells('A3:H3');
      const statusCell = ws.getCell('A3');
      statusCell.value = `(${getStatusLabel() || 'Prototype'})`;
      statusCell.font = { name: FONT, size: 11, italic: true };
      statusCell.alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getRow(3).height = 20;

      // ---- INFO GRID (Rows 4-9) ----
      const infoRows: [string, string, string, string][] = [
        ['Organisation Name:', project?.organisationName || '—', 'Customer Name:', project?.customer || '—'],
        ['Manufacturing Plant:', project?.organisationPlant || '—', 'Document Number:', getDerivedDocNumber()],
        ['Subject (Part Name):', project?.partName || '—', 'Part Number:', project?.orgPartNumber || '—'],
        ['Revision:', `Rev ${project?.revisionNumber || '1.0'} (${getStatusLabel()})`, 'Origination Date:', project?.originationDate ? new Date(project.originationDate).toLocaleDateString() : '—'],
        ['Dwg No.:', project?.dwgNumber || '—', 'Dwg Rev No / Date.:', project?.dwgRevNoAndDate || (project?.drawingRevDate ? new Date(project.drawingRevDate).toLocaleDateString() : '—')],
        ['Assy. Line No.:', project?.assemblyLineNumber || '—', 'CFT Members:', Array.isArray(project?.cftMembers) ? project.cftMembers.join(', ') : (project?.cftMembers || '—')],
      ];

      let r = 4;
      infoRows.forEach(([l1, v1, l2, v2]) => {
        ws.mergeCells(`A${r}:B${r}`);
        const labelCell1 = ws.getCell(`A${r}`);
        labelCell1.value = l1;
        labelCell1.font = { name: FONT, size: 11, bold: true };
        labelCell1.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        labelCell1.border = allBorders();

        ws.mergeCells(`C${r}:D${r}`);
        const valCell1 = ws.getCell(`C${r}`);
        valCell1.value = v1;
        valCell1.font = { name: FONT, size: 11 };
        valCell1.alignment = { horizontal: 'left', vertical: 'middle', indent: 1, wrapText: true };
        valCell1.border = allBorders();

        ws.mergeCells(`E${r}:F${r}`);
        const labelCell2 = ws.getCell(`E${r}`);
        labelCell2.value = l2;
        labelCell2.font = { name: FONT, size: 11, bold: true };
        labelCell2.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        labelCell2.border = allBorders();

        ws.mergeCells(`G${r}:H${r}`);
        const valCell2 = ws.getCell(`G${r}`);
        valCell2.value = v2;
        valCell2.font = { name: FONT, size: 11 };
        valCell2.alignment = { horizontal: 'left', vertical: 'middle', indent: 1, wrapText: true };
        valCell2.border = allBorders();

        ws.getRow(r).height = 20;
        r++;
      });

      // ---- TABLE HEADER (Row 10) ----
      const headerRowIdx = r;
      const COLS = [
        'Step #', 'Process Description', 'Incoming Source of Variation',
        'Spec Class', 'Flow Symbols', 'Machines / Equipment / Docs',
        'Desired Outcome', 'Process Characteristics'
      ];
      const headerRow = ws.getRow(headerRowIdx);
      COLS.forEach((title, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = title;
        cell.font = { name: FONT, size: 11, bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.fill = HEADER_FILL;
        cell.border = allBorders(BORDER_THICK);
      });
      headerRow.height = 30;

      // Freeze panes below the header row
      ws.views = [{ state: 'frozen' as const, ySplit: headerRowIdx }];
      // AutoFilter on header row
      ws.autoFilter = { from: { row: headerRowIdx, column: 1 }, to: { row: headerRowIdx, column: 8 } };

      r = headerRowIdx + 1;

      // ---- DATA ROWS ----
      data.forEach((step) => {
        const row = ws.getRow(r);
        const icons = step.flowIcons || {};
        const activeKeys = Object.keys(icons).filter(k => icons[k]);
        const symbolsText = activeKeys.length > 0 ? activeKeys.map(k => { const m = getPfdIconMeta(k); return `${m.sym} ${m.short}`; }).join(', ') : '—';

        const values = [
          step.stepNumber || '',
          step.name || '',
          arrToText(step.incomingVariation),
          step.specialCharacteristics || '',
          symbolsText,
          arrToText(step.machinesEquipmentDocs),
          arrToText(step.desiredOutcome),
          arrToText(step.processCharacteristics)
        ];

        values.forEach((val, i) => {
          const cell = row.getCell(i + 1);
          cell.value = val;
          cell.font = { name: FONT, size: 11 };
          cell.border = allBorders(BORDER_THIN);
          cell.alignment = {
            vertical: 'middle',
            wrapText: true,
            horizontal: CENTERED_COLS.includes(i) ? 'center' : 'left'
          };
        });

        // Dynamic row height based on wrapped line count
        const maxLines = Math.max(...values.map(v => String(v || '').split('\n').length));
        row.height = Math.max(20, maxLines * 15);
        r++;
      });

      const lastDataRow = r - 1;

      // Apply outer medium border around the entire table (header → last data row)
      for (let c = 1; c <= 8; c++) {
        const topCell = ws.getRow(headerRowIdx).getCell(c);
        topCell.border = { ...topCell.border, top: BORDER_THICK };
        const bottomCell = ws.getRow(lastDataRow).getCell(c);
        bottomCell.border = { ...bottomCell.border, bottom: BORDER_THICK };
      }
      for (let rr = headerRowIdx; rr <= lastDataRow; rr++) {
        const leftCell = ws.getRow(rr).getCell(1);
        leftCell.border = { ...leftCell.border, left: BORDER_THICK };
        const rightCell = ws.getRow(rr).getCell(8);
        rightCell.border = { ...rightCell.border, right: BORDER_THICK };
      }

      // ---- LEGEND ROW ----
      r += 1; // spacer row
      ws.mergeCells(`A${r}:H${r}`);
      const legendCell = ws.getCell(`A${r}`);
      legendCell.value =
        'LEGEND:  Transportation: TRNS (⇨)  |  Storage: STR (▽)  |  Work-In Progress: WIP (⊙)  |  ' +
        'Operation: OPER (○)  |  Inspection: INSP (▭)  |  Decision: DEC (◇)  |  Rework: REW (⬠)  |  Reject: REJ (⬡)';
      legendCell.font = { name: FONT, size: 10, italic: true };
      legendCell.alignment = { horizontal: 'left', vertical: 'middle' };
      ws.getRow(r).height = 20;

      // ---- SIGNATURE ROW (3 fields) ----
      r += 1;
      // Prepared By: (A:B), blank (C), Checked By: (D:E), blank (F), Approved By: (G:H)
      ws.mergeCells(`A${r}:B${r}`);
      const prepCell = ws.getCell(`A${r}`);
      prepCell.value = 'Prepared By:';
      prepCell.font = { name: FONT, size: 11, bold: true };
      prepCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      prepCell.border = allBorders();

      const prepBlank = ws.getCell(`C${r}`);
      prepBlank.border = allBorders();

      ws.mergeCells(`D${r}:E${r}`);
      const checkCell = ws.getCell(`D${r}`);
      checkCell.value = 'Checked By:';
      checkCell.font = { name: FONT, size: 11, bold: true };
      checkCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      checkCell.border = allBorders();

      const checkBlank = ws.getCell(`F${r}`);
      checkBlank.border = allBorders();

      ws.mergeCells(`G${r}:H${r}`);
      const approveCell = ws.getCell(`G${r}`);
      approveCell.value = 'Approved By:';
      approveCell.font = { name: FONT, size: 11, bold: true };
      approveCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      approveCell.border = allBorders();

      ws.getRow(r).height = 25;

      // ---- PRINT SETUP ----
      ws.pageSetup.printArea = `A1:H${r}`;
      ws.pageSetup.printTitlesRow = `${headerRowIdx}:${headerRowIdx}`;

      // ---- WRITE & DOWNLOAD ----
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${projectName.replace(/\s+/g, '_')}_${docType}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    } else if (docType === 'PFMEA') {
      // ============================================================
      // ExcelJS-based PFMEA export with full professional formatting
      // (Same strategy as PFD export — Title → Info → Header → Data → Signature)
      // ============================================================
      const ExcelJS = await import('exceljs');
      const wb = new ExcelJS.Workbook();
      wb.creator = 'PFMEA System';
      wb.created = new Date();

      // -- CONFIG --
      const FONT = 'Calibri';
      const BORDER_THIN: Partial<import('exceljs').Border> = { style: 'thin' as const, color: { argb: 'FF000000' } };
      const BORDER_THICK: Partial<import('exceljs').Border> = { style: 'medium' as const, color: { argb: 'FF000000' } };
      const HEADER_FILL: import('exceljs').FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
      const AP_HIGH_FILL: import('exceljs').FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
      const AP_MED_FILL: import('exceljs').FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
      const AP_LOW_FILL: import('exceljs').FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };

      const PFMEA_COL_WIDTHS = [6, 22, 20, 22, 20, 22, 7, 22, 22, 7, 22, 7, 8, 7, 22, 22, 22, 22, 8, 8, 8, 8, 12, 22];
      const PFMEA_HEADERS = [
        '#', 'Structure / Item', 'Work Element (4M)', 'Function / Focus Element',
        'Failure Mode', 'Potential Effects', 'SEV', 'Failure Causes',
        'Current Control – Prevention', 'OCC', 'Current Control – Detection', 'DET',
        'AP', 'FC', 'Prevention Action', 'Detection Action',
        'Responsibility & Target Date', 'Action Taken & Completion Date',
        'SEV (rev)', 'OCC (rev)', 'DET (rev)', 'AP (rev)', 'Status', 'Remarks'
      ];
      const TOTAL_COLS = PFMEA_HEADERS.length; // 24
      const LAST_COL_LETTER = 'X';
      // Columns that should be center-aligned (0-indexed): #, SEV, OCC, DET, AP, FC, SEV(rev), OCC(rev), DET(rev), AP(rev), Status
      const CENTERED_COLS = [0, 6, 9, 11, 12, 13, 18, 19, 20, 21, 22];

      const allBorders = (style: Partial<import('exceljs').Border> = BORDER_THIN): Partial<import('exceljs').Borders> => ({
        top: style, left: style, bottom: style, right: style
      });

      const stripNum = (s: string) => s.replace(/^\d+[\.)\-]\s*/, '');
      const arrToText = (arr: any): string => {
        if (!arr) return '';
        if (Array.isArray(arr)) {
          const items = arr.map(x => typeof x === 'object' ? (x.name || '') : String(x));
          return items.length > 0 ? items.map((x, i) => `${i + 1}. ${stripNum(x)}`).join('\n') : '';
        }
        if (typeof arr === 'string') {
          try {
            const parsed = JSON.parse(arr);
            if (Array.isArray(parsed)) return arrToText(parsed);
          } catch { /* not JSON */ }
          return arr;
        }
        return String(arr);
      };

      const getApFill = (ap: string | undefined): import('exceljs').FillPattern | undefined => {
        if (!ap) return undefined;
        const clean = ap.trim().toUpperCase();
        if (clean === 'HIGH' || clean === 'H') return AP_HIGH_FILL;
        if (clean === 'MEDIUM' || clean === 'M') return AP_MED_FILL;
        if (clean === 'LOW' || clean === 'L') return AP_LOW_FILL;
        return undefined;
      };

      const getApFontColor = (ap: string | undefined): string => {
        if (!ap) return 'FF0F172A';
        const clean = ap.trim().toUpperCase();
        if (clean === 'HIGH' || clean === 'H') return 'FF991B1B';
        if (clean === 'MEDIUM' || clean === 'M') return 'FF92400E';
        if (clean === 'LOW' || clean === 'L') return 'FF166534';
        return 'FF0F172A';
      };

      const ws = wb.addWorksheet('PFMEA', {
        pageSetup: {
          orientation: 'landscape',
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0,
          margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 }
        }
      });
      ws.columns = PFMEA_COL_WIDTHS.map(width => ({ width }));

      // ---- TITLE BLOCK (Rows 1-3) ----
      ws.mergeCells(`A1:${LAST_COL_LETTER}1`);
      const titleCell = ws.getCell('A1');
      titleCell.value = project?.organisationName?.toUpperCase() || 'ORGANISATION NAME';
      titleCell.font = { name: FONT, size: 14, bold: true };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getRow(1).height = 22;

      ws.mergeCells(`A2:${LAST_COL_LETTER}2`);
      const subtitleCell = ws.getCell('A2');
      subtitleCell.value = 'Process Failure Mode & Effects Analysis (PFMEA)';
      subtitleCell.font = { name: FONT, size: 12, bold: true };
      subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getRow(2).height = 20;

      ws.mergeCells(`A3:${LAST_COL_LETTER}3`);
      const statusCell = ws.getCell('A3');
      statusCell.value = `(${getStatusLabel() || 'Prototype'})`;
      statusCell.font = { name: FONT, size: 11, italic: true };
      statusCell.alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getRow(3).height = 20;

      // ---- INFO GRID (Rows 4-9) — 6 rows × 4 fields spanning 24 columns ----
      // Layout: label (A:D), value (E:L), label (M:P), value (Q:X)
      const infoRows: [string, string, string, string][] = [
        ['Organisation Name:', project?.organisationName || '—', 'Customer Name:', project?.customer || '—'],
        ['Manufacturing Plant:', project?.organisationPlant || '—', 'Document Number:', getDerivedDocNumber()],
        ['Subject (Part Name):', project?.partName || '—', 'Part Number:', project?.orgPartNumber || '—'],
        ['Revision:', `Rev ${project?.revisionNumber || '1.0'} (${getStatusLabel()})`, 'Origination Date:', project?.originationDate ? new Date(project.originationDate).toLocaleDateString() : '—'],
        ['Dwg No.:', project?.dwgNumber || '—', 'Dwg Rev No / Date.:', project?.dwgRevNoAndDate || (project?.drawingRevDate ? new Date(project.drawingRevDate).toLocaleDateString() : '—')],
        ['Assy. Line No.:', project?.assemblyLineNumber || '—', 'CFT Members:', Array.isArray(project?.cftMembers) ? project.cftMembers.join(', ') : (project?.cftMembers || '—')],
      ];

      let r = 4;
      infoRows.forEach(([l1, v1, l2, v2]) => {
        // Label 1: A:D
        ws.mergeCells(`A${r}:D${r}`);
        const labelCell1 = ws.getCell(`A${r}`);
        labelCell1.value = l1;
        labelCell1.font = { name: FONT, size: 11, bold: true };
        labelCell1.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        labelCell1.border = allBorders();

        // Value 1: E:L
        ws.mergeCells(`E${r}:L${r}`);
        const valCell1 = ws.getCell(`E${r}`);
        valCell1.value = v1;
        valCell1.font = { name: FONT, size: 11 };
        valCell1.alignment = { horizontal: 'left', vertical: 'middle', indent: 1, wrapText: true };
        valCell1.border = allBorders();

        // Label 2: M:P
        ws.mergeCells(`M${r}:P${r}`);
        const labelCell2 = ws.getCell(`M${r}`);
        labelCell2.value = l2;
        labelCell2.font = { name: FONT, size: 11, bold: true };
        labelCell2.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        labelCell2.border = allBorders();

        // Value 2: Q:X
        ws.mergeCells(`Q${r}:${LAST_COL_LETTER}${r}`);
        const valCell2 = ws.getCell(`Q${r}`);
        valCell2.value = v2;
        valCell2.font = { name: FONT, size: 11 };
        valCell2.alignment = { horizontal: 'left', vertical: 'middle', indent: 1, wrapText: true };
        valCell2.border = allBorders();

        ws.getRow(r).height = 20;
        r++;
      });

      // ---- TABLE HEADER ----
      const headerRowIdx = r;
      const headerRow = ws.getRow(headerRowIdx);
      PFMEA_HEADERS.forEach((title, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = title;
        cell.font = { name: FONT, size: 11, bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.fill = HEADER_FILL;
        cell.border = allBorders(BORDER_THICK);
      });
      headerRow.height = 30;

      // Freeze panes below the header row
      ws.views = [{ state: 'frozen' as const, ySplit: headerRowIdx }];
      // AutoFilter on header row (24 columns)
      ws.autoFilter = { from: { row: headerRowIdx, column: 1 }, to: { row: headerRowIdx, column: TOTAL_COLS } };

      r = headerRowIdx + 1;

      // ---- DATA ROWS ----
      data.forEach((row) => {
        const excelRow = ws.getRow(r);
        const step = steps?.find(s => s.id === row.processStepId);

        // Work Element — each point on separate line
        let workElementsText = '';
        if (step) {
          if (Array.isArray(step.machinesEquipmentDocs)) {
            workElementsText = step.machinesEquipmentDocs.map((x: string, i: number) => `${i + 1}. ${x.replace(/^\d+[\.)\-]\s*/, '')}`).join('\n');
          } else if (typeof step.machinesEquipmentDocs === 'string' && step.machinesEquipmentDocs) {
            try {
              const parsed = JSON.parse(step.machinesEquipmentDocs);
              workElementsText = Array.isArray(parsed) ? parsed.map((x: string, i: number) => `${i + 1}. ${x.replace(/^\d+[\.)\-]\s*/, '')}`).join('\n') : step.machinesEquipmentDocs;
            } catch {
              workElementsText = step.machinesEquipmentDocs;
            }
          }
        }

        // Responsibility & Target Date combined
        let respTargetDate = row.responsibility || '';
        if (row.targetDate) {
          respTargetDate += (respTargetDate ? '\n' : '') + `Target: ${new Date(row.targetDate).toLocaleDateString()}`;
        }

        // Action Taken & Completion Date combined
        let actionCompDate = row.actionTaken || '';
        if (row.completionDate) {
          actionCompDate += (actionCompDate ? '\n' : '') + `Done: ${new Date(row.completionDate).toLocaleDateString()}`;
        }

        const values = [
          String(row.rowNumber || ''),
          step ? `${step.stepNumber}: ${step.name}` : '',
          workElementsText,
          arrToText(row.functions),
          arrToText(row.failureModes),
          arrToText(row.effects),
          String(row.severity || ''),
          arrToText(row.causes),
          arrToText(row.controls?.filter((c: any) => c.type === 'prevention')),
          String(row.occurrence || ''),
          arrToText(row.controls?.filter((c: any) => c.type === 'detection')),
          String(row.detection || ''),
          row.ap || '',
          row.filterCode || '',
          row.preventionAction || '',
          row.detectionAction || '',
          respTargetDate,
          actionCompDate,
          String(row.revisedSeverity || ''),
          String(row.revisedOccurrence || ''),
          String(row.revisedDetection || ''),
          row.revisedAp || '',
          row.status === 'approved' ? 'Closed' : row.status === 'reviewed' ? 'In Progress' : 'Open',
          row.notes || ''
        ];

        values.forEach((val, i) => {
          const cell = excelRow.getCell(i + 1);
          cell.value = val;
          cell.font = { name: FONT, size: 11, color: { argb: 'FF0F172A' } };
          cell.border = allBorders(BORDER_THIN);
          cell.alignment = {
            vertical: 'middle',
            wrapText: true,
            horizontal: CENTERED_COLS.includes(i) ? 'center' : 'left'
          };

          // AP columns — conditional color fills (col index 12 = AP, 21 = AP rev)
          if (i === 12 || i === 21) {
            const apFill = getApFill(val);
            if (apFill) cell.fill = apFill;
            cell.font = { name: FONT, size: 11, bold: true, color: { argb: getApFontColor(val) } };
          }
        });

        // Dynamic row height based on wrapped line count
        const maxLines = Math.max(...values.map(v => String(v || '').split('\n').length));
        excelRow.height = Math.max(20, maxLines * 15);
        r++;
      });

      const lastDataRow = r - 1;

      // Apply outer medium border around entire table (header → last data row)
      for (let c = 1; c <= TOTAL_COLS; c++) {
        const topCell = ws.getRow(headerRowIdx).getCell(c);
        topCell.border = { ...topCell.border, top: BORDER_THICK };
        const bottomCell = ws.getRow(lastDataRow).getCell(c);
        bottomCell.border = { ...bottomCell.border, bottom: BORDER_THICK };
      }
      for (let rr = headerRowIdx; rr <= lastDataRow; rr++) {
        const leftCell = ws.getRow(rr).getCell(1);
        leftCell.border = { ...leftCell.border, left: BORDER_THICK };
        const rightCell = ws.getRow(rr).getCell(TOTAL_COLS);
        rightCell.border = { ...rightCell.border, right: BORDER_THICK };
      }

      // ---- SIGNATURE ROW ----
      r += 1; // spacer row
      // Prepared By: (A:H), Checked By: (I:P), Approved By: (Q:X)
      ws.mergeCells(`A${r}:H${r}`);
      const prepCell = ws.getCell(`A${r}`);
      prepCell.value = 'Prepared By:';
      prepCell.font = { name: FONT, size: 11, bold: true };
      prepCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      prepCell.border = allBorders();

      ws.mergeCells(`I${r}:P${r}`);
      const checkCell = ws.getCell(`I${r}`);
      checkCell.value = 'Checked By:';
      checkCell.font = { name: FONT, size: 11, bold: true };
      checkCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      checkCell.border = allBorders();

      ws.mergeCells(`Q${r}:${LAST_COL_LETTER}${r}`);
      const approveCell = ws.getCell(`Q${r}`);
      approveCell.value = 'Approved By:';
      approveCell.font = { name: FONT, size: 11, bold: true };
      approveCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      approveCell.border = allBorders();

      ws.getRow(r).height = 25;

      // ---- PRINT SETUP ----
      ws.pageSetup.printArea = `A1:${LAST_COL_LETTER}${r}`;
      ws.pageSetup.printTitlesRow = `${headerRowIdx}:${headerRowIdx}`;

      // ---- WRITE & DOWNLOAD ----
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${projectName.replace(/\s+/g, '_')}_${docType}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    } else if (docType === 'DFMEA') {
      headers = [
        '#', 'Higher Level', 'Focus Element', 'Component Element', 'Functions', 'Requirements',
        'Failure Effects (FE)', 'S', 'Failure Modes (FM)', 'Failure Causes (FC)',
        'Prevention Controls', 'O', 'Detection Controls', 'D', 'AP', 'Notes'
      ];
      data.forEach((row, idx) => {
        const step = steps?.find(s => s.id === row.processStepId);
        let workElements = '';
        if (step) {
          workElements = Array.isArray(step.machinesEquipmentDocs) ? step.machinesEquipmentDocs.join(', ') : (step.machinesEquipmentDocs || '');
        }

        const rowClass = idx % 2 === 0 ? '' : 'class="bg-zebra"';
        tableRowsHtml += `<tr ${rowClass}>`;
        tableRowsHtml += `<td class="text-center">${row.rowNumber}</td>`;
        if (idx === 0) {
          tableRowsHtml += `<td rowspan="${data.length}">${projectName}</td>`;
        }
        if (stepSpans[idx] > 0) {
          tableRowsHtml += `<td rowspan="${stepSpans[idx]}">${step ? `${step.stepNumber} - ${step.name}` : ''}</td>`;
          tableRowsHtml += `<td rowspan="${stepSpans[idx]}">${workElements}</td>`;
        }
        if (funcSpans[idx] > 0) {
          tableRowsHtml += `<td rowspan="${funcSpans[idx]}">${formatExcelList(row.functions)}</td>`;
        }
        if (reqSpans[idx] > 0) {
          tableRowsHtml += `<td rowspan="${reqSpans[idx]}">${formatExcelList(row.requirements)}</td>`;
        }
        
        tableRowsHtml += `<td>${formatExcelList(row.effects)}</td>`;
        tableRowsHtml += `<td class="rating-cell">${row.severity || ''}</td>`;
        tableRowsHtml += `<td>${formatExcelList(row.failureModes)}</td>`;
        tableRowsHtml += `<td>${formatExcelList(row.causes)}</td>`;
        tableRowsHtml += `<td>${formatExcelList(row.controls?.filter((c: any) => c.type === 'prevention'))}</td>`;
        tableRowsHtml += `<td class="rating-cell">${row.occurrence || ''}</td>`;
        tableRowsHtml += `<td>${formatExcelList(row.controls?.filter((c: any) => c.type === 'detection'))}</td>`;
        tableRowsHtml += `<td class="rating-cell">${row.detection || ''}</td>`;
        
        const apVal = row.ap || '';
        tableRowsHtml += `<td ${getApStyleClass(apVal)}>${apVal}</td>`;
        tableRowsHtml += `<td>${row.notes || ''}</td>`;
        tableRowsHtml += '</tr>';
      });
    } else if (docType === 'CONTROL_PLAN') {
      headers = [
        '#', 'Source', 'Process Step', 'Machine / Equipment', 'Characteristics', 'Classification',
        'Spec / Tolerance', 'Measurement Method', 'Sample Size', 'Frequency', 'Control Type',
        'Control Method', 'Reaction Plan', 'Responsible'
      ];
      data.forEach((row, idx) => {
        const step = steps?.find(s => s.id === row.processStepId);
        const sourceLabel = row.linkedPfmeaRows && row.linkedPfmeaRows.length > 0 ? 'FMEA' : 'PFD';
        const rowClass = idx % 2 === 0 ? '' : 'class="bg-zebra"';
        
        tableRowsHtml += `<tr ${rowClass}>`;
        tableRowsHtml += `<td class="text-center">${row.rowNumber}</td>`;
        tableRowsHtml += `<td class="text-center">${sourceLabel}</td>`;
        if (stepSpans[idx] > 0) {
          tableRowsHtml += `<td rowspan="${stepSpans[idx]}">${step ? `${step.stepNumber} - ${step.name}` : ''}</td>`;
          tableRowsHtml += `<td rowspan="${stepSpans[idx]}">${row.machinesEquipmentDocs || ''}</td>`;
        }
        tableRowsHtml += `<td>${row.characteristicName || ''}</td>`;
        tableRowsHtml += `<td class="text-center text-bold">${row.characteristicClassification || ''}</td>`;
        tableRowsHtml += `<td>${row.specTolerance || ''}</td>`;
        tableRowsHtml += `<td>${row.measurementMethod || ''}</td>`;
        tableRowsHtml += `<td>${row.sampleSize || ''}</td>`;
        tableRowsHtml += `<td>${row.frequency || ''}</td>`;
        tableRowsHtml += `<td>${row.controlType || ''}</td>`;
        tableRowsHtml += `<td>${row.controlMethod || ''}</td>`;
        tableRowsHtml += `<td>${row.reactionPlan || ''}</td>`;
        tableRowsHtml += `<td>${row.responsible || ''}</td>`;
        tableRowsHtml += '</tr>';
      });
    }

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>${docType} Export</x:Name>
                  <x:WorksheetOptions>
                    <x:DisplayGridlines/>
                  </x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
          <style>
            body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #0F172A; }
            table { border-collapse: collapse; }
            th {
              background-color: #0F172A;
              color: #ffffff;
              font-weight: bold;
              font-size: 10.5pt;
              border: 0.5pt solid #94A3B8;
              padding: 8px 6px;
              text-align: left;
            }
            td {
              font-size: 9.5pt;
              border: 0.5pt solid #CBD5E1;
              padding: 6px;
              vertical-align: top;
              mso-number-format: "\\@";
            }
            .text-center { text-align: center; }
            .text-bold { font-weight: bold; }
            .bg-zebra { background-color: #F8FAFC; }
            .rating-cell { font-weight: bold; text-align: center; }
            .ap-high { background-color: #FEE2E2; color: #991B1B; font-weight: bold; text-align: center; }
            .ap-medium { background-color: #FEF3C7; color: #92400E; font-weight: bold; text-align: center; }
            .ap-low { background-color: #DCFCE7; color: #166534; font-weight: bold; text-align: center; }
          </style>
        </head>
        <body>
          <h2>${projectName} — ${getDocTypeName()}</h2>
          <p>Exported on: ${new Date().toLocaleDateString()}</p>
          ${project ? `
            <table style="margin-bottom: 20px; border-collapse: collapse;">
              <tr>
                <td colspan="2" style="font-weight: bold; background-color: #f1f5f9; border: 0.5pt solid #cbd5e1;">Company Name:</td>
                <td colspan="2" style="border: 0.5pt solid #cbd5e1;">${project.organisationName || '—'}</td>
                <td colspan="2" style="font-weight: bold; background-color: #f1f5f9; border: 0.5pt solid #cbd5e1;">Customer Name:</td>
                <td colspan="2" style="border: 0.5pt solid #cbd5e1;">${project.customer || '—'}</td>
              </tr>
              <tr>
                <td colspan="2" style="font-weight: bold; background-color: #f1f5f9; border: 0.5pt solid #cbd5e1;">Manufacturing Plant:</td>
                <td colspan="2" style="border: 0.5pt solid #cbd5e1;">${project.organisationPlant || '—'}</td>
                <td colspan="2" style="font-weight: bold; background-color: #f1f5f9; border: 0.5pt solid #cbd5e1;">Document Number:</td>
                <td colspan="2" style="border: 0.5pt solid #cbd5e1;">${getDerivedDocNumber()}</td>
              </tr>
              <tr>
                <td colspan="2" style="font-weight: bold; background-color: #f1f5f9; border: 0.5pt solid #cbd5e1;">Subject (Part Name):</td>
                <td colspan="2" style="border: 0.5pt solid #cbd5e1;">${project.partName || '—'}</td>
                <td colspan="2" style="font-weight: bold; background-color: #f1f5f9; border: 0.5pt solid #cbd5e1;">Part Number:</td>
                <td colspan="2" style="border: 0.5pt solid #cbd5e1;">${project.orgPartNumber || '—'}</td>
              </tr>
              <tr>
                <td colspan="2" style="font-weight: bold; background-color: #f1f5f9; border: 0.5pt solid #cbd5e1;">Revision / Status:</td>
                <td colspan="2" style="border: 0.5pt solid #cbd5e1;">Rev ${project.revisionNumber || '1.0'} (${getStatusLabel()})</td>
                <td colspan="2" style="font-weight: bold; background-color: #f1f5f9; border: 0.5pt solid #cbd5e1;">Origination Date:</td>
                <td colspan="2" style="border: 0.5pt solid #cbd5e1;">${project.originationDate ? new Date(project.originationDate).toLocaleDateString() : '—'}</td>
              </tr>
            </table>
          ` : ''}
          <table style="border-collapse: collapse;">
            <thead>
              <tr>
                ${headers.map(h => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>
        </body>
      </html>
    `;

    // Parse HTML template and convert to genuine OpenXML .xlsx binary workbook
    const tempDiv = document.createElement('div');
    tempDiv.style.display = 'none';
    tempDiv.innerHTML = excelTemplate;
    document.body.appendChild(tempDiv);

    try {
      const wb = XLSX.utils.table_to_book(tempDiv, { sheet: `${docType} Report` });
      document.body.removeChild(tempDiv);

      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${projectName.replace(/\s+/g, '_')}_${docType}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      if (document.body.contains(tempDiv)) {
        document.body.removeChild(tempDiv);
      }
      console.error('Failed to export native .xlsx workbook:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const paperSizesCss = {
    A3: '@page { size: 420mm 297mm; margin: 10mm; }',
    A2: '@page { size: 594mm 420mm; margin: 10mm; }',
    A1: '@page { size: 841mm 594mm; margin: 10mm; }',
    A0: '@page { size: 1189mm 841mm; margin: 10mm; }'
  };

  const watermarkText = getWatermarkText();

  // Reset view mode on close
  const handleCloseDialog = () => {
    setExportMode('options');
    onClose();
  };

  return (
    <>
      {/* 1. Options Modal */}
      <Dialog open={open && exportMode === 'options'} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Export Document Options</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl>
              <FormLabel sx={{ fontWeight: 'bold', mb: 1 }}>Paper Size (For PDF & Print)</FormLabel>
              <Select
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value as any)}
                size="small"
                fullWidth
              >
                <MenuItem value="A3">A3 Landscape (Recommended)</MenuItem>
                <MenuItem value="A2">A2 Landscape (Large Grid)</MenuItem>
                <MenuItem value="A1">A1 Landscape (Very Large)</MenuItem>
                <MenuItem value="A0">A0 Landscape (Engineering Size)</MenuItem>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel sx={{ fontWeight: 'bold', mb: 1 }}>Watermark Options</FormLabel>
              <RadioGroup value={watermarkOption} onChange={(e) => setWatermarkOption(e.target.value as any)}>
                <FormControlLabel value="none" control={<Radio />} label="No Watermark" />
                <FormControlLabel value="draft" control={<Radio />} label="DRAFT Watermark" />
                <FormControlLabel value="confidential" control={<Radio />} label="CONFIDENTIAL Watermark" />
                <FormControlLabel value="custom" control={<Radio />} label="Custom Watermark Text" />
              </RadioGroup>
            </FormControl>

            {watermarkOption === 'custom' && (
              <TextField
                label="Custom Watermark text"
                value={customWatermark}
                onChange={(e) => setCustomWatermark(e.target.value)}
                placeholder="e.g. INTERNAL ONLY"
                size="small"
                fullWidth
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={handleCloseDialog} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleExportExcel}
            variant="outlined"
            color="success"
            startIcon={<DownloadIcon />}
          >
            Excel Export
          </Button>
          <Button
            onClick={() => setExportMode('preview')}
            variant="contained"
            color="primary"
            startIcon={<PreviewIcon />}
          >
            Print Preview
          </Button>
        </DialogActions>
      </Dialog>

      {/* 2. Full-Screen Print Preview Modal */}
      <Dialog
        fullScreen
        open={open && exportMode === 'preview'}
        onClose={() => setExportMode('options')}
      >
        {/* Style block specifically for Print Media queries */}
        <style>
          {`
            @media print {
              body {
                background: none !important;
                color: #000 !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              #root {
                display: none !important;
              }
              /* Reset MUI Dialog overlay wrappers for absolute static flow */
              .MuiDialog-root,
              .MuiDialog-container,
              .MuiDialog-paper {
                position: static !important;
                display: block !important;
                width: 100% !important;
                height: auto !important;
                max-width: none !important;
                max-height: none !important;
                overflow: visible !important;
                box-shadow: none !important;
                background: none !important;
              }
              .MuiBackdrop-root {
                display: none !important;
              }
              /* Display only the print preview content */
              .print-preview-root {
                display: block !important;
                position: static !important;
                width: 100% !important;
                height: auto !important;
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
                overflow: visible !important;
              }
              .print-toolbar {
                display: none !important;
              }
              .print-preview-card {
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              ${paperSizesCss[paperSize]}
            }
          `}
        </style>

        {/* Floating print preview toolbar */}
        <Box
          className="print-toolbar"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            py: 1.5,
            borderBottom: '1px solid #cbd5e1',
            bgcolor: '#0F172A',
            color: 'white',
            zIndex: 1000
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            Print Preview — {getDocTypeName()}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControl size="small" variant="outlined" sx={{ minWidth: 150 }}>
              <InputLabel sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>Paper Size</InputLabel>
              <Select
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value as any)}
                label="Paper Size"
                size="small"
                sx={{
                  color: 'white',
                  fontSize: '0.8rem',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' }
                }}
              >
                <MenuItem value="A3">A3 Landscape (Default)</MenuItem>
                <MenuItem value="A2">A2 Landscape</MenuItem>
                <MenuItem value="A1">A1 Landscape</MenuItem>
                <MenuItem value="A0">A0 Landscape</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              color="inherit"
              onClick={handleExportExcel}
              startIcon={<DownloadIcon />}
              sx={{ borderColor: 'rgba(255,255,255,0.3)', textTransform: 'none', color: 'white' }}
            >
              Export Excel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handlePrint}
              startIcon={<PrintIcon />}
              sx={{ textTransform: 'none' }}
            >
              Print / Save PDF
            </Button>
            <IconButton onClick={() => setExportMode('options')} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Printable/Preview container */}
        <DialogContent
          className="print-preview-root"
          sx={{
            p: 4,
            bgcolor: '#e2e8f0',
            overflowY: 'auto',
            display: 'flex',
            justifyContent: 'center',
            position: 'relative'
          }}
        >
          {/* Watermark overlay */}
          {watermarkText && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(-45deg)',
                fontSize: '8rem',
                color: 'rgba(148, 163, 184, 0.15)',
                fontWeight: 900,
                textTransform: 'uppercase',
                pointerEvents: 'none',
                zIndex: 9999,
                userSelect: 'none',
                whiteSpace: 'nowrap'
              }}
            >
              {watermarkText}
            </Box>
          )}

          {/* Actual spreadsheet paper preview */}
          <Card
            className="print-preview-card"
            sx={{
              width: '100%',
              maxWidth: '1600px',
              p: 4,
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
              borderRadius: 3,
              bgcolor: 'white',
              display: 'flex',
              flexDirection: 'column',
              gap: 3
            }}
          >
            {/* Header info — 3 Separate Top Rows */}
            <Box sx={{ borderBottom: '2px solid #0F172A', pb: 2, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: '900', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                PADMINI VNA MECHATRONICS PRIVATE LIMITED
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1E293B', mt: 0.5 }}>
                {getDocTypeName()}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: '600', color: '#64748B', mt: 0.25 }}>
                ({getStatusLabel()})
              </Typography>
            </Box>

            {/* Document Header Grid Display — 6 Rows, Clean White Cells (No Color Fill) */}
            {project && (
              <Box sx={{ border: '1px solid #000000', bgcolor: '#ffffff' }}>
                <Grid container sx={{ fontSize: '0.8rem', '& .MuiGrid-root': { borderBottom: '1px solid #000000', borderRight: '1px solid #000000', p: 1 } }}>
                  {/* Row 1 */}
                  <Grid size={3} sx={{ bgcolor: '#ffffff' }}>
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold', color: '#000000' }}>Organisation Name:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#000000' }}>{project.organisationName || '—'}</Typography>
                  </Grid>
                  <Grid size={9} sx={{ bgcolor: '#ffffff' }}>
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold', color: '#000000' }}>Customer Name:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#000000' }}>{project.customer || '—'}</Typography>
                  </Grid>

                  {/* Row 2 */}
                  <Grid size={3} sx={{ bgcolor: '#ffffff' }}>
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold', color: '#000000' }}>Manufacturing Plant:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#000000' }}>{project.organisationPlant || '—'}</Typography>
                  </Grid>
                  <Grid size={9} sx={{ bgcolor: '#ffffff' }}>
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold', color: '#000000' }}>Document Number:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#000000' }}>{getDerivedDocNumber()}</Typography>
                  </Grid>

                  {/* Row 3 */}
                  <Grid size={3} sx={{ bgcolor: '#ffffff' }}>
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold', color: '#000000' }}>Subject (Part Name):</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#000000' }}>{project.partName || '—'}</Typography>
                  </Grid>
                  <Grid size={9} sx={{ bgcolor: '#ffffff' }}>
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold', color: '#000000' }}>Part Number:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#000000' }}>{project.orgPartNumber || '—'}</Typography>
                  </Grid>

                  {/* Row 4 */}
                  <Grid size={3} sx={{ bgcolor: '#ffffff' }}>
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold', color: '#000000' }}>Revision:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#000000' }}>Rev {project.revisionNumber || '1.0'} ({getStatusLabel()})</Typography>
                  </Grid>
                  <Grid size={9} sx={{ bgcolor: '#ffffff' }}>
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold', color: '#000000' }}>Origination Date:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#000000' }}>{project.originationDate ? new Date(project.originationDate).toLocaleDateString() : '—'}</Typography>
                  </Grid>

                  {/* Row 5 */}
                  <Grid size={3} sx={{ bgcolor: '#ffffff' }}>
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold', color: '#000000' }}>Dwg No.:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#000000' }}>{project.dwgNumber || '—'}</Typography>
                  </Grid>
                  <Grid size={9} sx={{ bgcolor: '#ffffff' }}>
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold', color: '#000000' }}>Dwg Rev No / Date.:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#000000' }}>{project.dwgRevNoAndDate || (project.drawingRevDate ? new Date(project.drawingRevDate).toLocaleDateString() : '—')}</Typography>
                  </Grid>

                  {/* Row 6 */}
                  <Grid size={3} sx={{ bgcolor: '#ffffff', borderBottom: 'none' }}>
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold', color: '#000000' }}>Assy. Line No.:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#000000' }}>{project.assemblyLineNumber || '—'}</Typography>
                  </Grid>
                  <Grid size={9} sx={{ bgcolor: '#ffffff', borderBottom: 'none' }}>
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold', color: '#000000' }}>CFT Members:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#000000' }}>{Array.isArray(project.cftMembers) ? project.cftMembers.join(', ') : (project.cftMembers || '—')}</Typography>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Document Table Render */}
            <TableContainer component={Box} sx={{ border: '1px solid #cbd5e1', borderRadius: 2, overflow: 'auto' }}>
              <Table size="small" sx={{ borderCollapse: 'collapse', '& th, & td': { border: '1px solid #cbd5e1', p: 1 } }}>
                <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                  <TableRow>
                    {docType === 'PFD' && (
                      <>
                        <TableCell sx={{ fontWeight: 'bold' }}>Step #</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Process Description</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Incoming Variation</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Spec Class</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Flow Symbols</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Machines/Equipment/Docs</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Desired Outcome</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Process Characteristics</TableCell>
                      </>
                    )}
                    {docType === 'PFMEA' && (
                      <>
                        <TableCell sx={{ fontWeight: 'bold', width: 40 }}>#</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Structure / Item</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Work Element (4M)</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Function / Focus Element</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Failure Mode</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Potential Effects</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: 30 }}>SEV</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Failure Causes</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Prevention Controls</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: 30 }}>OCC</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Detection Controls</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: 30 }}>DET</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: 40 }}>AP</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: 30 }}>FC</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Prevention Action</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Detection Action</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Resp & Target Date</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Action Taken</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: 30 }}>SEV (rev)</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: 30 }}>OCC (rev)</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: 30 }}>DET (rev)</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: 40 }}>AP (rev)</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Remarks</TableCell>
                      </>
                    )}
                    {docType === 'DFMEA' && (
                      <>
                        <TableCell sx={{ fontWeight: 'bold', width: 40 }}>#</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Higher Level</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Focus Element</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Component Element</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Functions</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Requirements</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Failure Effects</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: 30 }}>S</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Failure Modes</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Failure Causes</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Prevention Controls</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: 30 }}>O</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Detection Controls</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: 30 }}>D</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: 40 }}>AP</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Notes</TableCell>
                      </>
                    )}
                    {docType === 'CONTROL_PLAN' && (
                      <>
                        <TableCell sx={{ fontWeight: 'bold', width: 40 }}>#</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: 50 }}>Source</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Process Step</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Machine / Equipment</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Characteristics</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: 55 }}>Class</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Spec / Tolerance</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Method</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Sample Size</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Frequency</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Control Type</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Control Method</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Reaction Plan</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Responsible</TableCell>
                      </>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody sx={{ fontSize: '0.75rem' }}>
                  {data.map((row, idx) => {
                    const step = steps?.find(s => s.id === row.processStepId);
                    
                    return (
                      <TableRow key={idx}>
                        {docType === 'PFD' && (
                          <>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>{row.stepNumber || ''}</TableCell>
                            <TableCell>{row.name || ''}</TableCell>
                            <TableCell>{renderPdfList(row.incomingVariation)}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{row.specialCharacteristics || ''}</TableCell>
                            <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle', p: 1 }}>
                               <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%', minHeight: 32 }}>
                                 <Stack direction="row" spacing={0.75} sx={{ justifyContent: 'center', alignItems: 'center' }}>
                                   {Object.keys(row.flowIcons || {}).filter(k => row.flowIcons[k]).map(key => {
                                     const meta = getPfdIconMeta(key);
                                     return (
                                       <Tooltip key={key} title={meta.label} arrow>
                                         <Box
                                           sx={{
                                             display: 'inline-flex',
                                             alignItems: 'center',
                                             justifyContent: 'center',
                                             width: 24,
                                             height: 24,
                                             borderRadius: '50%',
                                             bgcolor: '#ffffff',
                                             border: '1.5px solid #0f172a',
                                             boxShadow: '0 2px 4px rgba(15, 23, 42, 0.08)'
                                           }}
                                         >
                                           <Box
                                             component="img"
                                             src={meta.iconPath}
                                             alt={meta.label}
                                             sx={{ width: 14, height: 14 }}
                                           />
                                         </Box>
                                       </Tooltip>
                                     );
                                   })}
                                 </Stack>
                               </Box>
                             </TableCell>
                            <TableCell>{renderPdfList(row.machinesEquipmentDocs)}</TableCell>
                            <TableCell>{renderPdfList(row.desiredOutcome)}</TableCell>
                            <TableCell>{renderPdfList(row.processCharacteristics)}</TableCell>
                          </>
                        )}
                        {docType === 'PFMEA' && (
                          <>
                            <TableCell sx={{ textAlign: 'center' }}>{row.rowNumber}</TableCell>
                            <TableCell>{step ? `${step.stepNumber} - ${step.name}` : ''}</TableCell>
                            <TableCell>{step ? (Array.isArray(step.machinesEquipmentDocs) ? step.machinesEquipmentDocs.join(', ') : (step.machinesEquipmentDocs || '')) : ''}</TableCell>
                            <TableCell>{row.functions?.map((f: any) => f.name).join(', ') || ''}</TableCell>
                            <TableCell>{row.failureModes?.map((fm: any) => fm.name).join(', ') || ''}</TableCell>
                            <TableCell>{row.effects?.map((e: any) => e.name).join(', ') || ''}</TableCell>
                            <TableCell sx={{ textAlign: 'center', fontWeight: 'bold' }}>{row.severity || ''}</TableCell>
                            <TableCell>{row.causes?.map((c: any) => c.name).join(', ') || ''}</TableCell>
                            <TableCell>{row.controls?.filter((c: any) => c.type === 'prevention').map((c: any) => c.name).join(', ') || ''}</TableCell>
                            <TableCell sx={{ textAlign: 'center', fontWeight: 'bold' }}>{row.occurrence || ''}</TableCell>
                            <TableCell>{row.controls?.filter((c: any) => c.type === 'detection').map((c: any) => c.name).join(', ') || ''}</TableCell>
                            <TableCell sx={{ textAlign: 'center', fontWeight: 'bold' }}>{row.detection || ''}</TableCell>
                            <TableCell sx={{
                              textAlign: 'center',
                              fontWeight: 'bold',
                              bgcolor: row.ap === 'High' ? '#fee2e2' : row.ap === 'Medium' ? '#fef3c7' : row.ap === 'Low' ? '#dcfce7' : 'transparent',
                              color: row.ap === 'High' ? '#991b1b' : row.ap === 'Medium' ? '#92400e' : row.ap === 'Low' ? '#166534' : 'inherit'
                            }}>{row.ap || ''}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{row.filterCode || ''}</TableCell>
                            <TableCell>{row.preventionAction || ''}</TableCell>
                            <TableCell>{row.detectionAction || ''}</TableCell>
                            <TableCell>{row.responsibility || ''}</TableCell>
                            <TableCell>{row.actionTaken || ''}</TableCell>
                            <TableCell sx={{ textAlign: 'center', fontWeight: 'bold' }}>{row.revisedSeverity || ''}</TableCell>
                            <TableCell sx={{ textAlign: 'center', fontWeight: 'bold' }}>{row.revisedOccurrence || ''}</TableCell>
                            <TableCell sx={{ textAlign: 'center', fontWeight: 'bold' }}>{row.revisedDetection || ''}</TableCell>
                            <TableCell sx={{
                              textAlign: 'center',
                              fontWeight: 'bold',
                              bgcolor: row.revisedAp === 'High' ? '#fee2e2' : row.revisedAp === 'Medium' ? '#fef3c7' : row.revisedAp === 'Low' ? '#dcfce7' : 'transparent',
                              color: row.revisedAp === 'High' ? '#991b1b' : row.revisedAp === 'Medium' ? '#92400e' : row.revisedAp === 'Low' ? '#166534' : 'inherit'
                            }}>{row.revisedAp || ''}</TableCell>
                            <TableCell>{row.status === 'approved' ? 'Closed' : row.status === 'reviewed' ? 'In Progress' : 'Open'}</TableCell>
                            <TableCell>{row.notes || ''}</TableCell>
                          </>
                        )}
                        {docType === 'DFMEA' && (
                          <>
                            <TableCell sx={{ textAlign: 'center' }}>{row.rowNumber}</TableCell>
                            <TableCell>{projectName}</TableCell>
                            <TableCell>{step ? `${step.stepNumber} - ${step.name}` : ''}</TableCell>
                            <TableCell>{step ? (Array.isArray(step.machinesEquipmentDocs) ? step.machinesEquipmentDocs.join(', ') : (step.machinesEquipmentDocs || '')) : ''}</TableCell>
                            <TableCell>{row.functions?.map((f: any) => f.name).join(', ') || ''}</TableCell>
                            <TableCell>{row.requirements?.map((req: any) => req.name).join(', ') || ''}</TableCell>
                            <TableCell>{row.effects?.map((e: any) => e.name).join(', ') || ''}</TableCell>
                            <TableCell sx={{ textAlign: 'center', fontWeight: 'bold' }}>{row.severity || ''}</TableCell>
                            <TableCell>{row.failureModes?.map((fm: any) => fm.name).join(', ') || ''}</TableCell>
                            <TableCell>{row.causes?.map((c: any) => c.name).join(', ') || ''}</TableCell>
                            <TableCell>{row.controls?.filter((c: any) => c.type === 'prevention').map((c: any) => c.name).join(', ') || ''}</TableCell>
                            <TableCell sx={{ textAlign: 'center', fontWeight: 'bold' }}>{row.occurrence || ''}</TableCell>
                            <TableCell>{row.controls?.filter((c: any) => c.type === 'detection').map((c: any) => c.name).join(', ') || ''}</TableCell>
                            <TableCell sx={{ textAlign: 'center', fontWeight: 'bold' }}>{row.detection || ''}</TableCell>
                            <TableCell sx={{
                              textAlign: 'center',
                              fontWeight: 'bold',
                              bgcolor: row.ap === 'High' ? '#fee2e2' : row.ap === 'Medium' ? '#fef3c7' : row.ap === 'Low' ? '#dcfce7' : 'transparent',
                              color: row.ap === 'High' ? '#991b1b' : row.ap === 'Medium' ? '#92400e' : row.ap === 'Low' ? '#166534' : 'inherit'
                            }}>{row.ap || ''}</TableCell>
                            <TableCell>{row.notes || ''}</TableCell>
                          </>
                        )}
                        {docType === 'CONTROL_PLAN' && (
                          <>
                            <TableCell sx={{ textAlign: 'center' }}>{row.rowNumber}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{row.linkedPfmeaRows && row.linkedPfmeaRows.length > 0 ? 'FMEA' : 'PFD'}</TableCell>
                            <TableCell>{step ? `${step.stepNumber} - ${step.name}` : ''}</TableCell>
                            <TableCell>{row.machinesEquipmentDocs || ''}</TableCell>
                            <TableCell>{row.characteristicName || ''}</TableCell>
                            <TableCell sx={{ textAlign: 'center', fontWeight: 'bold' }}>{row.characteristicClassification || ''}</TableCell>
                            <TableCell>{row.specTolerance || ''}</TableCell>
                            <TableCell>{row.measurementMethod || ''}</TableCell>
                            <TableCell>{row.sampleSize || ''}</TableCell>
                            <TableCell>{row.frequency || ''}</TableCell>
                            <TableCell>{row.controlType || ''}</TableCell>
                            <TableCell>{row.controlMethod || ''}</TableCell>
                            <TableCell>{row.reactionPlan || ''}</TableCell>
                            <TableCell>{row.responsible || ''}</TableCell>
                          </>
                        )}
                      </TableRow>
                    );
                  })}
                  {/* 4 Trailing Blank Rows for PFD */}
                  {docType === 'PFD' && [1, 2, 3, 4].map(bIdx => (
                    <TableRow key={`blank-${bIdx}`} sx={{ height: 28 }}>
                      <TableCell>&nbsp;</TableCell>
                      <TableCell>&nbsp;</TableCell>
                      <TableCell>&nbsp;</TableCell>
                      <TableCell>&nbsp;</TableCell>
                      <TableCell>&nbsp;</TableCell>
                      <TableCell>&nbsp;</TableCell>
                      <TableCell>&nbsp;</TableCell>
                      <TableCell>&nbsp;</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Footer Section for PFD — 8-Icon Legend & Sign-Off Row */}
            {docType === 'PFD' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
                {/* 8-Icon Legend Bar */}
                <Box sx={{ border: '1px solid #000000', bgcolor: '#ffffff', p: 1, display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  {[
                    { key: 'trans', label: 'Transportation', short: 'TRNS', sym: '⇨', path: '/icons/pfd/transportation.svg' },
                    { key: 'store', label: 'Storage', short: 'STR', sym: '▽', path: '/icons/pfd/Storage.svg' },
                    { key: 'wip', label: 'Work-In Progress', short: 'WIP', sym: '☉', path: '/icons/pfd/WIP.svg' },
                    { key: 'oper', label: 'Operation', short: 'OPER', sym: '◯', path: '/icons/pfd/operation.svg' },
                    { key: 'insp', label: 'Inspection', short: 'INSP', sym: '□', path: '/icons/pfd/inspect.svg' },
                    { key: 'decs', label: 'Decision', short: 'DEC', sym: '◇', path: '/icons/pfd/Decision.svg' },
                    { key: 'rework', label: 'Rework', short: 'REW', sym: 'Ⓡ', path: '/icons/pfd/rework.svg' },
                    { key: 'reject', label: 'Reject', short: 'REJ', sym: '✕', path: '/icons/pfd/reject.svg' },
                  ].map((item) => (
                    <Box key={item.key} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                      <Box
                        sx={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          bgcolor: '#ffffff',
                          border: '1px solid #0f172a',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Box component="img" src={item.path} alt={item.label} sx={{ width: 11, height: 11 }} />
                      </Box>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: '0.75rem', color: '#000000' }}>
                        {item.label}: {item.short} ({item.sym})
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {/* Sign-Off Block */}
                <Box sx={{ border: '1px solid #000000', bgcolor: '#ffffff', p: 1.5 }}>
                  <Grid container spacing={2}>
                    <Grid size={4}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#000000' }}>
                        Prepared By: ____________________
                      </Typography>
                    </Grid>
                    <Grid size={4}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#000000' }}>
                        Checked By: ____________________
                      </Typography>
                    </Grid>
                    <Grid size={4}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#000000' }}>
                        Approved By: ____________________
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            )}
          </Card>
        </DialogContent>
      </Dialog>
    </>
  );
};
