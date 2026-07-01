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
  onOpenDetailWindow: _onOpenDetailWindow,
  structureFunctions: _structureFunctions,
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
                '&:hover': { bgcolor: '#f1f5f9' }
              }}
            >
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpand('root'); }} sx={{ p: 0.25, color: '#0f172a' }}>
                {expandedNodes.root ? <ExpandIcon /> : <CollapseIcon />}
              </IconButton>
              <RootIcon sx={{ color: '#0f172a', fontSize: '1.25rem' }} />
              <Typography sx={{ fontWeight: 900, fontSize: '1.05rem', color: '#0f172a', fontFamily: 'inherit', letterSpacing: '-0.01em' }}>
                {projectName || 'Process Item (Root)'}
              </Typography>
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
                        '&:hover': { bgcolor: '#dcfce7' }
                      }}
                    >
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpand(nodeKey); }} sx={{ p: 0.25, color: '#14532d' }}>
                        {expandedNodes[nodeKey] ? <ExpandIcon /> : <CollapseIcon />}
                      </IconButton>
                      <FunctionIcon sx={{ color: '#14532d', fontSize: '1.1rem' }} />
                      <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, color: '#14532d', fontFamily: 'inherit' }}>{fn}</Typography>
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
                        transition: 'all 0.15s ease'
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
                                  '&:hover': { bgcolor: '#dcfce7' }
                                }}
                              >
                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpand(nodeKey); }} sx={{ p: 0.25, color: '#14532d' }}>
                                  {expandedNodes[nodeKey] ? <ExpandIcon /> : <CollapseIcon />}
                                </IconButton>
                                <FunctionIcon sx={{ color: '#14532d', fontSize: '1.1rem' }} />
                                <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, color: '#14532d', fontFamily: 'inherit' }}>{fn}</Typography>
                              </Stack>

                              <Collapse in={!!expandedNodes[nodeKey]}>
                                <Box sx={{ pl: 4 }}>
                                  {failures.map((fail, failIdx) => (
                                    <Box key={failIdx} sx={{ mb: 0.5 }}>
                                      <Stack 
                                        key={failIdx} 
                                        direction="row" 
                                        spacing={1} 
                                        onClick={(e) => { e.stopPropagation(); handleSelectNode(`step-fail::${step.id}::${fn}::${fail}`); }}
                                        sx={{ 
                                          py: 0.5, 
                                          px: 1.5, 
                                          alignItems: 'center', 
                                          cursor: 'pointer', 
                                          borderRadius: 2, 
                                          display: 'inline-flex',
                                          width: 'fit-content',
                                          bgcolor: selectedNodeId === `step-fail::${step.id}::${fn}::${fail}` ? '#fee2e2' : '#fef2f2', 
                                          border: selectedNodeId === `step-fail::${step.id}::${fn}::${fail}` ? '2px solid #ef4444' : '2px solid #fecaca', 
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
                                  '&:hover': { bgcolor: '#dbeafe' }
                                }}
                              >
                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpand(weNodeId); }} sx={{ p: 0.25, color: '#1e3a8a' }}>
                                  {weExpanded ? <ExpandIcon /> : <CollapseIcon />}
                                </IconButton>
                                <WorkElementIcon sx={{ color: '#1e3a8a', fontSize: '1.1rem' }} />
                                <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, color: '#1e3a8a', fontFamily: 'inherit' }}>{we}</Typography>
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
                                            '&:hover': { bgcolor: '#dcfce7' }
                                          }}
                                        >
                                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpand(weFuncKey); }} sx={{ p: 0.25, color: '#14532d' }}>
                                            {weFuncExpanded ? <ExpandIcon /> : <CollapseIcon />}
                                          </IconButton>
                                           <FunctionIcon sx={{ color: '#14532d', fontSize: '1.1rem' }} />
                                           <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, color: '#14532d', fontFamily: 'inherit' }}>{fn}</Typography>
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
