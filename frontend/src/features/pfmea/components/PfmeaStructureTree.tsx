import React, { useState } from 'react';
import {
  Box, Typography, Button, IconButton, Paper, Divider, TextField,
  Collapse, Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowUpward as UpIcon,
  ArrowDownward as DownIcon,
  ChevronRight as CollapseIcon,
  ExpandMore as ExpandIcon,
  SettingsSuggest as StepIcon,
  Build as WorkElementIcon,
  Warning as FailureIcon,
  Edit as EditIcon,
  FolderOpen as RootIcon,
  HelpOutlined as FunctionIcon
} from '@mui/icons-material';

interface PfmeaStructureTreeProps {
  projectName: string;
  steps: any[];
  rows: any[];
  onAddStep: () => void;
  onEditStep: (step: any) => void;
  onDeleteStep: (stepId: string) => void;
  onMoveStep: (stepId: string, direction: 'up' | 'down') => void;
  onAddFunction: (stepId: string) => void;
  onAddWorkElement: (stepId: string) => void;
  onAddFailure: (stepId: string) => void;
}

export const PfmeaStructureTree: React.FC<PfmeaStructureTreeProps> = ({
  projectName,
  steps,
  rows,
  onAddStep,
  onEditStep,
  onDeleteStep,
  onMoveStep,
  onAddFunction,
  onAddWorkElement,
  onAddFailure
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({ root: true });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleExpand = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelectNode = (id: string) => {
    setSelectedNodeId(id);
  };

  const getSelectedStepId = (): string | null => {
    if (!selectedNodeId) return null;
    if (selectedNodeId.startsWith('step-')) return selectedNodeId.replace('step-', '');
    
    // Resolve parent step ID from children nodes
    const foundStep = steps.find(s => 
      selectedNodeId.endsWith(`-${s.id}`) || selectedNodeId.includes(`-${s.id}-`)
    );
    return foundStep ? foundStep.id : null;
  };

  const selectedStepId = getSelectedStepId();

  const filteredSteps = steps.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.stepNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2 }}>
      {/* 1. Structure Tree Toolbar (FMEA Executive Alignment) */}
      <Paper
        sx={{
          p: 1.5,
          border: '1px solid rgba(40, 37, 29, 0.1)',
          borderRadius: 3,
          bgcolor: 'background.paper',
          boxShadow: 'none'
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Add Group */}
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', mr: 1 }}>ADD</Typography>
            <Button
              size="small"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onAddStep}
            >
              Step
            </Button>
            <Button
              size="small"
              variant="outlined"
              disabled={!selectedStepId}
              onClick={() => selectedStepId && onAddWorkElement(selectedStepId)}
            >
              Work Element
            </Button>
            <Button
              size="small"
              variant="outlined"
              disabled={!selectedStepId}
              onClick={() => selectedStepId && onAddFunction(selectedStepId)}
            >
              Function
            </Button>
            <Button
              size="small"
              variant="outlined"
              disabled={!selectedStepId}
              onClick={() => selectedStepId && onAddFailure(selectedStepId)}
            >
              Failure
            </Button>
          </Stack>

          <Divider orientation="vertical" flexItem />

          {/* Edit Group */}
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', mr: 1 }}>EDIT</Typography>
            <IconButton
              size="small"
              disabled={!selectedNodeId || !selectedNodeId.startsWith('step-')}
              onClick={() => {
                const step = steps.find(s => `step-${s.id}` === selectedNodeId);
                if (step) onEditStep(step);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              disabled={!selectedNodeId || !selectedNodeId.startsWith('step-')}
              onClick={() => {
                const stepId = selectedNodeId?.replace('step-', '');
                if (stepId) onDeleteStep(stepId);
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              disabled={!selectedNodeId || !selectedNodeId.startsWith('step-')}
              onClick={() => {
                const stepId = selectedNodeId?.replace('step-', '');
                if (stepId) onMoveStep(stepId, 'up');
              }}
            >
              <UpIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              disabled={!selectedNodeId || !selectedNodeId.startsWith('step-')}
              onClick={() => {
                const stepId = selectedNodeId?.replace('step-', '');
                if (stepId) onMoveStep(stepId, 'down');
              }}
            >
              <DownIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Divider orientation="vertical" flexItem />

          {/* Search bar */}
          <TextField
            size="small"
            placeholder="Type and Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              ml: 'auto',
              width: 200,
              '& .MuiOutlinedInput-root': {
                height: 32,
                borderRadius: 2,
                fontSize: '0.8rem'
              }
            }}
          />
        </Stack>
      </Paper>

      {/* 2. Interactive Tree Structure Canvas */}
      <Paper
        sx={{
          p: 3,
          border: '1px solid rgba(40, 37, 29, 0.1)',
          borderRadius: 3,
          bgcolor: 'background.paper',
          boxShadow: 'none',
          flexGrow: 1,
          overflowY: 'auto',
          minHeight: 400
        }}
      >
        <Box sx={{ pl: 0.5 }}>
          {/* Root node */}
          <Stack direction="row" spacing={1} onClick={() => handleSelectNode('root')} sx={{ cursor: 'pointer', mb: 1, alignItems: 'center' }}>
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpand('root'); }} sx={{ p: 0.25 }}>
              {expandedNodes.root ? <ExpandIcon fontSize="small" /> : <CollapseIcon fontSize="small" />}
            </IconButton>
            <RootIcon sx={{ color: 'primary.main', fontSize: '1.2rem' }} />
            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: selectedNodeId === 'root' ? 'primary.main' : 'text.primary' }}>
              {projectName || 'Process Item (Root)'}
            </Typography>
          </Stack>

          {/* Child nodes of root (Process Steps) */}
          <Collapse in={expandedNodes.root}>
            <Box sx={{ pl: 3 }}>
              {filteredSteps.map((step) => {
                const stepNodeId = `step-${step.id}`;
                const stepExpanded = !!expandedNodes[stepNodeId];
                const stepSelected = selectedNodeId === stepNodeId;

                const stepRows = rows.filter(r => r.processStepId === step.id);
                
                const uniqueFunctions = Array.from(new Set(stepRows.flatMap(r => r.functions?.map((f: any) => f.name) || []).filter(Boolean)));
                const uniqueFailures = Array.from(new Set(stepRows.flatMap(r => r.failureModes?.map((fm: any) => fm.name) || []).filter(Boolean)));
                
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
                stepWorkElements = stepWorkElements.map(w => w.trim()).filter(Boolean);

                return (
                  <Box key={step.id} sx={{ mb: 1 }}>
                    <Stack
                      direction="row"
                      spacing={1}
                      onClick={() => handleSelectNode(stepNodeId)}
                      onDoubleClick={() => onEditStep(step)}
                      sx={{
                        cursor: 'pointer',
                        py: 0.5,
                        px: 1,
                        borderRadius: 1.5,
                        alignItems: 'center',
                        bgcolor: stepSelected ? 'rgba(1, 105, 111, 0.06)' : 'transparent',
                        '&:hover': { bgcolor: stepSelected ? 'rgba(1, 105, 111, 0.08)' : 'rgba(40, 37, 29, 0.02)' }
                      }}
                    >
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpand(stepNodeId); }} sx={{ p: 0.25 }}>
                        {stepExpanded ? <ExpandIcon fontSize="small" /> : <CollapseIcon fontSize="small" />}
                      </IconButton>
                      <StepIcon sx={{ color: '#2563eb', fontSize: '1.1rem' }} />
                      <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: stepSelected ? 'primary.main' : 'text.primary' }}>
                        {step.stepNumber}: {step.name || 'Untitled Step'}
                      </Typography>
                    </Stack>

                    <Collapse in={stepExpanded}>
                      <Box sx={{ pl: 3.5 }}>
                        {/* 1. Functions Group */}
                        {uniqueFunctions.length > 0 && (
                          <Box sx={{ mt: 0.5 }}>
                            <Stack direction="row" spacing={1} onClick={() => toggleExpand(`func-group-${step.id}`)} sx={{ cursor: 'pointer', py: 0.25, alignItems: 'center' }}>
                              {expandedNodes[`func-group-${step.id}`] ? <ExpandIcon sx={{ fontSize: '0.9rem' }} /> : <CollapseIcon sx={{ fontSize: '0.9rem' }} />}
                              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>Functions</Typography>
                            </Stack>
                            <Collapse in={!!expandedNodes[`func-group-${step.id}`]}>
                              <Box sx={{ pl: 2 }}>
                                {uniqueFunctions.map((fn, fIdx) => (
                                  <Stack key={fIdx} direction="row" spacing={1} sx={{ py: 0.25, alignItems: 'center' }}>
                                    <FunctionIcon sx={{ color: '#437A22', fontSize: '0.9rem' }} />
                                    <Typography variant="body2" sx={{ fontSize: '0.825rem', color: 'text.primary' }}>{fn}</Typography>
                                  </Stack>
                                ))}
                              </Box>
                            </Collapse>
                          </Box>
                        )}

                        {/* 2. Work Elements Group */}
                        {stepWorkElements.length > 0 && (
                          <Box sx={{ mt: 0.5 }}>
                            <Stack direction="row" spacing={1} onClick={() => toggleExpand(`work-group-${step.id}`)} sx={{ cursor: 'pointer', py: 0.25, alignItems: 'center' }}>
                              {expandedNodes[`work-group-${step.id}`] ? <ExpandIcon sx={{ fontSize: '0.9rem' }} /> : <CollapseIcon sx={{ fontSize: '0.9rem' }} />}
                              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>Work Elements (4M)</Typography>
                            </Stack>
                            <Collapse in={!!expandedNodes[`work-group-${step.id}`]}>
                              <Box sx={{ pl: 2 }}>
                                {stepWorkElements.map((we, wIdx) => (
                                  <Stack key={wIdx} direction="row" spacing={1} sx={{ py: 0.25, alignItems: 'center' }}>
                                    <WorkElementIcon sx={{ color: '#f97316', fontSize: '0.9rem' }} />
                                    <Typography variant="body2" sx={{ fontSize: '0.825rem', color: 'text.primary' }}>{we}</Typography>
                                  </Stack>
                                ))}
                              </Box>
                            </Collapse>
                          </Box>
                        )}

                        {/* 3. Failures Group */}
                        {uniqueFailures.length > 0 && (
                          <Box sx={{ mt: 0.5 }}>
                            <Stack direction="row" spacing={1} onClick={() => toggleExpand(`fail-group-${step.id}`)} sx={{ cursor: 'pointer', py: 0.25, alignItems: 'center' }}>
                              {expandedNodes[`fail-group-${step.id}`] ? <ExpandIcon sx={{ fontSize: '0.9rem' }} /> : <CollapseIcon sx={{ fontSize: '0.9rem' }} />}
                              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>Failures</Typography>
                            </Stack>
                            <Collapse in={!!expandedNodes[`fail-group-${step.id}`]}>
                              <Box sx={{ pl: 2 }}>
                                {uniqueFailures.map((fl, flIdx) => (
                                  <Stack key={flIdx} direction="row" spacing={1} sx={{ py: 0.25, alignItems: 'center' }}>
                                    <FailureIcon sx={{ color: '#dc2626', fontSize: '0.9rem' }} />
                                    <Typography variant="body2" sx={{ fontSize: '0.825rem', color: 'text.primary' }}>{fl}</Typography>
                                  </Stack>
                                ))}
                              </Box>
                            </Collapse>
                          </Box>
                        )}

                        {uniqueFunctions.length === 0 && stepWorkElements.length === 0 && uniqueFailures.length === 0 && (
                          <Typography variant="caption" sx={{ display: 'block', pl: 2, py: 0.5, fontStyle: 'italic', color: 'text.secondary' }}>
                            Empty step. Add elements from toolbar.
                          </Typography>
                        )}
                      </Box>
                    </Collapse>
                  </Box>
                );
              })}
            </Box>
          </Collapse>
        </Box>
      </Paper>
    </Box>
  );
};
