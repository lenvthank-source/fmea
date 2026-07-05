import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  RadioGroup, FormControlLabel, Radio, TextField, Stack, Typography, FormControl, FormLabel
} from '@mui/material';
import { Download as DownloadIcon, Print as PrintIcon } from '@mui/icons-material';

interface ReportExporterProps {
  open: boolean;
  onClose: () => void;
  docType: 'PFMEA' | 'DFMEA' | 'CONTROL_PLAN';
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
  const [format, setFormat] = useState<'csv' | 'print'>('print');
  const [watermarkOption, setWatermarkOption] = useState<'none' | 'draft' | 'confidential' | 'custom'>('none');
  const [customWatermark, setCustomWatermark] = useState('');

  const getWatermarkText = (): string => {
    if (watermarkOption === 'none') return '';
    if (watermarkOption === 'draft') return 'DRAFT';
    if (watermarkOption === 'confidential') return 'CONFIDENTIAL';
    return customWatermark;
  };

  const handleExport = () => {
    const wmText = getWatermarkText();
    if (format === 'csv') {
      generateCSV(wmText);
    } else {
      triggerPrint(wmText);
    }
    onClose();
  };

  const generateCSV = (watermark: string) => {
    // Helper to format item arrays for cell display with Excel-specific line breaks
    const formatExcelList = (arr: any[] | undefined): string => {
      if (!arr || arr.length === 0) return '—';
      return arr.map(item => {
        const val = typeof item === 'object' ? (item.name || '') : String(item);
        return val
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
      }).join('<br style="mso-data-placement:same-cell;"/>');
    };

    // Helper to apply class names for Action Priority ratings
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

    // 1. Calculate spans for Process Steps, Functions, and Requirements
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
        for (let k = 1; k < stepCount; k++) {
          stepSpans[i + k] = 0;
        }
        
        let j = i;
        const stepEnd = i + stepCount;
        while (j < stepEnd) {
          let funcCount = 1;
          const currentFuncsStr = data[j].functions?.map((f: any) => f.name).join('|') || '';
          
          while (j + funcCount < stepEnd && (data[j + funcCount].functions?.map((f: any) => f.name).join('|') || '') === currentFuncsStr) {
            funcCount++;
          }
          
          funcSpans[j] = funcCount;
          for (let k = 1; k < funcCount; k++) {
            funcSpans[j + k] = 0;
          }
          
          let r = j;
          const funcEnd = j + funcCount;
          while (r < funcEnd) {
            let reqCount = 1;
            const currentReqsStr = data[r].requirements?.map((req: any) => req.name).join('|') || '';
            
            while (r + reqCount < funcEnd && (data[r + reqCount].requirements?.map((req: any) => req.name).join('|') || '') === currentReqsStr) {
              reqCount++;
            }
            
            reqSpans[r] = reqCount;
            for (let k = 1; k < reqCount; k++) {
              reqSpans[r + k] = 0;
            }
            
            r += reqCount;
          }
          
          j += funcCount;
        }
        
        i += stepCount;
      }
    } else if (docType === 'CONTROL_PLAN') {
      let i = 0;
      while (i < data.length) {
        let stepCount = 1;
        const currentStepId = data[i].processStepId;
        
        while (i + stepCount < data.length && data[i + stepCount].processStepId === currentStepId) {
          stepCount++;
        }
        
        stepSpans[i] = stepCount;
        for (let k = 1; k < stepCount; k++) {
          stepSpans[i + k] = 0;
        }
        i += stepCount;
      }
    }

    // 2. Generate Columns and Rows based on Document Type
    if (docType === 'PFMEA') {
      headers = [
        '#', 'Process Step', 'Work Element (4M)', 'Functions', 'Requirements',
        'Failure Effects (FE)', 'S', 'Failure Modes (FM)', 'Failure Causes (FC)',
        'Prevention Controls', 'O', 'Detection Controls', 'D', 'AP', 'Notes'
      ];
      if (watermark) {
        headers.push('Classification');
      }

      data.forEach((row, idx) => {
        const step = steps?.find(s => s.id === row.processStepId);
        let workElements = '';
        if (step) {
          if (Array.isArray(step.machinesEquipmentDocs)) {
            workElements = step.machinesEquipmentDocs.join(', ');
          } else if (typeof step.machinesEquipmentDocs === 'string' && step.machinesEquipmentDocs) {
            try {
              const parsed = JSON.parse(step.machinesEquipmentDocs);
              workElements = Array.isArray(parsed) ? parsed.join(', ') : step.machinesEquipmentDocs;
            } catch {
              workElements = step.machinesEquipmentDocs;
            }
          }
        }

        const rowClass = idx % 2 === 0 ? '' : 'class="bg-zebra"';
        tableRowsHtml += `<tr ${rowClass}>`;
        tableRowsHtml += `<td class="text-center">${row.rowNumber}</td>`;
        
        if (stepSpans[idx] > 0) {
          const stepText = step ? `${step.stepNumber} - ${step.name}` : '';
          tableRowsHtml += `<td rowspan="${stepSpans[idx]}">${stepText}</td>`;
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
        
        if (watermark) {
          tableRowsHtml += `<td>[${watermark}]</td>`;
        }
        tableRowsHtml += '</tr>';
      });

    } else if (docType === 'DFMEA') {
      headers = [
        '#', 'Higher Level (System)', 'Focus Element', 'Component Element', 'Functions', 'Requirements',
        'Failure Effects (FE)', 'S', 'Failure Modes (FM)', 'Failure Causes (FC)',
        'Prevention Controls', 'O', 'Detection Controls', 'D', 'AP', 'Filter Code', 'Notes'
      ];
      if (watermark) {
        headers.push('Classification');
      }

      data.forEach((row, idx) => {
        const step = steps?.find(s => s.id === row.processStepId);
        let workElements = '';
        if (step) {
          if (Array.isArray(step.machinesEquipmentDocs)) {
            workElements = step.machinesEquipmentDocs.join(', ');
          } else if (typeof step.machinesEquipmentDocs === 'string' && step.machinesEquipmentDocs) {
            try {
              const parsed = JSON.parse(step.machinesEquipmentDocs);
              workElements = Array.isArray(parsed) ? parsed.join(', ') : step.machinesEquipmentDocs;
            } catch {
              workElements = step.machinesEquipmentDocs;
            }
          }
        }

        const rowClass = idx % 2 === 0 ? '' : 'class="bg-zebra"';
        tableRowsHtml += `<tr ${rowClass}>`;
        tableRowsHtml += `<td class="text-center">${row.rowNumber}</td>`;
        
        if (idx === 0) {
          tableRowsHtml += `<td rowspan="${data.length}">${projectName || 'System (Root)'}</td>`;
        }
        
        if (stepSpans[idx] > 0) {
          const stepText = step ? `${step.stepNumber} - ${step.name}` : '';
          tableRowsHtml += `<td rowspan="${stepSpans[idx]}">${stepText}</td>`;
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
        tableRowsHtml += `<td>${row.filterCode || ''}</td>`;
        tableRowsHtml += `<td>${row.notes || ''}</td>`;
        
        if (watermark) {
          tableRowsHtml += `<td>[${watermark}]</td>`;
        }
        tableRowsHtml += '</tr>';
      });

    } else if (docType === 'CONTROL_PLAN') {
      headers = [
        '#', 'Source', 'Process Step', 'Machine / Equipment', 'Characteristics', 'Classification',
        'Spec / Tolerance', 'Measurement Method', 'Sample Size', 'Frequency', 'Control Type',
        'Control Method', 'Reaction Plan', 'Responsible'
      ];
      if (watermark) {
        headers.push('Classification');
      }

      data.forEach((row, idx) => {
        const step = steps?.find(s => s.id === row.processStepId);
        const sourceLabel = row.linkedPfmeaRows && row.linkedPfmeaRows.length > 0 ? 'FMEA' : 'PFD';
        const rowClass = idx % 2 === 0 ? '' : 'class="bg-zebra"';
        
        tableRowsHtml += `<tr ${rowClass}>`;
        tableRowsHtml += `<td class="text-center">${row.rowNumber}</td>`;
        tableRowsHtml += `<td class="text-center">${sourceLabel}</td>`;
        
        if (stepSpans[idx] > 0) {
          const stepText = step ? `${step.stepNumber} - ${step.name}` : '';
          tableRowsHtml += `<td rowspan="${stepSpans[idx]}">${stepText}</td>`;
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
        
        if (watermark) {
          tableRowsHtml += `<td>[${watermark}]</td>`;
        }
        tableRowsHtml += '</tr>';
      });
    }

    // 3. Assemble Excel-compliant styled HTML spreadsheet template
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
          <h2>${projectName} — ${docType} Spreadsheet</h2>
          <p>Exported on: ${new Date().toLocaleDateString()}</p>
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

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${projectName.replace(/\s+/g, '_')}_${docType}_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerPrint = (watermark: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let tableHtml = '';
    if (docType === 'PFMEA') {
      tableHtml = `
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Process Step</th>
              <th>Work Element</th>
              <th>Functions</th>
              <th>Effects</th>
              <th>S</th>
              <th>Modes</th>
              <th>Causes</th>
              <th>Prevention</th>
              <th>O</th>
              <th>Detection</th>
              <th>D</th>
              <th>AP</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(row => {
              const step = steps?.find(s => s.id === row.processStepId);
              let weStr = '';
              if (step) {
                if (Array.isArray(step.machinesEquipmentDocs)) weStr = step.machinesEquipmentDocs.join(', ');
                else if (step.machinesEquipmentDocs) weStr = String(step.machinesEquipmentDocs);
              }
              return `
                <tr>
                  <td>${row.rowNumber}</td>
                  <td>${step ? `${step.stepNumber} - ${step.name}` : ''}</td>
                  <td>${weStr}</td>
                  <td>${row.functions?.map((f: any) => f.name).join('<br/>') || ''}</td>
                  <td>${row.effects?.map((e: any) => e.name).join('<br/>') || ''}</td>
                  <td class="center font-bold">${row.severity || ''}</td>
                  <td>${row.failureModes?.map((fm: any) => fm.name).join('<br/>') || ''}</td>
                  <td>${row.causes?.map((c: any) => c.name).join('<br/>') || ''}</td>
                  <td>${row.controls?.filter((c: any) => c.type === 'prevention').map((c: any) => c.name).join('<br/>') || ''}</td>
                  <td class="center font-bold">${row.occurrence || ''}</td>
                  <td>${row.controls?.filter((c: any) => c.type === 'detection').map((c: any) => c.name).join('<br/>') || ''}</td>
                  <td class="center font-bold">${row.detection || ''}</td>
                  <td class="center font-bold">${row.ap || ''}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    } else if (docType === 'DFMEA') {
      tableHtml = `
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Higher Level</th>
              <th>Focus Element</th>
              <th>Component Element</th>
              <th>Functions</th>
              <th>Effects</th>
              <th>S</th>
              <th>Modes</th>
              <th>Causes</th>
              <th>Prevention</th>
              <th>O</th>
              <th>Detection</th>
              <th>D</th>
              <th>AP</th>
              <th>Filter Code</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(row => {
              const step = steps?.find(s => s.id === row.processStepId);
              let weStr = '';
              if (step) {
                if (Array.isArray(step.machinesEquipmentDocs)) weStr = step.machinesEquipmentDocs.join(', ');
                else if (step.machinesEquipmentDocs) weStr = String(step.machinesEquipmentDocs);
              }
              return `
                <tr>
                  <td>${row.rowNumber}</td>
                  <td>${projectName}</td>
                  <td>${step ? `${step.stepNumber} - ${step.name}` : ''}</td>
                  <td>${weStr}</td>
                  <td>${row.functions?.map((f: any) => f.name).join('<br/>') || ''}</td>
                  <td>${row.effects?.map((e: any) => e.name).join('<br/>') || ''}</td>
                  <td class="center font-bold">${row.severity || ''}</td>
                  <td>${row.failureModes?.map((fm: any) => fm.name).join('<br/>') || ''}</td>
                  <td>${row.causes?.map((c: any) => c.name).join('<br/>') || ''}</td>
                  <td>${row.controls?.filter((c: any) => c.type === 'prevention').map((c: any) => c.name).join('<br/>') || ''}</td>
                  <td class="center font-bold">${row.occurrence || ''}</td>
                  <td>${row.controls?.filter((c: any) => c.type === 'detection').map((c: any) => c.name).join('<br/>') || ''}</td>
                  <td class="center font-bold">${row.detection || ''}</td>
                  <td class="center font-bold">${row.ap || ''}</td>
                  <td>${row.filterCode || ''}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    } else if (docType === 'CONTROL_PLAN') {
      tableHtml = `
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Source</th>
              <th>Process Step</th>
              <th>Machine / Equip</th>
              <th>Characteristics</th>
              <th>Class</th>
              <th>Spec / Tolerance</th>
              <th>Method</th>
              <th>Size</th>
              <th>Freq</th>
              <th>Type</th>
              <th>Control Method</th>
              <th>Reaction Plan</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(row => {
              const step = steps?.find(s => s.id === row.processStepId);
              const sourceLabel = row.linkedPfmeaRows && row.linkedPfmeaRows.length > 0 ? 'FMEA' : 'PFD';
              return `
                <tr>
                  <td>${row.rowNumber}</td>
                  <td class="center">${sourceLabel}</td>
                  <td>${step ? `${step.stepNumber} - ${step.name}` : ''}</td>
                  <td>${row.machinesEquipmentDocs || ''}</td>
                  <td>${row.characteristicName || ''}</td>
                  <td class="center font-bold">${row.characteristicClassification || ''}</td>
                  <td>${row.specTolerance || ''}</td>
                  <td>${row.measurementMethod || ''}</td>
                  <td>${row.sampleSize || ''}</td>
                  <td>${row.frequency || ''}</td>
                  <td>${row.controlType || ''}</td>
                  <td>${row.controlMethod || ''}</td>
                  <td>${row.reactionPlan || ''}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }

    const watermarkStyle = watermark
      ? `
      body::before {
        content: "${watermark}";
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        font-size: 8rem;
        color: rgba(220, 220, 220, 0.18);
        pointer-events: none;
        z-index: 9999;
        font-weight: 900;
        text-transform: uppercase;
        font-family: sans-serif;
        white-space: nowrap;
      }
      `
      : '';

    printWindow.document.write(`
      <html>
        <head>
          <title>${projectName} - ${docType} Report</title>
          <style>
            body {
              font-family: 'Inter', sans-serif;
              color: #28251D;
              margin: 20px;
            }
            h1 {
              font-size: 1.5rem;
              color: #01696F;
              margin-bottom: 5px;
            }
            h2 {
              font-size: 1rem;
              color: #7A7974;
              margin-top: 0;
              margin-bottom: 25px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
              font-size: 0.8rem;
            }
            th, td {
              border: 1px solid rgba(40, 37, 29, 0.15);
              padding: 6px 8px;
              text-align: left;
              vertical-align: top;
            }
            th {
              background-color: #F7F6F2;
              color: #28251D;
              font-weight: 700;
            }
            .center {
              text-align: center;
            }
            .font-bold {
              font-weight: bold;
            }
            ${watermarkStyle}
            @media print {
              body { margin: 10mm; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>${projectName} - ${docType} Form Sheet</h1>
          <h2>Generated on: ${new Date().toLocaleDateString()}</h2>
          ${tableHtml}
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold' }}>Export {docType} Document</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <FormControl>
            <FormLabel sx={{ fontWeight: 'bold', mb: 1 }}>Export Format</FormLabel>
            <RadioGroup value={format} onChange={(e) => setFormat(e.target.value as any)}>
              <FormControlLabel 
                value="print" 
                control={<Radio />} 
                label={
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <PrintIcon fontSize="small" color="primary" />
                    <Typography variant="body2">Print / Export to PDF (Native A4 Sheet)</Typography>
                  </Stack>
                } 
              />
              <FormControlLabel 
                value="csv" 
                control={<Radio />} 
                label={
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <DownloadIcon fontSize="small" color="primary" />
                    <Typography variant="body2">Export to Excel Spreadsheet (.XLS Format)</Typography>
                  </Stack>
                } 
              />
            </RadioGroup>
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
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button 
          onClick={handleExport} 
          variant="contained" 
          startIcon={format === 'csv' ? <DownloadIcon /> : <PrintIcon />}
        >
          {format === 'csv' ? 'Download Excel' : 'Open Print / PDF'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
