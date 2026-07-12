import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Alert, Tab, Tabs, Input, Drawer,
  Divider, Stack, TextField, Tooltip, FormControl, InputLabel, Select, MenuItem, Fab
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ContentCopy as DuplicateIcon,
  DragIndicator as DragIcon,
  Info as DetailsIcon,
  Close as CloseIcon,
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowRight as ChevronRightIcon,
  Download as DownloadIcon,
  Check as CheckIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useAuth } from '../auth/AuthContext';
import { WorkspaceSkeleton } from '../../components/Layout/WorkspaceSkeleton';
import { API_BASE_URL } from '../../config';
import { DocumentHeader } from '../../components/DocumentHeader';
import { useResponsive } from '../../hooks/useResponsive';
import { ReportExporter } from '../reports/ReportExporter';

interface ProcessStep {
  id: string;
  stepNumber: string;
  name: string;
  stepType: string;
  inputs?: string;
  outputs?: string;
  resources?: string;
  sequenceOrder: number;
  
  // New columns
  incomingVariation?: string[];
  specialCharacteristics?: string;
  flowIcons?: any;
  machinesEquipmentDocs?: string[];
  desiredOutcome?: string | string[];
  processCharacteristics?: string | string[];
}

interface PfdCellWrapperProps {
  children: React.ReactNode;
  textToCopy: string;
  onEdit: () => void;
  showEditOnly?: boolean;
}

