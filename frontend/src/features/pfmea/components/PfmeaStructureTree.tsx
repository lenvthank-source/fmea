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
  Warning as FailureIcon,
  Link as LinkIcon
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
  onOpenLinkageModal?: (failureModeId: string) => void;
  onOpenDetailWindow?: (failureModeId: string) => void;
  structureFunctions?: any[];
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
  onAddFailure,
  onOpenLinkageModal,
  onOpenDetailWindow,
  structureFunctions,
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

  const getFailureModeLinkInfo = (stepId: string, fnName: string, failName: string) => {
    if (!structureFunctions) return null;
    const fnNode = structureFunctions.find(
      (f) => f.parentType === 'process_step' && f.parentId === stepId && f.narration === fnName
    );
    if (!fnNode) return null;
    const failNode = fnNode.failures?.find(
      (failObj: any) => failObj.narration === failName && failObj.role === 'mode'
    );
    return failNode || null;
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
      // step-func::${stepId}::${fnName}
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
      // we-func::${stepId}::${weName}::${fnName}
      const withoutPrefix = selectedNodeId.replace('we-func::', '');
      const parts = withoutPrefix.split('::');
      const stepId = parts[0];
      const weName = parts[1];
      const functionName = parts.slice(2).join('::');
      return { type: 'we-function', stepId, workElementName: weName, functionName };
    }

    if (selectedNodeId.startsWith('we::')) {
      // we::${stepId}::${weName}
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
          {/* Linkage Section */}
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mr: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>LINKAGE</Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<LinkIcon />}
              disabled={!selectedNodeId?.startsWith('struct-mode::')}
              onClick={() => {
                if (selectedNodeId?.startsWith('struct-mode::') && onOpenLinkageModal) {
                  const modeId = selectedNodeId.replace('struct-mode::', '');
                  onOpenLinkageModal(modeId);
                }
              }}
              sx={{
                borderColor: '#b71c1c',
                color: '#b71c1c',
                '&:hover': { bgcolor: '#fce4ec' },
                '&.Mui-disabled': { borderColor: 'rgba(0,0,0,0.2)', color: 'rgba(0,0,0,0.3)' }
              }}
            >
              Link Failures
            </Button>
          </Stack>

          <Divider orientation="vertical" flexItem />

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
              disabled={!selectedNodeId || !selectedNodeId.startsWith('step::')}
              onClick={() => {
                const step = steps.find(s => `step::${s.id}` === selectedNodeId);
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
                bgcolor: selectedNodeId === 'root' ? '#f1f5f9' : '#f8fafc',
                py: 0.5,
                px: 1.5,
                borderRadius: 2,
                border: selectedNodeId === 'root' ? '2px solid #0f172a' : '2px solid #cbd5e1',
                transition: 'all 0.15s ease',
                '&:hover': { bgcolor: '#f1f5f9' },
                '& .inline-actions': { opacity: 0, pointerEvents: 'none', transition: 'opacity 0.15s ease' },
                '&:hover .inline-actions': { opacity: 1, pointerEvents: 'auto' }
              }}
            >
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpand('root'); }} sx={{ p: 0.25, color: '#0f172a' }}>
                {expandedNodes.root ? <ExpandIcon /> : <CollapseIcon />}
              </IconButton>
              <RootIcon sx={{ color: '#0f172a', fontSize: '1.25rem' }} />
              <Typography sx={{ fontWeight: 900, fontSize: '1.05rem', color: '#0f172a', fontFamily: 'inherit', letterSpacing: '-0.01em' }}>
                {projectName || 'Process Item (Root)'}
              </Typography>
              <Box className="inline-actions" sx={{ ml: 2, display: 'flex', gap: 0.5 }}>
                <Tooltip title="Add Step">
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); onAddStep(); }} sx={{ p: 0.25, bgcolor: '#fff', border: '1px solid #cbd5e1', '&:hover': { bgcolor: '#f1f5f9' } }}>
                    <AddIcon sx={{ fontSize: '0.9rem', color: '#0f172a' }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Add Project Function">
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); onAddFunction(null, null); }} sx={{ p: 0.25, bgcolor: '#fff', border: '1px solid #cbd5e1', '&:hover': { bgcolor: '#f1f5f9' } }}>
                    <FunctionIcon sx={{ fontSize: '0.9rem', color: '#14532d' }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Stack>
          </Box>

          {/* Child nodes of root */}
          <Collapse in={expandedNodes.root}>
            <Box sx={{ pl: 2 }}>
              {/* Root Functions */}
              {rootFunctions.map((fn, fIdx) => {
                const nodeKey = `root-func::${fn}`;
                const isSelected = selectedNodeId === nodeKey;
                const failures = Array.from(new Set(
                  rootRows
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
                        py: 0.5, 
                        px: 1.5,
                        alignItems: 'center',
                        display: 'inline-flex',
                        width: 'fit-content',
                        bgcolor: isSelected ? '#dcfce7' : '#f0fdf4',
                        borderRadius: 2,
                        border: isSelected ? '2px solid #22c55e' : '2px solid #bbf7d0',
                        transition: 'all 0.15s ease',
                        '&:hover': { bgcolor: '#dcfce7' },
                        '& .inline-actions': { opacity: 0, pointerEvents: 'none', transition: 'opacity 0.15s ease' },
                        '&:hover .inline-actions': { opacity: 1, pointerEvents: 'auto' }
                      }}
                    >
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpand(nodeKey); }} sx={{ p: 0.25, color: '#14532d' }}>
                        {expandedNodes[nodeKey] ? <ExpandIcon /> : <CollapseIcon />}
                      </IconButton>
                      <FunctionIcon sx={{ color: '#14532d', fontSize: '1.1rem' }} />
                      <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, color: '#14532d', fontFamily: 'inherit' }}>{fn}</Typography>
                      <Box className="inline-actions" sx={{ ml: 2, display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Add Failure (Effect)">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onAddFailure(null, { functionName: fn }); }} sx={{ p: 0.25, bgcolor: '#fff', border: '1px solid #bbf7d0', '&:hover': { bgcolor: '#e8f5e9' } }}>
                            <AddIcon sx={{ fontSize: '0.9rem', color: '#7f1d1d' }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Stack>

                    <Collapse in={!!expandedNodes[nodeKey]}>
                      <Box sx={{ pl: 4 }}>
                        {failures.map((fail, failIdx) => (
                          <Box key={failIdx} sx={{ mb: 0.5 }}>
                            <Stack 
                              direction="row" 
                              spacing={1} 
                              onClick={(e) => { e.stopPropagation(); handleSelectNode(`root-fail-${fn}-${fail}`); }}
                              sx={{ 
                                py: 0.5, 
                                px: 1.5, 
                                alignItems: 'center', 
                                cursor: 'pointer', 
                                borderRadius: 2, 
                                display: 'inline-flex',
                                width: 'fit-content',
                                bgcolor: selectedNodeId === `root-fail-${fn}-${fail}` ? '#fee2e2' : '#fef2f2', 
                                border: selectedNodeId === `root-fail-${fn}-${fail}` ? '2px solid #ef4444' : '2px solid #fecaca', 
                                '&:hover': { bgcolor: '#fee2e2' }, 
                                transition: 'all 0.15s ease' 
                              }}
                            >
                               <FailureIcon sx={{ color: '#7f1d1d', fontSize: '1.1rem' }} />
                               <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, color: '#7f1d1d', fontFamily: 'inherit' }}>{fail}</Typography>
                            </Stack>
                          </Box>
                        ))}
                      </Box>
                    </Collapse>
                  </Box>
                );
              })}

              {/* Process Steps */}
              {filteredSteps.map((step) => {
                const stepNodeId = `step::${step.id}`;
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
                        px: 1.5,
                        borderRadius: 2,
                        alignItems: 'center',
                        display: 'inline-flex',
                        width: 'fit-content',
                        bgcolor: stepSelected ? '#fef9c3' : '#fefce8',
                        border: stepSelected ? '2px solid #eab308' : '2px solid #fef08a',
                        '&:hover': { bgcolor: '#fef9c3' },
                        transition: 'all 0.15s ease',
                        '& .inline-actions': { opacity: 0, pointerEvents: 'none', transition: 'opacity 0.15s ease' },
                        '&:hover .inline-actions': { opacity: 1, pointerEvents: 'auto' }
                      }}
                    >
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpand(stepNodeId); }} sx={{ p: 0.25, color: '#854d0e' }}>
                        {stepExpanded ? <ExpandIcon /> : <CollapseIcon />}
                      </IconButton>
                      <StepIcon sx={{ color: '#854d0e', fontSize: '1.3rem' }} />
                      <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: '#854d0e', fontFamily: 'inherit', display: 'flex', alignItems: 'center' }}>
                        {step.stepNumber}: {step.name || 'Untitled Step'}
                        {step.isOrphaned && (
                          <Tooltip title="Linked PFD step has been deleted (Orphaned)">
                            <FailureIcon sx={{ color: '#7f1d1d', fontSize: '1.1rem', ml: 1 }} />
                          </Tooltip>
                        )}
                      </Typography>
                      <Box className="inline-actions" sx={{ ml: 2, display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Add Work Element">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onAddWorkElement(step.id); }} sx={{ p: 0.25, bgcolor: '#fff', border: '1px solid #fef08a', '&:hover': { bgcolor: '#fef9c3' } }}>
                            <WorkElementIcon sx={{ fontSize: '0.9rem', color: '#1e3a8a' }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Add Step Function">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onAddFunction(step.id, null); }} sx={{ p: 0.25, bgcolor: '#fff', border: '1px solid #fef08a', '&:hover': { bgcolor: '#fef9c3' } }}>
                            <FunctionIcon sx={{ fontSize: '0.9rem', color: '#14532d' }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Step">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEditStep(step); }} sx={{ p: 0.25, bgcolor: '#fff', border: '1px solid #fef08a', '&:hover': { bgcolor: '#fef9c3' } }}>
                            <EditIcon sx={{ fontSize: '0.9rem', color: '#854d0e' }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Step">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDeleteStep(step.id); }} sx={{ p: 0.25, bgcolor: '#fff', border: '1px solid #fef08a', '&:hover': { bgcolor: '#fef9c3' } }}>
                            <DeleteIcon sx={{ fontSize: '0.9rem', color: '#7f1d1d' }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Stack>

                    <Collapse in={stepExpanded}>
                      <Box sx={{ pl: 4 }}>
                        {/* Step Functions List */}
                        {stepFunctions.map((fn, fIdx) => {
                          const nodeKey = `step-func::${step.id}::${fn}`;
                          const isSelected = selectedNodeId === nodeKey;
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
                                  py: 0.5, 
                                  px: 1.5, 
                                  alignItems: 'center',
                                  display: 'inline-flex',
                                  width: 'fit-content',
                                  bgcolor: isSelected ? '#dcfce7' : '#f0fdf4',
                                  borderRadius: 2,
                                  border: isSelected ? '2px solid #22c55e' : '2px solid #bbf7d0',
                                  transition: 'all 0.15s ease',
                                  '&:hover': { bgcolor: '#dcfce7' },
                                  '& .inline-actions': { opacity: 0, pointerEvents: 'none', transition: 'opacity 0.15s ease' },
                                  '&:hover .inline-actions': { opacity: 1, pointerEvents: 'auto' }
                                }}
                              >
                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpand(nodeKey); }} sx={{ p: 0.25, color: '#14532d' }}>
                                  {expandedNodes[nodeKey] ? <ExpandIcon /> : <CollapseIcon />}
                                </IconButton>
                                <FunctionIcon sx={{ color: '#14532d', fontSize: '1.1rem' }} />
                                <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, color: '#14532d', fontFamily: 'inherit' }}>{fn}</Typography>
                                <Box className="inline-actions" sx={{ ml: 2, display: 'flex', gap: 0.5 }}>
                                  <Tooltip title="Add Failure (Mode)">
                                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); onAddFailure(step.id, { functionName: fn }); }} sx={{ p: 0.25, bgcolor: '#fff', border: '1px solid #bbf7d0', '&:hover': { bgcolor: '#e8f5e9' } }}>
                                      <AddIcon sx={{ fontSize: '0.9rem', color: '#7f1d1d' }} />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Stack>

                              <Collapse in={!!expandedNodes[nodeKey]}>
                                <Box sx={{ pl: 4 }}>
                                  {failures.map((fail, failIdx) => {
                                    const failNode = getFailureModeLinkInfo(step.id, fn, fail);
                                    const isLinked = failNode?.isLinked ?? false;
                                    const failNodeId = failNode ? `struct-mode::${failNode.id}` : `step-fail::${step.id}::${fn}::${fail}`;
                                    const isFailSelected = selectedNodeId === failNodeId;

                                    let bgcolor = '#fef2f2';
                                    let border = '2px solid #fecaca';
                                    let textColor = '#7f1d1d';

                                    if (isLinked) {
                                      bgcolor = isFailSelected ? '#e0f2fe' : '#f0f9ff';
                                      border = isFailSelected ? '2px solid #0284c7' : '2px solid #bae6fd';
                                      textColor = '#0284c7';
                                    } else {
                                      bgcolor = isFailSelected ? '#fee2e2' : '#fef2f2';
                                      border = isFailSelected ? '2px solid #ef4444' : '2px solid #fecaca';
                                      textColor = '#7f1d1d';
                                    }

                                    return (
                                      <Box key={failIdx} sx={{ mb: 0.5 }}>
                                        <Stack 
                                          direction="row" 
                                          spacing={1} 
                                          onClick={(e) => { e.stopPropagation(); handleSelectNode(failNodeId); }}
                                          sx={{ 
                                            py: 0.5, 
                                            px: 1.5, 
                                            alignItems: 'center', 
                                            cursor: 'pointer', 
                                            borderRadius: 2, 
                                            display: 'inline-flex',
                                            width: 'fit-content',
                                            bgcolor: bgcolor, 
                                            border: border, 
                                            '&:hover': { bgcolor: isLinked ? '#e0f2fe' : '#fee2e2' }, 
                                            transition: 'all 0.15s ease',
                                            '& .inline-actions': { opacity: 0, pointerEvents: 'none', transition: 'opacity 0.15s ease' },
                                            '&:hover .inline-actions': { opacity: 1, pointerEvents: 'auto' }
                                          }}
                                        >
                                          <FailureIcon sx={{ color: textColor, fontSize: '1.1rem' }} />
                                          {isLinked && <LinkIcon sx={{ color: textColor, fontSize: '0.9rem', ml: -0.5, mr: 0.5 }} />}
                                          <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, color: textColor, fontFamily: 'inherit' }}>{fail}</Typography>
                                          <Box className="inline-actions" sx={{ ml: 2, display: 'flex', gap: 0.5 }}>
                                            {failNode && onOpenLinkageModal && (
                                              <Tooltip title="Link Effects / Causes">
                                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); onOpenLinkageModal(failNode.id); }} sx={{ p: 0.25, bgcolor: '#fff', border: '1px solid ' + (isLinked ? '#bae6fd' : '#fecaca'), '&:hover': { bgcolor: isLinked ? '#bae6fd' : '#fee2e2' } }}>
                                                  <LinkIcon sx={{ fontSize: '0.9rem', color: isLinked ? '#0284c7' : '#ef4444' }} />
                                                </IconButton>
                                              </Tooltip>
                                            )}
                                            {failNode && onOpenDetailWindow && (
                                              <Tooltip title="View Linkage & Action Details">
                                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); onOpenDetailWindow(failNode.id); }} sx={{ p: 0.25, bgcolor: '#fff', border: '1px solid ' + (isLinked ? '#bae6fd' : '#fecaca'), '&:hover': { bgcolor: isLinked ? '#bae6fd' : '#fee2e2' } }}>
                                                  <EditIcon sx={{ fontSize: '0.9rem', color: isLinked ? '#0284c7' : '#ef4444' }} />
                                                </IconButton>
                                              </Tooltip>
                                            )}
                                          </Box>
                                        </Stack>
                                      </Box>
                                    );
                                  })}
                                </Box>
                              </Collapse>
                            </Box>
                          );
                        })}

                        {/* Work Elements List */}
                        {allWeNames.map((we, wIdx) => {
                          const weNodeId = `we::${step.id}::${we}`;
                          const isWeSelected = selectedNodeId === weNodeId;
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
                                  py: 0.5, 
                                  px: 1.5, 
                                  alignItems: 'center',
                                  display: 'inline-flex',
                                  width: 'fit-content',
                                  bgcolor: isWeSelected ? '#dbeafe' : '#eff6ff',
                                  borderRadius: 2,
                                  border: isWeSelected ? '2px solid #3b82f6' : '2px solid #bfdbfe',
                                  transition: 'all 0.15s ease',
                                  '&:hover': { bgcolor: '#dbeafe' },
                                  '& .inline-actions': { opacity: 0, pointerEvents: 'none', transition: 'opacity 0.15s ease' },
                                  '&:hover .inline-actions': { opacity: 1, pointerEvents: 'auto' }
                                }}
                              >
                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpand(weNodeId); }} sx={{ p: 0.25, color: '#1e3a8a' }}>
                                  {weExpanded ? <ExpandIcon /> : <CollapseIcon />}
                                </IconButton>
                                <WorkElementIcon sx={{ color: '#1e3a8a', fontSize: '1.1rem' }} />
                                <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, color: '#1e3a8a', fontFamily: 'inherit' }}>{we}</Typography>
                                <Box className="inline-actions" sx={{ ml: 2, display: 'flex', gap: 0.5 }}>
                                  <Tooltip title="Add Work Element Function">
                                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); onAddFunction(step.id, we); }} sx={{ p: 0.25, bgcolor: '#fff', border: '1px solid #bfdbfe', '&:hover': { bgcolor: '#dbeafe' } }}>
                                      <AddIcon sx={{ fontSize: '0.9rem', color: '#14532d' }} />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Stack>

                              <Collapse in={weExpanded}>
                                <Box sx={{ pl: 4.5 }}>
                                  {weFunctions.map((fn, wfIdx) => {
                                    const weFuncKey = `we-func::${step.id}::${we}::${fn}`;
                                    const isWeFuncSelected = selectedNodeId === weFuncKey;
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
                                            py: 0.5, 
                                            px: 1.5, 
                                            alignItems: 'center',
                                            display: 'inline-flex',
                                            width: 'fit-content',
                                            bgcolor: isWeFuncSelected ? '#dcfce7' : '#f0fdf4',
                                            borderRadius: 2,
                                            border: isWeFuncSelected ? '2px solid #22c55e' : '2px solid #bbf7d0',
                                            transition: 'all 0.15s ease',
                                            '&:hover': { bgcolor: '#dcfce7' },
                                            '& .inline-actions': { opacity: 0, pointerEvents: 'none', transition: 'opacity 0.15s ease' },
                                            '&:hover .inline-actions': { opacity: 1, pointerEvents: 'auto' }
                                          }}
                                        >
                                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpand(weFuncKey); }} sx={{ p: 0.25, color: '#14532d' }}>
                                            {weFuncExpanded ? <ExpandIcon /> : <CollapseIcon />}
                                          </IconButton>
                                           <FunctionIcon sx={{ color: '#14532d', fontSize: '1.1rem' }} />
                                           <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, color: '#14532d', fontFamily: 'inherit' }}>{fn}</Typography>
                                          <Box className="inline-actions" sx={{ ml: 2, display: 'flex', gap: 0.5 }}>
                                            <Tooltip title="Add Failure (Cause)">
                                              <IconButton size="small" onClick={(e) => { e.stopPropagation(); onAddFailure(step.id, { workElementName: we, functionName: fn }); }} sx={{ p: 0.25, bgcolor: '#fff', border: '1px solid #bbf7d0', '&:hover': { bgcolor: '#e8f5e9' } }}>
                                                <AddIcon sx={{ fontSize: '0.9rem', color: '#7f1d1d' }} />
                                              </IconButton>
                                            </Tooltip>
                                          </Box>
                                        </Stack>

                                        <Collapse in={weFuncExpanded}>
                                          <Box sx={{ pl: 4 }}>
                                            {failures.map((fail, failIdx) => (
                                              <Box key={failIdx} sx={{ mb: 0.5 }}>
                                                <Stack 
                                                  key={failIdx} 
                                                  direction="row" 
                                                  spacing={1} 
                                                  onClick={(e) => { e.stopPropagation(); handleSelectNode(`we-fail::${step.id}::${we}::${fn}::${fail}`); }}
                                                  sx={{ 
                                                    py: 0.5, 
                                                    px: 1.5, 
                                                    alignItems: 'center', 
                                                    cursor: 'pointer', 
                                                    borderRadius: 2, 
                                                    display: 'inline-flex',
                                                    width: 'fit-content',
                                                    bgcolor: selectedNodeId === `we-fail::${step.id}::${we}::${fn}::${fail}` ? '#fee2e2' : '#fef2f2', 
                                                    border: selectedNodeId === `we-fail::${step.id}::${we}::${fn}::${fail}` ? '2px solid #ef4444' : '2px solid #fecaca', 
                                                    '&:hover': { bgcolor: '#fee2e2' }, 
                                                    transition: 'all 0.15s ease' 
                                                  }}
                                                >
                                                   <FailureIcon sx={{ color: '#7f1d1d', fontSize: '1.1rem' }} />
                                                   <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, color: '#7f1d1d', fontFamily: 'inherit' }}>{fail}</Typography>
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
