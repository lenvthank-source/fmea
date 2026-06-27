import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Alert, CircularProgress, Tab, Tabs, Input, Drawer,
  Divider, Stack, TextField, Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ContentCopy as DuplicateIcon,
  DragIndicator as DragIcon,
  Info as DetailsIcon
} from '@mui/icons-material';
import { useAuth } from '../auth/AuthContext';
import { API_BASE_URL } from '../../config';
import { DocumentHeader } from '../../components/DocumentHeader';

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
  desiredOutcome?: string;
  processCharacteristics?: string;
}

export const PfdWorkspace: React.FC = () => {
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

  // Drag and Drop States
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Zoom & Pan navigation states for Flow Diagram
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(50);
  const [panY, setPanY] = useState(80);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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

  const renderMultiInputCell = (stepId: string, fieldName: 'incomingVariation' | 'machinesEquipmentDocs', placeholder: string) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return null;

    let items: string[] = [];
    const val = step[fieldName];
    if (Array.isArray(val)) {
      items = val;
    } else if (typeof val === 'string' && val) {
      try {
        const parsed = JSON.parse(val);
        items = Array.isArray(parsed) ? parsed : [val];
      } catch {
        items = [val];
      }
    }
    if (items.length === 0) {
      items = [''];
    }

    const handleChange = async (idx: number, newVal: string) => {
      const updated = [...items];
      updated[idx] = newVal;
      
      setSteps(prev => prev.map(s => s.id === stepId ? { ...s, [fieldName]: updated } : s));

      try {
        await fetch(`${API_BASE_URL}/pfd-steps/${stepId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ [fieldName]: updated }),
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
        
        setSteps(prev => prev.map(s => s.id === stepId ? { ...s, [fieldName]: updated } : s));
        
        try {
          await fetch(`${API_BASE_URL}/pfd-steps/${stepId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ [fieldName]: updated }),
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
        
        setSteps(prev => prev.map(s => s.id === stepId ? { ...s, [fieldName]: updated } : s));

        try {
          await fetch(`${API_BASE_URL}/pfd-steps/${stepId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ [fieldName]: updated }),
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
      
      setSteps(prev => prev.map(s => s.id === stepId ? { ...s, [fieldName]: updated } : s));

      try {
        await fetch(`${API_BASE_URL}/pfd-steps/${stepId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ [fieldName]: updated }),
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

  // Add Blank Row
  const handleAddBlankRow = async () => {
    setError(null);
    try {
      const nextSequence = steps.length + 1;
      const stepNumber = `OP${nextSequence * 10}`;
      const response = await fetch(`${API_BASE_URL}/revisions/${revisionId}/pfd-steps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          stepNumber,
          name: '',
          stepType: 'operation',
          flowIcons: { oper: true }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to insert new process step');
      }

      const newStep = await response.json();
      setSteps([...steps, newStep]);

      // Focus the new input
      setTimeout(() => {
        const input = document.getElementById(`name-input-${newStep.id}`);
        if (input) input.focus();
      }, 80);
    } catch (err: any) {
      setError(err.message || 'Could not insert new step');
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
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end', gap: 2, alignItems: 'center' }}>
        <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
          <Tab label="Table View" value="table" />
          <Tab label="Flow Diagram" value="diagram" />
        </Tabs>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddBlankRow}
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
                
                {/* 9 Flow Icons Columns */}
                {Object.entries(FLOW_ICON_COLUMNS).map(([key, label]) => (
                  <TableCell key={key} align="center" style={{ width: 40, padding: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                    {label.short}
                  </TableCell>
                ))}

                <TableCell style={{ minWidth: 180, fontWeight: 'bold' }}>Machines/Equipment/Docs</TableCell>
                <TableCell style={{ minWidth: 180, fontWeight: 'bold' }}>Desired Outcome</TableCell>
                <TableCell style={{ minWidth: 180, fontWeight: 'bold' }}>Process Characteristics</TableCell>
                <TableCell style={{ width: 120, fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {steps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={22} align="center" sx={{ py: 6, color: 'text.secondary' }}>
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
                      sx={{
                        '&:hover': { bgcolor: '#f8fafc' },
                        opacity: draggedIndex === index ? 0.5 : 1,
                        cursor: 'grab'
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

                      {/* 9 Flow Icons column toggle cells */}
                      {Object.keys(FLOW_ICON_COLUMNS).map((key) => {
                        const isActive = !!icons[key];
                        const iconMeta = FLOW_ICON_COLUMNS[key];
                        return (
                          <TableCell
                            key={key}
                            align="center"
                            onClick={() => handleToggleFlowIcon(step.id, key, isActive)}
                            sx={{
                              cursor: 'pointer',
                              padding: '4px',
                              transition: 'all 0.2s',
                              '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' }
                            }}
                          >
                            <Tooltip title={iconMeta.name} arrow>
                              <Box
                                sx={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: 28,
                                  height: 28,
                                  borderRadius: '50%',
                                  bgcolor: isActive ? 'primary.main' : 'transparent',
                                  color: isActive ? 'white' : '#475569',
                                  fontWeight: 'bold',
                                  border: isActive ? '1px solid transparent' : '1px solid #cbd5e1',
                                  boxShadow: isActive ? '0 2px 4px rgba(99, 102, 241, 0.4)' : 'none',
                                  transition: 'all 0.2s',
                                  '&:hover': {
                                    transform: 'scale(1.1)',
                                    bgcolor: isActive ? 'primary.dark' : '#f1f5f9'
                                  }
                                }}
                              >
                                <Typography variant="body2" sx={{ fontWeight: 'bold', userSelect: 'none', fontSize: '0.95rem' }}>
                                  {iconMeta.sym}
                                </Typography>
                              </Box>
                            </Tooltip>
                          </TableCell>
                        );
                      })}

                      {/* Machines / Machinery / Docs */}
                      <TableCell sx={{ verticalAlign: 'top', py: 1.5 }}>
                        {renderMultiInputCell(step.id, 'machinesEquipmentDocs', 'CNC Drilling Machine...')}
                      </TableCell>

                      {/* Desired Outcome */}
                      <TableCell>
                        <Input
                          value={step.desiredOutcome || step.outputs || ''}
                          placeholder="Hole diameter ø12.05mm"
                          onChange={(e) => handleFieldChange(step.id, 'desiredOutcome', e.target.value)}
                          disableUnderline
                          fullWidth
                          sx={{ fontSize: '0.85rem' }}
                        />
                      </TableCell>

                      {/* Process Characteristics */}
                      <TableCell>
                        <Input
                          value={step.processCharacteristics || ''}
                          placeholder="Drill spindle speed"
                          onChange={(e) => handleFieldChange(step.id, 'processCharacteristics', e.target.value)}
                          disableUnderline
                          fullWidth
                          sx={{ fontSize: '0.85rem' }}
                        />
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
                        <g key={s.stepId}>
                          <rect
                            x={s.nodes[0].x - stepWidth / 2}
                            y="60"
                            width={stepWidth}
                            height={minHeight}
                            rx="12"
                            fill="rgba(255, 255, 255, 0.85)"
                            stroke="#e2e8f0"
                            strokeWidth="1.5"
                            strokeDasharray="4 4"
                            style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.02))' }}
                          />
                          
                          <text
                            x={s.nodes[0].x}
                            y="95"
                            textAnchor="middle"
                            fontWeight="bold"
                            fontSize="14"
                            fill="#1e293b"
                          >
                            {s.stepNumber}
                          </text>
                          <text
                            x={s.nodes[0].x}
                            y="118"
                            textAnchor="middle"
                            fontSize="11"
                            fill="#64748b"
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
                                strokeWidth="2"
                                style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.06))' }}
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
        slotProps={{ paper: { sx: { width: 450, p: 3, borderLeft: '1px solid #e2e8f0' } } }}
      >
        {selectedStep && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Step {selectedStep.stepNumber} Details
              </Typography>
              <Button onClick={() => setDetailsOpen(false)}>Close</Button>
            </Box>
            <Divider sx={{ mb: 3 }} />

            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Process Description"
                value={selectedStep.name || ''}
                onChange={(e) => {
                  handleFieldChange(selectedStep.id, 'name', e.target.value);
                  setSelectedStep({ ...selectedStep, name: e.target.value });
                }}
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Incoming Source of Variation (one per line)"
                value={Array.isArray(selectedStep.incomingVariation) ? selectedStep.incomingVariation.join('\n') : (selectedStep.incomingVariation || '')}
                onChange={(e) => {
                  const lines = e.target.value.split('\n');
                  handleFieldChange(selectedStep.id, 'incomingVariation', lines as any);
                  setSelectedStep({ ...selectedStep, incomingVariation: lines });
                }}
              />
              <TextField
                fullWidth
                label="Special Characteristics Code"
                value={selectedStep.specialCharacteristics || ''}
                onChange={(e) => {
                  handleFieldChange(selectedStep.id, 'specialCharacteristics', e.target.value);
                  setSelectedStep({ ...selectedStep, specialCharacteristics: e.target.value });
                }}
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Machines / Equipment / Documents Used (one per line)"
                value={Array.isArray(selectedStep.machinesEquipmentDocs) ? selectedStep.machinesEquipmentDocs.join('\n') : (selectedStep.machinesEquipmentDocs || '')}
                onChange={(e) => {
                  const lines = e.target.value.split('\n');
                  handleFieldChange(selectedStep.id, 'machinesEquipmentDocs', lines as any);
                  setSelectedStep({ ...selectedStep, machinesEquipmentDocs: lines });
                }}
              />
              <TextField
                fullWidth
                label="Desired Outcome / Product Characteristics"
                value={selectedStep.desiredOutcome || ''}
                onChange={(e) => {
                  handleFieldChange(selectedStep.id, 'desiredOutcome', e.target.value);
                  setSelectedStep({ ...selectedStep, desiredOutcome: e.target.value });
                }}
              />
              <TextField
                fullWidth
                label="Process Characteristics"
                value={selectedStep.processCharacteristics || ''}
                onChange={(e) => {
                  handleFieldChange(selectedStep.id, 'processCharacteristics', e.target.value);
                  setSelectedStep({ ...selectedStep, processCharacteristics: e.target.value });
                }}
              />
            </Stack>
          </Box>
        )}
      </Drawer>
    </Box>
  );
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
