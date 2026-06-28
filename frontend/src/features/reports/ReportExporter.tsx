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
    let headers: string[] = [];
    let rows: string[][] = [];

    if (docType === 'PFMEA') {
      headers = [
        '#', 'Process Step', 'Work Element (4M)', 'Functions', 'Requirements',
        'Failure Effects (FE)', 'S', 'Failure Modes (FM)', 'Failure Causes (FC)',
        'Prevention Controls', 'O', 'Detection Controls', 'D', 'AP', 'Notes'
      ];
      if (watermark) {
        headers.push('Classification');
      }

      rows = data.map(row => {
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

        const funcs = row.functions?.map((f: any) => f.name).join(' | ') || '';
        const reqs = row.requirements?.map((r: any) => r.name).join(' | ') || '';
        const effects = row.effects?.map((e: any) => e.name).join(' | ') || '';
        const fms = row.failureModes?.map((fm: any) => fm.name).join(' | ') || '';
        const causes = row.causes?.map((c: any) => c.name).join(' | ') || '';
        const prevControls = row.controls?.filter((c: any) => c.type === 'prevention').map((c: any) => c.name).join(' | ') || '';
        const detControls = row.controls?.filter((c: any) => c.type === 'detection').map((c: any) => c.name).join(' | ') || '';

        const cells = [
          row.rowNumber,
          step ? `${step.stepNumber} - ${step.name}` : '',
          workElements,
          funcs,
          reqs,
          effects,
          row.severity || '',
          fms,
          causes,
          prevControls,
          row.occurrence || '',
          detControls,
          row.detection || '',
          row.ap || '',
          row.notes || ''
        ];

        if (watermark) {
          cells.push(`[${watermark}]`);
        }
        return cells.map(val => `"${String(val).replace(/"/g, '""')}"`);
      });
    } else if (docType === 'DFMEA') {
      headers = [
        '#', 'Higher Level (System)', 'Focus Element', 'Component Element', 'Functions', 'Requirements',
        'Failure Effects (FE)', 'S', 'Failure Modes (FM)', 'Failure Causes (FC)',
        'Prevention Controls', 'O', 'Detection Controls', 'D', 'AP', 'Filter Code', 'Notes'
      ];
      rows = data.map(row => {
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

        const funcs = row.functions?.map((f: any) => f.name).join(' | ') || '';
        const reqs = row.requirements?.map((r: any) => r.name).join(' | ') || '';
        const effects = row.effects?.map((e: any) => e.name).join(' | ') || '';
        const fms = row.failureModes?.map((fm: any) => fm.name).join(' | ') || '';
        const causes = row.causes?.map((c: any) => c.name).join(' | ') || '';
        const prevControls = row.controls?.filter((c: any) => c.type === 'prevention').map((c: any) => c.name).join(' | ') || '';
        const detControls = row.controls?.filter((c: any) => c.type === 'detection').map((c: any) => c.name).join(' | ') || '';

        const cells = [
          row.rowNumber,
          projectName || 'System (Root)',
          step ? `${step.stepNumber} - ${step.name}` : '',
          workElements,
          funcs,
          reqs,
          effects,
          row.severity || '',
          fms,
          causes,
          prevControls,
          row.occurrence || '',
          detControls,
          row.detection || '',
          row.ap || '',
          row.filterCode || '',
          row.notes || ''
        ];
        if (watermark) {
          cells.push(`[${watermark}]`);
        }
        return cells.map(val => `"${String(val).replace(/"/g, '""')}"`);
      });
    } else if (docType === 'CONTROL_PLAN') {
      headers = [
        '#', 'Source', 'Process Step', 'Machine / Equipment', 'Characteristics', 'Classification',
        'Spec / Tolerance', 'Measurement Method', 'Sample Size', 'Frequency', 'Control Type',
        'Control Method', 'Reaction Plan', 'Responsible'
      ];
      rows = data.map(row => {
        const step = steps?.find(s => s.id === row.processStepId);
        const sourceLabel = row.linkedPfmeaRows && row.linkedPfmeaRows.length > 0 ? 'FMEA' : 'PFD';
        const cells = [
          row.rowNumber,
          sourceLabel,
          step ? `${step.stepNumber} - ${step.name}` : '',
          row.machinesEquipmentDocs || '',
          row.characteristicName || '',
          row.characteristicClassification || '',
          row.specTolerance || '',
          row.measurementMethod || '',
          row.sampleSize || '',
          row.frequency || '',
          row.controlType || '',
          row.controlMethod || '',
          row.reactionPlan || '',
          row.responsible || ''
        ];
        if (watermark) {
          cells.push(`[${watermark}]`);
        }
        return cells.map(val => `"${String(val).replace(/"/g, '""')}"`);
      });
    }

    const csvContent = [headers.map(h => `"${h}"`).join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${projectName.replace(/\s+/g, '_')}_${docType}_${new Date().toISOString().split('T')[0]}.csv`);
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
                    <Typography variant="body2">Export to Excel Spreadsheet (CSV Format)</Typography>
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
