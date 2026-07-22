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
  const handleExportExcel = () => {
    const wmText = getWatermarkText();
    generateExcel(wmText);
    onClose();
  };

  const generateExcel = (_watermark: string) => {
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
      const aoa: any[][] = [];

      // 1. Top 3 Title Rows (clean white, bold/centered text)
      aoa.push(['PADMINI VNA MECHATRONICS PRIVATE LIMITED']);
      aoa.push(['Process Flow Diagram (PFD)']);
      aoa.push(['(Prototype)']);
      aoa.push([]); // blank spacer

      // 2. 6-Row Header Grid (Clean White Cells, No Color Fill)
      aoa.push(['Organisation Name:', project?.organisationName || '—', '', '', 'Customer Name:', project?.customer || '—', '', '']);
      aoa.push(['Manufacturing Plant:', project?.organisationPlant || '—', '', '', 'Document Number:', getDerivedDocNumber(), '', '']);
      aoa.push(['Subject (Part Name):', project?.partName || '—', '', '', 'Part Number:', project?.orgPartNumber || '—', '', '']);
      aoa.push(['Revision:', `Rev ${project?.revisionNumber || '1.0'} (${getStatusLabel()})`, '', '', 'Origination Date:', project?.originationDate ? new Date(project.originationDate).toLocaleDateString() : '—', '', '']);
      aoa.push(['Dwg No.:', project?.dwgNumber || '—', '', '', 'Dwg Rev No / Date.:', project?.dwgRevNoAndDate || (project?.drawingRevDate ? new Date(project.drawingRevDate).toLocaleDateString() : '—'), '', '']);
      aoa.push(['Assy. Line No.:', project?.assemblyLineNumber || '—', '', '', 'CFT Members:', Array.isArray(project?.cftMembers) ? project.cftMembers.join(', ') : (project?.cftMembers || '—'), '', '']);
      aoa.push([]); // blank spacer

      // 3. Main Table Header Row
      aoa.push([
        'Step #',
        'Process Description',
        'Incoming Source of Variation',
        'Spec Class',
        'Flow Symbols',
        'Machines / Equipment / Docs',
        'Desired Outcome',
        'Process Characteristics'
      ]);

      const formatListForAoa = (val: any): string => {
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
        return arr.map(item => (typeof item === 'object' ? item.name || '' : String(item))).join('\n');
      };

      data.forEach((row) => {
        const icons = row.flowIcons || {};
        const activeKeys = Object.keys(icons).filter(k => icons[k]);
        const symbolsText = activeKeys.length > 0 ? activeKeys.map(k => getPfdIconMeta(k).short).join(', ') : '—';

        aoa.push([
          row.stepNumber || '',
          row.name || '',
          formatListForAoa(row.incomingVariation),
          row.specialCharacteristics || '',
          symbolsText,
          formatListForAoa(row.machinesEquipmentDocs),
          formatListForAoa(row.desiredOutcome),
          formatListForAoa(row.processCharacteristics)
        ]);
      });

      // 4. Trailing 4 Blank Rows
      for (let b = 0; b < 4; b++) {
        aoa.push(['', '', '', '', '', '', '', '']);
      }

      // 5. Footer Legend Row
      aoa.push(['LEGEND:  Transportation: TRNS (⇨)   |   Storage: STR (▽)   |   Work-In Progress: WIP (☉)   |   Operation: OPER (◯)   |   Inspection: INSP (□)   |   Decision: DEC (◇)   |   Rework: REW (Ⓡ)   |   Reject: REJ (✕)']);

      // 6. Sign-off Footer Row
      aoa.push(['Prepared By: ____________________', '', 'Checked By: ____________________', '', '', 'Approved By: ____________________', '', '']);

      const ws = XLSX.utils.aoa_to_sheet(aoa);

      // Define Column Widths to guarantee zero overlapping text!
      ws['!cols'] = [
        { wch: 12 }, // Step #
        { wch: 32 }, // Process Description
        { wch: 38 }, // Incoming Source of Variation
        { wch: 14 }, // Spec Class
        { wch: 22 }, // Flow Symbols
        { wch: 38 }, // Machines / Equipment / Docs
        { wch: 38 }, // Desired Outcome
        { wch: 38 }  // Process Characteristics
      ];

      const legendRowIdx = aoa.length - 2;
      const signoffRowIdx = aoa.length - 1;

      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, // Row 0 Title
        { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }, // Row 1 Subtitle
        { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } }, // Row 2 Status
        { s: { r: 4, c: 1 }, e: { r: 4, c: 3 } }, // Row 4 Org Name value
        { s: { r: 4, c: 5 }, e: { r: 4, c: 7 } }, // Row 4 Customer value
        { s: { r: 5, c: 1 }, e: { r: 5, c: 3 } }, // Row 5 Plant value
        { s: { r: 5, c: 5 }, e: { r: 5, c: 7 } }, // Row 5 Doc No value
        { s: { r: 6, c: 1 }, e: { r: 6, c: 3 } }, // Row 6 Part Name value
        { s: { r: 6, c: 5 }, e: { r: 6, c: 7 } }, // Row 6 Part No value
        { s: { r: 7, c: 1 }, e: { r: 7, c: 3 } }, // Row 7 Rev value
        { s: { r: 7, c: 5 }, e: { r: 7, c: 7 } }, // Row 7 Date value
        { s: { r: 8, c: 1 }, e: { r: 8, c: 3 } }, // Row 8 Dwg No value
        { s: { r: 8, c: 5 }, e: { r: 8, c: 7 } }, // Row 8 Dwg Rev Date value
        { s: { r: 9, c: 1 }, e: { r: 9, c: 3 } }, // Row 9 Line No value
        { s: { r: 9, c: 5 }, e: { r: 9, c: 7 } }, // Row 9 CFT value
        { s: { r: legendRowIdx, c: 0 }, e: { r: legendRowIdx, c: 7 } }, // Legend
        { s: { r: signoffRowIdx, c: 0 }, e: { r: signoffRowIdx, c: 1 } }, // Prepared By
        { s: { r: signoffRowIdx, c: 2 }, e: { r: signoffRowIdx, c: 4 } }, // Checked By
        { s: { r: signoffRowIdx, c: 5 }, e: { r: signoffRowIdx, c: 7 } }, // Approved By
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `${docType} Report`);

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
      return;
    } else if (docType === 'PFMEA') {
      headers = [
        '#', 'Structure / Item', 'Work Element (4M)', 'Function / Focus Element',
        'Failure Mode', 'Potential Effects', 'SEV', 'Failure Causes',
        'Current Control – Prevention', 'OCC', 'Current Control – Detection', 'DET',
        'AP', 'FC', 'Prevention Action', 'Detection Action',
        'Responsibility & Target Date', 'Action Taken & Completion Date',
        'SEV (rev)', 'OCC (rev)', 'DET (rev)', 'AP (rev)', 'Status', 'Remarks'
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
        
        if (stepSpans[idx] > 0) {
          tableRowsHtml += `<td rowspan="${stepSpans[idx]}">${step ? `${step.stepNumber} - ${step.name}` : ''}</td>`;
          tableRowsHtml += `<td rowspan="${stepSpans[idx]}">${workElements}</td>`;
        }
        if (funcSpans[idx] > 0) {
          tableRowsHtml += `<td rowspan="${funcSpans[idx]}">${formatExcelList(row.functions)}</td>`;
        }
        
        tableRowsHtml += `<td>${formatExcelList(row.failureModes)}</td>`;
        tableRowsHtml += `<td>${formatExcelList(row.effects)}</td>`;
        tableRowsHtml += `<td class="rating-cell">${row.severity || ''}</td>`;
        tableRowsHtml += `<td>${formatExcelList(row.causes)}</td>`;
        tableRowsHtml += `<td>${formatExcelList(row.controls?.filter((c: any) => c.type === 'prevention'))}</td>`;
        tableRowsHtml += `<td class="rating-cell">${row.occurrence || ''}</td>`;
        tableRowsHtml += `<td>${formatExcelList(row.controls?.filter((c: any) => c.type === 'detection'))}</td>`;
        tableRowsHtml += `<td class="rating-cell">${row.detection || ''}</td>`;
        
        const apVal = row.ap || '';
        tableRowsHtml += `<td ${getApStyleClass(apVal)}>${apVal}</td>`;
        tableRowsHtml += `<td class="text-center">${row.filterCode || ''}</td>`;
        tableRowsHtml += `<td>${row.preventionAction || ''}</td>`;
        tableRowsHtml += `<td>${row.detectionAction || ''}</td>`;
        tableRowsHtml += `<td>${row.responsibility || ''}</td>`;
        tableRowsHtml += `<td>${row.actionTaken || ''}</td>`;
        tableRowsHtml += `<td class="rating-cell">${row.revisedSeverity || ''}</td>`;
        tableRowsHtml += `<td class="rating-cell">${row.revisedOccurrence || ''}</td>`;
        tableRowsHtml += `<td class="rating-cell">${row.revisedDetection || ''}</td>`;
        const revisedApVal = row.revisedAp || '';
        tableRowsHtml += `<td ${getApStyleClass(revisedApVal)}>${revisedApVal}</td>`;
        tableRowsHtml += `<td>${row.status === 'approved' ? 'Closed' : row.status === 'reviewed' ? 'In Progress' : 'Open'}</td>`;
        tableRowsHtml += `<td>${row.notes || ''}</td>`;
        tableRowsHtml += '</tr>';
      });
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
