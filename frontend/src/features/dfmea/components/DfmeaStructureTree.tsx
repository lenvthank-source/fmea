import React, { useState } from 'react';
import processStepIcon from '../../../assets/process-step.png';
import failureIcon from '../../../assets/failure.png';
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
  Warning as FailureIcon,
  PrecisionManufacturing as WorkElementIcon,
  HelpOutlined as FunctionIcon
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

interface DfmeaStructureTreeProps {
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

export const DfmeaStructureTree: React.FC<DfmeaStructureTreeProps> = ({
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
    
    if (selectedNodeId.startsWith('root-func::')) {
      const functionName = selectedNodeId.replace('root-func::', '');
      return { type: 'root-function', stepId: null, functionName };
    }

    if (selectedNodeId.startsWith('step-func::')) {
      const withoutPrefix = selectedNodeId.replace('step-func::', '');
      const sepIdx = withoutPrefix.indexOf('::');
      const stepId = sepIdx >= 0 ? withoutPrefix.slice(0, sepIdx) : withoutPrefix;
      const functionName = sepIdx >= 0 ? withoutPrefix.slice(sepIdx + 2) : '';
      return { type: 'step-function', stepId, functionName };
    }

    if (selectedNodeId.startsWith('step::')) {
      const stepId = selectedNodeId.replace('step::', '');
      return { type: 'step', stepId };
    }

    if (selectedNodeId.startsWith('we-func::')) {
      const withoutPrefix = selectedNodeId.replace('we-func::', '');
      const parts = withoutPrefix.split('::');
      const stepId = parts[0];
      const weName = parts[1];
      const functionName = parts.slice(2).join('::');
      return { type: 'we-function', stepId, workElementName: weName, functionName };
    }

    if (selectedNodeId.startsWith('we::')) {
      const withoutPrefix = selectedNodeId.replace('we::', '');
      const sepIdx = withoutPrefix.indexOf('::');
      const stepId = sepIdx >= 0 ? withoutPrefix.slice(0, sepIdx) : withoutPrefix;
      const weName = sepIdx >= 0 ? withoutPrefix.slice(sepIdx + 2) : '';
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
      {/* 1. Structure Tree Toolbar */}
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
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
            >
              System Element
            </Button>
            <Button
              size="small"
              variant="outlined"
              disabled={!isAddWorkElementEnabled}
              onClick={() => nodeInfo && nodeInfo.stepId && onAddWorkElement(nodeInfo.stepId)}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
            >
              Component Element
            </Button>
            <Button
              size="small"
              variant="outlined"
              disabled={!isAddFunctionEnabled}
              onClick={handleAddFunctionClick}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
            >
              Function
            </Button>
            <Button
              size="small"
              variant="outlined"
              disabled={!isAddFailureEnabled}
              onClick={handleAddFailureClick}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
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
              disabled={!selectedNodeId || !selectedNodeId.startsWith('step::')}
              onClick={() => {
                const stepId = selectedNodeId?.replace('step::', '');
                const step = steps.find(s => s.id === stepId);
                if (step) onEditStep(step);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              disabled={!selectedNodeId || !selectedNodeId.startsWith('step::')}
              onClick={() => {
                const stepId = selectedNodeId?.replace('step::', '');
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
          <Box sx={{ mb: 1 }}>
            <Stack 
              direction="row" 
              spacing={1} 
              onClick={() => handleSelectNode('root')} 
              sx={{ 
                cursor: 'pointer', 
                alignItems: 'center',
                display: 'inline-flex',
                width: 'fit-content',
                bgcolor: 'transparent',
                py: 0.25,
                px: 0.5,
                borderRadius: 1,
                border: '2px solid transparent',
                transition: 'all 0.15s ease',
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
                '& .inline-actions': { opacity: 0, pointerEvents: 'none', transition: 'opacity 0.15s ease' },
                '&:hover .inline-actions': { opacity: 1, pointerEvents: 'auto' }
              }}
            >
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpand('root'); }} sx={{ p: 0.25, color: '#2962FF' }}>
                {expandedNodes.root ? <ExpandIcon /> : <CollapseIcon />}
              </IconButton>
              <RootIcon sx={{ color: '#2962FF', fontSize: '1.5rem', mr: 0.5 }} />
              <Typography sx={{ fontWeight: 950, fontSize: '0.95rem', color: '#2962FF', fontFamily: 'inherit', letterSpacing: '-0.01em' }}>
                {projectName || 'System Item (Root)'}
              </Typography>
              <Box className="inline-actions" sx={{ ml: 2, display: 'flex', gap: 0.5 }}>
                <Tooltip title="Add System Element">
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); onAddStep(); }} sx={{ p: 0.25, bgcolor: '#fff', border: '1px solid #cbd5e1', '&:hover': { bgcolor: '#f1f5f9' } }}>
                    <AddIcon sx={{ fontSize: '0.9rem', color: '#0f172a' }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Add System Function">
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); onAddFunction(null, null); }} sx={{ p: 0.25, bgcolor: '#fff', border: '1px solid #cbd5e1', '&:hover': { bgcolor: '#f1f5f9' } }}>
                    <FunctionIcon sx={{ fontSize: '0.9rem', color: '#10B981' }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Stack>
          </Box>

          {/* Child nodes of root */}
          <Collapse in={expandedNodes.root}>
            <Box sx={{ pl: 2, ml: 1.5, borderLeft: '1.5px solid rgba(41, 98, 255, 0.25)' }}>
              {/* Root Functions */}
              {rootFunctions.map((fn, fIdx) => {
                const nodeKey = `root-func::${fn}`;
                const dbFailures: string[] = [];
                const rowFailures = rootRows
                  .filter(r => r.functions?.some(f => f.name === fn))
                  .flatMap(r => r.failureModes?.map(fm => fm.name) || []);
                const failures = Array.from(new Set([...rowFailures, ...dbFailures])).filter(Boolean);

                return (
                  <Box key={fIdx} sx={{ mb: 1 }}>
                    <Stack 
                      direction="row" 
                      spacing={1} 
                      onClick={(e) => { e.stopPropagation(); handleSelectNode(nodeKey); }}
                      sx={{ 
                        cursor: 'pointer', 
                        py: 0.25, 
                        px: 0.5,
                        alignItems: 'center',
                        display: 'inline-flex',
                        width: 'fit-content',
                        bgcolor: 'transparent',
                        borderRadius: 1,
                        border: '2px solid transparent',
                        transition: 'all 0.15s ease',
                        '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
                        '& .inline-actions': { opacity: 0, pointerEvents: 'none', transition: 'opacity 0.15s ease' },
                        '&:hover .inline-actions': { opacity: 1, pointerEvents: 'auto' }
                      }}
                    >
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpand(nodeKey); }} sx={{ p: 0.25, color: '#00C853' }}>
                        {expandedNodes[nodeKey] ? <ExpandIcon /> : <CollapseIcon />}
                      </IconButton>
                      <Box sx={{ display: 'inline-flex', width: 30, height: 30, overflow: 'hidden', mr: 0.75, alignItems: 'center', justifyContent: 'center' }}>
                        <Box 
                          component="img" 
                          src={processStepIcon} 
                          alt="icon" 
                          sx={{ 
                            width: 30, 
                            height: 30, 
                            objectFit: 'contain',
                            transform: 'translateX(-100px)',
                            filter: 'drop-shadow(100px 0 0 #00C853)' 
                          }} 
                        />
                      </Box>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#00C853', fontFamily: 'inherit' }}>{fn}</Typography>
                      <Box className="inline-actions" sx={{ ml: 2, display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Add Failure">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onAddFailure(null, { functionName: fn }); }} sx={{ p: 0.25, bgcolor: '#fff', border: '1px solid #bbf7d0', '&:hover': { bgcolor: '#e8f5e9' } }}>
                            <AddIcon sx={{ fontSize: '0.9rem', color: '#FF0000' }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Stack>

                    <Collapse in={!!expandedNodes[nodeKey]}>
                      <Box sx={{ pl: 4, ml: 2.25, borderLeft: '1.5px solid rgba(0, 200, 83, 0.25)' }}>
                        {failures.map((fail, failIdx) => (
                          <Box key={failIdx} sx={{ mb: 0.5 }}>
                            <Stack 
                              direction="row" 
                              spacing={1} 
                              onClick={(e) => { e.stopPropagation(); handleSelectNode(`root-fail-${fn}-${fail}`); }}
                              sx={{ 
                                py: 0.25, 
                                px: 0.5, 
                                alignItems: 'center', 
                                cursor: 'pointer', 
                                borderRadius: 1, 
                                display: 'inline-flex',
                                width: 'fit-content',
                                bgcolor: 'transparent', 
                                border: '2px solid transparent', 
                                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }, 
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <Box sx={{ display: 'inline-flex', width: 30, height: 30, overflow: 'hidden', mr: 0.75, alignItems: 'center', justifyContent: 'center' }}>
                                <Box 
                                  component="img" 
                                  src={failureIcon} 
                                  alt="icon" 
                                  sx={{ 
                                    width: 30, 
                                    height: 30, 
                                    objectFit: 'contain',
                                    transform: 'translateX(-100px)',
                                    filter: 'drop-shadow(100px 0 0 #FF0000)' 
                                  }} 
                                />
                              </Box>
                              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#FF0000', fontFamily: 'inherit' }}>{fail}</Typography>
                            </Stack>
                          </Box>
                        ))}
                      </Box>
                    </Collapse>
                  </Box>
                );
              })}

              {/* System Elements (Steps) */}
              {filteredSteps.map((step) => {
                const stepNodeId = `step::${step.id}`;
                const stepExpanded = !!expandedNodes[stepNodeId];

                const stepRows = rows.filter(r => r.processStepId === step.id);
                const stepOnlyRows = stepRows.filter(r => !r.workElementName);
                const stepFunctions = Array.from(new Set(stepOnlyRows.flatMap(r => r.functions?.map(f => f.name) || []))).filter(Boolean);

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
                        py: 0.25,
                        px: 0.5,
                        borderRadius: 1,
                        alignItems: 'center',
                        display: 'inline-flex',
                        width: 'fit-content',
                        bgcolor: 'transparent',
                        border: '2px solid transparent',
                        '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
                        transition: 'all 0.15s ease',
                        '& .inline-actions': { opacity: 0, pointerEvents: 'none', transition: 'opacity 0.15s ease' },
                        '&:hover .inline-actions': { opacity: 1, pointerEvents: 'auto' }
                      }}
                    >
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpand(stepNodeId); }} sx={{ p: 0.25, color: '#FF6D00' }}>
                        {stepExpanded ? <ExpandIcon /> : <CollapseIcon />}
                      </IconButton>
                      <Box sx={{ display: 'inline-flex', width: 30, height: 30, overflow: 'hidden', mr: 0.75, alignItems: 'center', justifyContent: 'center' }}>
                        <Box 
                          component="img" 
                          src={processStepIcon} 
                          alt="icon" 
                          sx={{ 
                            width: 30, 
                            height: 30, 
                            objectFit: 'contain',
                            transform: 'translateX(-100px)',
                            filter: 'drop-shadow(100px 0 0 #FF6D00)' 
                          }} 
                        />
                      </Box>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#FF6D00', fontFamily: 'inherit' }}>
                        {step.stepNumber} - {step.name || 'Untitled System Element'}
                        {step.isOrphaned && (
                          <Tooltip title="Linked PFD step has been deleted (Orphaned)">
                            <FailureIcon sx={{ color: '#7f1d1d', fontSize: '1.1rem', ml: 1 }} />
                          </Tooltip>
                        )}
                      </Typography>
                      <Box className="inline-actions" sx={{ ml: 2, display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Add Component Element">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onAddWorkElement(step.id); }} sx={{ p: 0.25, bgcolor: '#fff', border: '1px solid #fef08a', '&:hover': { bgcolor: '#fef9c3' } }}>
                            <WorkElementIcon sx={{ fontSize: '0.9rem', color: '#D500F9' }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Add Element Function">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onAddFunction(step.id, null); }} sx={{ p: 0.25, bgcolor: '#fff', border: '1px solid #fef08a', '&:hover': { bgcolor: '#fef9c3' } }}>
                            <FunctionIcon sx={{ fontSize: '0.9rem', color: '#00C853' }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Element">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEditStep(step); }} sx={{ p: 0.25, bgcolor: '#fff', border: '1px solid #fef08a', '&:hover': { bgcolor: '#fef9c3' } }}>
                            <EditIcon sx={{ fontSize: '0.9rem', color: '#854d0e' }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Element">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDeleteStep(step.id); }} sx={{ p: 0.25, bgcolor: '#fff', border: '1px solid #fef08a', '&:hover': { bgcolor: '#fef9c3' } }}>
                            <DeleteIcon sx={{ fontSize: '0.9rem', color: '#FF0000' }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Stack>

                    <Collapse in={stepExpanded}>
                      <Box sx={{ pl: 4, ml: 2.25, borderLeft: '1.5px solid rgba(255, 109, 0, 0.25)' }}>
                        {/* Step Functions List */}
                        {stepFunctions.map((fn, fIdx) => {
                          const nodeKey = `step-func::${step.id}::${fn}`;
                          const failures = Array.from(new Set(
                            stepOnlyRows
                              .filter(r => r.functions?.some(f => f.name === fn))
                              .flatMap(r => r.failureModes?.map(fm => fm.name) || [])
                          )).filter(Boolean);

                          return (
                            <Box key={fIdx} sx={{ mb: 1 }}>
                              <Stack 
                                direction="row" 
                                spacing={1} 
                                onClick={(e) => { e.stopPropagation(); handleSelectNode(nodeKey); }}
                                sx={{ 
                                  cursor: 'pointer', 
                                  py: 0.25, 
                                  px: 0.5, 
                                  alignItems: 'center',
                                  display: 'inline-flex',
                                  width: 'fit-content',
                                  bgcolor: 'transparent',
                                  borderRadius: 1,
                                  border: '2px solid transparent',
                                  transition: 'all 0.15s ease',
                                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
                                  '& .inline-actions': { opacity: 0, pointerEvents: 'none', transition: 'opacity 0.15s ease' },
                                  '&:hover .inline-actions': { opacity: 1, pointerEvents: 'auto' }
                                }}
                              >
                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpand(nodeKey); }} sx={{ p: 0.25, color: '#00C853' }}>
                                  {expandedNodes[nodeKey] ? <ExpandIcon /> : <CollapseIcon />}
                                </IconButton>
                                <Box sx={{ display: 'inline-flex', width: 30, height: 30, overflow: 'hidden', mr: 0.75, alignItems: 'center', justifyContent: 'center' }}>
                                  <Box 
                                    component="img" 
                                    src={processStepIcon} 
                                    alt="icon" 
                                    sx={{ 
                                      width: 30, 
                                      height: 30, 
                                      objectFit: 'contain',
                                      transform: 'translateX(-100px)',
                                      filter: 'drop-shadow(100px 0 0 #00C853)' 
                                    }} 
                                  />
                                </Box>
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#00C853', fontFamily: 'inherit' }}>{fn}</Typography>
                                <Box className="inline-actions" sx={{ ml: 2, display: 'flex', gap: 0.5 }}>
                                  <Tooltip title="Add Failure">
                                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); onAddFailure(step.id, { functionName: fn }); }} sx={{ p: 0.25, bgcolor: '#fff', border: '1px solid #bbf7d0', '&:hover': { bgcolor: '#e8f5e9' } }}>
                                      <AddIcon sx={{ fontSize: '0.9rem', color: '#FF0000' }} />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Stack>

                              <Collapse in={!!expandedNodes[nodeKey]}>
                                <Box sx={{ pl: 4, ml: 2.25, borderLeft: '1.5px solid rgba(0, 200, 83, 0.25)' }}>
                                  {failures.map((fail, failIdx) => (
                                    <Box key={failIdx} sx={{ mb: 0.5 }}>
                                      <Stack 
                                        direction="row" 
                                        spacing={1} 
                                        onClick={(e) => { e.stopPropagation(); handleSelectNode(`step-fail::${step.id}::${fn}::${fail}`); }}
                                        sx={{ 
                                          py: 0.25, 
                                          px: 0.5, 
                                          alignItems: 'center', 
                                          cursor: 'pointer', 
                                          borderRadius: 1, 
                                          display: 'inline-flex',
                                          width: 'fit-content',
                                          bgcolor: 'transparent', 
                                          border: '2px solid transparent', 
                                          '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }, 
                                          transition: 'all 0.15s ease' 
                                        }}
                                      >
                                        <Box sx={{ display: 'inline-flex', width: 30, height: 30, overflow: 'hidden', mr: 0.75, alignItems: 'center', justifyContent: 'center' }}>
                                          <Box 
                                            component="img" 
                                            src={failureIcon} 
                                            alt="icon" 
                                            sx={{ 
                                              width: 30, 
                                              height: 30, 
                                              objectFit: 'contain',
                                              transform: 'translateX(-100px)',
                                              filter: 'drop-shadow(100px 0 0 #FF0000)' 
                                            }} 
                                          />
                                        </Box>
                                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#FF0000', fontFamily: 'inherit' }}>{fail}</Typography>
                                      </Stack>
                                    </Box>
                                  ))}
                                </Box>
                              </Collapse>
                            </Box>
                          );
                        })}

                        {/* Component Elements List */}
                        {allWeNames.map((we, wIdx) => {
                          const weNodeId = `we::${step.id}::${we}`;
                          const weExpanded = !!expandedNodes[weNodeId];
                          const weRows = stepRows.filter(r => r.workElementName === we);
                          const weFunctions = Array.from(new Set(weRows.flatMap(r => r.functions?.map(f => f.name) || []))).filter(Boolean);

                          return (
                            <Box key={wIdx} sx={{ mb: 1 }}>
                              <Stack 
                                direction="row" 
                                spacing={1} 
                                onClick={(e) => { e.stopPropagation(); handleSelectNode(weNodeId); }}
                                sx={{ 
                                  cursor: 'pointer', 
                                  py: 0.25, 
                                  px: 0.5, 
                                  alignItems: 'center',
                                  display: 'inline-flex',
                                  width: 'fit-content',
                                  bgcolor: 'transparent',
                                  borderRadius: 1,
                                  border: '2px solid transparent',
                                  transition: 'all 0.15s ease',
                                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
                                  '& .inline-actions': { opacity: 0, pointerEvents: 'none', transition: 'opacity 0.15s ease' },
                                  '&:hover .inline-actions': { opacity: 1, pointerEvents: 'auto' }
                                }}
                              >
                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpand(weNodeId); }} sx={{ p: 0.25, color: '#D500F9' }}>
                                  {weExpanded ? <ExpandIcon /> : <CollapseIcon />}
                                </IconButton>
                                <Box sx={{ display: 'inline-flex', width: 30, height: 30, overflow: 'hidden', mr: 0.75, alignItems: 'center', justifyContent: 'center' }}>
                                  <Box 
                                    component="img" 
                                    src={processStepIcon} 
                                    alt="icon" 
                                    sx={{ 
                                      width: 30, 
                                      height: 30, 
                                      objectFit: 'contain',
                                      transform: 'translateX(-100px)',
                                      filter: 'drop-shadow(100px 0 0 #D500F9)' 
                                    }} 
                                  />
                                </Box>
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#D500F9', fontFamily: 'inherit' }}>{we}</Typography>
                                <Box className="inline-actions" sx={{ ml: 2, display: 'flex', gap: 0.5 }}>
                                  <Tooltip title="Add Component Function">
                                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); onAddFunction(step.id, we); }} sx={{ p: 0.25, bgcolor: '#fff', border: '1px solid #bfdbfe', '&:hover': { bgcolor: '#dbeafe' } }}>
                                      <AddIcon sx={{ fontSize: '0.9rem', color: '#00C853' }} />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Stack>

                              <Collapse in={weExpanded}>
                                <Box sx={{ pl: 4.5, ml: 2.25, borderLeft: '1.5px solid rgba(213, 0, 249, 0.25)' }}>
                                  {weFunctions.map((fn, wfIdx) => {
                                    const weFuncKey = `we-func::${step.id}::${we}::${fn}`;
                                    const weFuncExpanded = !!expandedNodes[weFuncKey];

                                    const failures = Array.from(new Set(
                                      weRows
                                        .filter(r => r.functions?.some(f => f.name === fn))
                                        .flatMap(r => r.failureModes?.map(fm => fm.name) || [])
                                    )).filter(Boolean);

                                    return (
                                      <Box key={wfIdx} sx={{ mb: 1 }}>
                                        <Stack 
                                          direction="row" 
                                          spacing={1} 
                                          onClick={(e) => { e.stopPropagation(); handleSelectNode(weFuncKey); }}
                                          sx={{ 
                                            cursor: 'pointer', 
                                            py: 0.25, 
                                            px: 0.5, 
                                            alignItems: 'center',
                                            display: 'inline-flex',
                                            width: 'fit-content',
                                            bgcolor: 'transparent',
                                            borderRadius: 1,
                                            border: '2px solid transparent',
                                            transition: 'all 0.15s ease',
                                            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
                                            '& .inline-actions': { opacity: 0, pointerEvents: 'none', transition: 'opacity 0.15s ease' },
                                            '&:hover .inline-actions': { opacity: 1, pointerEvents: 'auto' }
                                          }}
                                        >
                                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpand(weFuncKey); }} sx={{ p: 0.25, color: '#00C853' }}>
                                            {weFuncExpanded ? <ExpandIcon /> : <CollapseIcon />}
                                          </IconButton>
                                          <Box sx={{ display: 'inline-flex', width: 30, height: 30, overflow: 'hidden', mr: 0.75, alignItems: 'center', justifyContent: 'center' }}>
                                            <Box 
                                              component="img" 
                                              src={processStepIcon} 
                                              alt="icon" 
                                              sx={{ 
                                                width: 30, 
                                                height: 30, 
                                                objectFit: 'contain',
                                                transform: 'translateX(-100px)',
                                                filter: 'drop-shadow(100px 0 0 #00C853)' 
                                              }} 
                                            />
                                          </Box>
                                          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#00C853', fontFamily: 'inherit' }}>{fn}</Typography>
                                          <Box className="inline-actions" sx={{ ml: 2, display: 'flex', gap: 0.5 }}>
                                            <Tooltip title="Add Failure">
                                              <IconButton size="small" onClick={(e) => { e.stopPropagation(); onAddFailure(step.id, { workElementName: we, functionName: fn }); }} sx={{ p: 0.25, bgcolor: '#fff', border: '1px solid #bbf7d0', '&:hover': { bgcolor: '#e8f5e9' } }}>
                                                <AddIcon sx={{ fontSize: '0.9rem', color: '#FF0000' }} />
                                              </IconButton>
                                            </Tooltip>
                                          </Box>
                                        </Stack>

                                        <Collapse in={weFuncExpanded}>
                                          <Box sx={{ pl: 4, ml: 2.25, borderLeft: '1.5px solid rgba(0, 200, 83, 0.25)' }}>
                                            {failures.map((fail, failIdx) => (
                                              <Box key={failIdx} sx={{ mb: 0.5 }}>
                                                <Stack 
                                                  direction="row" 
                                                  spacing={1} 
                                                  onClick={(e) => { e.stopPropagation(); handleSelectNode(`we-fail::${step.id}::${we}::${fn}::${fail}`); }}
                                                  sx={{ 
                                                    py: 0.25, 
                                                    px: 0.5, 
                                                    alignItems: 'center', 
                                                    cursor: 'pointer', 
                                                    borderRadius: 1, 
                                                    display: 'inline-flex',
                                                    width: 'fit-content',
                                                    bgcolor: 'transparent', 
                                                    border: '2px solid transparent', 
                                                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }, 
                                                    transition: 'all 0.15s ease' 
                                                  }}
                                                >
                                                  <Box sx={{ display: 'inline-flex', width: 30, height: 30, overflow: 'hidden', mr: 0.75, alignItems: 'center', justifyContent: 'center' }}>
                                                    <Box 
                                                      component="img" 
                                                      src={failureIcon} 
                                                      alt="icon" 
                                                      sx={{ 
                                                        width: 30, 
                                                        height: 30, 
                                                        objectFit: 'contain',
                                                        transform: 'translateX(-100px)',
                                                        filter: 'drop-shadow(100px 0 0 #FF0000)' 
                                                      }} 
                                                    />
                                                  </Box>
                                                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#FF0000', fontFamily: 'inherit' }}>{fail}</Typography>
                                                </Stack>
                                              </Box>
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
