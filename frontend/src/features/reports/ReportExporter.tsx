import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  RadioGroup, FormControlLabel, Radio, TextField, Stack,
  FormControl, FormLabel
} from '@mui/material';
import {
  Download as DownloadIcon
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

  const handleExportPdf = async () => {
    const wmText = getWatermarkText();
    await generatePdf(wmText);
    onClose();
  };

  const generatePdf = async (watermark: string) => {
    let headers: string[] = [];
    let rowsData: string[][] = [];

    if (docType === 'PFD') {
      headers = ['Step #', 'Process Step / Operation Description', 'Flow Symbols', 'Machine, Device, Jig, Tools', 'Characteristics / Special Char'];
      const rawSteps = steps && steps.length > 0 ? steps : data;
      rowsData = (rawSteps || []).map((step: any, index: number) => {
        let symbolsText = '—';
        if (step.category) {
          const meta = getPfdIconMeta(step.category);
          symbolsText = `${meta.symbol} (${meta.label})`;
        }
        let machinesText = '—';
        if (Array.isArray(step.machinesEquipmentDocs) && step.machinesEquipmentDocs.length > 0) {
          machinesText = step.machinesEquipmentDocs.map((m: any) => typeof m === 'string' ? m : (m.name || m.narration || '')).filter(Boolean).join('<br/>');
        } else if (typeof step.machinesEquipmentDocs === 'string' && step.machinesEquipmentDocs.trim()) {
          machinesText = step.machinesEquipmentDocs;
        }
        return [
          step.stepNumber ? String(step.stepNumber) : String(index + 1),
          step.name || step.description || '—',
          symbolsText,
          machinesText,
          step.specialCharacteristics || '—',
        ];
      });
    } else if (docType === 'PFMEA' || docType === 'DFMEA') {
      headers = [
        'Process Step / Function',
        'Failure Mode',
        'Failure Effect',
        'S',
        'Failure Cause',
        'O',
        'Prevention Control',
        'Detection Control',
        'D',
        'AP',
        'Action Prevention',
        'Action Detection',
        'Resp & Target',
        'Action Taken & Date',
        'S (rev)',
        'O (rev)',
        'D (rev)',
        'AP (rev)',
        'Status'
      ];
      rowsData = (data || []).map((row: any) => [
        row.processStepName || row.functionNarration || '—',
        row.failureModeNarration || '—',
        row.failureEffectNarration || '—',
        String(row.severityRating || '—'),
        row.failureCauseNarration || '—',
        String(row.occurrenceRating || '—'),
        row.currentControlPrevention || '—',
        row.currentControlDetection || '—',
        String(row.detectionRating || '—'),
        row.actionPriority || '—',
        row.preventionAction || '—',
        row.detectionAction || '—',
        row.responsibility && row.targetDate ? `${row.responsibility} (${row.targetDate})` : '—',
        row.actionTaken && row.completionDate ? `${row.actionTaken} (${row.completionDate})` : '—',
        String(row.revisedSeverity || '—'),
        String(row.revisedOccurrence || '—'),
        String(row.revisedDetection || '—'),
        row.revisedAp || '—',
        row.status || 'Open',
      ]);
    } else if (docType === 'CONTROL_PLAN') {
      headers = [
        'Step #',
        'Process Name / Operation Description',
        'Machine, Device, Jig, Tools',
        'Product / Process Characteristic',
        'Special Char',
        'Methods of Control',
        'Sample Size / Freq',
        'Control Method',
        'Reaction Plan'
      ];
      rowsData = (data || []).map((row: any, index: number) => [
        String(row.stepNumber || index + 1),
        row.processStepName || '—',
        row.machineEquipment || '—',
        row.characteristic || '—',
        row.specialChar || '—',
        row.methodOfControl || '—',
        row.sampleSizeFreq || '—',
        row.controlMethod || '—',
        row.reactionPlan || '—',
      ]);
    }

    const tableRowsHtml = rowsData.map(row => `
      <tr>
        ${row.map(cell => `<td style="border: 0.5pt solid #cbd5e1; padding: 6px; font-size: 11px;">${cell}</td>`).join('')}
      </tr>
    `).join('');

    const pdfHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${projectName} — ${getDocTypeName()}</title>
          <style>
            @page { size: landscape; margin: 10mm; }
            body { font-family: Arial, sans-serif; margin: 10px; color: #1e293b; position: relative; }
            h2 { color: #0f172a; margin-bottom: 4px; }
            p { color: #64748b; font-size: 12px; margin-top: 0; margin-bottom: 12px; }
            table { border-collapse: collapse; width: 100%; font-size: 11px; margin-top: 10px; }
            th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; vertical-align: top; }
            th { background-color: #0b5563; color: #ffffff; font-weight: bold; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .meta-table { margin-bottom: 16px; width: 100%; border-collapse: collapse; }
            .meta-table td { padding: 5px 8px; font-size: 11px; }
            .watermark {
              position: fixed;
              top: 35%;
              left: 10%;
              width: 80%;
              text-align: center;
              font-size: 5rem;
              font-weight: 900;
              color: rgba(203, 213, 225, 0.35);
              transform: rotate(-30deg);
              pointer-events: none;
              z-index: 9999;
              letter-spacing: 0.1em;
              text-transform: uppercase;
            }
          </style>
        </head>
        <body>
          ${watermark ? `<div class="watermark">${watermark}</div>` : ''}
          <h2>${projectName} — ${getDocTypeName()}</h2>
          <p>Exported on: ${new Date().toLocaleDateString()}</p>
          ${project ? `
            <table class="meta-table">
              <tr>
                <td style="font-weight: bold; background-color: #f1f5f9;">Company Name:</td>
                <td>${project.organisationName || '—'}</td>
                <td style="font-weight: bold; background-color: #f1f5f9;">Customer Name:</td>
                <td>${project.customer || '—'}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; background-color: #f1f5f9;">Manufacturing Plant:</td>
                <td>${project.organisationPlant || '—'}</td>
                <td style="font-weight: bold; background-color: #f1f5f9;">Document Number:</td>
                <td>${getDerivedDocNumber()}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; background-color: #f1f5f9;">Subject (Part Name):</td>
                <td>${project.partName || '—'}</td>
                <td style="font-weight: bold; background-color: #f1f5f9;">Part Number:</td>
                <td>${project.orgPartNumber || '—'}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; background-color: #f1f5f9;">Revision / Status:</td>
                <td>Rev ${project.revisionNumber || '1.0'} (${getStatusLabel()})</td>
                <td style="font-weight: bold; background-color: #f1f5f9;">Origination Date:</td>
                <td>${project.originationDate ? new Date(project.originationDate).toLocaleDateString() : '—'}</td>
              </tr>
            </table>
          ` : ''}
          <table>
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

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(pdfHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold' }}>Export Document</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
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
      <DialogActions sx={{ p: 2.5, pt: 0, gap: 1 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleExportPdf}
          variant="contained"
          color="primary"
          startIcon={<DownloadIcon />}
        >
          Download PDF (.pdf)
        </Button>
        <Button
          onClick={handleExportExcel}
          variant="contained"
          color="success"
          startIcon={<DownloadIcon />}
        >
          Download Excel (.xlsx)
        </Button>
      </DialogActions>
    </Dialog>
  );
};
