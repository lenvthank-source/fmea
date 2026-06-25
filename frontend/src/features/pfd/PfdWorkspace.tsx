import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, IconButton, Alert, CircularProgress, Collapse, Link } from '@mui/material';
import { Add as AddIcon, ArrowUpward as UpIcon, ArrowDownward as DownIcon, Delete as DeleteIcon, Edit as EditIcon, KeyboardArrowDown as ExpandIcon, KeyboardArrowUp as CollapseIcon } from '@mui/icons-material';
import { useAuth } from '../auth/AuthContext';
import { StepFormDialog } from './components/StepFormDialog';
import { WorkElementDialog } from './components/WorkElementDialog';

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
}

export const PfdWorkspace: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [revisionId, setRevisionId] = useState<string | null>(null);
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Dialog states
  const [stepDialogOpen, setStepDialogOpen] = useState(false);
  const [stepToEdit, setStepToEdit] = useState<ProcessStep | undefined>(undefined);
  const [elementDialogOpen, setElementDialogOpen] = useState(false);
  const [activeStepIdForElement, setActiveStepIdForElement] = useState<string | null>(null);

  // Resolve revisionId for the PFD document of this project
  useEffect(() => {
    const resolvePfdRevision = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`http://localhost:3000/api/v1/projects/${projectId}/documents`, {
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

  // Load steps once revisionId is resolved
  const fetchSteps = async () => {
    if (!revisionId) return;
    try {
      const response = await fetch(`http://localhost:3000/api/v1/revisions/${revisionId}/pfd-steps`, {
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

  const handleToggleRow = (stepId: string) => {
    setExpandedRows((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  const getStepTypeChip = (type: string) => {
    switch (type) {
      case 'operation':
        return <Chip label="◯ Operation" size="small" color="primary" />;
      case 'inspection':
        return <Chip label="□ Inspection" size="small" color="success" />;
      case 'transport':
        return <Chip label="⇨ Transport" size="small" color="info" />;
      case 'storage':
        return <Chip label="▽ Storage" size="small" color="warning" />;
      case 'delay':
        return <Chip label="D Delay" size="small" color="warning" variant="outlined" />;
      case 'rework':
        return <Chip label="R Rework" size="small" color="error" />;
      case 'decision':
        return <Chip label="◇ Decision" size="small" color="secondary" />;
      default:
        return <Chip label={type} size="small" />;
    }
  };

  const handleSaveStep = async (stepData: any) => {
    setError(null);
    try {
      let response;
      if (stepToEdit) {
        // Edit step
        response = await fetch(`http://localhost:3000/api/v1/pfd-steps/${stepToEdit.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(stepData),
        });
      } else {
        // Create step
        response = await fetch(`http://localhost:3000/api/v1/revisions/${revisionId}/pfd-steps`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(stepData),
        });
      }

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to save process step');
      }

      await fetchSteps();
    } catch (err: any) {
      setError(err.message || 'Could not save process step');
      throw err;
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    setError(null);
    try {
      const response = await fetch(`http://localhost:3000/api/v1/pfd-steps/${stepId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to delete process step');
      }

      await fetchSteps();
    } catch (err: any) {
      setError(err.message || 'Failed to delete step');
    }
  };

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    setError(null);
    const newSteps = [...steps];
    const swapWith = direction === 'up' ? index - 1 : index + 1;
    
    if (swapWith < 0 || swapWith >= steps.length) return;

    // Swap locally for instant response
    const temp = newSteps[index];
    newSteps[index] = newSteps[swapWith];
    newSteps[swapWith] = temp;
    setSteps(newSteps);

    try {
      const response = await fetch(`http://localhost:3000/api/v1/revisions/${revisionId}/pfd-steps/reorder`, {
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
      fetchSteps(); // Rollback local swap
    }
  };

  const handleSaveWorkElement = async (elementData: any) => {
    setError(null);
    try {
      const response = await fetch(`http://localhost:3000/api/v1/pfd-steps/${activeStepIdForElement}/work-elements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(elementData),
      });

      if (!response.ok) {
        throw new Error('Failed to create work element');
      }

      await fetchSteps();
    } catch (err: any) {
      setError(err.message || 'Could not save work element');
      throw err;
    }
  };

  const handleDeleteWorkElement = async (elementId: string) => {
    setError(null);
    try {
      const response = await fetch(`http://localhost:3000/api/v1/work-elements/${elementId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete work element');
      }

      await fetchSteps();
    } catch (err: any) {
      setError(err.message || 'Failed to delete work element');
    }
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Process Flow Diagram (PFD)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Step 2 of the FMEA Workflow: Define manufacturing process steps and 4M work elements.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setStepToEdit(undefined);
              setStepDialogOpen(true);
            }}
          >
            Add Step
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ border: '1px solid #2e2e36', backgroundImage: 'none' }}>
        <Table aria-label="PFD steps table">
          <TableHead>
            <TableRow>
              <TableCell style={{ width: 50 }} />
              <TableCell style={{ width: 100 }}>Step #</TableCell>
              <TableCell>Name</TableCell>
              <TableCell style={{ width: 150 }}>Type</TableCell>
              <TableCell>Inputs</TableCell>
              <TableCell>Outputs</TableCell>
              <TableCell>Resources</TableCell>
              <TableCell style={{ width: 120 }}>Move</TableCell>
              <TableCell style={{ width: 120 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {steps.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  No process steps added yet. Click "Add Step" to begin.
                </TableCell>
              </TableRow>
            ) : (
              steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <TableRow sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleToggleRow(step.id)}>
                        {expandedRows[step.id] ? <CollapseIcon /> : <ExpandIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{step.stepNumber}</TableCell>
                    <TableCell>{step.name}</TableCell>
                    <TableCell>{getStepTypeChip(step.stepType)}</TableCell>
                    <TableCell color="text.secondary">{step.inputs || '—'}</TableCell>
                    <TableCell color="text.secondary">{step.outputs || '—'}</TableCell>
                    <TableCell color="text.secondary">{step.resources || '—'}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        disabled={index === 0}
                        onClick={() => handleReorder(index, 'up')}
                      >
                        <UpIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        disabled={index === steps.length - 1}
                        onClick={() => handleReorder(index, 'down')}
                      >
                        <DownIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setStepToEdit(step);
                          setStepDialogOpen(true);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeleteStep(step.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>

                  {/* Expandable Work Elements row */}
                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
                      <Collapse in={expandedRows[step.id]} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 2, pl: 6, pr: 2, pb: 2, borderLeft: '2px solid #2196f3' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'primary.light' }}>
                              Work Elements (4M Sub-Tasks)
                            </Typography>
                            <Button
                              size="small"
                              startIcon={<AddIcon />}
                              onClick={() => {
                                setActiveStepIdForElement(step.id);
                                setElementDialogOpen(true);
                              }}
                            >
                              Add Element
                            </Button>
                          </Box>

                          {step.workElements.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                              No work elements defined for this step. Add elements (e.g. Man, Machine) to map to FMEA causes.
                            </Typography>
                          ) : (
                            <Table size="small" aria-label="work elements">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Name</TableCell>
                                  <TableCell>Details / Description</TableCell>
                                  <TableCell style={{ width: 80 }} align="right">Actions</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {step.workElements.map((el) => (
                                  <TableRow key={el.id}>
                                    <TableCell sx={{ fontWeight: 500 }}>{el.name}</TableCell>
                                    <TableCell color="text.secondary">{el.description || '—'}</TableCell>
                                    <TableCell align="right">
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleDeleteWorkElement(el.id)}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialogs */}
      <StepFormDialog
        open={stepDialogOpen}
        onClose={() => setStepDialogOpen(false)}
        onSave={handleSaveStep}
        stepToEdit={stepToEdit}
      />

      <WorkElementDialog
        open={elementDialogOpen}
        onClose={() => setElementDialogOpen(false)}
        onSave={handleSaveWorkElement}
      />
    </Box>
  );
};
