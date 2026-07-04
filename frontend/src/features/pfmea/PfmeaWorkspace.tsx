import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, IconButton, Alert, CircularProgress, Select, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControl, InputLabel, Stack, Tooltip, TextField, Tabs, Tab,
  Collapse, Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  PlaylistAdd as PlaylistAddIcon,
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowUp as ExpandLessIcon
} from '@mui/icons-material';
import { useAuth } from '../auth/AuthContext';
import { PfmeaRowEditor } from './components/PfmeaRowEditor';
import { PfmeaStructureTree } from './components/PfmeaStructureTree';
import { AddFunctionDialog } from './components/AddFunctionDialog';
import { AddFailureDialog } from './components/AddFailureDialog';
import { FailureLinkageModal } from './components/FailureLinkageModal';
import { FailureDetailWindow } from './components/FailureDetailWindow';
import { RatingDropdown } from './components/RatingDropdown';
import { calculateAP } from './utils/apCalculator';
import { useResponsive } from '../../hooks/useResponsive';
import { ReportExporter } from '../reports/ReportExporter';
import { API_BASE_URL } from '../../config';
import { DocumentHeader } from '../../components/DocumentHeader';

interface ProcessStep {
  id: string;
  stepNumber: string;
  name: string;
  stepType: string;
  machinesEquipmentDocs?: any;
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
  notes: string;
  status: string;
  accessLevel: string;
  processStep?: { name: string; stepNumber: string; isOrphaned?: boolean } | null;
  functions: { name: string }[];
  requirements: { name: string }[];
  failureModes: { name: string }[];
  effects: { name: string }[];
  causes: { name: string }[];
  controls: { name: string; type: string; detectionMethod?: string }[];
  characteristics: { name: string; classification: string; unitOfMeasure?: string }[];
}

const severityCriteria: Record<number, string> = {
  10: "10 - Safety/regulatory (without warning)",
  9: "9 - Safety/regulatory (with warning)",
  8: "8 - Loss of primary function / disruption",
  7: "7 - Reduced primary function / minor disruption",
  6: "6 - Loss of secondary function",
  5: "5 - Reduced secondary function",
  4: "4 - Minor defect (noticed by user)",
  3: "3 - Defect noticed by expert/inspector",
  2: "2 - Very minor defect noticed",
  1: "1 - No effect"
};

const occurrenceCriteria: Record<number, string> = {
  10: "10 - Extremely high, no controls",
  9: "9 - Very high, basic controls",
  8: "8 - High, prevention control is low effectiveness",
  7: "7 - Moderately high, prevention control has moderate effectiveness",
  6: "6 - Moderate, prevention control is moderately effective",
  5: "5 - Moderately low, prevention control is effective",
  4: "4 - Low, prevention control is highly effective",
  3: "3 - Very low, prevention control is extremely effective",
  2: "2 - Extremely low, prevention control is outstanding",
  1: "1 - Failure is eliminated through design/process"
};

const detectionCriteria: Record<number, string> = {
  10: "10 - Cannot detect, no method",
  9: "9 - Very low, purely visual",
  8: "8 - Low, visual or double inspection",
  7: "7 - Moderately low, attribute gauge",
  6: "6 - Moderate, variable gauge or test",
  5: "5 - Moderately high, double variable inspection",
  4: "4 - High, automated attribute inspection",
  3: "3 - Very high, automated variable inspection",
  2: "2 - Extremely high, automated variable + prevention loop",
  1: "1 - Failure is prevented from occurrence"
};

