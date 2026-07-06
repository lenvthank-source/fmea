import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  RadioGroup, FormControlLabel, Radio, TextField, Stack, Typography,
  FormControl, FormLabel, MenuItem, Select, InputLabel, Box, Card,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Grid, IconButton
} from '@mui/material';
import {
  Download as DownloadIcon, Print as PrintIcon, Close as CloseIcon,
  Visibility as PreviewIcon
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { API_BASE_URL } from '../../config';

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
    if (docType === 'PFD') return `PFD-${partNo}`;
    if (docType === 'PFMEA') return `PFMEA-${partNo}`;
    if (docType === 'DFMEA') return `DFMEA-${partNo}`;
    if (docType === 'CONTROL_PLAN') return `CP-${partNo}`;
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
      headers = [
        'Step #', 'Process Description', 'Incoming Variation', 'Spec Class',
        'Flow Symbols', 'Machines / Equipment / Docs', 'Desired Outcome', 'Process Characteristics'
      ];
      data.forEach((row, idx) => {
        const rowClass = idx % 2 === 0 ? '' : 'class="bg-zebra"';
        const icons = row.flowIcons || {};
        const symbolStr = Object.keys(icons).filter(k => icons[k]).map(k => k.substring(0, 3).toUpperCase()).join(', ');
        
        tableRowsHtml += `<tr ${rowClass}>`;
        tableRowsHtml += `<td class="text-center text-bold">${row.stepNumber || ''}</td>`;
        tableRowsHtml += `<td>${row.name || ''}</td>`;
        tableRowsHtml += `<td>${formatExcelList(row.incomingVariation)}</td>`;
        tableRowsHtml += `<td class="text-center">${row.specialCharacteristics || ''}</td>`;
        tableRowsHtml += `<td class="text-center">${symbolStr}</td>`;
        tableRowsHtml += `<td>${formatExcelList(row.machinesEquipmentDocs)}</td>`;
        tableRowsHtml += `<td>${formatExcelList(row.desiredOutcome)}</td>`;
        tableRowsHtml += `<td>${formatExcelList(row.processCharacteristics)}</td>`;
        tableRowsHtml += '</tr>';
      });
    } else if (docType === 'PFMEA') {
      headers = [
        '#', 'Process Step', 'Work Element (4M)', 'Functions', 'Requirements',
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
              body > * {
                display: none !important;
              }
              /* Display only the print preview content */
              .print-preview-root {
                display: block !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                height: auto !important;
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
              }
              .print-toolbar {
                display: none !important;
              }
              .print-preview-card {
                border: none !important;
                box-shadow: none !important;
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
            {/* Header info */}
            <Box sx={{ borderBottom: '2px solid #0F172A', pb: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#0F172A' }}>
                {getDocTypeName()}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Quality Program Assessment sheet • Exported: {new Date().toLocaleDateString()}
              </Typography>
            </Box>

            {/* Document Header grid display */}
            {project && (
              <Box sx={{ p: 2.5, border: '1px solid #cbd5e1', borderRadius: 2, bgcolor: '#f8fafc' }}>
                <Grid container spacing={2} sx={{ fontSize: '0.8rem' }}>
                  <Grid size={3}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>Company Name</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{project.organisationName || '—'}</Typography>
                  </Grid>
                  <Grid size={3}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>Manufacturing Plant</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{project.organisationPlant || '—'}</Typography>
                  </Grid>
                  <Grid size={3}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>Customer Name</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{project.customer || '—'}</Typography>
                  </Grid>
                  <Grid size={3}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>FMEA ID / Document Number</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{getDerivedDocNumber()}</Typography>
                  </Grid>
                  <Grid size={3}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>Subject (Part Name)</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{project.partName || '—'}</Typography>
                  </Grid>
                  <Grid size={3}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>Organisation Part No.</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{project.orgPartNumber || '—'}</Typography>
                  </Grid>
                  <Grid size={3}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>Revision / Status</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Rev {project.revisionNumber || '1.0'} • <span style={{ color: '#0d9488' }}>{getStatusLabel()}</span></Typography>
                  </Grid>
                  <Grid size={3}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>Origination Date</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{project.originationDate ? new Date(project.originationDate).toLocaleDateString() : '—'}</Typography>
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
                        <TableCell sx={{ fontWeight: 'bold' }}>Process Step</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Work Element (4M)</TableCell>
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
                            <TableCell>{Array.isArray(row.incomingVariation) ? row.incomingVariation.join(', ') : (row.incomingVariation || '')}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{row.specialCharacteristics || ''}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              {Object.keys(row.flowIcons || {}).filter(k => row.flowIcons[k]).map(k => k.substring(0, 3).toUpperCase()).join(', ')}
                            </TableCell>
                            <TableCell>{Array.isArray(row.machinesEquipmentDocs) ? row.machinesEquipmentDocs.join(', ') : (row.machinesEquipmentDocs || '')}</TableCell>
                            <TableCell>{Array.isArray(row.desiredOutcome) ? row.desiredOutcome.join(', ') : (row.desiredOutcome || '')}</TableCell>
                            <TableCell>{Array.isArray(row.processCharacteristics) ? row.processCharacteristics.join(', ') : (row.processCharacteristics || '')}</TableCell>
                          </>
                        )}
                        {docType === 'PFMEA' && (
                          <>
                            <TableCell sx={{ textAlign: 'center' }}>{row.rowNumber}</TableCell>
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
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </DialogContent>
      </Dialog>
    </>
  );
};
