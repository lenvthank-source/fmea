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
  KeyboardArrowRight as CollapseIcon,
  KeyboardArrowDown as ExpandIcon,
} from '@mui/icons-material';
import { TREE_COLORS, TREE_TYPOGRAPHY, TREE_ASSETS } from '../../shared/fmeaTreeStyles';

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

// Crisp HD Icon Component (24px HD)
const TreeIconBadge: React.FC<{
  type?: keyof typeof TREE_COLORS.iconBg;
  iconSrc?: string;
  size?: number;
}> = ({ iconSrc, size = 24 }) => (
  <Box
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      mr: 1.5,
      flexShrink: 0,
      width: size,
      height: size,
    }}
  >
    {iconSrc && (
      <Box
        component="img"
        src={iconSrc}
        alt="icon"
        sx={{
          width: size,
          height: size,
          objectFit: 'contain',
          imageRendering: '-webkit-optimize-contrast',
          filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.18))'
        }}
      />
    )}
  </Box>
);

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

  const rootRows = rows.filter(r => !r.processStepId);
  const rootFunctions = Array.from(new Set(rootRows.flatMap(r => r.functions?.map(f => f.name) || []))).filter(Boolean);

  const isDeleteEnabled = !!selectedNodeId && selectedNodeId.startsWith('step::');

  // Common node row style generator
  const getNodeRowStyle = (nodeId: string) => {
    const isSelected = selectedNodeId === nodeId;
    return {
      cursor: 'pointer',
      py: 0.75,
      px: 1,
      alignItems: 'center',
      display: 'inline-flex',
      width: 'fit-content',
      minHeight: 32,
      bgcolor: isSelected ? TREE_COLORS.selectedBg : 'transparent',
      borderRadius: 1.5,
      borderLeft: isSelected ? `3px solid ${TREE_COLORS.selectedBorder}` : '3px solid transparent',
      transition: 'all 0.15s ease',
      '&:hover': { bgcolor: TREE_COLORS.hoverBg },
      '& .inline-actions': { opacity: 0, pointerEvents: 'none', transition: 'opacity 0.15s ease' },
      '&:hover .inline-actions': { opacity: 1, pointerEvents: 'auto' }
    };
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2 }}>
      {/* Toolbar */}
      <Paper
        sx={{
          p: 1.5,
          border: '1px solid rgba(40, 37, 29, 0.1)',
          borderRadius: 3,
          bgcolor: 'background.paper',
          boxShadow: 'none'
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <Button
              size="small"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onAddStep}
              disabled={!isAddStepEnabled}
            >
              System Element
            </Button>
            <Button
              size="small"
              variant="outlined"
              disabled={!isAddWorkElementEnabled}
              onClick={() => nodeInfo && nodeInfo.stepId && onAddWorkElement(nodeInfo.stepId)}
            >
              Component Element
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
              Failure Mode
            </Button>
          </Stack>

          <Divider orientation="vertical" flexItem />

          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <IconButton
              size="small"
              disabled={!selectedNodeId || !selectedNodeId.startsWith('step::')}
              onClick={() => {
                if (selectedNodeId && selectedNodeId.startsWith('step::')) {
                  const step = steps.find(s => `step::${s.id}` === selectedNodeId);
                  if (step) onEditStep(step);
                }
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              disabled={!isDeleteEnabled}
              onClick={() => {
                if (selectedNodeId && selectedNodeId.startsWith('step::')) {
                  const stepId = selectedNodeId.replace('step::', '');
                  onDeleteStep(stepId);
                }
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>

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

        <Divider sx={{ my: 1.5 }} />

        {/* Legend */}
        <Stack direction="row" spacing={2.5} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: TREE_COLORS.textSecondary, letterSpacing: '0.5px' }}>LEGEND:</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TreeIconBadge type="root" iconSrc={TREE_ASSETS.processStep} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: TREE_COLORS.nodeText.root }}>System Item (Root)</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TreeIconBadge type="process" iconSrc={TREE_ASSETS.processStep} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: TREE_COLORS.nodeText.process }}>System Element</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TreeIconBadge type="workElem" iconSrc={TREE_ASSETS.workElement} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: TREE_COLORS.nodeText.workElem }}>Component Element</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TreeIconBadge type="function" iconSrc={TREE_ASSETS.function} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: TREE_COLORS.nodeText.function }}>Function</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TreeIconBadge type="failure" iconSrc={TREE_ASSETS.failure} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: TREE_COLORS.nodeText.failure }}>Failure Mode</Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Tree Canvas */}
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
              sx={getNodeRowStyle('root')}
            >
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpand('root'); }} sx={{ p: 0.25, color: TREE_COLORS.chevron }}>
                {expandedNodes.root ? <ExpandIcon /> : <CollapseIcon />}
              </IconButton>
              <TreeIconBadge type="root" iconSrc={TREE_ASSETS.processStep} />
              <Typography sx={TREE_TYPOGRAPHY.root}>
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
                    <TreeIconBadge type="function" iconSrc={TREE_ASSETS.function} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Stack>
          </Box>

          {/* Child nodes of root */}
          <Collapse in={expandedNodes.root}>
            <Box sx={{ pl: 3, ml: 1.5, borderLeft: `1px solid ${TREE_COLORS.connectorLine}` }}>
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
                      sx={getNodeRowStyle(nodeKey)}
                    >
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpand(nodeKey); }} sx={{ p: 0.25, color: TREE_COLORS.chevron }}>
                        {expandedNodes[nodeKey] ? <ExpandIcon /> : <CollapseIcon />}
                      </IconButton>
                      <TreeIconBadge type="function" iconSrc={TREE_ASSETS.function} />
                      <Typography sx={TREE_TYPOGRAPHY.function}>{fn}</Typography>
                      <Box className="inline-actions" sx={{ ml: 2, display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Add Failure">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onAddFailure(null, { functionName: fn }); }} sx={{ p: 0.25, bgcolor: '#fff', border: '1px solid #bbf7d0', '&:hover': { bgcolor: '#e8f5e9' } }}>
                            <AddIcon sx={{ fontSize: '0.9rem', color: '#DC2626' }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Stack>

                    <Collapse in={!!expandedNodes[nodeKey]}>
                      <Box sx={{ pl: 3, ml: 1.5, borderLeft: `1px solid ${TREE_COLORS.connectorLine}` }}>
                        {failures.map((fail, failIdx) => (
                          <Box key={failIdx} sx={{ mb: 0.5 }}>
                            <Stack 
                              direction="row" 
                              spacing={1} 
                              onClick={(e) => { e.stopPropagation(); handleSelectNode(`root-fail-${fn}-${fail}`); }}
                              sx={getNodeRowStyle(`root-fail-${fn}-${fail}`)}
                            >
                              <TreeIconBadge type="failure" iconSrc={TREE_ASSETS.failure} />
                              <Typography sx={TREE_TYPOGRAPHY.failure}>{fail}</Typography>
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
                      sx={getNodeRowStyle(stepNodeId)}
                    >
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpand(stepNodeId); }} sx={{ p: 0.25, color: TREE_COLORS.chevron }}>
                        {stepExpanded ? <ExpandIcon /> : <CollapseIcon />}
                      </IconButton>
                      <TreeIconBadge type="process" iconSrc={TREE_ASSETS.processStep} />
                      <Typography sx={TREE_TYPOGRAPHY.process}>
                        {step.stepNumber} - {step.name || 'Untitled Element'}
                      </Typography>
                      <Box className="inline-actions" sx={{ ml: 2, display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Add Component Element">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onAddWorkElement(step.id); }} sx={{ p: 0.25, bgcolor: '#fff', border: '1px solid #fef08a', '&:hover': { bgcolor: '#fef9c3' } }}>
                            <TreeIconBadge type="workElem" iconSrc={TREE_ASSETS.workElement} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Add Element Function">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onAddFunction(step.id, null); }} sx={{ p: 0.25, bgcolor: '#fff', border: '1px solid #fef08a', '&:hover': { bgcolor: '#fef9c3' } }}>
                            <TreeIconBadge type="function" iconSrc={TREE_ASSETS.function} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Element">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEditStep(step); }} sx={{ p: 0.25, bgcolor: '#fff', border: '1px solid #fef08a', '&:hover': { bgcolor: '#fef9c3' } }}>
                            <EditIcon sx={{ fontSize: '0.9rem', color: '#854d0e' }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Element">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDeleteStep(step.id); }} sx={{ p: 0.25, bgcolor: '#fff', border: '1px solid #fecaca', '&:hover': { bgcolor: '#fee2e2' } }}>
                            <DeleteIcon sx={{ fontSize: '0.9rem', color: '#7f1d1d' }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Stack>

                    <Collapse in={stepExpanded}>
                      <Box sx={{ pl: 3, ml: 1.5, borderLeft: `1px solid ${TREE_COLORS.connectorLine}` }}>
                        {/* Step Functions List */}
                        {stepFunctions.map((fn, fIdx) => {
                          const nodeKey = `step-func::${step.id}::${fn}`;
                          const stepFuncExpanded = !!expandedNodes[nodeKey];

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
                                sx={getNodeRowStyle(nodeKey)}
                              >
                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpand(nodeKey); }} sx={{ p: 0.25, color: TREE_COLORS.chevron }}>
                                  {stepFuncExpanded ? <ExpandIcon /> : <CollapseIcon />}
                                </IconButton>
                                <TreeIconBadge type="function" iconSrc={TREE_ASSETS.function} />
                                <Typography sx={TREE_TYPOGRAPHY.function}>{fn}</Typography>
                                <Box className="inline-actions" sx={{ ml: 2, display: 'flex', gap: 0.5 }}>
                                  <Tooltip title="Add Failure">
                                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); onAddFailure(step.id, { functionName: fn }); }} sx={{ p: 0.25, bgcolor: '#fff', border: '1px solid #bbf7d0', '&:hover': { bgcolor: '#e8f5e9' } }}>
                                      <AddIcon sx={{ fontSize: '0.9rem', color: '#DC2626' }} />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Stack>

                              <Collapse in={stepFuncExpanded}>
                                <Box sx={{ pl: 3, ml: 1.5, borderLeft: `1px solid ${TREE_COLORS.connectorLine}` }}>
                                  {failures.map((fail, failIdx) => (
                                    <Box key={failIdx} sx={{ mb: 0.5 }}>
                                      <Stack 
                                        direction="row" 
                                        spacing={1} 
                                        onClick={(e) => { e.stopPropagation(); handleSelectNode(`step-fail::${step.id}::${fn}::${fail}`); }}
                                        sx={getNodeRowStyle(`step-fail::${step.id}::${fn}::${fail}`)}
                                      >
                                        <TreeIconBadge type="failure" iconSrc={TREE_ASSETS.failure} />
                                        <Typography sx={TREE_TYPOGRAPHY.failure}>{fail}</Typography>
                                      </Stack>
                                    </Box>
                                  ))}
                                </Box>
                              </Collapse>
                            </Box>
                          );
                        })}

                        {/* Work Elements / Component Elements List */}
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
                                sx={getNodeRowStyle(weNodeId)}
                              >
                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpand(weNodeId); }} sx={{ p: 0.25, color: TREE_COLORS.chevron }}>
                                  {weExpanded ? <ExpandIcon /> : <CollapseIcon />}
                                </IconButton>
                                <TreeIconBadge type="workElem" iconSrc={TREE_ASSETS.workElement} />
                                <Typography sx={TREE_TYPOGRAPHY.workElem}>{we}</Typography>
                                <Box className="inline-actions" sx={{ ml: 2, display: 'flex', gap: 0.5 }}>
                                  <Tooltip title="Add Component Function">
                                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); onAddFunction(step.id, we); }} sx={{ p: 0.25, bgcolor: '#fff', border: '1px solid #bfdbfe', '&:hover': { bgcolor: '#dbeafe' } }}>
                                      <TreeIconBadge type="function" iconSrc={TREE_ASSETS.function} />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Stack>

                              <Collapse in={weExpanded}>
                                <Box sx={{ pl: 3, ml: 1.5, borderLeft: `1px solid ${TREE_COLORS.connectorLine}` }}>
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
                                          sx={getNodeRowStyle(weFuncKey)}
                                        >
                                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpand(weFuncKey); }} sx={{ p: 0.25, color: TREE_COLORS.chevron }}>
                                            {weFuncExpanded ? <ExpandIcon /> : <CollapseIcon />}
                                          </IconButton>
                                          <TreeIconBadge type="function" iconSrc={TREE_ASSETS.function} />
                                          <Typography sx={TREE_TYPOGRAPHY.function}>{fn}</Typography>
                                          <Box className="inline-actions" sx={{ ml: 2, display: 'flex', gap: 0.5 }}>
                                            <Tooltip title="Add Failure">
                                              <IconButton size="small" onClick={(e) => { e.stopPropagation(); onAddFailure(step.id, { workElementName: we, functionName: fn }); }} sx={{ p: 0.25, bgcolor: '#fff', border: '1px solid #bbf7d0', '&:hover': { bgcolor: '#e8f5e9' } }}>
                                                <AddIcon sx={{ fontSize: '0.9rem', color: '#DC2626' }} />
                                              </IconButton>
                                            </Tooltip>
                                          </Box>
                                        </Stack>

                                        <Collapse in={weFuncExpanded}>
                                          <Box sx={{ pl: 3, ml: 1.5, borderLeft: `1px solid ${TREE_COLORS.connectorLine}` }}>
                                            {failures.map((fail, failIdx) => (
                                              <Box key={failIdx} sx={{ mb: 0.5 }}>
                                                <Stack 
                                                  direction="row" 
                                                  spacing={1} 
                                                  onClick={(e) => { e.stopPropagation(); handleSelectNode(`we-fail::${step.id}::${we}::${fn}::${fail}`); }}
                                                  sx={getNodeRowStyle(`we-fail::${step.id}::${we}::${fn}::${fail}`)}
                                                >
                                                  <TreeIconBadge type="failure" iconSrc={TREE_ASSETS.failure} />
                                                  <Typography sx={TREE_TYPOGRAPHY.failure}>{fail}</Typography>
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
