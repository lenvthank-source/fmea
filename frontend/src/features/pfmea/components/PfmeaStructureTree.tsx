import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
  Stack,
  Collapse,
  Tooltip,
  TextField,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ChevronRight as CollapseIcon,
  ExpandMore as ExpandIcon,
  AccountTree as RootIcon,
  ViewWeek as StepIcon,
  PrecisionManufacturing as WorkElementIcon,
  HelpOutlined as FunctionIcon,
  Warning as FailureIcon
} from '@mui/icons-material';

interface ProcessStep {
  id: string;
  stepNumber: string;
  name: string;
  machinesEquipmentDocs?: any;
  isOrphaned?: boolean;
}

interface PfmeaRow {
  id: string;
  processStepId: string | null;
  workElementName: string | null;
  rowNumber: number;
  severity: number | null;
  occurrence: number | null;
  detection: number | null;
  ap: string | null;
  functions?: { name: string }[];
  failureModes?: { name: string }[];
}

interface PfmeaStructureTreeProps {
  projectName: string;
  steps: ProcessStep[];
  rows: PfmeaRow[];
  onAddStep: () => void;
  onEditStep: (step: ProcessStep) => void;
  onDeleteStep: (stepId: string) => void;
  onMoveStep: (stepId: string, direction: 'up' | 'down') => void;
  onAddFunction: (stepId: string | null, workElementName?: string | null) => void;
  onAddWorkElement: (stepId: string) => void;
  onAddFailure: (stepId: string | null, parentContext?: { workElementName?: string | null; functionName: string }) => void;
}

