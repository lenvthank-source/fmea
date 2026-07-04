import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Alert, CircularProgress, Tab, Tabs, Input, Drawer,
  Divider, Stack, TextField, Tooltip, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ContentCopy as DuplicateIcon,
  DragIndicator as DragIcon,
  Info as DetailsIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useAuth } from '../auth/AuthContext';
import { API_BASE_URL } from '../../config';
import { DocumentHeader } from '../../components/DocumentHeader';
import { useResponsive } from '../../hooks/useResponsive';

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

export const PfdWorkspace: React.FC = () => {
  const TextFieldAny = TextField as any;
  const { projectId } = useParams<{ projectId: string }>();
  const { token } = useAuth();

  const [revisionId, setRevisionId] = useState<string | null>(null);
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'table' | 'diagram'>('table');

  // Drawer for Detail Editing
  const [detailsOpen, setDetailsOpen] = useState(false);
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

  // Flow Icon Column Toggler
  const handleToggleFlowIcon = async (stepId: string, iconKey: string, currentValue: boolean) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return;

    const currentIcons = step.flowIcons || {};
    const newIcons = { ...currentIcons, [iconKey]: !currentValue };

    let stepType = step.stepType;
    if (!currentValue) {
      if (iconKey === 'oper') stepType = 'operation';
      else if (iconKey === 'insp') stepType = 'inspection';
      else if (iconKey === 'trans') stepType = 'transport';
      else if (iconKey === 'store') stepType = 'storage';
      else if (iconKey === 'decs') stepType = 'decision';
      else if (iconKey === 'rework') stepType = 'rework';
      else if (iconKey === 'reject') stepType = 'rework';
    }

    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, flowIcons: newIcons, stepType } : s));

    try {
      await fetch(`${API_BASE_URL}/pfd-steps/${stepId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ flowIcons: newIcons, stepType })
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
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
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
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAddDrawer}
        >
          Add Step
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Reusable Collapsible Document Header */}
      <DocumentHeader projectId={projectId!} docType="PFD" />

      {activeTab === 'table' ? (
        <TableContainer component={Paper} sx={{ border: '1px solid #e2e8f0', borderRadius: 4, overflowX: 'auto', mt: 1 }}>
          <Table aria-label="PFD spreadsheet grid" size="small">
            <TableHead>
              <TableRow>
                <TableCell style={{ width: 40 }} /> {/* Drag Handle */}
                <TableCell style={{ width: 80, fontWeight: 'bold' }}>Step #</TableCell>
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
                  <TableCell colSpan={10} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No steps added yet. Click "+ Add Step" to insert a blank row.
                  </TableCell>
                </TableRow>
              ) : (
                steps.map((step, index) => {
                  const icons = step.flowIcons || {};
                  return (
                    <TableRow
                      key={step.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(index)}
                      onMouseEnter={() => setHoveredStepId(step.id)}
                      onMouseLeave={() => setHoveredStepId(null)}
                      sx={{
                        '&:hover': { bgcolor: '#f8fafc' },
                        opacity: draggedIndex === index ? 0.5 : 1,
                        cursor: 'grab',
                        position: 'relative'
                      }}
                    >
                      {/* Drag Handle */}
                      <TableCell align="center" sx={{ cursor: 'move' }}>
                        <DragIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                      </TableCell>

                      {/* Step Number */}
                      <TableCell>
                        <Input
                          value={step.stepNumber}
                          onChange={(e) => handleFieldChange(step.id, 'stepNumber', e.target.value)}
                          disableUnderline
                          fullWidth
                          sx={{ fontSize: '0.85rem', fontWeight: 'bold' }}
                        />
                      </TableCell>

                      {/* Process Description */}
                      <TableCell>
                        <Input
                          id={`name-input-${step.id}`}
                          value={step.name}
                          placeholder="Drill core hole..."
                          onChange={(e) => handleFieldChange(step.id, 'name', e.target.value)}
                          disableUnderline
                          fullWidth
                          sx={{ fontSize: '0.85rem' }}
                        />
                      </TableCell>

                      {/* Incoming Variation */}
                      <TableCell sx={{ verticalAlign: 'top', py: 1.5 }}>
                        {renderMultiInputCell(step.id, 'incomingVariation', 'Raw casting variation...')}
                      </TableCell>

                      {/* Special Characteristics */}
                      <TableCell>
                        <Input
                          value={step.specialCharacteristics || ''}
                          placeholder="CC / SC"
                          onChange={(e) => handleFieldChange(step.id, 'specialCharacteristics', e.target.value)}
                          disableUnderline
                          fullWidth
                          sx={{ fontSize: '0.85rem' }}
                        />
                      </TableCell>

                      {/* Flow Symbols - Floating hover overlay + permanent visible active symbols */}
                      <TableCell sx={{ position: 'relative', minWidth: 130, p: 0.5, bgcolor: 'rgba(1, 105, 111, 0.02)', borderLeft: '1px solid rgba(1, 105, 111, 0.06)', borderRight: '1px solid rgba(1, 105, 111, 0.06)' }}>
                        {hoveredStepId === step.id ? (
                          <Box
                            sx={{
                              position: 'absolute',
                              left: '50%',
                              top: '50%',
                              transform: 'translate(-50%, -50%)',
                              display: 'flex',
                              gap: 0.5,
                              bgcolor: 'rgba(255,255,255,0.98)',
                              border: '1px solid rgba(40, 37, 29, 0.15)',
                              borderRadius: 3,
                              px: 1,
                              py: 0.5,
                              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                              zIndex: 10,
                              animation: 'fadeIn 0.15s ease-in-out',
                              '@keyframes fadeIn': {
                                from: { opacity: 0, transform: 'translate(-50%, -50%) scale(0.95)' },
                                to: { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' }
                              }
                            }}
                            onMouseEnter={() => setHoveredStepId(step.id)}
                          >
                            {Object.keys(FLOW_ICON_COLUMNS).map((key) => {
                              const isActive = !!icons[key];
                              const iconMeta = FLOW_ICON_COLUMNS[key];
                              return (
                                <Tooltip key={key} title={iconMeta.name} arrow>
                                  <Box
                                    onClick={(e) => { e.stopPropagation(); handleToggleFlowIcon(step.id, key, isActive); }}
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
                                      boxShadow: isActive ? `0 4px 8px ${SYMBOL_COLORS[key]?.shadow || 'rgba(0,0,0,0.1)'}` : 'none',
                                      transition: 'all 0.15s ease-in-out',
                                      '&:hover': {
                                        transform: 'scale(1.15)',
                                        bgcolor: isActive ? (SYMBOL_COLORS[key]?.bg || '#01696F') : 'rgba(40, 37, 29, 0.05)',
                                        border: isActive ? '2px solid transparent' : '2px solid rgba(40, 37, 29, 0.3)',
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
                      </TableCell>

                      {/* Machines / Machinery / Docs */}
                      <TableCell sx={{ verticalAlign: 'top', py: 1.5 }}>
                        {renderMultiInputCell(step.id, 'machinesEquipmentDocs', 'CNC Drilling Machine...')}
                      </TableCell>

                      {/* Desired Outcome */}
                      <TableCell sx={{ verticalAlign: 'top', py: 1.5 }}>
                        {renderMultiInputCell(step.id, 'desiredOutcome', 'Hole diameter ø12.05mm')}
                      </TableCell>

                      {/* Process Characteristics */}
                      <TableCell sx={{ verticalAlign: 'top', py: 1.5 }}>
                        {renderMultiInputCell(step.id, 'processCharacteristics', 'Drill spindle speed')}
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
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
            <Typography variant="caption" color="text.secondary" sx={{ bgcolor: 'rgba(255,255,255,0.8)', px: 1.5, py: 0.75, borderRadius: 2, border: '1px solid #e2e8f0' }}>
              💡 Drag to Pan • Mouse wheel to Zoom
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
              }> = [];

              let currentX = 100;
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

                const stepX = currentX;
                const stepWidth = 200;
                
                const nodes = activeKeys.map((key, nodeIdx) => {
                  const meta = FLOW_ICON_COLUMNS[key] || FLOW_ICON_COLUMNS.oper;
                  let color = '#6366f1';
                  if (key === 'insp') color = '#0d9488';
                  else if (key === 'trans') color = '#f97316';
                  else if (key === 'store') color = '#2563eb';
                  else if (key === 'wip') color = '#d97706';
                  else if (key === 'recArea') color = '#059669';
                  else if (key === 'decs') color = '#9333ea';
                  else if (key === 'rework') color = '#e11d48';
                  else if (key === 'reject') color = '#dc2626';

                  return {
                    id: `${step.id}-${key}`,
                    symbolKey: key,
                    sym: meta.sym,
                    short: meta.short,
                    color,
                    x: stepX + stepWidth / 2,
                    y: 180 + nodeIdx * 120
                  };
                });

                stepNodes.push({
                  stepId: step.id,
                  stepNumber: step.stepNumber,
                  name: step.name,
                  nodes,
                  incomingVariation: incomingVar
                });

                currentX += 320;
              });

              return (
                <svg
                  width="100%"
                  height="100%"
                  onWheel={handleWheel}
                  style={{ overflow: 'visible' }}
                >
                  <g transform={`translate(${panX}, ${panY}) scale(${zoom})`}>
                    {/* 1. Connections within steps */}
                    {stepNodes.map((s) => {
                      return s.nodes.slice(0, -1).map((node, idx) => {
                        const nextNode = s.nodes[idx + 1];
                        return (
                          <g key={`intra-${node.id}`}>
                            <defs>
                              <marker id={`arrow-intra-${node.id}`} markerWidth="10" markerHeight="10" refX="22" refY="3" orient="auto" markerUnits="strokeWidth">
                                <path d="M0,0 L0,6 L9,3 z" fill="#cbd5e1" />
                              </marker>
                            </defs>
                            <line
                              x1={node.x}
                              y1={node.y}
                              x2={nextNode.x}
                              y2={nextNode.y}
                              stroke="#cbd5e1"
                              strokeWidth="3"
                              markerEnd={`url(#arrow-intra-${node.id})`}
                            />
                          </g>
                        );
                      });
                    })}

                    {/* 2. Connections between steps with quadratic bezier curves for branches */}
                    {stepNodes.slice(0, -1).map((s, idx) => {
                      const nextS = stepNodes[idx + 1];
                      if (s.nodes.length === 0 || nextS.nodes.length === 0) return null;
                      const startNode = s.nodes[s.nodes.length - 1];
                      const endNode = nextS.nodes[0];
                      
                      const vars = nextS.incomingVariation.length > 0 ? nextS.incomingVariation : [''];
                      const N = vars.length;

                      return vars.map((v, k) => {
                        const midX = (startNode.x + endNode.x) / 2;
                        const midY = (startNode.y + endNode.y) / 2;
                        const offset = N > 1 ? (k - (N - 1) / 2) * 80 : 0;
                        const controlX = midX;
                        const controlY = midY + offset;
                        
                        const pathData = `M ${startNode.x} ${startNode.y} Q ${controlX} ${controlY} ${endNode.x} ${endNode.y}`;
                        const labelX = 0.25 * startNode.x + 0.5 * controlX + 0.25 * endNode.x;
                        const labelY = 0.25 * startNode.y + 0.5 * controlY + 0.25 * endNode.y;

                        return (
                          <g key={`inter-${s.stepId}-${k}`}>
                            <defs>
                              <marker id={`arrow-inter-${s.stepId}-${k}`} markerWidth="6" markerHeight="6" refX="20" refY="3" orient="auto">
                                <path d="M0,0 L0,6 L6,3 z" fill="#818cf8" />
                              </marker>
                            </defs>
                            <path
                              d={pathData}
                              fill="none"
                              stroke="#818cf8"
                              strokeWidth="2"
                              strokeDasharray={N > 1 ? '4 4' : '0'}
                              markerEnd={`url(#arrow-inter-${s.stepId}-${k})`}
                            />
                            {v && (
                              <g transform={`translate(${labelX}, ${labelY - 12})`}>
                                <rect
                                  x={-v.length * 3.5 - 6}
                                  y="-8"
                                  width={v.length * 7 + 12}
                                  height="18"
                                  rx="4"
                                  fill="#ffffff"
                                  stroke="#818cf8"
                                  strokeWidth="1"
                                  style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.06))' }}
                                />
                                <text
                                  textAnchor="middle"
                                  fontSize="9"
                                  fontWeight="bold"
                                  fill="#3730a3"
                                  y="4"
                                >
                                  {v}
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      });
                    })}

                    {/* 3. Steps boundary boxes and active flow symbol nodes */}
                    {stepNodes.map((s) => {
                      const stepWidth = 200;
                      const minHeight = 120 + s.nodes.length * 120;
                      
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
                          <rect
                            x={s.nodes[0].x - stepWidth / 2}
                            y="60"
                            width={stepWidth}
                            height={minHeight}
                            rx="12"
                            fill={hoveredStepId === s.stepId ? "rgba(1, 105, 111, 0.04)" : "rgba(255, 255, 255, 0.85)"}
                            stroke={hoveredStepId === s.stepId ? "#01696F" : "#e2e8f0"}
                            strokeWidth={hoveredStepId === s.stepId ? 2.5 : 1.5}
                            strokeDasharray={hoveredStepId === s.stepId ? "0" : "4 4"}
                            style={{ 
                              filter: hoveredStepId === s.stepId 
                                ? 'drop-shadow(0px 6px 12px rgba(1, 105, 111, 0.15))' 
                                : 'drop-shadow(0px 4px 6px rgba(0,0,0,0.02))',
                              transition: 'all 0.2s ease-in-out'
                            }}
                          />
                          
                          <text
                            x={s.nodes[0].x}
                            y="95"
                            textAnchor="middle"
                            fontWeight="bold"
                            fontSize="14"
                            fill={hoveredStepId === s.stepId ? "#01696F" : "#1e293b"}
                          >
                            {s.stepNumber}
                          </text>
                          <text
                            x={s.nodes[0].x}
                            y="118"
                            textAnchor="middle"
                            fontSize="11"
                            fill={hoveredStepId === s.stepId ? "#01696F" : "#64748b"}
                            fontWeight="600"
                          >
                            {s.name.length > 25 ? `${s.name.substring(0, 22)}...` : (s.name || 'Untitled Step')}
                          </text>

                          {s.nodes.map((node) => (
                            <g key={node.id}>
                              <circle
                                cx={node.x}
                                cy={node.y}
                                r="28"
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
                                fontSize="18"
                                fontWeight="bold"
                                fill={node.color}
                              >
                                {node.sym}
                              </text>
                              <rect
                                x={node.x - 22}
                                y={node.y + 34}
                                width="44"
                                height="15"
                                rx="3.5"
                                fill={node.color}
                              />
                              <text
                                x={node.x}
                                y={node.y + 44}
                                textAnchor="middle"
                                fontSize="8.5"
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
