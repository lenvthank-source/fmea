import React, { useRef } from 'react';
import { Box, Typography, IconButton, Tooltip, Paper } from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  RestartAlt as ResetIcon,
  FitScreen as FitScreenIcon,
  HelpOutlined as LegendIcon,
  FileDownload as DownloadIcon,
} from '@mui/icons-material';
import { PFD_ICON_MAP } from '../utils/pfdIconMap';
import type { ProcessStep } from '../PfdWorkspace';

interface PfdEngineeringCanvasProps {
  steps: ProcessStep[];
  hoveredStepId: string | null;
  onHoverStep: (id: string | null) => void;
  onSelectStep: (step: ProcessStep) => void;
  zoom: number;
  panX: number;
  panY: number;
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onWheel: (e: React.WheelEvent) => void;
  onResetZoom: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
}

// Detect equipment type from step name, machines, or flow icons
function detectEquipmentType(step: ProcessStep): string {
  const text = `${step.name || ''} ${step.machinesEquipmentDocs || ''} ${step.stepType || ''}`.toLowerCase();
  
  if (text.includes('pump') || text.includes('p-') || text.includes('impeller') || text.includes('feed pump')) return 'pump';
  if (text.includes('heat') || text.includes('exchange') || text.includes('he-') || text.includes('cooler') || text.includes('condenser') || text.includes('chiller')) return 'heat_exchanger';
  if (text.includes('oven') || text.includes('furnace') || text.includes('ht-') || text.includes('bake') || text.includes('cure') || text.includes('thermal') || text.includes('coil')) return 'heater_coil';
  if (text.includes('reactor') || text.includes('column') || text.includes('r-') || text.includes('distill') || text.includes('tower')) return 'reactor_column';
  if (text.includes('tank') || text.includes('vessel') || text.includes('v-') || text.includes('mix') || text.includes('blend') || text.includes('m-') || text.includes('agitator') || text.includes('slurry')) return 'tank_vessel';
  if (text.includes('filter') || text.includes('f-') || text.includes('strainer') || text.includes('screen') || text.includes('mesh')) return 'filter';
  if (text.includes('compress') || text.includes('c-') || text.includes('blower') || text.includes('fan') || text.includes('exhaust')) return 'compressor';
  if (text.includes('cyclone') || text.includes('cs-') || text.includes('separator') || text.includes('silo') || text.includes('sl-') || text.includes('hopper')) return 'cyclone';
  if (text.includes('drum') || text.includes('receiver') || text.includes('accumulator')) return 'horizontal_drum';
  if (text.includes('inspect') || text.includes('vision') || text.includes('camera') || text.includes('gage') || text.includes('gauge') || text.includes('test') || text.includes('measure') || text.includes('cmm') || text.includes('sensor')) return 'inspection';
  if (text.includes('weld') || text.includes('laser') || text.includes('braze') || text.includes('solder') || text.includes('join')) return 'laser_weld';
  if (text.includes('press') || text.includes('stamp') || text.includes('form') || text.includes('bend') || text.includes('crimp')) return 'press';
  return 'general_operation';
}