export const PfmeaWorkspace: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { token } = useAuth();
  const { isMobile } = useResponsive();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'tree';

  // Project Document Revisions
  const [pfmeaRevisionId, setPfmeaRevisionId] = useState<string | null>(null);
  const [pfdRevisionId, setPfdRevisionId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>('');

  // Data states
  const [rows, setRows] = useState<PfmeaRow[]>([]);
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Expanded Optimization Rows state
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Dialog and Drawer states
  const [editorOpen, setEditorOpen] = useState(false);
  const [activeRow, setActiveRow] = useState<PfmeaRow | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Add row form state
  const [selectedStepId, setSelectedStepId] = useState('');

  // PFD steps and import dialog states
  const [pfdSteps, setPfdSteps] = useState<any[]>([]);
  const [importPromptOpen, setImportPromptOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  // Generic Tree Element Add Dialog states
  const [treeAddType, setTreeAddType] = useState<'workElement' | 'function' | 'failure' | null>(null);
  const [treeAddTargetStepId, setTreeAddTargetStepId] = useState<string | null>(null);
  const [treeAddWorkElementName, setTreeAddWorkElementName] = useState<string | null>(null);
  const [treeAddFunctionName, setTreeAddFunctionName] = useState<string | null>(null);
  const [treeAddValue, setTreeAddValue] = useState('');

  // Exporter Dialog state
  const [exporterOpen, setExporterOpen] = useState(false);

  // Corrective action creation state
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedRowForAction, setSelectedRowForAction] = useState<PfmeaRow | null>(null);
  const [actionDescription, setActionDescription] = useState('');
  const [actionPriority, setActionPriority] = useState('medium');
  const [actionOwnerId, setActionOwnerId] = useState('');
  const [actionDueDate, setActionDueDate] = useState('');
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);

  // Linkage dialogs state
  const [linkageModalOpen, setLinkageModalOpen] = useState(false);
  const [linkageModalFailureModeId, setLinkageModalFailureModeId] = useState<string | null>(null);
  const [detailWindowOpen, setDetailWindowOpen] = useState(false);
  const [detailWindowFailureModeId, setDetailWindowFailureModeId] = useState<string | null>(null);

  // Structure-level function/failure dialog state
  const [structFuncDialogOpen, setStructFuncDialogOpen] = useState(false);
  const [structFuncParentType, setStructFuncParentType] = useState<'project' | 'process_step' | 'work_element' | null>(null);
  const [structFuncParentId, setStructFuncParentId] = useState<string | null>(null);
  const [structFailDialogOpen, setStructFailDialogOpen] = useState(false);
  const [structFailRole, setStructFailRole] = useState<'effect' | 'mode' | 'cause' | null>(null);
  const [structFailFunctionId, setStructFailFunctionId] = useState<string | null>(null);
  const [structFailFunctionNarration, setStructFailFunctionNarration] = useState('');
  const [structureFunctions, setStructureFunctions] = useState<any[]>([]);

  // Load tenant users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        }
      } catch (err) {
        console.error('Failed to load tenant users', err);
      }
    };
    if (token) {
      fetchUsers();
    }
  }, [token]);

  const handleCreateAction = async () => {
    if (!selectedRowForAction || !actionDescription || !actionOwnerId || !actionDueDate) return;
    setError(null);
    setActionDialogOpen(false);
    try {
      const response = await fetch(`${API_BASE_URL}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId,
          description: actionDescription,
          ownerId: actionOwnerId,
          dueDate: actionDueDate,
          priority: actionPriority,
          fmeaRowId: selectedRowForAction.id,
          fmeaType: 'PFMEA',
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to create corrective action.');
      }

      setActionDescription('');
      setActionPriority('medium');
      setActionOwnerId('');
      setActionDueDate('');
      setSelectedRowForAction(null);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Could not create corrective action.');
    }
  };

  // Load project revisions context
  useEffect(() => {
    const resolveContext = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/documents`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to resolve project document schemas.');
        const documents = await response.json();

        const pfmeaDoc = documents.find((doc: any) => doc.type === 'PFMEA');
        const pfdDoc = documents.find((doc: any) => doc.type === 'PFD');

        if (!pfmeaDoc || !pfmeaDoc.currentRevisionId) {
          throw new Error('PFMEA Document context not found or revision uninitialized.');
        }
        if (!pfdDoc || !pfdDoc.currentRevisionId) {
          throw new Error('PFD Document context not found. Please setup process structure first.');
        }

        setPfmeaRevisionId(pfmeaDoc.currentRevisionId);
        setPfdRevisionId(pfdDoc.currentRevisionId);
      } catch (err: any) {
        setError(err.message || 'An error occurred while loading project context.');
        setLoading(false);
      }
    };

    if (projectId && token) {
      resolveContext();
    }
  }, [projectId, token]);

  const fetchData = async () => {
    if (!pfmeaRevisionId || !pfdRevisionId) return;
    try {
      // 1. Fetch PFMEA process steps
      const stepsResponse = await fetch(`${API_BASE_URL}/revisions/${pfmeaRevisionId}/pfd-steps`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!stepsResponse.ok) throw new Error('Failed to load Process Steps');
      const stepsData = await stepsResponse.json();
      setSteps(stepsData);

      // 2. Fetch PFD process steps for reference/import check
      const pfdStepsResponse = await fetch(`${API_BASE_URL}/revisions/${pfdRevisionId}/pfd-steps`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (pfdStepsResponse.ok) {
        const pfdStepsData = await pfdStepsResponse.json();
        setPfdSteps(pfdStepsData);
        
        // Show import prompt if PFMEA is empty but PFD has steps
        if (stepsData.length === 0 && pfdStepsData.length > 0) {
          setImportPromptOpen(true);
        }
      }

      const rowsResponse = await fetch(`${API_BASE_URL}/revisions/${pfmeaRevisionId}/pfmea-rows`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!rowsResponse.ok) throw new Error('Failed to load PFMEA analysis rows');
      const rowsData = await rowsResponse.json();
      setRows(rowsData);

      // Fetch structure functions
      const structRes = await fetch(`${API_BASE_URL}/structure-functions/project/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (structRes.ok) {
        const structData = await structRes.json();
        setStructureFunctions(structData);
      }
    } catch (err: any) {
      setError(err.message || 'Could not load FMEA workspace data.');
    } finally {
      setLoading(false);
    }
  };

  const handleImportPfdSteps = async () => {
    if (!pfmeaRevisionId || !pfdRevisionId) return;
    setImporting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/revisions/${pfmeaRevisionId}/import-pfd-steps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ sourceRevisionId: pfdRevisionId }),
      });
      if (!res.ok) throw new Error('Failed to import process steps from PFD.');
      
      await fetchData();
      setImportPromptOpen(false);
    } catch (err: any) {
      setError(err.message || 'Could not import steps.');
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => {
    if (pfmeaRevisionId && pfdRevisionId) {
      fetchData();
    }
  }, [pfmeaRevisionId, pfdRevisionId]);

  const handleAddRow = async () => {
    if (!selectedStepId) return;
    setError(null);
    setAddDialogOpen(false);
    try {
      const nextRowNumber = rows.length > 0 ? Math.max(...rows.map((r) => r.rowNumber)) + 1 : 1;

      const response = await fetch(`${API_BASE_URL}/revisions/${pfmeaRevisionId}/pfmea-rows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          processStepId: selectedStepId,
          rowNumber: nextRowNumber,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create FMEA row.');
      }

      await fetchData();
      setSelectedStepId('');
    } catch (err: any) {
      setError(err.message || 'Error occurred while appending FMEA row.');
    }
  };

  const handleAddWorkElementFromTree = (stepId: string) => {
    setTreeAddTargetStepId(stepId);
    setTreeAddWorkElementName(null);
    setTreeAddFunctionName(null);
    setTreeAddType('workElement');
    setTreeAddValue('');
  };

  const handleAddFunctionFromTree = (stepId: string | null, workElementName?: string | null) => {
    if (!stepId && !workElementName) {
      setStructFuncParentType('project');
      setStructFuncParentId(projectId!);
    } else if (stepId && !workElementName) {
      setStructFuncParentType('process_step');
      setStructFuncParentId(stepId);
    } else if (stepId && workElementName) {
      setStructFuncParentType('work_element');
      setStructFuncParentId(`${stepId}::${workElementName}`);
    }
    setStructFuncDialogOpen(true);
  };

  const handleAddFailureFromTree = (
    stepId: string | null,
    parentContext?: { workElementName?: string | null; functionName: string }
  ) => {
    if (!parentContext) return;
    const { workElementName, functionName } = parentContext;

    let fnNode = null;
    if (!stepId && !workElementName) {
      fnNode = structureFunctions.find(
        (f) => f.parentType === 'project' && f.narration === functionName
      );
    } else if (stepId && !workElementName) {
      fnNode = structureFunctions.find(
        (f) => f.parentType === 'process_step' && f.parentId === stepId && f.narration === functionName
      );
    } else if (stepId && workElementName) {
      fnNode = structureFunctions.find(
        (f) => f.parentType === 'work_element' && f.parentId === `${stepId}::${workElementName}` && f.narration === functionName
      );
    }

    if (!fnNode) {
      setError('Cannot add structure failure: Parent structure function not found in DB.');
      return;
    }

    const roleMap: Record<string, 'effect' | 'mode' | 'cause'> = {
      project: 'effect',
      process_step: 'mode',
      work_element: 'cause',
    };
    const role = roleMap[fnNode.parentType];

    setStructFailRole(role);
    setStructFailFunctionId(fnNode.id);
    setStructFailFunctionNarration(fnNode.narration);
    setStructFailDialogOpen(true);
  };

  const handleConfirmAddTreeElement = async () => {
    if (!treeAddType || !treeAddValue.trim()) return;
    const value = treeAddValue.trim();
    setTreeAddType(null);
    setTreeAddValue('');
    setError(null);

    try {
      if (treeAddType === 'workElement') {
        if (!treeAddTargetStepId) throw new Error('Step target is required for Work Element');
        const step = steps.find(s => s.id === treeAddTargetStepId);
        if (!step) throw new Error('Step not found');
        
        let existingWe: string[] = [];
        if (Array.isArray(step.machinesEquipmentDocs)) {
          existingWe = step.machinesEquipmentDocs;
        } else if (typeof step.machinesEquipmentDocs === 'string' && step.machinesEquipmentDocs) {
          try {
            const parsed = JSON.parse(step.machinesEquipmentDocs);
            existingWe = Array.isArray(parsed) ? parsed : [step.machinesEquipmentDocs];
          } catch {
            existingWe = [step.machinesEquipmentDocs];
          }
        }
        const updatedWe = [...existingWe, value];

        const response = await fetch(`${API_BASE_URL}/pfd-steps/${treeAddTargetStepId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ machinesEquipmentDocs: updatedWe })
        });
        if (!response.ok) throw new Error('Failed to save Work Element to Process Step');
      } else {
        // Find or create PFMEA Row matching:
        // - processStepId === treeAddTargetStepId
        // - workElementName === treeAddWorkElementName
        // - (if adding failure, we also want the row to have the given function name!)
        let row = rows.find(r => 
          r.processStepId === treeAddTargetStepId && 
          r.workElementName === treeAddWorkElementName &&
          (treeAddType !== 'failure' || r.functions?.some(f => f.name === treeAddFunctionName))
        );

        if (!row) {
          const nextRowNumber = rows.length > 0 ? Math.max(...rows.map((r) => r.rowNumber)) + 1 : 1;
          const createResponse = await fetch(`${API_BASE_URL}/revisions/${pfmeaRevisionId}/pfmea-rows`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              processStepId: treeAddTargetStepId || undefined,
              workElementName: treeAddWorkElementName || undefined,
              rowNumber: nextRowNumber,
            }),
          });
          if (!createResponse.ok) {
            let backendMsg = 'Failed to initialize analysis row.';
            try {
              const errBody = await createResponse.json();
              backendMsg = errBody?.message || backendMsg;
            } catch { /* ignore parse errors */ }
            throw new Error(backendMsg);
          }
          const newRow = await createResponse.json();
          row = {
            ...newRow,
            functions: [],
            requirements: [],
            failureModes: [],
            effects: [],
            causes: [],
            controls: [],
            characteristics: [],
          };
          
          // If we created a new row because we are adding a failure, we must copy the function name to it first!
          if (treeAddType === 'failure' && treeAddFunctionName && row) {
            await fetch(`${API_BASE_URL}/pfmea-rows/${row.id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ functions: [treeAddFunctionName] })
            });
            // Update local object
            row.functions = [{ name: treeAddFunctionName }];
          }
        }

        if (!row) throw new Error('Failed to resolve FMEA row');

        if (treeAddType === 'function') {
          const existingFuncs = row.functions?.map((f: any) => f.name) || [];
          const updatedFuncs = [...existingFuncs, value];
          const response = await fetch(`${API_BASE_URL}/pfmea-rows/${row.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ functions: updatedFuncs })
          });
          if (!response.ok) throw new Error('Failed to save Function');
        } else if (treeAddType === 'failure') {
          const existingFms = row.failureModes?.map((fm: any) => fm.name) || [];
          const updatedFms = [...existingFms, value];
          const response = await fetch(`${API_BASE_URL}/pfmea-rows/${row.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ failureModes: updatedFms })
          });
          if (!response.ok) throw new Error('Failed to save Failure Mode');
        }
      }

      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Error occurred while adding tree element.');
    }
  };

  const handleDeleteRow = async (rowId: string) => {
    if (!window.confirm('Are you sure you want to delete this analysis row? This action is permanent.')) return;
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/pfmea-rows/${rowId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete FMEA row.');
      }

      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Could not delete FMEA row.');
    }
  };

  const handleRatingChange = async (rowId: string, field: 'severity' | 'occurrence' | 'detection', value: number) => {
    setError(null);
    const targetRow = rows.find((r) => r.id === rowId);
    if (!targetRow) return;

    const S = field === 'severity' ? value : targetRow.severity;
    const O = field === 'occurrence' ? value : targetRow.occurrence;
    const D = field === 'detection' ? value : targetRow.detection;
    const localAp = calculateAP(S, O, D);

    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, [field]: value, ap: localAp } : r))
    );

    try {
      const response = await fetch(`${API_BASE_URL}/pfmea-rows/${rowId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        throw new Error('Failed to persist rating update.');
      }

      const updatedRow = await response.json();
      setRows((prev) =>
        prev.map((r) => (r.id === rowId ? { ...r, severity: updatedRow.severity, occurrence: updatedRow.occurrence, detection: updatedRow.detection, ap: updatedRow.ap } : r))
      );
    } catch (err: any) {
      setError(err.message || 'Failed to update rating. Reverting...');
      fetchData();
    }
  };

  const handleSaveRowDetails = async (updatedData: any) => {
    if (!activeRow) return;
    const response = await fetch(`${API_BASE_URL}/pfmea-rows/${activeRow.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updatedData),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Failed to save FMEA row modifications.');
    }

    await fetchData();
  };

  const getApBadge = (ap: string | null) => {
    if (!ap) return <Chip label="—" size="small" variant="outlined" />;
    switch (ap) {
      case 'H':
        return <Chip label="High" size="small" color="error" sx={{ fontWeight: 'bold' }} />;
      case 'M':
        return <Chip label="Medium" size="small" color="warning" sx={{ fontWeight: 'bold' }} />;
      case 'L':
        return <Chip label="Low" size="small" color="success" sx={{ fontWeight: 'bold' }} />;
      default:
        return <Chip label={ap} size="small" />;
    }
  };

  const toggleRowExpansion = (rowId: string) => {
    setExpandedRows(prev => ({ ...prev, [rowId]: !prev[rowId] }));
  };

  const ratingOptions = Array.from({ length: 10 }, (_, i) => i + 1);

  const getFailureModeDbId = (row: PfmeaRow) => {
    const fnName = row.functions?.[0]?.name;
    const fmName = row.failureModes?.[0]?.name;
    if (!fnName || !fmName || !structureFunctions) return null;

    const fnNode = structureFunctions.find(
      (f) => f.parentType === 'process_step' && f.parentId === row.processStepId && f.narration === fnName
    );
    if (!fnNode) return null;

    const fmNode = fnNode.failures?.find(
      (fail: any) => fail.narration === fmName && fail.role === 'mode'
    );
    return fmNode?.id || null;
  };

  if (loading && !pfmeaRevisionId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <DocumentHeader
        projectId={projectId!}
        docType="PFMEA"
        onHeaderLoaded={(p) => setProjectName(p.name)}
      />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 2 : 0, justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center' }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setSearchParams({ tab: val })}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab value="tree" label="Structure Tree" sx={{ fontWeight: 'bold' }} />
          <Tab value="table" label="Analysis Table" sx={{ fontWeight: 'bold' }} />
          <Tab value="chains" label="Func/Fail Chains" sx={{ fontWeight: 'bold' }} />
        </Tabs>
        
        <Stack direction="row" spacing={1.5} sx={{ mt: isMobile ? 1.5 : 0 }}>
          <Button variant="outlined" color="primary" onClick={() => setExporterOpen(true)}>
            Export FMEA
          </Button>
          {activeTab === 'table' && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddDialogOpen(true)}>
              Add Analysis Row
            </Button>
          )}
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* RENDER ACTIVE TAB VIEW */}
      {activeTab === 'tree' ? (
        <PfmeaStructureTree
          projectName={projectName}
          steps={steps}
          rows={rows}
          onAddStep={() => setAddDialogOpen(true)}
          onEditStep={(step) => {
            const row = rows.find(r => r.processStepId === step.id);
            if (row) {
              setActiveRow(row);
              setEditorOpen(true);
            }
          }}
          onDeleteStep={handleDeleteRow}
          onMoveStep={() => {}}
          onAddFunction={handleAddFunctionFromTree}
          onAddWorkElement={handleAddWorkElementFromTree}
          onAddFailure={handleAddFailureFromTree}
          onOpenLinkageModal={(modeId) => {
            setLinkageModalFailureModeId(modeId);
            setLinkageModalOpen(true);
          }}
          onOpenDetailWindow={(modeId) => {
            setDetailWindowFailureModeId(modeId);
            setDetailWindowOpen(true);
          }}
          structureFunctions={structureFunctions}
        />
      ) : activeTab === 'table' ? (
        <TableContainer component={Paper} sx={{ border: '1px solid rgba(40, 37, 29, 0.1)', borderRadius: 3, bgcolor: 'background.paper', overflowX: 'auto', boxShadow: 'none' }}>
          <Table aria-label="PFMEA rows grid" size="small">
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell sx={{ minWidth: 40, fontWeight: 'bold' }}>#</TableCell>
                <TableCell sx={{ minWidth: 140, fontWeight: 'bold' }}>Process Step</TableCell>
                <TableCell sx={{ minWidth: 150, fontWeight: 'bold' }}>Work Element (4M)</TableCell>
                <TableCell sx={{ minWidth: 180, fontWeight: 'bold' }}>Functions / Requirements</TableCell>
                <TableCell sx={{ minWidth: 150, fontWeight: 'bold' }}>Failure Effects (FE)</TableCell>
                <TableCell sx={{ minWidth: 65, fontWeight: 'bold', textAlign: 'center' }}>S</TableCell>
                <TableCell sx={{ minWidth: 150, fontWeight: 'bold' }}>Failure Modes (FM)</TableCell>
                <TableCell sx={{ minWidth: 150, fontWeight: 'bold' }}>Failure Causes (FC)</TableCell>
                <TableCell sx={{ minWidth: 150, fontWeight: 'bold' }}>Prevention Controls</TableCell>
                <TableCell sx={{ minWidth: 65, fontWeight: 'bold', textAlign: 'center' }}>O</TableCell>
                <TableCell sx={{ minWidth: 150, fontWeight: 'bold' }}>Detection Controls</TableCell>
                <TableCell sx={{ minWidth: 65, fontWeight: 'bold', textAlign: 'center' }}>D</TableCell>
                <TableCell sx={{ minWidth: 70, fontWeight: 'bold', textAlign: 'center' }}>AP</TableCell>
                <TableCell sx={{ minWidth: 90, fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={15} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No PFMEA analysis rows added yet. Click "Add Analysis Row" to begin.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const step = steps.find(s => s.id === row.processStepId);
                  let workElements: string[] = [];
                  if (step) {
                    if (Array.isArray(step.machinesEquipmentDocs)) {
                      workElements = step.machinesEquipmentDocs;
                    } else if (typeof step.machinesEquipmentDocs === 'string' && step.machinesEquipmentDocs) {
                      try {
                        const parsed = JSON.parse(step.machinesEquipmentDocs);
                        workElements = Array.isArray(parsed) ? parsed : [step.machinesEquipmentDocs];
                      } catch {
                        workElements = [step.machinesEquipmentDocs];
                      }
                    }
                  }

                  const isExpanded = !!expandedRows[row.id];

                  return (
                    <React.Fragment key={row.id}>
                      <TableRow sx={{ '&:hover': { bgcolor: 'rgba(40, 37, 29, 0.01)' } }}>
                        {/* Expansion trigger */}
                        <TableCell sx={{ width: 40, p: 0.5 }}>
                          <IconButton size="small" onClick={() => toggleRowExpansion(row.id)}>
                            {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                          </IconButton>
                        </TableCell>

                        {/* Row Number */}
                        <TableCell sx={{ fontWeight: 'bold' }}>{row.rowNumber}</TableCell>

                        {/* Process Step */}
                        <TableCell>
                          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {row.processStep?.stepNumber}
                            </Typography>
                            {row.processStep?.isOrphaned && (
                              <Chip 
                                label="Orphaned" 
                                size="small" 
                                color="error" 
                                variant="outlined" 
                                sx={{ height: 18, fontSize: '0.65rem', px: 0.5 }} 
                              />
                            )}
                          </Stack>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {row.processStep?.name}
                          </Typography>
                        </TableCell>

                        {/* Work Element (4M) */}
                        <TableCell>
                          <Stack spacing={0.5} direction="row" sx={{ flexWrap: 'wrap' }}>
                            {workElements.map((we, weIdx) => (
                              <Chip key={weIdx} label={we} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.75rem', borderColor: '#f97316', color: '#f97316' }} />
                            ))}
                            {workElements.length === 0 && '—'}
                          </Stack>
                        </TableCell>

                        {/* Functions & Requirements */}
                        <TableCell>
                          <Stack spacing={0.5}>
                            {row.functions?.map((f, i) => (
                              <Chip key={i} label={`F: ${f.name}`} size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: '0.75rem' }} />
                            ))}
                            {row.requirements?.map((req, i) => (
                              <Chip key={i} label={`R: ${req.name}`} size="small" color="secondary" variant="outlined" sx={{ height: 20, fontSize: '0.75rem' }} />
                            ))}
                            {(!row.functions || row.functions.length === 0) && (!row.requirements || row.requirements.length === 0) && '—'}
                          </Stack>
                        </TableCell>

                        {/* Failure Effects (FE) */}
                        <TableCell>
                          <Stack spacing={0.5}>
                            {row.effects?.map((e, i) => (
                              <Chip key={i} label={e.name} size="small" color="error" sx={{ height: 20, fontSize: '0.75rem' }} />
                            ))}
                            {(!row.effects || row.effects.length === 0) && '—'}
                          </Stack>
                        </TableCell>

                        {/* Severity (S) with Tooltip guide */}
                        <TableCell align="center">
                          <RatingDropdown
                            ratingType="severity"
                            value={row.severity}
                            onChange={(val) => handleRatingChange(row.id, 'severity', val || 0)}
                            hideLabel
                            size="small"
                          />
                        </TableCell>

                        {/* Failure Modes (FM) */}
                        <TableCell>
                          <Stack spacing={0.5}>
                            {row.failureModes?.map((fm, i) => (
                              <Chip key={i} label={fm.name} size="small" color="error" variant="outlined" sx={{ height: 20, fontSize: '0.75rem' }} />
                            ))}
                            {(!row.failureModes || row.failureModes.length === 0) && '—'}
                          </Stack>
                        </TableCell>

                        {/* Failure Causes (FC) */}
                        <TableCell>
                          <Stack spacing={0.5}>
                            {row.causes?.map((c, i) => (
                              <Chip key={i} label={c.name} size="small" color="warning" variant="outlined" sx={{ height: 20, fontSize: '0.75rem' }} />
                            ))}
                            {(!row.causes || row.causes.length === 0) && '—'}
                          </Stack>
                        </TableCell>

                        {/* Prevention Controls */}
                        <TableCell>
                          <Stack spacing={0.5}>
                            {row.controls
                              ?.filter((c) => c.type === 'prevention')
                              .map((c, i) => (
                                <Chip key={i} label={c.name} size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: '0.75rem' }} />
                              ))}
                            {row.controls?.filter((c) => c.type === 'prevention').length === 0 && '—'}
                          </Stack>
                        </TableCell>

                        {/* Occurrence (O) with Tooltip guide */}
                        <TableCell align="center">
                          <RatingDropdown
                            ratingType="occurrence"
                            value={row.occurrence}
                            onChange={(val) => handleRatingChange(row.id, 'occurrence', val || 0)}
                            hideLabel
                            size="small"
                          />
                        </TableCell>

                        {/* Detection Controls */}
                        <TableCell>
                          <Stack spacing={0.5}>
                            {row.controls
                              ?.filter((c) => c.type === 'detection')
                              .map((c, i) => (
                                <Tooltip title={c.detectionMethod || ''} key={i}>
                                  <Chip label={c.name} size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.75rem' }} />
                                </Tooltip>
                              ))}
                            {row.controls?.filter((c) => c.type === 'detection').length === 0 && '—'}
                          </Stack>
                        </TableCell>

                        {/* Detection (D) with Tooltip guide */}
                        <TableCell align="center">
                          <RatingDropdown
                            ratingType="detection"
                            value={row.detection}
                            onChange={(val) => handleRatingChange(row.id, 'detection', val || 0)}
                            hideLabel
                            size="small"
                          />
                        </TableCell>

                        {/* AP Badge */}
                        <TableCell align="center">{getApBadge(row.ap)}</TableCell>

                        {/* Actions */}
                        <TableCell align="center">
                          <Tooltip title="Create Corrective Action">
                            <IconButton
                              size="small"
                              color="secondary"
                              onClick={() => {
                                setSelectedRowForAction(row);
                                setActionDialogOpen(true);
                              }}
                            >
                              <PlaylistAddIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              setActiveRow(row);
                              setEditorOpen(true);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeleteRow(row.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>

                      {/* Expandable Step 6 Optimization Sub-Panel */}
                      <TableRow>
                        <TableCell colSpan={15} sx={{ p: 0, bgcolor: '#fafafa' }}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ p: 3, borderLeft: '3px solid #01696F', m: 1.5, bgcolor: '#ffffff', borderRadius: 2, border: '1px solid rgba(40,37,29,0.06)' }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
                                Step 6 Optimization (Action Plan)
                              </Typography>
                              <Grid container spacing={3} sx={{ fontSize: '0.85rem' }}>
                                <Grid size={{ xs: 12, md: 4 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', color: 'text.secondary' }}>Prevention Action</Typography>
                                  <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 500 }}>Implement tool wear sensor feedback loop</Typography>
                                </Grid>
                                <Grid size={{ xs: 12, md: 4 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', color: 'text.secondary' }}>Detection Action</Typography>
                                  <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 500 }}>Perform 100% laser caliper test</Typography>
                                </Grid>
                                <Grid size={{ xs: 12, md: 4 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', color: 'text.secondary' }}>Responsible Person & Target Date</Typography>
                                  <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 500 }}>John Doe • Oct 15, 2026</Typography>
                                </Grid>
                              </Grid>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        /* Func/Fail Chains View */
        <Paper sx={{ p: 4, border: '1px solid rgba(40, 37, 29, 0.1)', borderRadius: 3, bgcolor: 'background.paper', boxShadow: 'none' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
            Function & Failure Traceability Chain
          </Typography>
          <Stack spacing={3}>
            {rows.length === 0 ? (
              <Typography color="text.secondary">No FMEA rows added to visualize linkages.</Typography>
            ) : (
              rows.map((row) => (
                <Box key={row.id} sx={{ p: 2.5, border: '1px solid rgba(40, 37, 29, 0.08)', borderRadius: 3, bgcolor: '#fafafa' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
                    Row #{row.rowNumber} Linkages ({row.processStep?.stepNumber})
                  </Typography>
                  <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Function */}
                    <Box sx={{ p: 1.5, bgcolor: '#eefcf4', border: '1px solid #437A22', borderRadius: 2, minWidth: 150 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#437A22', display: 'block' }}>FUNCTION</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.functions?.[0]?.name || '—'}</Typography>
                    </Box>
                    <Typography color="text.secondary">➔</Typography>

                    {/* Failure Effect */}
                    <Box sx={{ p: 1.5, bgcolor: '#fdf2f2', border: '1px solid #A13544', borderRadius: 2, minWidth: 150 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#A13544', display: 'block' }}>FAILURE EFFECT</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.effects?.[0]?.name || '—'}</Typography>
                    </Box>
                    <Typography color="text.secondary">➔</Typography>

                    {/* Failure Mode */}
                    <Box sx={{ p: 1.5, bgcolor: '#fffbeb', border: '1px solid #D19900', borderRadius: 2, minWidth: 150 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#D19900', display: 'block' }}>FAILURE MODE</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.failureModes?.[0]?.name || '—'}</Typography>
                    </Box>
                    <Typography color="text.secondary">➔</Typography>

                    {/* Failure Cause */}
                    <Box sx={{ p: 1.5, bgcolor: '#f0f9ff', border: '1px solid #006494', borderRadius: 2, minWidth: 150 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#006494', display: 'block' }}>FAILURE CAUSE</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.causes?.[0]?.name || '—'}</Typography>
                    </Box>
                  </Stack>
                </Box>
              ))
            )}
          </Stack>
        </Paper>
      )}

      {/* Row Editor Drawer */}
      <PfmeaRowEditor
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setActiveRow(null);
        }}
        row={activeRow}
        steps={steps}
        onSave={handleSaveRowDetails}
        projectId={projectId}
        token={token ?? undefined}
        onCreateAction={(row) => {
          setSelectedRowForAction(row);
          setActionDialogOpen(true);
        }}
        failureModeId={activeRow ? getFailureModeDbId(activeRow) : null}
      />

      {/* Add Row Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Add PFMEA Analysis Row</DialogTitle>
        <DialogContent sx={{ minWidth: 400, pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Process Step</InputLabel>
              <Select
                value={selectedStepId}
                label="Process Step"
                onChange={(e) => setSelectedStepId(e.target.value)}
              >
                {steps.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.stepNumber} - {s.name} ({s.stepType})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleAddRow} variant="contained" disabled={!selectedStepId}>
            Add Row
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Corrective Action Dialog */}
      <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Create Corrective Action</DialogTitle>
        <DialogContent sx={{ minWidth: 400, pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Step 6 Optimization: Define preventive or corrective tasks to reduce S/O/D ratings.
            </Typography>

            <TextField
              label="Action Description / Task"
              multiline
              rows={3}
              value={actionDescription}
              onChange={(e: any) => setActionDescription(e.target.value)}
              placeholder="Define action to reduce occurrence or improve detection..."
              fullWidth
              size="small"
              required
            />

            <FormControl fullWidth size="small">
              <InputLabel>Assigned Owner</InputLabel>
              <Select
                value={actionOwnerId}
                label="Assigned Owner"
                onChange={(e: any) => setActionOwnerId(e.target.value as string)}
                required
              >
                {users.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Priority</InputLabel>
              <Select
                value={actionPriority}
                label="Priority"
                onChange={(e: any) => setActionPriority(e.target.value as string)}
              >
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>

            <TextField
              {...({
                label: "Due Date",
                type: "date",
                value: actionDueDate,
                onChange: (e: any) => setActionDueDate(e.target.value),
                InputLabelProps: { shrink: true },
                fullWidth: true,
                size: "small",
                required: true
              } as any)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleCreateAction}
            variant="contained"
            disabled={!actionDescription || !actionOwnerId || !actionDueDate}
          >
            Create Action
          </Button>
        </DialogActions>
      </Dialog>

      {/* PFD Step Import Prompt Dialog */}
      <Dialog open={importPromptOpen} onClose={() => setImportPromptOpen(false)}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Import Process Flow Steps?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            We found {pfdSteps.length} process steps in your Process Flow Diagram (PFD). 
            Importing them will automatically create the initial Process Steps structure in your PFMEA.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={() => setImportPromptOpen(false)} variant="outlined">
            Skip
          </Button>
          <Button 
            onClick={handleImportPfdSteps} 
            variant="contained" 
            color="primary"
            disabled={importing}
          >
            {importing ? 'Importing...' : 'Import Steps'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Generic Add Tree Element Dialog */}
      <Dialog open={treeAddType !== null} onClose={() => setTreeAddType(null)}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Add {treeAddType === 'workElement' ? 'Work Element' : treeAddType === 'function' ? 'Function' : 'Failure'}
        </DialogTitle>
        <DialogContent sx={{ minWidth: 400, pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Description / Name"
              value={treeAddValue}
              onChange={(e) => setTreeAddValue(e.target.value)}
              fullWidth
              size="small"
              required
              autoFocus
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={() => setTreeAddType(null)} variant="outlined">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmAddTreeElement} 
            variant="contained" 
            color="primary"
            disabled={!treeAddValue.trim()}
          >
            Add Element
          </Button>
        </DialogActions>
      </Dialog>

      <ReportExporter
        open={exporterOpen}
        onClose={() => setExporterOpen(false)}
        docType="PFMEA"
        projectName={projectName}
        data={rows}
        steps={steps}
      />

      {/* Failure Linkage Modal (3-pane: Effects | Mode | Causes) */}
      {token && (
        <FailureLinkageModal
          open={linkageModalOpen}
          onClose={() => { setLinkageModalOpen(false); setLinkageModalFailureModeId(null); }}
          failureModeId={linkageModalFailureModeId}
          token={token}
          onSuccess={() => fetchData()}
        />
      )}

      {/* Failure Detail Window (Effects/Causes tabs + inline actions) */}
      {token && (
        <FailureDetailWindow
          open={detailWindowOpen}
          onClose={() => { setDetailWindowOpen(false); setDetailWindowFailureModeId(null); }}
          failureModeId={detailWindowFailureModeId}
          token={token}
          onRefresh={() => fetchData()}
        />
      )}

      {/* Add Structure Function Dialog (Windows 1/3/6) */}
      {token && projectId && (
        <AddFunctionDialog
          open={structFuncDialogOpen}
          onClose={() => { setStructFuncDialogOpen(false); setStructFuncParentType(null); setStructFuncParentId(null); }}
          parentType={structFuncParentType}
          parentId={structFuncParentId}
          projectId={projectId}
          token={token}
          onSuccess={() => fetchData()}
        />
      )}

      {/* Add Structure Failure Dialog (Windows 2/4/7) */}
      {token && (
        <AddFailureDialog
          open={structFailDialogOpen}
          onClose={() => { setStructFailDialogOpen(false); setStructFailRole(null); setStructFailFunctionId(null); setStructFailFunctionNarration(''); }}
          role={structFailRole}
          functionId={structFailFunctionId}
          functionNarration={structFailFunctionNarration}
          token={token}
          onSuccess={() => fetchData()}
        />
      )}
    </Box>
  );
};