export const PfmeaStructureTree: React.FC<PfmeaStructureTreeProps> = ({
  projectName,
  steps,
  rows,
  onAddStep,
  onEditStep,
  onDeleteStep,
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

  // Helper to extract step ID and other metadata from selectedNodeId
  const getSelectedNodeInfo = () => {
    if (!selectedNodeId) return null;
    
    if (selectedNodeId === 'root') {
      return { type: 'root', stepId: null };
    }
    
    if (selectedNodeId.startsWith('root-func-')) {
      const functionName = selectedNodeId.replace('root-func-', '');
      return { type: 'root-function', stepId: null, functionName };
    }

    if (selectedNodeId.startsWith('step-func-')) {
      // step-func-${stepId}-${fnName}
      const parts = selectedNodeId.replace('step-func-', '').split('-');
      const stepId = parts[0];
      const functionName = parts.slice(1).join('-');
      return { type: 'step-function', stepId, functionName };
    }

    if (selectedNodeId.startsWith('step-')) {
      const stepId = selectedNodeId.replace('step-', '');
      return { type: 'step', stepId };
    }

    if (selectedNodeId.startsWith('we-func-')) {
      // we-func-${stepId}-${weName}-${fnName}
      const parts = selectedNodeId.replace('we-func-', '').split('-');
      const stepId = parts[0];
      const weName = parts[1];
      const functionName = parts.slice(2).join('-');
      return { type: 'we-function', stepId, workElementName: weName, functionName };
    }

    if (selectedNodeId.startsWith('we-')) {
      // we-${stepId}-${weName}
      const parts = selectedNodeId.replace('we-', '').split('-');
      const stepId = parts[0];
      const weName = parts.slice(1).join('-');
      return { type: 'workElement', stepId, workElementName: weName };
    }

    return null;
  };

  const nodeInfo = getSelectedNodeInfo();

  // Enable/Disable rules based on user-agent spec
  const isAddStepEnabled = true;
  const isAddWorkElementEnabled = !!nodeInfo && nodeInfo.type === 'step';
  const isAddFunctionEnabled = !!nodeInfo && (
    nodeInfo.type === 'root' || 
    nodeInfo.type === 'step' || 
    nodeInfo.type === 'workElement'
  );
  const isAddFailureEnabled = !!nodeInfo && (
    nodeInfo.type === 'root-function' || 
    nodeInfo.type === 'step-function' || 
    nodeInfo.type === 'we-function'
  );

  const handleAddFunctionClick = () => {
    if (!nodeInfo) return;
    if (nodeInfo.type === 'root') {
      onAddFunction(null, null);
    } else if (nodeInfo.type === 'step') {
      onAddFunction(nodeInfo.stepId, null);
    } else if (nodeInfo.type === 'workElement') {
      onAddFunction(nodeInfo.stepId, nodeInfo.workElementName);
    }
  };

  const handleAddFailureClick = () => {
    if (!nodeInfo) return;
    if (nodeInfo.type === 'root-function') {
      onAddFailure(null, { functionName: nodeInfo.functionName! });
    } else if (nodeInfo.type === 'step-function') {
      onAddFailure(nodeInfo.stepId, { functionName: nodeInfo.functionName! });
    } else if (nodeInfo.type === 'we-function') {
      onAddFailure(nodeInfo.stepId, { 
        workElementName: nodeInfo.workElementName, 
        functionName: nodeInfo.functionName! 
      });
    }
  };

  const filteredSteps = steps.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.stepNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group root rows
  const rootRows = rows.filter(r => !r.processStepId);
  const rootFunctions = Array.from(new Set(rootRows.flatMap(r => r.functions?.map(f => f.name) || []))).filter(Boolean);

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
              disabled={!isAddStepEnabled}
            >
              Step
            </Button>
            <Button
              size="small"
              variant="outlined"
              disabled={!isAddWorkElementEnabled}
              onClick={() => nodeInfo && nodeInfo.stepId && onAddWorkElement(nodeInfo.stepId)}
            >
              Work Element
            </Button>
            <Button
              size="small"
              variant="outlined"
              disabled={!isAddFunctionEnabled}
              onClick={handleAddFunctionClick}
            >
              Function
            </Button>
            <Button
              size="small"
              variant="outlined"
              disabled={!isAddFailureEnabled}
              onClick={handleAddFailureClick}
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
          </Stack>

          {/* Search Field */}
          <TextField
            placeholder="Search elements..."
            size="small"
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
          <Stack 
            direction="row" 
            spacing={1} 
            onClick={() => handleSelectNode('root')} 
            sx={{ 
              cursor: 'pointer', 
              mb: 1, 
              alignItems: 'center',
              bgcolor: selectedNodeId === 'root' ? 'rgba(1, 105, 111, 0.06)' : 'transparent',
              p: 0.5,
              borderRadius: 1.5
            }}
          >
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpand('root'); }} sx={{ p: 0.25 }}>
              {expandedNodes.root ? <ExpandIcon fontSize="small" /> : <CollapseIcon fontSize="small" />}
            </IconButton>
            <RootIcon sx={{ color: 'primary.main', fontSize: '1.2rem' }} />
            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: selectedNodeId === 'root' ? 'primary.main' : 'text.primary' }}>
              {projectName || 'Process Item (Root)'}
            </Typography>
          </Stack>

          {/* Child nodes of root */}
          <Collapse in={expandedNodes.root}>
            <Box sx={{ pl: 3 }}>
              {/* Root Functions */}
              {rootFunctions.map((fn, fIdx) => {
                const nodeKey = `root-func-${fn}`;
                const isSelected = selectedNodeId === nodeKey;
                const failures = Array.from(new Set(
                  rootRows
                    .filter(r => r.functions?.some(f => f.name === fn))
                    .flatMap(r => r.failureModes?.map(fm => fm.name) || [])
                )).filter(Boolean);

                return (
                  <Box key={fIdx} sx={{ mb: 0.5 }}>
                    <Stack 
                      direction="row" 
                      spacing={1} 
                      onClick={(e) => { e.stopPropagation(); handleSelectNode(nodeKey); }}
                      sx={{ 
                        cursor: 'pointer', 
                        py: 0.25, 
                        px: 1,
                        alignItems: 'center',
                        bgcolor: isSelected ? 'rgba(1, 105, 111, 0.06)' : 'transparent',
                        borderRadius: 1
                      }}
                    >
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpand(nodeKey); }} sx={{ p: 0.25 }}>
                        {expandedNodes[nodeKey] ? <ExpandIcon sx={{ fontSize: '0.9rem' }} /> : <CollapseIcon sx={{ fontSize: '0.9rem' }} />}
                      </IconButton>
                      <FunctionIcon sx={{ color: '#437A22', fontSize: '0.9rem' }} />
                      <Typography variant="body2" sx={{ fontSize: '0.825rem', fontWeight: 500 }}>{fn}</Typography>
                    </Stack>

                    <Collapse in={!!expandedNodes[nodeKey]}>
                      <Box sx={{ pl: 3 }}>
                        {failures.map((fail, failIdx) => (
                          <Stack 
                            key={failIdx} 
                            direction="row" 
                            spacing={1} 
                            onClick={(e) => { e.stopPropagation(); handleSelectNode(`root-fail-${fn}-${fail}`); }}
                            sx={{ py: 0.25, px: 1, alignItems: 'center', cursor: 'pointer', borderRadius: 1 }}
                          >
                            <FailureIcon sx={{ color: '#A13544', fontSize: '0.85rem' }} />
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{fail}</Typography>
                          </Stack>
                        ))}
                      </Box>
                    </Collapse>
                  </Box>
                );
              })}

              {/* Process Steps */}
              {filteredSteps.map((step) => {
                const stepNodeId = `step-${step.id}`;
                const stepExpanded = !!expandedNodes[stepNodeId];
                const stepSelected = selectedNodeId === stepNodeId;

                const stepRows = rows.filter(r => r.processStepId === step.id);
                
                // Step functions (where workElementName is null)
                const stepOnlyRows = stepRows.filter(r => !r.workElementName);
                const stepFunctions = Array.from(new Set(stepOnlyRows.flatMap(r => r.functions?.map(f => f.name) || []))).filter(Boolean);

                // Work Elements
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
                const rowWeNames = stepRows.map(r => r.workElementName).filter(Boolean) as string[];
                const allWeNames = Array.from(new Set([...stepWorkElements.map(w => w.trim()).filter(Boolean), ...rowWeNames]));

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
                      <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: stepSelected ? 'primary.main' : 'text.primary', display: 'flex', alignItems: 'center' }}>
                        {step.stepNumber}: {step.name || 'Untitled Step'}
                        {step.isOrphaned && (
                          <Tooltip title="Linked PFD step has been deleted (Orphaned)">
                            <FailureIcon sx={{ color: 'error.main', fontSize: '1rem', ml: 1 }} />
                          </Tooltip>
                        )}
                      </Typography>
                    </Stack>

                    <Collapse in={stepExpanded}>
                      <Box sx={{ pl: 3.5 }}>
                        {/* Step Functions List */}
                        {stepFunctions.map((fn, fIdx) => {
                          const nodeKey = `step-func-${step.id}-${fn}`;
                          const isSelected = selectedNodeId === nodeKey;
                          const failures = Array.from(new Set(
                            stepOnlyRows
                              .filter(r => r.functions?.some(f => f.name === fn))
                              .flatMap(r => r.failureModes?.map(fm => fm.name) || [])
                          )).filter(Boolean);

                          return (
                            <Box key={fIdx} sx={{ mb: 0.5 }}>
                              <Stack 
                                direction="row" 
                                spacing={1} 
                                onClick={(e) => { e.stopPropagation(); handleSelectNode(nodeKey); }}
                                sx={{ 
                                  cursor: 'pointer', 
                                  py: 0.25, 
                                  px: 1, 
                                  alignItems: 'center',
                                  bgcolor: isSelected ? 'rgba(1, 105, 111, 0.06)' : 'transparent',
                                  borderRadius: 1
                                }}
                              >
                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpand(nodeKey); }} sx={{ p: 0.25 }}>
                                  {expandedNodes[nodeKey] ? <ExpandIcon sx={{ fontSize: '0.9rem' }} /> : <CollapseIcon sx={{ fontSize: '0.9rem' }} />}
                                </IconButton>
                                <FunctionIcon sx={{ color: '#437A22', fontSize: '0.9rem' }} />
                                <Typography variant="body2" sx={{ fontSize: '0.825rem', fontWeight: 500 }}>{fn}</Typography>
                              </Stack>

                              <Collapse in={!!expandedNodes[nodeKey]}>
                                <Box sx={{ pl: 3 }}>
                                  {failures.map((fail, failIdx) => (
                                    <Stack 
                                      key={failIdx} 
                                      direction="row" 
                                      spacing={1} 
                                      onClick={(e) => { e.stopPropagation(); handleSelectNode(`step-fail-${step.id}-${fn}-${fail}`); }}
                                      sx={{ py: 0.25, px: 1, alignItems: 'center', cursor: 'pointer', borderRadius: 1 }}
                                    >
                                      <FailureIcon sx={{ color: '#A13544', fontSize: '0.85rem' }} />
                                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{fail}</Typography>
                                    </Stack>
                                  ))}
                                </Box>
                              </Collapse>
                            </Box>
                          );
                        })}

                        {/* Work Elements List */}
                        {allWeNames.map((we, wIdx) => {
                          const weNodeId = `we-${step.id}-${we}`;
                          const isWeSelected = selectedNodeId === weNodeId;
                          const weExpanded = !!expandedNodes[weNodeId];

                          const weRows = stepRows.filter(r => r.workElementName === we);
                          const weFunctions = Array.from(new Set(weRows.flatMap(r => r.functions?.map(f => f.name) || []))).filter(Boolean);

                          return (
                            <Box key={wIdx} sx={{ mb: 0.5 }}>
                              <Stack 
                                direction="row" 
                                spacing={1} 
                                onClick={(e) => { e.stopPropagation(); handleSelectNode(weNodeId); }}
                                sx={{ 
                                  cursor: 'pointer', 
                                  py: 0.25, 
                                  px: 1, 
                                  alignItems: 'center',
                                  bgcolor: isWeSelected ? 'rgba(1, 105, 111, 0.06)' : 'transparent',
                                  borderRadius: 1
                                }}
                              >
                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpand(weNodeId); }} sx={{ p: 0.25 }}>
                                  {weExpanded ? <ExpandIcon sx={{ fontSize: '0.9rem' }} /> : <CollapseIcon sx={{ fontSize: '0.9rem' }} />}
                                </IconButton>
                                <WorkElementIcon sx={{ color: '#f97316', fontSize: '0.9rem' }} />
                                <Typography variant="body2" sx={{ fontSize: '0.825rem', fontWeight: 500 }}>{we}</Typography>
                              </Stack>

                              <Collapse in={weExpanded}>
                                <Box sx={{ pl: 3.5 }}>
                                  {weFunctions.map((fn, wfIdx) => {
                                    const weFuncKey = `we-func-${step.id}-${we}-${fn}`;
                                    const isWeFuncSelected = selectedNodeId === weFuncKey;
                                    const weFuncExpanded = !!expandedNodes[weFuncKey];

                                    const failures = Array.from(new Set(
                                      weRows
                                        .filter(r => r.functions?.some(f => f.name === fn))
                                        .flatMap(r => r.failureModes?.map(fm => fm.name) || [])
                                    )).filter(Boolean);

                                    return (
                                      <Box key={wfIdx} sx={{ mb: 0.5 }}>
                                        <Stack 
                                          direction="row" 
                                          spacing={1} 
                                          onClick={(e) => { e.stopPropagation(); handleSelectNode(weFuncKey); }}
                                          sx={{ 
                                            cursor: 'pointer', 
                                            py: 0.25, 
                                            px: 1, 
                                            alignItems: 'center',
                                            bgcolor: isWeFuncSelected ? 'rgba(1, 105, 111, 0.06)' : 'transparent',
                                            borderRadius: 1
                                          }}
                                        >
                                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpand(weFuncKey); }} sx={{ p: 0.25 }}>
                                            {weFuncExpanded ? <ExpandIcon sx={{ fontSize: '0.85rem' }} /> : <CollapseIcon sx={{ fontSize: '0.85rem' }} />}
                                          </IconButton>
                                          <FunctionIcon sx={{ color: '#437A22', fontSize: '0.85rem' }} />
                                          <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>{fn}</Typography>
                                        </Stack>

                                        <Collapse in={weFuncExpanded}>
                                          <Box sx={{ pl: 3 }}>
                                            {failures.map((fail, failIdx) => (
                                              <Stack 
                                                key={failIdx} 
                                                direction="row" 
                                                spacing={1} 
                                                onClick={(e) => { e.stopPropagation(); handleSelectNode(`we-fail-${step.id}-${we}-${fn}-${fail}`); }}
                                                sx={{ py: 0.25, px: 1, alignItems: 'center', cursor: 'pointer', borderRadius: 1 }}
                                              >
                                                <FailureIcon sx={{ color: '#A13544', fontSize: '0.8rem' }} />
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{fail}</Typography>
                                              </Stack>
                                            ))}
                                          </Box>
                                        </Collapse>
                                      </Box>
                                    );
                                  })}
                                </Box>
                              </Collapse>
                            </Box>
                          );
                        })}
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