export const PfdEngineeringCanvas: React.FC<PfdEngineeringCanvasProps> = ({
  steps,
  hoveredStepId,
  onHoverStep,
  onSelectStep,
  zoom,
  panX,
  panY,
  isDragging,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onWheel,
  onResetZoom,
  onZoomIn,
  onZoomOut,
  onFitView,
}) => {
  const [showLegend, setShowLegend] = React.useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Layout calculation: arrange in standard serpentine/orthogonal engineering rows
  // 4 steps per row for clear readability, connected with orthogonal piping
  const STEPS_PER_ROW = 4;
  const COL_WIDTH = 340;
  const ROW_HEIGHT = 280;
  const START_X = 140;
  const START_Y = 120;

  const renderedSteps = steps.map((step, index) => {
    const row = Math.floor(index / STEPS_PER_ROW);
    const isEvenRow = row % 2 === 0;
    const colInRow = index % STEPS_PER_ROW;
    const col = isEvenRow ? colInRow : STEPS_PER_ROW - 1 - colInRow;

    const x = START_X + col * COL_WIDTH;
    const y = START_Y + row * ROW_HEIGHT;
    const equipType = detectEquipmentType(step);

    // Primary ASME / AIAG flow symbol
    const activeKeys = Object.keys(step.flowIcons || {}).filter((k) => step.flowIcons?.[k]);
    const primaryKey = activeKeys[0] || (equipType === 'inspection' ? 'insp' : equipType === 'horizontal_drum' ? 'store' : 'oper');
    const symbolMeta = PFD_ICON_MAP[primaryKey] || PFD_ICON_MAP.oper;

    // Parse incoming variations / feed stream
    let incomingVar: string[] = [];
    const val = step.incomingVariation;
    if (Array.isArray(val)) incomingVar = val;
    else if (typeof val === 'string' && val) {
      try {
        const p = JSON.parse(val);
        incomingVar = Array.isArray(p) ? p : [val];
      } catch {
        incomingVar = [val];
      }
    }
    incomingVar = incomingVar.map((v) => String(v).trim()).filter(Boolean);

    // Parse machines / equipment
    let stepEquip: string[] = [];
    if (Array.isArray(step.machinesEquipmentDocs)) stepEquip = step.machinesEquipmentDocs;
    else if (typeof step.machinesEquipmentDocs === 'string' && step.machinesEquipmentDocs) {
      try {
        const p = JSON.parse(step.machinesEquipmentDocs);
        stepEquip = Array.isArray(p) ? p : [step.machinesEquipmentDocs];
      } catch {
        stepEquip = [step.machinesEquipmentDocs];
      }
    }
    const machines = stepEquip.map((m) => String(m).trim()).filter(Boolean);

    // Equipment Tag (e.g. V-101, P-101 or Step 10)
    const rawTag = machines[0] || `OP-${step.stepNumber || index + 1}`;
    const equipTag = rawTag.length > 10 ? rawTag.substring(0, 10) : rawTag;

    return {
      step,
      index,
      row,
      col,
      isEvenRow,
      x,
      y,
      equipType,
      symbolMeta,
      primaryKey,
      equipTag,
      incomingVar,
      machines,
    };
  });

  // Export SVG to high-res SVG file
  const handleExportSvg = () => {
    if (!svgRef.current) return;
    const svgElement = svgRef.current;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);

    const downloadLink = document.createElement('a');
    downloadLink.href = blobURL;
    downloadLink.download = `Process_Flow_Diagram_${new Date().toISOString().slice(0, 10)}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  // Render authentic industrial equipment symbols matching the user's reference PFD
  const renderEquipmentGraphic = (equipType: string, isHovered: boolean) => {
    const strokeColor = isHovered ? '#ff682c' : '#09090b';
    const fillColor = '#ffffff';
    const strokeWidth = isHovered ? 2.5 : 2;

    switch (equipType) {
      case 'pump':
        // Centrifugal pump: circular casing with tangential discharge nozzle & base plate (P-101, P-102)
        return (
          <g>
            <circle cx="0" cy="0" r="24" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
            <polygon points="-8,-12 18,0 -8,12" fill={strokeColor} />
            <path d="M 0 -24 L 20 -24 L 20 -15" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
            <line x1="-15" y1="26" x2="15" y2="26" stroke={strokeColor} strokeWidth="2.5" />
            <line x1="-8" y1="24" x2="-8" y2="26" stroke={strokeColor} strokeWidth="2" />
            <line x1="8" y1="24" x2="8" y2="26" stroke={strokeColor} strokeWidth="2" />
          </g>
        );

      case 'tank_vessel':
        // Vertical Vessel / Mixing Tank with internal agitator & propeller (V-101, V-201)
        return (
          <g>
            <path
              d="M -26 -28 C -26 -40 26 -40 26 -28 L 26 28 C 26 40 -26 40 -26 28 Z"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <rect x="-6" y="-48" width="12" height="9" fill={strokeColor} rx="1" />
            <line x1="0" y1="-39" x2="0" y2="24" stroke={strokeColor} strokeWidth="1.75" />
            <path d="M -16 16 L 0 24 L 16 16 M -16 28 L 0 24 L 16 28" fill="none" stroke={strokeColor} strokeWidth="2" />
            <line x1="-20" y1="36" x2="-20" y2="46" stroke={strokeColor} strokeWidth="2.5" />
            <line x1="20" y1="36" x2="20" y2="46" stroke={strokeColor} strokeWidth="2.5" />
          </g>
        );

      case 'reactor_column':
        // Tall Vertical Reactor / Packed Column with internal baffles (R-101)
        return (
          <g>
            <path
              d="M -22 -44 C -22 -54 22 -54 22 -44 L 22 44 C 22 54 -22 54 -22 44 Z"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <line x1="-12" y1="-32" x2="-12" y2="32" stroke="#71717a" strokeWidth="1.5" strokeDasharray="3 2" />
            <line x1="12" y1="-32" x2="12" y2="32" stroke="#71717a" strokeWidth="1.5" strokeDasharray="3 2" />
            <line x1="0" y1="-50" x2="0" y2="-62" stroke={strokeColor} strokeWidth="1.75" />
            <path d="M -8 -62 L -4 -67 L 0 -62 L 4 -67 L 8 -62" fill="none" stroke={strokeColor} strokeWidth="1.5" />
            <line x1="-22" y1="52" x2="-26" y2="60" stroke={strokeColor} strokeWidth="2" />
            <line x1="22" y1="52" x2="26" y2="60" stroke={strokeColor} strokeWidth="2" />
          </g>
        );

      case 'heat_exchanger':
        // Heat Exchanger with internal S-tube bundle & utility ports (HE-101, HE-102)
        return (
          <g>
            <circle cx="0" cy="0" r="25" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
            <path
              d="M -25 0 C -12 -18 12 18 25 0"
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.5"
            />
            <line x1="0" y1="-25" x2="0" y2="-38" stroke="#2563eb" strokeWidth="2" />
            <polygon points="-4,-38 0,-44 4,-38" fill="#2563eb" />
            <text x="7" y="-34" fontSize="8.5" fontWeight="800" fill="#2563eb">CW</text>
          </g>
        );

      case 'heater_coil':
        // Serpentine Thermal Coil / Curing Oven (HT-101)
        return (
          <g>
            <rect
              x="-36"
              y="-24"
              width="72"
              height="48"
              rx="4"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth="1.75"
              strokeDasharray="4 3"
            />
            <path
              d="M -30 -12 L 20 -12 C 28 -12 28 0 20 0 L -20 0 C -28 0 -28 12 -20 12 L 30 12"
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.5"
            />
          </g>
        );

      case 'filter':
        // In-line Filter / Strainer (F-101)
        return (
          <g>
            <path d="M -16 -20 L 16 0 L -16 20 Z" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
            <path d="M 16 -20 L -16 0 L 16 20 Z" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
            <line x1="-16" y1="-20" x2="16" y2="20" stroke="#71717a" strokeWidth="1" strokeDasharray="2 2" />
          </g>
        );

      case 'compressor':
        // Compressor / Blower / Fan (C-101)
        return (
          <g>
            <polygon points="-16,-24 24,-12 24,12 -16,24" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
            <line x1="-16" y1="0" x2="-28" y2="0" stroke={strokeColor} strokeWidth="2" />
            <line x1="24" y1="0" x2="34" y2="0" stroke={strokeColor} strokeWidth="2" />
          </g>
        );

      case 'cyclone':
        // Cyclone Separator / Hopper Silo (CS-201, SL-201)
        return (
          <g>
            <rect x="-24" y="-36" width="48" height="20" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
            <polygon points="-24,-16 24,-16 8,24 -8,24" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
            <rect x="-14" y="24" width="28" height="14" rx="2" fill={fillColor} stroke={strokeColor} strokeWidth="1.75" />
          </g>
        );

      case 'horizontal_drum':
        // Horizontal Storage Drum / Surge Tank (V-203)
        return (
          <g>
            <rect x="-30" y="-16" width="60" height="32" rx="14" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
            <line x1="-18" y1="16" x2="-18" y2="24" stroke={strokeColor} strokeWidth="2.5" />
            <line x1="18" y1="16" x2="18" y2="24" stroke={strokeColor} strokeWidth="2.5" />
            <line x1="-24" y1="24" x2="-12" y2="24" stroke={strokeColor} strokeWidth="2" />
            <line x1="12" y1="24" x2="24" y2="24" stroke={strokeColor} strokeWidth="2" />
          </g>
        );

      case 'inspection':
        // High-Precision Inspection / Vision Station
        return (
          <g>
            <rect x="-24" y="-24" width="48" height="48" rx="8" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
            <circle cx="0" cy="0" r="14" fill="none" stroke={strokeColor} strokeWidth="2" />
            <line x1="-18" y1="0" x2="18" y2="0" stroke="#10b981" strokeWidth="2" />
            <line x1="0" y1="-18" x2="0" y2="18" stroke="#10b981" strokeWidth="2" />
            <polygon points="-6,-24 6,-24 0,-14" fill="#10b981" />
          </g>
        );

      case 'laser_weld':
        // Precision Laser Welding / Joining Cell
        return (
          <g>
            <rect x="-26" y="-18" width="52" height="36" rx="6" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
            <polygon points="-8,-36 8,-36 4,-20 -4,-20" fill={strokeColor} />
            <line x1="0" y1="-20" x2="0" y2="-2" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 2" />
            <circle cx="0" cy="0" r="4" fill="#ef4444" />
          </g>
        );

      case 'press':
        // Mechanical Stamping Press
        return (
          <g>
            <path d="M -24 24 L -24 -28 L 24 -28 L 24 24 L 14 24 L 14 -16 L -14 -16 L -14 24 Z" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
            <rect x="-10" y="-14" width="20" height="16" fill={strokeColor} />
          </g>
        );

      default:
        // General Automated Manufacturing Operation Cell
        return (
          <g>
            <rect x="-25" y="-25" width="50" height="50" rx="8" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
            <circle cx="0" cy="0" r="16" fill="none" stroke={strokeColor} strokeWidth="2" />
            <circle cx="0" cy="0" r="6" fill={strokeColor} />
          </g>
        );
    }
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: 'calc(100vh - 240px)',
        minHeight: 560,
        bgcolor: '#ffffff',
        border: '1px solid #e4e4e7',
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onWheel={onWheel}
    >
      {/* Floating Canvas Controls (Shadcn Style) */}
      <Paper
        elevation={0}
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 10,
          p: 0.5,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          borderRadius: '8px',
          bgcolor: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(8px)',
          border: '1px solid #e4e4e7',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.05)',
        }}
      >
        <Tooltip title="Zoom In (+)">
          <IconButton size="small" onClick={onZoomIn} sx={{ p: 0.75, '&:hover': { bgcolor: '#f4f4f5' } }}>
            <ZoomInIcon sx={{ fontSize: '1.15rem' }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Zoom Out (-)">
          <IconButton size="small" onClick={onZoomOut} sx={{ p: 0.75, '&:hover': { bgcolor: '#f4f4f5' } }}>
            <ZoomOutIcon sx={{ fontSize: '1.15rem' }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Reset View (100%)">
          <IconButton size="small" onClick={onResetZoom} sx={{ p: 0.75, '&:hover': { bgcolor: '#f4f4f5' } }}>
            <ResetIcon sx={{ fontSize: '1.15rem' }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Fit Diagram to Screen">
          <IconButton size="small" onClick={onFitView} sx={{ p: 0.75, '&:hover': { bgcolor: '#f4f4f5' } }}>
            <FitScreenIcon sx={{ fontSize: '1.15rem' }} />
          </IconButton>
        </Tooltip>
        <Box sx={{ width: '1px', height: 20, bgcolor: '#e4e4e7', mx: 0.5 }} />
        <Tooltip title="Export Diagram (SVG)">
          <IconButton size="small" onClick={handleExportSvg} sx={{ p: 0.75, '&:hover': { bgcolor: '#f4f4f5' } }}>
            <DownloadIcon sx={{ fontSize: '1.15rem' }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="ASME/AIAG Symbol Legend">
          <IconButton
            size="small"
            onClick={() => setShowLegend(!showLegend)}
            sx={{ p: 0.75, bgcolor: showLegend ? '#f4f4f5' : 'transparent', '&:hover': { bgcolor: '#f4f4f5' } }}
          >
            <LegendIcon sx={{ fontSize: '1.15rem', color: showLegend ? '#ff682c' : '#71717a' }} />
          </IconButton>
        </Tooltip>
        <Typography sx={{ px: 1, fontSize: '0.75rem', fontWeight: 700, color: '#71717a', minWidth: 42, textAlign: 'center' }}>
          {Math.round(zoom * 100)}%
        </Typography>
      </Paper>

      {/* Symbol Legend Drawer (Collapsible) */}
      {showLegend && (
        <Paper
          elevation={0}
          sx={{
            position: 'absolute',
            top: 68,
            right: 16,
            zIndex: 10,
            p: 2,
            width: 280,
            borderRadius: '10px',
            bgcolor: '#ffffff',
            border: '1px solid #e4e4e7',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#09090b', mb: 1.25 }}>
            AIAG / ASME Standard Symbols
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
            {Object.values(PFD_ICON_MAP).map((m) => (
              <Box key={m.key} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 0.75, borderRadius: '6px', bgcolor: '#fafafa', border: '1px solid #f4f4f5' }}>
                <Typography sx={{ fontSize: '1rem', fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{m.sym}</Typography>
                <Box>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#09090b', lineHeight: 1.1 }}>{m.short}</Typography>
                  <Typography sx={{ fontSize: '0.65rem', color: '#71717a', lineHeight: 1 }}>{m.label}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {/* SVG Canvas with Grid & Orthogonal Piping */}
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <pattern id="eng-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="#e4e4e7" />
          </pattern>
          <marker id="pipe-arrow" markerWidth="9" markerHeight="9" refX="7" refY="3.5" orient="auto">
            <polygon points="0,0 8,3.5 0,7" fill="#09090b" />
          </marker>
          <marker id="pipe-arrow-hover" markerWidth="9" markerHeight="9" refX="7" refY="3.5" orient="auto">
            <polygon points="0,0 8,3.5 0,7" fill="#ff682c" />
          </marker>
        </defs>

        <rect width="100%" height="100%" fill="url(#eng-grid)" />

        <g transform={`translate(${panX}, ${panY}) scale(${zoom})`}>
          {/* 1. Orthogonal Process Piping Connectors */}
          {renderedSteps.map((curr, idx) => {
            if (idx === renderedSteps.length - 1) return null;
            const next = renderedSteps[idx + 1];
            const isHovered = hoveredStepId === curr.step.id || hoveredStepId === next.step.id;
            const strokeColor = isHovered ? '#ff682c' : '#09090b';
            const strokeWidth = isHovered ? 2.5 : 2;
            const marker = isHovered ? 'url(#pipe-arrow-hover)' : 'url(#pipe-arrow)';

            // Connect in same row
            if (curr.row === next.row) {
              const startX = curr.isEvenRow ? curr.x + 36 : curr.x - 36;
              const endX = curr.isEvenRow ? next.x - 36 : next.x + 36;
              const y = curr.y;

              return (
                <g key={`pipe-${curr.step.id}-${next.step.id}`}>
                  <line
                    x1={startX}
                    y1={y}
                    x2={endX}
                    y2={y}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    markerEnd={marker}
                  />
                </g>
              );
            }

            // Waterfall / Row turn connection
            const startX = curr.isEvenRow ? curr.x + 36 : curr.x - 36;
            const startY = curr.y;
            const turnX = startX + (curr.isEvenRow ? 40 : -40);
            const midY = (curr.y + next.y) / 2;
            const nextX = next.isEvenRow ? next.x - 36 : next.x + 36;
            const endY = next.y;

            return (
              <g key={`pipe-turn-${curr.step.id}-${next.step.id}`}>
                <path
                  d={`M ${startX} ${startY} L ${turnX} ${startY} L ${turnX} ${midY} L ${nextX - 30} ${midY} L ${nextX - 30} ${endY} L ${nextX} ${endY}`}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  markerEnd={marker}
                />
              </g>
            );
          })}

          {/* 2. Feed Stream Flags */}
          {renderedSteps.map((s) => {
            if (s.incomingVar.length === 0) return null;
            return (
              <g key={`feed-streams-${s.step.id}`} transform={`translate(${s.x - 42}, ${s.y - 15})`}>
                {s.incomingVar.map((varName, vIdx) => {
                  const offsetY = vIdx * 22 - (s.incomingVar.length - 1) * 11;
                  const label = varName.length > 14 ? `${varName.slice(0, 12)}..` : varName;
                  return (
                    <g key={vIdx} transform={`translate(-62, ${offsetY})`}>
                      <polygon
                        points="-4,-9 44,-9 54,0 44,9 -4,9"
                        fill="#ffffff"
                        stroke="#09090b"
                        strokeWidth="1.5"
                        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.08))' }}
                      />
                      <line x1="54" y1="0" x2="60" y2="0" stroke="#09090b" strokeWidth="1.5" markerEnd="url(#pipe-arrow)" />
                      <text x="20" y="3.5" fontSize="8.5" fontWeight="700" textAnchor="middle" fill="#09090b">
                        {label}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* 3. Equipment Stations & Labels */}
          {renderedSteps.map((s) => {
            const isHovered = hoveredStepId === s.step.id;

            return (
              <g
                key={s.step.id}
                transform={`translate(${s.x}, ${s.y})`}
                onMouseEnter={() => onHoverStep(s.step.id)}
                onMouseLeave={() => onHoverStep(null)}
                onClick={() => onSelectStep(s.step)}
                style={{ cursor: 'pointer' }}
              >
                {/* Subtle Interactive Selection Ring */}
                <rect
                  x="-65"
                  y="-65"
                  width="130"
                  height="160"
                  rx="10"
                  fill={isHovered ? 'rgba(255, 104, 44, 0.04)' : 'transparent'}
                  stroke={isHovered ? '#ff682c' : 'transparent'}
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                  style={{ transition: 'all 0.15s' }}
                />

                {/* ASME / AIAG Standard Symbol Badge */}
                <g transform="translate(0, -64)">
                  <rect
                    x="-42"
                    y="-11"
                    width="84"
                    height="22"
                    rx="5"
                    fill={isHovered ? '#09090b' : '#ffffff'}
                    stroke={isHovered ? '#09090b' : '#e4e4e7'}
                    strokeWidth="1.5"
                    style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.05))' }}
                  />
                  <text
                    x="0"
                    y="4"
                    fontSize="9.5"
                    fontWeight="800"
                    textAnchor="middle"
                    fill={isHovered ? '#ffffff' : '#09090b'}
                  >
                    {s.symbolMeta.sym} {s.symbolMeta.short}
                  </text>
                </g>

                {/* Vector Equipment Graphic */}
                <g transform="translate(0, 0)">
                  {renderEquipmentGraphic(s.equipType, isHovered)}
                </g>

                {/* Equipment Tag (e.g. V-101, P-101) directly beneath unit */}
                <text
                  x="0"
                  y="52"
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="800"
                  fill={isHovered ? '#ff682c' : '#09090b'}
                  letterSpacing="-0.01em"
                >
                  {s.equipTag}
                </text>

                {/* Step Description / Name */}
                <text
                  x="0"
                  y="67"
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight="600"
                  fill="#52525b"
                >
                  {s.step.name && s.step.name.length > 24 ? `${s.step.name.slice(0, 22)}..` : (s.step.name || `Step ${s.step.stepNumber}`)}
                </text>

                {/* Work Element Pill */}
                {s.machines.length > 0 && (
                  <g transform="translate(0, 77)">
                    <rect
                      x="-38"
                      y="0"
                      width="76"
                      height="15"
                      rx="3"
                      fill="#f4f4f5"
                      stroke="#e4e4e7"
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="11"
                      textAnchor="middle"
                      fontSize="8"
                      fontWeight="700"
                      fill="#71717a"
                    >
                      {s.machines[0].length > 14 ? `${s.machines[0].slice(0, 12)}..` : s.machines[0]}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </Box>
  );
};