const PfdCellWrapper: React.FC<PfdCellWrapperProps> = ({ children, textToCopy, onEdit, showEditOnly = false }) => {
  const [showButtons, setShowButtons] = useState(false);
  const [copied, setCopied] = useState(false);
  const timerRef = React.useRef<any>(null);

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setShowButtons(true);
    }, 500);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setShowButtons(false);
    setCopied(false);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit();
  };

  return (
    <Box
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        position: 'relative',
        minHeight: '40px',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        '&:hover': { bgcolor: 'rgba(40, 37, 29, 0.02)' }
      }}
    >
      <Box sx={{ width: '100%', pr: showButtons ? 7 : 0, transition: 'padding-right 0.15s ease' }}>
        {children}
      </Box>
      
      {showButtons && (
        <Box
          sx={{
            position: 'absolute',
            right: 4,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            gap: 0.5,
            bgcolor: 'background.paper',
            border: '1px solid rgba(40, 37, 29, 0.15)',
            borderRadius: 1.5,
            p: 0.25,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            zIndex: 10,
            animation: 'fadeInScale 0.15s ease-in-out',
            '@keyframes fadeInScale': {
              from: { opacity: 0, transform: 'translateY(-50%) scale(0.9)' },
              to: { opacity: 1, transform: 'translateY(-50%) scale(1)' }
            }
          }}
        >
          <Tooltip title="Edit" arrow>
            <IconButton onClick={handleEditClick} size="small" sx={{ p: 0.5 }}>
              <EditIcon sx={{ fontSize: '0.85rem' }} />
            </IconButton>
          </Tooltip>
          {!showEditOnly && (
            <Tooltip title={copied ? "Copied!" : "Copy content"} arrow>
              <IconButton onClick={handleCopy} size="small" sx={{ p: 0.5 }}>
                {copied ? (
                  <CheckIcon sx={{ fontSize: '0.85rem', color: 'success.main' }} />
                ) : (
                  <DuplicateIcon sx={{ fontSize: '0.85rem' }} />
                )}
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}
    </Box>
  );
};

export const PfdWorkspace: React.FC = () => {
  const TextFieldAny = TextField as any;
  const { projectId } = useParams<{ projectId: string }>();
  const { token } = useAuth();

  const [revisionId, setRevisionId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('');
  const [dragAllowedIndex, setDragAllowedIndex] = useState<number | null>(null);
  const [collapsedSteps, setCollapsedSteps] = useState<Set<string>>(new Set());
  const [editingFlowSymbolsStepId, setEditingFlowSymbolsStepId] = useState<string | null>(null);
  const [tempIcons, setTempIcons] = useState<Record<string, boolean>>({});

  const renderCollapsedPreview = (val: any) => {
    if (!val) return '—';
    if (Array.isArray(val)) {
      const filtered = val.filter(Boolean);
      return filtered.length > 0 ? filtered.join(', ') : '—';
    }
    const str = String(val).trim();
    return str || '—';
  };

  const handleToggleExpand = (stepId: string) => {
    setCollapsedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    setCollapsedSteps(new Set());
  };

  const handleCollapseAll = () => {
    setCollapsedSteps(new Set(steps.map(s => s.id)));
  };
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'table' | 'diagram'>('table');

  // Drawer for Detail Editing
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState<ProcessStep | null>(null);
  const [hoveredStepId, setHoveredStepId] = useState<string | null>(null);

  // Drawer for Adding a Step
  const [addOpen, setAddOpen] = useState(false);
  const [addStepNumber, setAddStepNumber] = useState('');
  const [addName, setAddName] = useState('');
  const [addStepType, setAddStepType] = useState('operation');
  const [addIncomingVariation, setAddIncomingVariation] = useState('');
  const [addMachinesEquipmentDocs, setAddMachinesEquipmentDocs] = useState('');
  const [addSpecialCharacteristics, setAddSpecialCharacteristics] = useState('');
  const [addDesiredOutcome, setAddDesiredOutcome] = useState('');
  const [addProcessCharacteristics, setAddProcessCharacteristics] = useState('');

  // Drag and Drop States
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Zoom & Pan navigation states for Flow Diagram
  // Zoom & Pan navigation states for Flow Diagram
  const { isMobile, isTablet } = useResponsive();
  const [zoom, setZoom] = useState(0.85);
  const [panX, setPanX] = useState(50);
  const [panY, setPanY] = useState(80);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setZoom(isMobile ? 0.45 : isTablet ? 0.65 : 0.85);
    setPanX(isMobile ? 10 : isTablet ? 30 : 50);
  }, [isMobile, isTablet]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    let newZoom = zoom;
    if (e.deltaY < 0) {
      newZoom = Math.min(zoom * zoomFactor, 3);
    } else {
      newZoom = Math.max(zoom / zoomFactor, 0.2);
    }
    setZoom(newZoom);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanX(e.clientX - dragStart.x);
    setPanY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPanX(50);
    setPanY(80);
  };



  // Resolve revisionId for PFD
  useEffect(() => {
    const resolvePfdRevision = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/documents`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch project documents');
        const documents = await response.json();
        
        const pfdDoc = documents.find((doc: any) => doc.type === 'PFD');
        if (!pfdDoc || !pfdDoc.currentRevisionId) {
          throw new Error('PFD Document not found or revision not initialized');
        }
        setRevisionId(pfdDoc.currentRevisionId);
      } catch (err: any) {
        setError(err.message || 'An error occurred while loading project context');
        setLoading(false);
      }
    };

    if (projectId && token) {
      resolvePfdRevision();
    }
  }, [projectId, token]);

  const fetchSteps = async () => {
    if (!revisionId) return;
    try {
      const response = await fetch(`${API_BASE_URL}/revisions/${revisionId}/pfd-steps`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to load PFD steps');
      const data = await response.json();
      setSteps(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load process steps');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (revisionId) {
      fetchSteps();
    }
  }, [revisionId]);

  // Inline changes handler
  const handleFieldChange = async (stepId: string, fieldName: string, value: string) => {
    // Optimistic local update
    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, [fieldName]: value } : s));

    try {
      await fetch(`${API_BASE_URL}/pfd-steps/${stepId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [fieldName]: value }),
      });
    } catch (err) {
      console.error('Error updating step inline:', err);
    }
  };

  const renderMultiInputCell = (
    stepId: string,
    fieldName: 'incomingVariation' | 'machinesEquipmentDocs' | 'desiredOutcome' | 'processCharacteristics',
    placeholder: string
  ) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return null;

    let items: string[] = [];
    const val = step[fieldName];
    if (Array.isArray(val)) {
      items = val;
    } else if (typeof val === 'string' && val) {
      if (fieldName === 'desiredOutcome' || fieldName === 'processCharacteristics') {
        items = val.split('\n');
      } else {
        try {
          const parsed = JSON.parse(val);
          items = Array.isArray(parsed) ? parsed : [val];
        } catch {
          items = [val];
        }
      }
    }
    if (items.length === 0) {
      items = [''];
    }

    const handleChange = async (idx: number, newVal: string) => {
      const updated = [...items];
      updated[idx] = newVal;
      
      const valToSave = (fieldName === 'desiredOutcome' || fieldName === 'processCharacteristics')
        ? updated.join('\n')
        : updated;

      setSteps(prev => prev.map(s => s.id === stepId ? { ...s, [fieldName]: valToSave } : s));

      try {
        await fetch(`${API_BASE_URL}/pfd-steps/${stepId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ [fieldName]: valToSave }),
        });
      } catch (err) {
        console.error(err);
      }
    };

    const handleKeyDown = async (e: React.KeyboardEvent, idx: number) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const updated = [...items];
        updated.splice(idx + 1, 0, '');
        
        const valToSave = (fieldName === 'desiredOutcome' || fieldName === 'processCharacteristics')
          ? updated.join('\n')
          : updated;

        setSteps(prev => prev.map(s => s.id === stepId ? { ...s, [fieldName]: valToSave } : s));
        
        try {
          await fetch(`${API_BASE_URL}/pfd-steps/${stepId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ [fieldName]: valToSave }),
          });
        } catch (err) {
          console.error(err);
        }

        setTimeout(() => {
          const nextInput = document.getElementById(`${fieldName}-input-${stepId}-${idx + 1}`);
          if (nextInput) (nextInput as HTMLInputElement).focus();
        }, 50);
      } else if (e.key === 'Backspace' && !items[idx] && items.length > 1) {
        e.preventDefault();
        const updated = [...items];
        updated.splice(idx, 1);
        
        const valToSave = (fieldName === 'desiredOutcome' || fieldName === 'processCharacteristics')
          ? updated.join('\n')
          : updated;

        setSteps(prev => prev.map(s => s.id === stepId ? { ...s, [fieldName]: valToSave } : s));

        try {
          await fetch(`${API_BASE_URL}/pfd-steps/${stepId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ [fieldName]: valToSave }),
          });
        } catch (err) {
          console.error(err);
        }

        setTimeout(() => {
          const prevInput = document.getElementById(`${fieldName}-input-${stepId}-${Math.max(0, idx - 1)}`);
          if (prevInput) (prevInput as HTMLInputElement).focus();
        }, 50);
      }
    };

    const handleDelete = async (idx: number) => {
      if (items.length <= 1) return;
      const updated = [...items];
      updated.splice(idx, 1);
      
      const valToSave = (fieldName === 'desiredOutcome' || fieldName === 'processCharacteristics')
        ? updated.join('\n')
        : updated;

      setSteps(prev => prev.map(s => s.id === stepId ? { ...s, [fieldName]: valToSave } : s));

      try {
        await fetch(`${API_BASE_URL}/pfd-steps/${stepId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ [fieldName]: valToSave }),
        });
      } catch (err) {
        console.error(err);
      }
    };

    return (
      <Stack spacing={0.5}>
        {items.map((item, idx) => (
          <Box
            key={idx}
            sx={{
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              '&:hover .delete-btn': { opacity: 1 }
            }}
          >
            <Input
              id={`${fieldName}-input-${stepId}-${idx}`}
              value={item}
              placeholder={placeholder}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              disableUnderline
              fullWidth
              multiline
              sx={{ fontSize: '0.85rem', pr: items.length > 1 ? 3 : 0 }}
            />
            {items.length > 1 && (
              <IconButton
                className="delete-btn"
                size="small"
                onClick={() => handleDelete(idx)}
                sx={{
                  position: 'absolute',
                  right: 0,
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  padding: '2px'
                }}
              >
                <DeleteIcon fontSize="inherit" sx={{ fontSize: '0.8rem' }} />
              </IconButton>
            )}
          </Box>
        ))}
      </Stack>
    );
  };



  const handleSaveFlowIcons = async (stepId: string) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return;

    let stepType = step.stepType;
    if (tempIcons.oper) stepType = 'operation';
    else if (tempIcons.insp) stepType = 'inspection';
    else if (tempIcons.trans) stepType = 'transport';
    else if (tempIcons.store) stepType = 'storage';
    else if (tempIcons.decs) stepType = 'decision';
    else if (tempIcons.rework) stepType = 'rework';
    else if (tempIcons.reject) stepType = 'rework';

    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, flowIcons: tempIcons, stepType } : s));
    setEditingFlowSymbolsStepId(null);

    try {
      await fetch(`${API_BASE_URL}/pfd-steps/${stepId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ flowIcons: tempIcons, stepType })
      });
    } catch (err) {
      console.error(err);
      fetchSteps(); // rollback
    }
  };

  // Add Step Drawer Handlers
  const handleOpenAddDrawer = () => {
    setError(null);
    const nextSequence = steps.length + 1;
    setAddStepNumber(`OP${nextSequence * 10}`);
    setAddName('');
    setAddStepType('operation');
    setAddIncomingVariation('');
    setAddMachinesEquipmentDocs('');
    setAddSpecialCharacteristics('');
    setAddDesiredOutcome('');
    setAddProcessCharacteristics('');
    setAddOpen(true);
  };

  const handleCreateStep = async () => {
    setError(null);
    try {
      const variationList = addIncomingVariation.split('\n').map(v => v.trim()).filter(Boolean);
      const machinesList = addMachinesEquipmentDocs.split('\n').map(m => m.trim()).filter(Boolean);
      const desiredOutcomeStr = addDesiredOutcome.split('\n').map(d => d.trim()).filter(Boolean).join('\n');
      const processCharStr = addProcessCharacteristics.split('\n').map(p => p.trim()).filter(Boolean).join('\n');

      const flowIcons: Record<string, boolean> = {};
      if (addStepType === 'operation') flowIcons.oper = true;
      else if (addStepType === 'inspection') flowIcons.insp = true;
      else if (addStepType === 'transport') flowIcons.trans = true;
      else if (addStepType === 'storage') flowIcons.store = true;
      else if (addStepType === 'delay') flowIcons.wip = true;
      else if (addStepType === 'rework') flowIcons.rework = true;
      else if (addStepType === 'decision') flowIcons.decs = true;

      const response = await fetch(`${API_BASE_URL}/revisions/${revisionId}/pfd-steps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          stepNumber: addStepNumber,
          name: addName,
          stepType: addStepType,
          incomingVariation: variationList,
          machinesEquipmentDocs: machinesList,
          specialCharacteristics: addSpecialCharacteristics || null,
          desiredOutcome: desiredOutcomeStr || null,
          processCharacteristics: processCharStr || null,
          flowIcons
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create new process step');
      }

      await fetchSteps();
      setAddOpen(false);
    } catch (err: any) {
      setError(err.message || 'Could not create process step');
    }
  };

  // Duplicate step
  const handleDuplicateStep = async (step: ProcessStep) => {
    setError(null);
    try {
      
      const stepNumber = `${step.stepNumber}_copy`;
      const response = await fetch(`${API_BASE_URL}/revisions/${revisionId}/pfd-steps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          stepNumber,
          name: step.name,
          stepType: step.stepType,
          incomingVariation: step.incomingVariation,
          specialCharacteristics: step.specialCharacteristics,
          flowIcons: step.flowIcons,
          machinesEquipmentDocs: step.machinesEquipmentDocs,
          desiredOutcome: step.desiredOutcome,
          processCharacteristics: step.processCharacteristics,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to duplicate step');
      }

      await fetchSteps();
    } catch (err: any) {
      setError(err.message || 'Failed to duplicate step');
    }
  };

  // Delete step
  const handleDeleteStep = async (stepId: string) => {
    if (!window.confirm('Are you sure you want to delete this process step?')) return;
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/pfd-steps/${stepId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to delete process step');
      }

      await fetchSteps();
      if (selectedStep?.id === stepId) {
        setDetailsOpen(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete step');
    }
  };

  // Reordering drag handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    const newSteps = [...steps];
    const draggedItem = newSteps[draggedIndex];
    
    newSteps.splice(draggedIndex, 1);
    newSteps.splice(index, 0, draggedItem);
    
    setSteps(newSteps);
    setDraggedIndex(null);

    try {
      const response = await fetch(`${API_BASE_URL}/revisions/${revisionId}/pfd-steps/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderedStepIds: newSteps.map((s) => s.id) }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync sequence order to server');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save sequence order');
      fetchSteps(); // rollback
    }
  };



  const openDetails = (step: ProcessStep) => {
    setSelectedStep(step);
    setDetailsOpen(true);
  };

  if (loading && !revisionId) {
    return <WorkspaceSkeleton />;
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2, alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'space-between' }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            minHeight: 40,
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
              backgroundColor: 'primary.main',
            }
          }}
        >
          <Tab 
            label="Table View" 
            value="table" 
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              minHeight: 40,
              color: 'text.secondary',
              '&.Mui-selected': { color: 'primary.main' }
            }}
          />
          <Tab 
            label="Flow Diagram" 
            value="diagram" 
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              minHeight: 40,
              color: 'text.secondary',
              '&.Mui-selected': { color: 'primary.main' }
            }}
          />
        </Tabs>
        {activeTab === 'table' && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleExpandAll}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Expand All
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={handleCollapseAll}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Collapse All
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={() => setExportOpen(true)}
              startIcon={<DownloadIcon />}
              sx={{ textTransform: 'none', fontWeight: 600, ml: 1 }}
            >
              Export
            </Button>
          </Box>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Reusable Collapsible Document Header */}
      <DocumentHeader projectId={projectId!} docType="PFD" onHeaderLoaded={(p) => setProjectName(p.name)} />

      {activeTab === 'table' ? (
        <>
          <TableContainer component={Paper} sx={{ border: '1px solid #e2e8f0', borderRadius: 4, overflowX: 'auto', mt: 1 }}>
          <Table aria-label="PFD spreadsheet grid" size="small">
            <TableHead>
              <TableRow>
                <TableCell style={{ width: 40 }} /> {/* Drag Handle */}
                <TableCell style={{ width: 130, fontWeight: 'bold' }}>Step #</TableCell>
                <TableCell style={{ minWidth: 200, fontWeight: 'bold' }}>Process Description</TableCell>
                <TableCell style={{ minWidth: 180, fontWeight: 'bold' }}>Incoming Source of Variation</TableCell>
                <TableCell style={{ minWidth: 100, fontWeight: 'bold' }}>Spec. Class</TableCell>
                <TableCell style={{ minWidth: 130, fontWeight: 'bold', textAlign: 'center' }}>Flow Symbols</TableCell>
                <TableCell style={{ minWidth: 180, fontWeight: 'bold' }}>Machines/Equipment/Docs</TableCell>
                <TableCell style={{ minWidth: 200, fontWeight: 'bold' }}>Product Description / Desired Outcome</TableCell>
                <TableCell style={{ minWidth: 180, fontWeight: 'bold' }}>Process Characteristics</TableCell>
                <TableCell style={{ width: 120, fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {steps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                      No process steps added yet.
                    </Typography>
                    <Fab
                      color="primary"
                      variant="extended"
                      onClick={handleOpenAddDrawer}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 14px 0 rgba(13, 148, 136, 0.4)',
                      }}
                    >
                      <AddIcon sx={{ mr: 1 }} />
                      Add First Step
                    </Fab>
                  </TableCell>
                </TableRow>
              ) : (
                steps.map((step, index) => {
                  const icons = step.flowIcons || {};
                  const isCollapsed = collapsedSteps.has(step.id);
                  return (
                    <TableRow
                      key={step.id}
                      draggable={dragAllowedIndex === index}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(index)}
                      onMouseEnter={() => setHoveredStepId(step.id)}
                      onMouseLeave={() => setHoveredStepId(null)}
                      onClick={() => handleToggleExpand(step.id)}
                      sx={{
                        '&:hover': { bgcolor: '#f8fafc', cursor: 'pointer' },
                        opacity: draggedIndex === index ? 0.5 : 1,
                        position: 'relative'
                      }}
                    >
                      {/* Drag Handle */}
                      <TableCell
                        align="center"
                        sx={{ cursor: 'move' }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={() => setDragAllowedIndex(index)}
                        onMouseUp={() => setDragAllowedIndex(null)}
                        onMouseLeave={() => setDragAllowedIndex(null)}
                      >
                        <DragIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                      </TableCell>

                      {/* Step Number */}
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <PfdCellWrapper
                          textToCopy={step.stepNumber}
                          onEdit={() => {
                            if (isCollapsed) handleToggleExpand(step.id);
                            setTimeout(() => {
                              const el = document.getElementById(`stepNumber-input-${step.id}`);
                              if (el) el.focus();
                            }, 100);
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <IconButton size="small" onClick={() => handleToggleExpand(step.id)} sx={{ p: 0.25 }}>
                              {isCollapsed ? <ChevronRightIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                            </IconButton>
                            {isCollapsed ? (
                              <Typography sx={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
                                {step.stepNumber}
                              </Typography>
                            ) : (
                              <Input
                                id={`stepNumber-input-${step.id}`}
                                value={step.stepNumber}
                                onChange={(e) => handleFieldChange(step.id, 'stepNumber', e.target.value)}
                                disableUnderline
                                fullWidth
                                sx={{ fontSize: '0.85rem', fontWeight: 'bold' }}
                              />
                            )}
                          </Box>
                        </PfdCellWrapper>
                      </TableCell>

                      {/* Process Description */}
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <PfdCellWrapper
                          textToCopy={step.name}
                          onEdit={() => {
                            if (isCollapsed) handleToggleExpand(step.id);
                            setTimeout(() => {
                              const el = document.getElementById(`name-input-${step.id}`);
                              if (el) el.focus();
                            }, 100);
                          }}
                        >
                          {isCollapsed ? (
                            <Typography sx={{ fontSize: '0.85rem', color: 'text.primary' }}>
                              {step.name || 'Untitled Process Step'}
                            </Typography>
                          ) : (
                            <Input
                              id={`name-input-${step.id}`}
                              value={step.name}
                              placeholder="Drill core hole..."
                              onChange={(e) => handleFieldChange(step.id, 'name', e.target.value)}
                              disableUnderline
                              fullWidth
                              multiline
                              sx={{ fontSize: '0.85rem' }}
                            />
                          )}
                        </PfdCellWrapper>
                      </TableCell>

                      {/* Incoming Variation */}
                      <TableCell sx={{ verticalAlign: 'top', py: 1.5 }} onClick={(e) => e.stopPropagation()}>
                        <PfdCellWrapper
                          textToCopy={renderCollapsedPreview(step.incomingVariation)}
                          onEdit={() => {
                            if (isCollapsed) handleToggleExpand(step.id);
                            setTimeout(() => {
                              const el = document.getElementById(`incomingVariation-input-${step.id}-0`);
                              if (el) el.focus();
                            }, 100);
                          }}
                        >
                          {isCollapsed ? (
                            <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', fontStyle: 'italic' }}>
                              {renderCollapsedPreview(step.incomingVariation)}
                            </Typography>
                          ) : (
                            renderMultiInputCell(step.id, 'incomingVariation', 'Raw casting variation...')
                          )}
                        </PfdCellWrapper>
                      </TableCell>

                      {/* Special Characteristics */}
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <PfdCellWrapper
                          textToCopy={step.specialCharacteristics || ''}
                          onEdit={() => {
                            if (isCollapsed) handleToggleExpand(step.id);
                            setTimeout(() => {
                              const el = document.getElementById(`specialCharacteristics-input-${step.id}`);
                              if (el) el.focus();
                            }, 100);
                          }}
                        >
                          {isCollapsed ? (
                            <Typography sx={{ fontSize: '0.85rem', color: 'text.primary' }}>
                              {step.specialCharacteristics || '—'}
                            </Typography>
                          ) : (
                            <Input
                              id={`specialCharacteristics-input-${step.id}`}
                              value={step.specialCharacteristics || ''}
                              placeholder="CC / SC"
                              onChange={(e) => handleFieldChange(step.id, 'specialCharacteristics', e.target.value)}
                              disableUnderline
                              fullWidth
                              multiline
                              sx={{ fontSize: '0.85rem' }}
                            />
                          )}
                        </PfdCellWrapper>
                      </TableCell>

                      {/* Flow Symbols */}
                      <TableCell sx={{ position: 'relative', minWidth: 130, p: 0.5, bgcolor: 'rgba(1, 105, 111, 0.02)', borderLeft: '1px solid rgba(1, 105, 111, 0.06)', borderRight: '1px solid rgba(1, 105, 111, 0.06)' }} onClick={(e) => e.stopPropagation()}>
                        <PfdCellWrapper
                          textToCopy=""
                          showEditOnly
                          onEdit={() => {
                            setTempIcons(step.flowIcons || {});
                            setEditingFlowSymbolsStepId(step.id);
                          }}
                        >
                          {editingFlowSymbolsStepId === step.id ? (
                            <Box
                              sx={{
                                position: 'absolute',
                                left: '50%',
                                top: '50%',
                                transform: 'translate(-50%, -50%)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.75,
                                bgcolor: 'rgba(255,255,255,0.99)',
                                border: '1px solid rgba(40, 37, 29, 0.15)',
                                borderRadius: 3,
                                px: 1.5,
                                py: 0.75,
                                boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
                                zIndex: 100,
                                animation: 'fadeInScale 0.15s ease-in-out',
                                '@keyframes fadeInScale': {
                                  from: { opacity: 0, transform: 'translate(-50%, -50%) scale(0.9)' },
                                  to: { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' }
                                }
                              }}
                            >
                              {Object.keys(FLOW_ICON_COLUMNS).map((key) => {
                                const isActive = !!tempIcons[key];
                                const iconMeta = FLOW_ICON_COLUMNS[key];
                                return (
                                  <Tooltip key={key} title={iconMeta.name} arrow>
                                    <Box
                                      onClick={(e) => { e.stopPropagation(); setTempIcons(prev => ({ ...prev, [key]: !isActive })); }}
                                      sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        cursor: 'pointer',
                                        bgcolor: isActive ? (SYMBOL_COLORS[key]?.bg || '#01696F') : 'transparent',
                                        color: isActive ? (SYMBOL_COLORS[key]?.text || '#ffffff') : '#7A7974',
                                        fontWeight: 'bold',
                                        border: isActive ? '2px solid transparent' : '2px solid rgba(40, 37, 29, 0.15)',
                                        transition: 'all 0.12s ease-in-out',
                                        '&:hover': {
                                          transform: 'scale(1.15)',
                                          bgcolor: isActive ? (SYMBOL_COLORS[key]?.bg || '#01696F') : 'rgba(40, 37, 29, 0.05)',
                                        }
                                      }}
                                    >
                                      <Typography variant="body2" sx={{ fontWeight: 'bold', userSelect: 'none', fontSize: '0.95rem' }}>
                                        {iconMeta.sym}
                                      </Typography>
                                    </Box>
                                  </Tooltip>
                                );
                              })}
                              
                              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

                              <Tooltip title="Save Selection" arrow>
                                <IconButton
                                  size="small"
                                  onClick={(e) => { e.stopPropagation(); handleSaveFlowIcons(step.id); }}
                                  color="success"
                                  sx={{ p: 0.25 }}
                                >
                                  <CheckCircleIcon sx={{ fontSize: '1.4rem' }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          ) : (
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'nowrap', justifyContent: 'center' }}>
                              {Object.keys(FLOW_ICON_COLUMNS).map((key) => {
                                const isActive = !!icons[key];
                                if (!isActive) return null;
                                const iconMeta = FLOW_ICON_COLUMNS[key];
                                return (
                                  <Tooltip key={key} title={iconMeta.name} arrow>
                                    <Stack spacing={0.25} sx={{ alignItems: 'center' }}>
                                      <Box
                                        sx={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          width: 30,
                                          height: 30,
                                          borderRadius: '50%',
                                          bgcolor: SYMBOL_COLORS[key]?.bg || '#01696F',
                                          color: SYMBOL_COLORS[key]?.text || '#ffffff',
                                          fontWeight: 'bold',
                                          boxShadow: `0 3px 6px ${SYMBOL_COLORS[key]?.shadow || 'rgba(0,0,0,0.1)'}`
                                        }}
                                      >
                                        <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.9rem', userSelect: 'none' }}>
                                          {iconMeta.sym}
                                        </Typography>
                                      </Box>
                                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'text.secondary', textTransform: 'uppercase' }}>
                                        {iconMeta.short}
                                      </Typography>
                                    </Stack>
                                  </Tooltip>
                                );
                              })}
                            </Box>
                          )}
                        </PfdCellWrapper>
                      </TableCell>

                      {/* Machines / Machinery / Docs */}
                      <TableCell sx={{ verticalAlign: 'top', py: 1.5 }} onClick={(e) => e.stopPropagation()}>
                        <PfdCellWrapper
                          textToCopy={renderCollapsedPreview(step.machinesEquipmentDocs)}
                          onEdit={() => {
                            if (isCollapsed) handleToggleExpand(step.id);
                            setTimeout(() => {
                              const el = document.getElementById(`machinesEquipmentDocs-input-${step.id}-0`);
                              if (el) el.focus();
                            }, 100);
                          }}
                        >
                          {isCollapsed ? (
                            <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', fontStyle: 'italic' }}>
                              {renderCollapsedPreview(step.machinesEquipmentDocs)}
                            </Typography>
                          ) : (
                            renderMultiInputCell(step.id, 'machinesEquipmentDocs', 'CNC Drilling Machine...')
                          )}
                        </PfdCellWrapper>
                      </TableCell>

                      {/* Desired Outcome */}
                      <TableCell sx={{ verticalAlign: 'top', py: 1.5 }} onClick={(e) => e.stopPropagation()}>
                        <PfdCellWrapper
                          textToCopy={renderCollapsedPreview(step.desiredOutcome)}
                          onEdit={() => {
                            if (isCollapsed) handleToggleExpand(step.id);
                            setTimeout(() => {
                              const el = document.getElementById(`desiredOutcome-input-${step.id}-0`);
                              if (el) el.focus();
                            }, 100);
                          }}
                        >
                          {isCollapsed ? (
                            <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', fontStyle: 'italic' }}>
                              {renderCollapsedPreview(step.desiredOutcome)}
                            </Typography>
                          ) : (
                            renderMultiInputCell(step.id, 'desiredOutcome', 'Hole diameter ø12.05mm')
                          )}
                        </PfdCellWrapper>
                      </TableCell>

                      {/* Process Characteristics */}
                      <TableCell sx={{ verticalAlign: 'top', py: 1.5 }} onClick={(e) => e.stopPropagation()}>
                        <PfdCellWrapper
                          textToCopy={renderCollapsedPreview(step.processCharacteristics)}
                          onEdit={() => {
                            if (isCollapsed) handleToggleExpand(step.id);
                            setTimeout(() => {
                              const el = document.getElementById(`processCharacteristics-input-${step.id}-0`);
                              if (el) el.focus();
                            }, 100);
                          }}
                        >
                          {isCollapsed ? (
                            <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', fontStyle: 'italic' }}>
                              {renderCollapsedPreview(step.processCharacteristics)}
                            </Typography>
                          ) : (
                            renderMultiInputCell(step.id, 'processCharacteristics', 'Drill spindle speed')
                          )}
                        </PfdCellWrapper>
                      </TableCell>

                      {/* Actions */}
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Stack direction="row" spacing={0.5}>
                          <IconButton size="small" onClick={() => openDetails(step)}>
                            <DetailsIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDuplicateStep(step)}>
                            <DuplicateIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeleteStep(step.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {steps.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 4 }}>
            <Fab
              color="primary"
              variant="extended"
              onClick={handleOpenAddDrawer}
              sx={{
                textTransform: 'none',
                fontWeight: 'bold',
                boxShadow: '0 4px 14px 0 rgba(13, 148, 136, 0.4)',
              }}
            >
              <AddIcon sx={{ mr: 1 }} />
              Add Process Step
            </Fab>
          </Box>
        )}
      </>
      ) : (
        /* Flow Diagram View */
        <Box sx={{ position: 'relative', border: '1px solid #cbd5e1', borderRadius: 4, overflow: 'hidden', bgcolor: '#f8fafc', height: 600 }}>
          {/* Zoom/Pan Toolbar */}
          <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 1, zIndex: 10 }}>
            <Button size="small" variant="contained" color="inherit" onClick={() => setZoom(z => Math.min(z + 0.1, 3))} sx={{ minWidth: 32, p: 0.5, fontWeight: 'bold' }}>+</Button>
            <Button size="small" variant="contained" color="inherit" onClick={() => setZoom(z => Math.max(z - 0.1, 0.2))} sx={{ minWidth: 32, p: 0.5, fontWeight: 'bold' }}>-</Button>
            <Button size="small" variant="contained" color="inherit" onClick={handleResetZoom} sx={{ fontSize: '0.75rem' }}>Fit</Button>
          </Box>
          <Box sx={{ position: 'absolute', bottom: 16, left: 16, zIndex: 10 }}>
            <Typography variant="caption" color="text.secondary" sx={{ bgcolor: 'rgba(255,255,255,0.9)', px: 1.5, py: 0.75, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              💡 Drag to Pan • Mouse wheel to Zoom • Click Card for Details
            </Typography>
          </Box>
          <div
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              width: '100%',
              height: '100%',
              cursor: isDragging ? 'grabbing' : 'grab',
              overflow: 'hidden'
            }}
          >
            {steps.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography color="text.secondary">No process steps found to generate diagram.</Typography>
              </Box>
            ) : (() => {
              // Precompute layout coordinates
              const stepNodes: Array<{
                stepId: string;
                stepNumber: string;
                name: string;
                nodes: Array<{
                  id: string;
                  symbolKey: string;
                  sym: string;
                  short: string;
                  color: string;
                  x: number;
                  y: number;
                }>;
                incomingVariation: string[];
                workElements: string[];
                x: number;
                y: number;
                width: number;
                height: number;
              }> = [];

              let currentX = 100;
              const stepY = 120;
              const stepWidth = 280;
              const stepHeight = 230;

              steps.forEach((step) => {
                const activeKeys = Object.keys(FLOW_ICON_COLUMNS).filter(k => step.flowIcons?.[k]);
                if (activeKeys.length === 0) {
                  activeKeys.push('oper');
                }

                let incomingVar: string[] = [];
                const val = step.incomingVariation;
                if (Array.isArray(val)) {
                  incomingVar = val;
                } else if (typeof val === 'string' && val) {
                  try {
                    const parsed = JSON.parse(val);
                    incomingVar = Array.isArray(parsed) ? parsed : [val];
                  } catch {
                    incomingVar = [val];
                  }
                }
                incomingVar = incomingVar.map(v => v.trim()).filter(Boolean);

                let stepWorkElements: string[] = [];
                if (Array.isArray(step.machinesEquipmentDocs)) {
                  stepWorkElements = step.machinesEquipmentDocs;
                } else if (typeof step.machinesEquipmentDocs === 'string' && step.machinesEquipmentDocs) {
                  try {
                    const parsed = JSON.parse(step.machinesEquipmentDocs);
                    stepWorkElements = Array.isArray(parsed) ? parsed : [step.machinesEquipmentDocs];
                  } catch {
                    stepWorkElements = [step.machinesEquipmentDocs];
                  }
                }
                const workElements = stepWorkElements.map(w => w.trim()).filter(Boolean);

                const stepX = currentX;
                const M = activeKeys.length;
                const startSymX = stepX + 28;
                const endSymX = stepX + stepWidth - 28;
                const stepSymX = M > 1 ? (endSymX - startSymX) / (M - 1) : 0;
                
                const nodes = activeKeys.map((key, nodeIdx) => {
                  const meta = FLOW_ICON_COLUMNS[key] || FLOW_ICON_COLUMNS.oper;
                  let color = '#0D9488'; // Teal
                  if (key === 'insp') color = '#2563eb'; // Blue
                  else if (key === 'trans') color = '#f97316'; // Orange
                  else if (key === 'store') color = '#d97706'; // Amber
                  else if (key === 'wip') color = '#9333ea'; // Purple
                  else if (key === 'recArea') color = '#059669'; // Emerald
                  else if (key === 'decs') color = '#475569'; // Slate
                  else if (key === 'rework') color = '#e11d48'; // Rose
                  else if (key === 'reject') color = '#dc2626'; // Red

                  const symX = M > 1 ? startSymX + nodeIdx * stepSymX : stepX + stepWidth / 2;
                  const symY = stepY + 165;

                  return {
                    id: `${step.id}-${key}`,
                    symbolKey: key,
                    sym: meta.sym,
                    short: meta.short,
                    color,
                    x: symX,
                    y: symY
                  };
                });

                stepNodes.push({
                  stepId: step.id,
                  stepNumber: step.stepNumber,
                  name: step.name,
                  nodes,
                  incomingVariation: incomingVar,
                  workElements,
                  x: stepX,
                  y: stepY,
                  width: stepWidth,
                  height: stepHeight
                });

                currentX += 480;
              });

              return (
                <svg
                  width="100%"
                  height="100%"
                  onWheel={handleWheel}
                  style={{ overflow: 'visible' }}
                >
                  <defs>
                    {/* Workspace dot grid pattern */}
                    <pattern id="dot-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                      <circle cx="2" cy="2" r="1.5" fill="#e2e8f0" />
                    </pattern>
                    <marker id="arrow-inter" markerWidth="8" markerHeight="8" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
                      <path d="M0,0 L0,6 L9,3 z" fill="#0D9488" />
                    </marker>
                    <marker id="arrow-intra" markerWidth="6" markerHeight="6" refX="5" refY="2" orient="auto" markerUnits="strokeWidth">
                      <path d="M0,0 L0,4 L6,2 z" fill="#94a3b8" />
                    </marker>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#dot-grid)" />

                  <g transform={`translate(${panX}, ${panY}) scale(${zoom})`}>
                    {/* 1. Intra-step horizontal connections */}
                    {stepNodes.map((s) => {
                      return s.nodes.slice(0, -1).map((node, idx) => {
                        const nextNode = s.nodes[idx + 1];
                        return (
                          <g key={`intra-${node.id}`}>
                            <line
                              x1={node.x + 18}
                              y1={node.y}
                              x2={nextNode.x - 18}
                              y2={nextNode.y}
                              stroke="#cbd5e1"
                              strokeWidth="2"
                              markerEnd="url(#arrow-intra)"
                            />
                          </g>
                        );
                      });
                    })}

                    {/* 2. Connections between steps */}
                    {stepNodes.slice(0, -1).map((s, idx) => {
                      const nextS = stepNodes[idx + 1];
                      if (s.nodes.length === 0 || nextS.nodes.length === 0) return null;
                      
                      const startX = s.x + s.width;
                      const startY = s.y + 165;
                      const endX = nextS.x;
                      const endY = nextS.y + 165;
                      
                      const vars = nextS.incomingVariation.length > 0 ? nextS.incomingVariation : [''];
                      const N = vars.length;
                      const gap = endX - startX;

                      return vars.map((v, k) => {
                        const midX = (startX + endX) / 2;
                        const midY = (startY + endY) / 2;
                        const offset = N > 1 ? (k - (N - 1) / 2) * 60 : 0;
                        const controlY = midY + offset * 1.333; // Cubic bezier control point offset
                        
                        const pathData = N > 1
                          ? `M ${startX} ${startY} C ${startX + gap * 0.4} ${controlY}, ${endX - gap * 0.4} ${controlY}, ${endX} ${endY}`
                          : `M ${startX} ${startY} L ${endX} ${endY}`;
                        
                        const labelX = midX;
                        const labelY = midY + offset;
                        const displayV = v.length > 25 ? `${v.substring(0, 22)}...` : v;

                        return (
                          <g key={`inter-${s.stepId}-${k}`}>
                            <path
                              d={pathData}
                              fill="none"
                              stroke="#0D9488"
                              strokeWidth="2.5"
                              strokeDasharray={N > 1 ? '4 4' : '0'}
                              markerEnd="url(#arrow-inter)"
                            />
                            {v && (
                              <g transform={`translate(${labelX}, ${labelY})`}>
                                <rect
                                  x={-displayV.length * 3.5 - 6}
                                  y="-9"
                                  width={displayV.length * 7 + 12}
                                  height="18"
                                  rx="4"
                                  fill="#ffffff"
                                  stroke="#0D9488"
                                  strokeWidth="1"
                                  style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.06))' }}
                                />
                                <text
                                  textAnchor="middle"
                                  fontSize="9"
                                  fontWeight="bold"
                                  fill="#0f766e"
                                  y="3.5"
                                >
                                  {displayV}
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      });
                    })}

                    {/* 3. Steps boundary boxes and active flow symbol nodes */}
                    {stepNodes.map((s) => {
                      return (
                        <g 
                          key={s.stepId}
                          onMouseEnter={() => setHoveredStepId(s.stepId)}
                          onMouseLeave={() => setHoveredStepId(null)}
                          onClick={() => {
                            const actualStep = steps.find(st => st.id === s.stepId);
                            if (actualStep) openDetails(actualStep);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          {/* Card Outer Shape */}
                          <rect
                            x={s.x}
                            y={s.y}
                            width={s.width}
                            height={s.height}
                            rx="12"
                            fill={hoveredStepId === s.stepId ? "#f8fafc" : "#ffffff"}
                            stroke={hoveredStepId === s.stepId ? "#0D9488" : "#e2e8f0"}
                            strokeWidth={hoveredStepId === s.stepId ? 2.5 : 1.5}
                            style={{ 
                              filter: hoveredStepId === s.stepId 
                                ? 'drop-shadow(0px 8px 16px rgba(13, 148, 136, 0.12))' 
                                : 'drop-shadow(0px 2px 4px rgba(0,0,0,0.03))',
                              transition: 'all 0.2s ease-in-out'
                            }}
                          />
                          
                          {/* Header Bar */}
                          <path
                            d={`M ${s.x + 12} ${s.y} L ${s.x + s.width - 12} ${s.y} A 12 12 0 0 1 ${s.x + s.width} ${s.y + 12} L ${s.x + s.width} ${s.y + 40} L ${s.x} ${s.y + 40} L ${s.x} ${s.y + 12} A 12 12 0 0 1 ${s.x + 12} ${s.y} Z`}
                            fill={hoveredStepId === s.stepId ? "#0f766e" : "#0D9488"}
                            style={{ transition: 'all 0.2s ease-in-out' }}
                          />
                          
                          {/* Header Text */}
                          <text
                            x={s.x + 16}
                            y={s.y + 25}
                            fontWeight="800"
                            fontSize="13"
                            fill="#ffffff"
                          >
                            Step {s.stepNumber}
                          </text>
                          
                          {/* Step Name */}
                          <text
                            x={s.x + 16}
                            y={s.y + 65}
                            fontWeight="700"
                            fontSize="13"
                            fill={hoveredStepId === s.stepId ? "#0f766e" : "#1e293b"}
                          >
                            {s.name.length > 30 ? `${s.name.substring(0, 27)}...` : (s.name || 'Untitled Step')}
                          </text>

                          {/* Components / Work Elements section */}
                          <g transform={`translate(${s.x + 16}, ${s.y + 85})`}>
                            <text x="0" y="5" fontSize="9.5" fontWeight="800" fill="#64748b">COMPONENTS:</text>
                            
                            {s.workElements.length === 0 ? (
                              <text x="0" y="20" fontSize="10.5" fontStyle="italic" fill="#94a3b8">No components linked</text>
                            ) : (
                              s.workElements.slice(0, 3).map((we, idx) => {
                                const badgeX = idx * 82;
                                const displayWe = we.length > 12 ? `${we.substring(0, 9)}..` : we;
                                return (
                                  <g key={idx} transform={`translate(${badgeX}, 11)`}>
                                    <rect
                                      x="0"
                                      y="0"
                                      width="76"
                                      height="18"
                                      rx="4"
                                      fill="#f1f5f9"
                                      stroke="#cbd5e1"
                                      strokeWidth="1"
                                    />
                                    <text
                                      x="38"
                                      y="12"
                                      textAnchor="middle"
                                      fontSize="9"
                                      fontWeight="600"
                                      fill="#475569"
                                    >
                                      {displayWe}
                                    </text>
                                  </g>
                                );
                              })
                            )}
                          </g>

                          {/* Symbol nodes chain */}
                          {s.nodes.map((node) => (
                            <g key={node.id}>
                              <circle
                                cx={node.x}
                                cy={node.y}
                                r="18"
                                fill="#ffffff"
                                stroke={node.color}
                                strokeWidth={hoveredStepId === s.stepId ? 3.5 : 2}
                                style={{ 
                                  filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.06))',
                                  transition: 'all 0.2s ease-in-out'
                                }}
                              />
                              <text
                                x={node.x}
                                y={node.y + 5}
                                textAnchor="middle"
                                fontSize="15"
                                fontWeight="bold"
                                fill={node.color}
                              >
                                {node.sym}
                              </text>
                              <rect
                                x={node.x - 18}
                                y={node.y + 22}
                                width="36"
                                height="11"
                                rx="2"
                                fill={node.color}
                              />
                              <text
                                x={node.x}
                                y={node.y + 30}
                                textAnchor="middle"
                                fontSize="7.5"
                                fontWeight="bold"
                                fill="#ffffff"
                              >
                                {node.short}
                              </text>
                            </g>
                          ))}
                        </g>
                      );
                    })}
                  </g>
                </svg>
              );
            })()}
          </div>
        </Box>
      )}

      {/* Details Slide-out Drawer */}
      <Drawer
        anchor="right"
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        slotProps={{ paper: { sx: { width: 500, p: 4, bgcolor: 'background.paper', borderLeft: '1px solid rgba(40, 37, 29, 0.1)' } } }}
      >
        {selectedStep && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                Step {selectedStep.stepNumber} Details
              </Typography>
              <IconButton onClick={() => setDetailsOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
            <Divider sx={{ mb: 3 }} />

            <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
              <Stack spacing={3}>
                {/* Identity Section */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                    1. Identity
                  </Typography>
                  <Stack spacing={2}>
                    <TextFieldAny
                      fullWidth
                      label="Step Number"
                      value={selectedStep.stepNumber || ''}
                      onChange={(e: any) => {
                        handleFieldChange(selectedStep.id, 'stepNumber', e.target.value);
                        setSelectedStep({ ...selectedStep, stepNumber: e.target.value });
                      }}
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextFieldAny
                      fullWidth
                      label="Process Description"
                      value={selectedStep.name || ''}
                      onChange={(e: any) => {
                        handleFieldChange(selectedStep.id, 'name', e.target.value);
                        setSelectedStep({ ...selectedStep, name: e.target.value });
                      }}
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Stack>
                </Box>

                {/* Inputs Section */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                    2. Inputs
                  </Typography>
                  <Stack spacing={2}>
                    <TextFieldAny
                      fullWidth
                      multiline
                      minRows={2}
                      label="Incoming Source of Variation (one per line)"
                      value={Array.isArray(selectedStep.incomingVariation) ? selectedStep.incomingVariation.join('\n') : (selectedStep.incomingVariation || '')}
                      onChange={(e: any) => {
                        const lines = e.target.value.split('\n');
                        handleFieldChange(selectedStep.id, 'incomingVariation', lines as any);
                        setSelectedStep({ ...selectedStep, incomingVariation: lines });
                      }}
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextFieldAny
                      fullWidth
                      multiline
                      minRows={2}
                      label="Machines / Equipment / Documents Used (one per line)"
                      value={Array.isArray(selectedStep.machinesEquipmentDocs) ? selectedStep.machinesEquipmentDocs.join('\n') : (selectedStep.machinesEquipmentDocs || '')}
                      onChange={(e: any) => {
                        const lines = e.target.value.split('\n');
                        handleFieldChange(selectedStep.id, 'machinesEquipmentDocs', lines as any);
                        setSelectedStep({ ...selectedStep, machinesEquipmentDocs: lines });
                      }}
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Stack>
                </Box>

                {/* Classification Section */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                    3. Classification
                  </Typography>
                  <Stack spacing={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="edit-step-type-label" shrink>Step Type</InputLabel>
                      <Select
                        labelId="edit-step-type-label"
                        value={selectedStep.stepType || 'operation'}
                        label="Step Type"
                        notched
                        onChange={(e: any) => {
                          const val = e.target.value;
                          handleFieldChange(selectedStep.id, 'stepType', val);
                          
                          // Also sync selected flow icon
                          const newIcons: Record<string, boolean> = {};
                          if (val === 'operation') newIcons.oper = true;
                          else if (val === 'inspection') newIcons.insp = true;
                          else if (val === 'transport') newIcons.trans = true;
                          else if (val === 'storage') newIcons.store = true;
                          else if (val === 'delay') newIcons.wip = true;
                          else if (val === 'rework') newIcons.rework = true;
                          else if (val === 'decision') newIcons.decs = true;
                          
                          handleFieldChange(selectedStep.id, 'flowIcons', newIcons as any);
                          setSelectedStep({ ...selectedStep, stepType: val, flowIcons: newIcons });
                        }}
                      >
                        <MenuItem value="operation">Operation (◯)</MenuItem>
                        <MenuItem value="inspection">Inspection (□)</MenuItem>
                        <MenuItem value="transport">Transport (⇨)</MenuItem>
                        <MenuItem value="storage">Storage (▽)</MenuItem>
                        <MenuItem value="delay">Delay (☉)</MenuItem>
                        <MenuItem value="rework">Rework (Ⓡ)</MenuItem>
                        <MenuItem value="decision">Decision (◇)</MenuItem>
                      </Select>
                    </FormControl>
                    <TextFieldAny
                      fullWidth
                      label="Special Characteristics Code"
                      value={selectedStep.specialCharacteristics || ''}
                      onChange={(e: any) => {
                        handleFieldChange(selectedStep.id, 'specialCharacteristics', e.target.value);
                        setSelectedStep({ ...selectedStep, specialCharacteristics: e.target.value });
                      }}
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Stack>
                </Box>

                {/* Outputs Section */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                    4. Outputs
                  </Typography>
                  <Stack spacing={2}>
                    <TextFieldAny
                      fullWidth
                      multiline
                      minRows={2}
                      label="Desired Outcome / Product Characteristics (one per line)"
                      value={selectedStep.desiredOutcome || ''}
                      onChange={(e: any) => {
                        handleFieldChange(selectedStep.id, 'desiredOutcome', e.target.value);
                        setSelectedStep({ ...selectedStep, desiredOutcome: e.target.value });
                      }}
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextFieldAny
                      fullWidth
                      multiline
                      minRows={2}
                      label="Process Characteristics (one per line)"
                      value={selectedStep.processCharacteristics || ''}
                      onChange={(e: any) => {
                        handleFieldChange(selectedStep.id, 'processCharacteristics', e.target.value);
                        setSelectedStep({ ...selectedStep, processCharacteristics: e.target.value });
                      }}
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Stack>
                </Box>
              </Stack>
            </Box>

            <Divider sx={{ my: 2 }} />
            <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
              <Button variant="contained" onClick={() => setDetailsOpen(false)} color="primary">
                Done
              </Button>
            </Stack>
          </Box>
        )}
      </Drawer>

      {/* Add Step Right-Side Drawer */}
      <Drawer
        anchor="right"
        open={addOpen}
        onClose={() => setAddOpen(false)}
        slotProps={{ paper: { sx: { width: 500, p: 4, bgcolor: 'background.paper', borderLeft: '1px solid rgba(40, 37, 29, 0.1)' } } }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              Add Process Step
            </Typography>
            <IconButton onClick={() => setAddOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 3 }} />

          <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
            <Stack spacing={3}>
              {/* Identity Section */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                  1. Identity
                </Typography>
                <Stack spacing={2}>
                  <TextFieldAny
                    fullWidth
                    label="Step Number"
                    value={addStepNumber}
                    onChange={(e: any) => setAddStepNumber(e.target.value)}
                    placeholder="e.g. OP10"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextFieldAny
                    fullWidth
                    label="Step Description / Name"
                    value={addName}
                    onChange={(e: any) => setAddName(e.target.value)}
                    placeholder="e.g. Assemble front bracket"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Stack>
              </Box>

              {/* Inputs Section */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                  2. Inputs
                </Typography>
                <Stack spacing={2}>
                  <TextFieldAny
                    fullWidth
                    multiline
                    minRows={2}
                    label="Incoming Source of Variation (one per line)"
                    value={addIncomingVariation}
                    onChange={(e: any) => setAddIncomingVariation(e.target.value)}
                    placeholder="Raw material thickness variation..."
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextFieldAny
                    fullWidth
                    multiline
                    minRows={2}
                    label="Machines / Equipment / Docs (one per line)"
                    value={addMachinesEquipmentDocs}
                    onChange={(e: any) => setAddMachinesEquipmentDocs(e.target.value)}
                    placeholder="Hydraulic Press HP-01..."
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Stack>
              </Box>

              {/* Classification Section */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                  3. Classification
                </Typography>
                <Stack spacing={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="add-step-type-label" shrink>Step Type</InputLabel>
                    <Select
                      labelId="add-step-type-label"
                      value={addStepType}
                      label="Step Type"
                      notched
                      onChange={(e: any) => setAddStepType(e.target.value)}
                    >
                      <MenuItem value="operation">Operation (◯)</MenuItem>
                      <MenuItem value="inspection">Inspection (□)</MenuItem>
                      <MenuItem value="transport">Transport (⇨)</MenuItem>
                      <MenuItem value="storage">Storage (▽)</MenuItem>
                      <MenuItem value="delay">Delay (☉)</MenuItem>
                      <MenuItem value="rework">Rework (Ⓡ)</MenuItem>
                      <MenuItem value="decision">Decision (◇)</MenuItem>
                    </Select>
                  </FormControl>
                  <TextFieldAny
                    fullWidth
                    label="Special Characteristics Code"
                    value={addSpecialCharacteristics}
                    onChange={(e: any) => setAddSpecialCharacteristics(e.target.value)}
                    placeholder="e.g. SC / CC / OS"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Stack>
              </Box>

              {/* Outputs Section */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                  4. Outputs
                </Typography>
                <Stack spacing={2}>
                  <TextFieldAny
                    fullWidth
                    multiline
                    minRows={2}
                    label="Desired Outcome / Product Characteristics (one per line)"
                    value={addDesiredOutcome}
                    onChange={(e: any) => setAddDesiredOutcome(e.target.value)}
                    placeholder="Hole diameter 12.0 +/- 0.2mm..."
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextFieldAny
                    fullWidth
                    multiline
                    minRows={2}
                    label="Process Characteristics (one per line)"
                    value={addProcessCharacteristics}
                    onChange={(e: any) => setAddProcessCharacteristics(e.target.value)}
                    placeholder="Clamping pressure 5.2 bar..."
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Stack>
              </Box>
            </Stack>
          </Box>

          <Divider sx={{ my: 2 }} />
          <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleCreateStep} color="primary">
              Create Step
            </Button>
          </Stack>
        </Box>
      </Drawer>

      <ReportExporter
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        docType="PFD"
        projectName={projectName}
        data={steps}
        steps={steps}
      />
    </Box>
  );
};

// Symbol color themes
const SYMBOL_COLORS: Record<string, { bg: string; text: string; shadow: string }> = {
  trans: { bg: '#10b981', text: '#ffffff', shadow: 'rgba(16, 185, 129, 0.25)' },
  recArea: { bg: '#6366f1', text: '#ffffff', shadow: 'rgba(99, 102, 241, 0.25)' },
  store: { bg: '#8b5cf6', text: '#ffffff', shadow: 'rgba(139, 92, 246, 0.25)' },
  wip: { bg: '#3b82f6', text: '#ffffff', shadow: 'rgba(59, 130, 246, 0.25)' },
  oper: { bg: '#01696F', text: '#ffffff', shadow: 'rgba(1, 105, 111, 0.25)' },
  insp: { bg: '#ca8a04', text: '#ffffff', shadow: 'rgba(202, 138, 4, 0.25)' },
  decs: { bg: '#06b6d4', text: '#ffffff', shadow: 'rgba(6, 182, 212, 0.25)' },
  rework: { bg: '#f97316', text: '#ffffff', shadow: 'rgba(249, 115, 22, 0.25)' },
  reject: { bg: '#dc2626', text: '#ffffff', shadow: 'rgba(220, 38, 38, 0.25)' },
};

// Flow Icons column definitions
const FLOW_ICON_COLUMNS: Record<string, { label: string; short: string; sym: string; name: string }> = {
  trans: { label: 'TRANS.', short: 'TRNS', sym: '⇨', name: 'Transport' },
  recArea: { label: 'Rec. Area', short: 'REC', sym: '📥', name: 'Receiving Area' },
  store: { label: 'STORE', short: 'STR', sym: '▽', name: 'Storage (Main)' },
  wip: { label: 'WIP @ Line', short: 'WIP', sym: '☉', name: 'Work in Progress' },
  oper: { label: 'OPER.', short: 'OPER', sym: '◯', name: 'Operation' },
  insp: { label: 'INSP.', short: 'INSP', sym: '□', name: 'Inspection' },
  decs: { label: 'DECS.', short: 'DEC', sym: '◇', name: 'Decision' },
  rework: { label: 'REWORK', short: 'REW', sym: 'Ⓡ', name: 'Rework' },
  reject: { label: 'REJECT', short: 'REJ', sym: '✕', name: 'Reject' },
};
