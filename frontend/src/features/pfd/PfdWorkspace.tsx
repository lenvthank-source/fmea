import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, IconButton, Alert, CircularProgress, Link, Tab, Tabs, Input, Drawer, Card, Avatar,
  Divider, Stack, TextField, Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ContentCopy as DuplicateIcon,
  DragIndicator as DragIcon,
  Info as DetailsIcon,
  ChevronRight as ArrowIcon
} from '@mui/icons-material';
import { useAuth } from '../auth/AuthContext';
import { API_BASE_URL } from '../../config';
import { DocumentHeader } from '../../components/DocumentHeader';

interface WorkElement {
  id: string;
  name: string;
  description?: string;
  sequenceOrder: number;
}

interface ProcessStep {
  id: string;
  stepNumber: string;
  name: string;
  stepType: string;
  inputs?: string;
  outputs?: string;
  resources?: string;
  sequenceOrder: number;
  workElements: WorkElement[];
  
  // New columns
  incomingVariation?: string;
  specialCharacteristics?: string;
  flowIcons?: any;
  machinesEquipmentDocs?: string;
  desiredOutcome?: string;
  processCharacteristics?: string;
}

export const PfdWorkspace: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();

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

  // New Work Element input in drawer
  const [newElementName, setNewElementName] = useState('');
  const [newElementDesc, setNewElementDesc] = useState('');

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

  // Flow Icon Column Toggler
  const handleToggleFlowIcon = async (stepId: string, iconKey: string, currentValue: boolean) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return;

    // Set clicked icon to true, and all others to false (exclusive step type toggle)
    const newIcons: Record<string, boolean> = {};
    Object.keys(FLOW_ICON_COLUMNS).forEach(key => {
      newIcons[key] = key === iconKey ? !currentValue : false;
    });

    // Update stepType to match flow column
    let stepType = 'operation';
    if (iconKey === 'oper') stepType = 'operation';
    else if (iconKey === 'insp') stepType = 'inspection';
    else if (iconKey === 'trans') stepType = 'transport';
    else if (iconKey === 'store') stepType = 'storage';
    else if (iconKey === 'decs') stepType = 'decision';
    else if (iconKey === 'rework') stepType = 'rework';
    else if (iconKey === 'reject') stepType = 'rework'; // map reject to rework category

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
      setSteps([...steps, { ...newStep, workElements: [] }]);

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

  // Add work element in side drawer
  const handleAddWorkElement = async () => {
    if (!selectedStep || !newElementName.trim()) return;
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/pfd-steps/${selectedStep.id}/work-elements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newElementName,
          description: newElementDesc,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create work element');
      }

      const element = await response.json();
      const updatedStep = {
        ...selectedStep,
        workElements: [...(selectedStep.workElements || []), element]
      };
      setSelectedStep(updatedStep);
      setSteps(prev => prev.map(s => s.id === selectedStep.id ? updatedStep : s));
      setNewElementName('');
      setNewElementDesc('');
    } catch (err: any) {
      setError(err.message || 'Could not add work element');
    }
  };

  // Delete work element
  const handleDeleteWorkElement = async (elementId: string) => {
    if (!selectedStep) return;
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/work-elements/${elementId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete work element');
      }

      const updatedStep = {
        ...selectedStep,
        workElements: selectedStep.workElements.filter(e => e.id !== elementId)
      };
      setSelectedStep(updatedStep);
      setSteps(prev => prev.map(s => s.id === selectedStep.id ? updatedStep : s));
    } catch (err: any) {
      setError(err.message || 'Could not delete work element');
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
      <Box sx={{ mb: 3 }}>
        <Link component="button" onClick={() => navigate('/projects')} sx={{ color: 'text.secondary', mb: 1, textDecoration: 'none' }}>
          &larr; Back to Projects
        </Link>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Process Flow Diagram (PFD)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Bypass modals to edit cells inline. Build dynamic flow visualizations.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
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
        </Box>
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
                      <TableCell>
                        <Input
                          value={step.incomingVariation || ''}
                          placeholder="Raw casting variations"
                          onChange={(e) => handleFieldChange(step.id, 'incomingVariation', e.target.value)}
                          disableUnderline
                          fullWidth
                          sx={{ fontSize: '0.85rem' }}
                        />
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
                              padding: '2px',
                              bgcolor: isActive ? 'primary.light' : 'transparent',
                              color: isActive ? 'white' : 'text.disabled',
                              transition: 'background-color 0.2s',
                              '&:hover': { bgcolor: isActive ? 'primary.main' : 'rgba(0,0,0,0.04)' }
                            }}
                          >
                            <Tooltip title={iconMeta.name} arrow>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', userSelect: 'none' }}>
                                {iconMeta.sym}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                        );
                      })}

                      {/* Machines / Machinery / Docs */}
                      <TableCell>
                        <Input
                          value={step.machinesEquipmentDocs || step.resources || ''}
                          placeholder="CNC Drilling Machine"
                          onChange={(e) => handleFieldChange(step.id, 'machinesEquipmentDocs', e.target.value)}
                          disableUnderline
                          fullWidth
                          sx={{ fontSize: '0.85rem' }}
                        />
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
        <Card sx={{ p: 4, border: '1px solid #e2e8f0', borderRadius: 4, bgcolor: 'background.paper' }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
            Process Flow Visualization
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {steps.length === 0 ? (
              <Typography color="text.secondary">No process steps found to generate diagram.</Typography>
            ) : (
              steps.map((step, idx) => {
                // Find which icon is active
                const activeIconKey = Object.keys(FLOW_ICON_COLUMNS).find(key => step.flowIcons?.[key]);
                const activeMeta = activeIconKey ? FLOW_ICON_COLUMNS[activeIconKey] : FLOW_ICON_COLUMNS.oper;
                
                return (
                  <Box key={step.id} sx={{ display: 'flex', alignItems: 'center' }}>
                    {/* Step Card */}
                    <Card sx={{
                      width: 400,
                      p: 2,
                      border: '1.5px solid #e2e8f0',
                      borderRadius: 4,
                      boxShadow: 'none',
                      bgcolor: '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}>
                      <Avatar sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        width: 40,
                        height: 40
                      }}>
                        {activeMeta.sym}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {step.stepNumber}
                          </Typography>
                          <Chip label={activeMeta.name.toUpperCase()} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.6rem' }} />
                        </Box>
                        <Typography variant="body2" color="text.primary" sx={{ mt: 0.5 }}>
                          {step.name || 'Untitled Process Step'}
                        </Typography>
                        {step.machinesEquipmentDocs && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            Equipment: {step.machinesEquipmentDocs}
                          </Typography>
                        )}
                      </Box>
                    </Card>

                    {/* Connector Arrow */}
                    {idx < steps.length - 1 && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', ml: 4, color: 'primary.main' }}>
                        <ArrowIcon sx={{ transform: 'rotate(90deg)', fontSize: 32 }} />
                      </Box>
                    )}
                  </Box>
                );
              })
            )}
          </Box>
        </Card>
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
                label="Incoming Source of Variation"
                value={selectedStep.incomingVariation || ''}
                onChange={(e) => {
                  handleFieldChange(selectedStep.id, 'incomingVariation', e.target.value);
                  setSelectedStep({ ...selectedStep, incomingVariation: e.target.value });
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
                label="Machines / Equipment / Documents Used"
                value={selectedStep.machinesEquipmentDocs || ''}
                onChange={(e) => {
                  handleFieldChange(selectedStep.id, 'machinesEquipmentDocs', e.target.value);
                  setSelectedStep({ ...selectedStep, machinesEquipmentDocs: e.target.value });
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

              <Divider sx={{ my: 1 }} />

              {/* Work Elements (4M) List inside Drawer */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Work Elements (4M Sub-Tasks)
                </Typography>
                <Stack spacing={1.5} sx={{ mb: 2 }}>
                  {selectedStep.workElements && selectedStep.workElements.map((el) => (
                    <Box key={el.id} sx={{ display: 'flex', justify: 'space-between', alignItems: 'center', p: 1.5, border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: '#f8fafc' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{el.name}</Typography>
                        {el.description && <Typography variant="caption" color="text.secondary">{el.description}</Typography>}
                      </Box>
                      <IconButton size="small" color="error" onClick={() => handleDeleteWorkElement(el.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                  {(!selectedStep.workElements || selectedStep.workElements.length === 0) && (
                    <Typography variant="caption" color="text.secondary">No work elements defined.</Typography>
                  )}
                </Stack>

                <Box sx={{ border: '1px solid #e2e8f0', p: 2, borderRadius: 3 }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
                    Add New Work Element
                  </Typography>
                  <Stack spacing={1.5}>
                    <TextField
                      size="small"
                      label="Element Name (e.g. Machine, Man)"
                      value={newElementName}
                      onChange={(e) => setNewElementName(e.target.value)}
                    />
                    <TextField
                      size="small"
                      label="Description"
                      value={newElementDesc}
                      onChange={(e) => setNewElementDesc(e.target.value)}
                    />
                    <Button size="small" variant="outlined" onClick={handleAddWorkElement}>
                      Add Element
                    </Button>
                  </Stack>
                </Box>
              </Box>
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
