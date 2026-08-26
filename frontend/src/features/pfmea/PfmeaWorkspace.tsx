import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, IconButton, Alert, Select, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControl, InputLabel, Stack, Tooltip, TextField, Tabs, Tab,
  Grid, TablePagination
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  PlaylistAdd as PlaylistAddIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAuth } from '../auth/AuthContext';
import { WorkspaceSkeleton } from '../../components/Layout/WorkspaceSkeleton';
import { PfmeaStructureTree } from './components/PfmeaStructureTree';
import { AddFunctionDialog } from './components/AddFunctionDialog';
import { AddFailureDialog } from './components/AddFailureDialog';
import { MultiAddWorkElementDialog } from './components/MultiAddWorkElementDialog';
import { dialogSelectProps } from '../../theme/muiSelectConfig';
import { FailureLinkageModal } from './components/FailureLinkageModal';
import { FailureDetailWindow } from './components/FailureDetailWindow';


import { useResponsive } from '../../hooks/useResponsive';
import { ReportExporter } from '../reports/ReportExporter';
import { API_BASE_URL } from '../../config';
import { DocumentHeader } from '../../components/DocumentHeader';
import { useToast, getToastSeverity } from '../../components/Toast/ToastProvider';
import { parseApiError } from '../../lib/api';
import { unwrapPaginated } from '../../lib/pagination';
import { ConfirmDialog } from '../../components/ConfirmDialog';

interface ProcessStep {
  id: string;
  stepNumber: string;
  name: string;
  stepType: string;
  machinesEquipmentDocs?: any;
  isOrphaned?: boolean;
  linkedPfdStepId?: string | null;
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
  filterCode?: string | null;
  preventionAction?: string | null;
  detectionAction?: string | null;
  responsibility?: string | null;
  targetDate?: string | null;
  actionTaken?: string | null;
  completionDate?: string | null;
  revisedSeverity?: number | null;
  revisedOccurrence?: number | null;
  revisedDetection?: number | null;
  revisedAp?: string | null;
  processStep?: { name: string; stepNumber: string; isOrphaned?: boolean } | null;
  functions: { name: string }[];
  requirements: { name: string }[];
  failureModes: { name: string }[];
  effects: { name: string }[];
  causes: { name: string }[];
  controls: { name: string; type: string; detectionMethod?: string }[];
  characteristics: { name: string; classification: string; unitOfMeasure?: string }[];
}



export const PfmeaWorkspace: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { token } = useAuth();
  const { showToast } = useToast();
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
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);


  // Dialog and Drawer states
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Add row form state
  const [selectedStepId, setSelectedStepId] = useState('');

  // PFD steps and import dialog states
  const [pfdSteps, setPfdSteps] = useState<any[]>([]);
  const [importPromptOpen, setImportPromptOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  // Tree Element Add Dialog states
  const [treeAddTargetStepId, setTreeAddTargetStepId] = useState<string | null>(null);
  const [multiAddWeDialogOpen, setMultiAddWeDialogOpen] = useState(false);

  // Exporter Dialog state
  const [exporterOpen, setExporterOpen] = useState(false);

  // Manage Action modal state (full action window)
  const [manageActionOpen, setManageActionOpen] = useState(false);
  const [manageActionRowId, setManageActionRowId] = useState<string | null>(null);
  const [manageActionForm, setManageActionForm] = useState({
    preventionAction: '',
    detectionAction: '',
    actionTaken: '',
    targetDate: '',
    completionDate: '',
    responsibility: '',
    status: 'Open',
    revisedSeverity: '',
    revisedOccurrence: '',
    revisedDetection: '',
    notes: '',
  });

  // Linkage dialogs state
  const [linkageModalOpen, setLinkageModalOpen] = useState(false);
  const [linkageModalFailureModeId, setLinkageModalFailureModeId] = useState<string | null>(null);
  const [detailWindowOpen, setDetailWindowOpen] = useState(false);
  const [detailWindowFailureModeId, setDetailWindowFailureModeId] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{ open: boolean; title: string; message: string; detail?: string; onConfirm: () => void } | null>(null);

  // Structure-level function/failure dialog state
  const [structFuncDialogOpen, setStructFuncDialogOpen] = useState(false);
  const [structFuncParentType, setStructFuncParentType] = useState<'project' | 'process_step' | 'work_element' | null>(null);
  const [structFuncParentId, setStructFuncParentId] = useState<string | null>(null);
  
  // Reusable Edit States for Functions
  const [structFuncEditMode, setStructFuncEditMode] = useState(false);
  const [structFuncEditNodeId, setStructFuncEditNodeId] = useState<string | null>(null);
  const [structFuncInitialNarration, setStructFuncInitialNarration] = useState('');
  const [structFuncInitialLocation, setStructFuncInitialLocation] = useState<'your_plant' | 'ship_to' | 'end_user'>('your_plant');

  const [structFailDialogOpen, setStructFailDialogOpen] = useState(false);
  const [structFailRole, setStructFailRole] = useState<'effect' | 'mode' | 'cause' | null>(null);
  const [structFailFunctionId, setStructFailFunctionId] = useState<string | null>(null);
  const [structFailFunctionNarration, setStructFailFunctionNarration] = useState('');
  const [structureFunctions, setStructureFunctions] = useState<any[]>([]);

  // Reusable Edit States for Failures
  const [structFailEditMode, setStructFailEditMode] = useState(false);
  const [structFailEditNodeId, setStructFailEditNodeId] = useState<string | null>(null);
  const [structFailInitialNarration, setStructFailInitialNarration] = useState('');
  const [structFailInitialSeverityRating, setStructFailInitialSeverityRating] = useState<number | null>(null);
  const [structFailInitialOccurrenceRating, setStructFailInitialOccurrenceRating] = useState<number | null>(null);
  const [structFailInitialDetectionRating, setStructFailInitialDetectionRating] = useState<number | null>(null);
  const [structFailInitialControlPrevention, setStructFailInitialControlPrevention] = useState('');
  const [structFailInitialControlDetection, setStructFailInitialControlDetection] = useState('');
  const [structFailInitialFilterCode, setStructFailInitialFilterCode] = useState('');



  const [syncingTree, setSyncingTree] = useState(false);
  const handleSyncTreeWithTable = async () => {
    if (!pfmeaRevisionId) return;
    setSyncingTree(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/revisions/${pfmeaRevisionId}/sync-from-tree`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const msg = await parseApiError(response, 'Failed to synchronize FMEA report view with structure tree.');
        throw new Error(msg);
      }
      await fetchData();
    } catch (err: any) {
      const msg = err.message || 'Could not synchronize tree.';
      setError(msg);
      showToast(msg, getToastSeverity(msg));
    } finally {
      setSyncingTree(false);
    }
  };

  const openManageAction = (row: PfmeaRow) => {
    setManageActionRowId(row.id);
    setManageActionForm({
      preventionAction: row.preventionAction || '',
      detectionAction: row.detectionAction || '',
      actionTaken: row.actionTaken || '',
      targetDate: row.targetDate ? row.targetDate.split('T')[0] : '',
      completionDate: row.completionDate ? row.completionDate.split('T')[0] : '',
      responsibility: row.responsibility || '',
      status: row.status === 'approved' ? 'Closed' : row.status === 'reviewed' ? 'In Progress' : 'Open',
      revisedSeverity: row.revisedSeverity ? String(row.revisedSeverity) : '',
      revisedOccurrence: row.revisedOccurrence ? String(row.revisedOccurrence) : '',
      revisedDetection: row.revisedDetection ? String(row.revisedDetection) : '',
      notes: row.notes || '',
    });
    setManageActionOpen(true);
  };

  const handleSaveManageAction = async () => {
    if (!manageActionRowId) return;
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/pfmea-rows/${manageActionRowId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          preventionAction: manageActionForm.preventionAction || null,
          detectionAction: manageActionForm.detectionAction || null,
          actionTaken: manageActionForm.actionTaken || null,
          targetDate: manageActionForm.targetDate || null,
          completionDate: manageActionForm.completionDate || null,
          responsibility: manageActionForm.responsibility || null,
          revisedSeverity: manageActionForm.revisedSeverity ? Number(manageActionForm.revisedSeverity) : null,
          revisedOccurrence: manageActionForm.revisedOccurrence ? Number(manageActionForm.revisedOccurrence) : null,
          revisedDetection: manageActionForm.revisedDetection ? Number(manageActionForm.revisedDetection) : null,
          notes: manageActionForm.notes || null,
        }),
      });

      if (!response.ok) {
        const msg = await parseApiError(response, 'Failed to save action data.');
        throw new Error(msg);
      }

      setManageActionOpen(false);
      setManageActionRowId(null);
      await fetchData();
    } catch (err: any) {
      const msg = err.message || 'Could not save action data.';
      setError(msg);
      showToast(msg, getToastSeverity(msg));
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
        if (!response.ok) {
          const msg = await parseApiError(response, 'Failed to resolve project document schemas.');
          throw new Error(msg);
        }
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
        const msg = err.message || 'An error occurred while loading project context.';
        setError(msg);
        showToast(msg, getToastSeverity(msg));
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
      if (!stepsResponse.ok) {
        const msg = await parseApiError(stepsResponse, 'Failed to load Process Steps');
        throw new Error(msg);
      }
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

      const rowsResponse = await fetch(`${API_BASE_URL}/revisions/${pfmeaRevisionId}/pfmea-rows?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!rowsResponse.ok) {
        const msg = await parseApiError(rowsResponse, 'Failed to load PFMEA analysis rows');
        throw new Error(msg);
      }
      const payload = await rowsResponse.json();
      const { data, total: t } = unwrapPaginated<PfmeaRow>(payload);
      setRows(data);
      setTotal(t);

      // Fetch structure functions
      const structRes = await fetch(`${API_BASE_URL}/structure-functions/project/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (structRes.ok) {
        const structData = await structRes.json();
        setStructureFunctions(structData);
      }
    } catch (err: any) {
      const msg = err.message || 'Could not load FMEA workspace data.';
      setError(msg);
      showToast(msg, getToastSeverity(msg));
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
      if (!res.ok) {
        const msg = await parseApiError(res, 'Failed to import process steps from PFD.');
        throw new Error(msg);
      }
      
      await fetchData();
      setImportPromptOpen(false);
    } catch (err: any) {
      const msg = err.message || 'Could not import steps.';
      setError(msg);
      showToast(msg, getToastSeverity(msg));
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => {
    if (pfmeaRevisionId && pfdRevisionId) {
      fetchData();
    }
  }, [pfmeaRevisionId, pfdRevisionId, page, limit]);

  useEffect(() => { setPage(1); }, [pfmeaRevisionId, pfdRevisionId]);

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
        const msg = await parseApiError(response, 'Failed to create FMEA row.');
        throw new Error(msg);
      }

      await fetchData();
      setSelectedStepId('');
    } catch (err: any) {
      const msg = err.message || 'Error occurred while appending FMEA row.';
      setError(msg);
      showToast(msg, getToastSeverity(msg));
    }
  };

  const handleAddWorkElementFromTree = (stepId: string) => {
    setTreeAddTargetStepId(stepId);
    setMultiAddWeDialogOpen(true);
  };

  const handleConfirmAddWorkElementSingle = async (name: string) => {
    if (!treeAddTargetStepId) return;
    const step = steps.find(s => s.id === treeAddTargetStepId);
    if (!step) return;

    let currentWe: string[] = [];
    if (step.machinesEquipmentDocs) {
      if (Array.isArray(step.machinesEquipmentDocs)) {
        currentWe = [...step.machinesEquipmentDocs];
      } else if (typeof step.machinesEquipmentDocs === 'string') {
        try { currentWe = JSON.parse(step.machinesEquipmentDocs); } catch { currentWe = [step.machinesEquipmentDocs]; }
      }
    }

    if (!currentWe.includes(name)) {
      currentWe.push(name);
      // Update shadow step
      await fetch(`${API_BASE_URL}/pfd-steps/${treeAddTargetStepId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ machinesEquipmentDocs: currentWe }),
      });
      // Also update master PFD step if linked
      if (step.linkedPfdStepId) {
        let masterWe: string[] = [];
        const masterStep = pfdSteps.find(s => s.id === step.linkedPfdStepId);
        if (masterStep?.machinesEquipmentDocs) {
          if (Array.isArray(masterStep.machinesEquipmentDocs)) {
            masterWe = [...masterStep.machinesEquipmentDocs];
          } else if (typeof masterStep.machinesEquipmentDocs === 'string') {
            try { masterWe = JSON.parse(masterStep.machinesEquipmentDocs); } catch { masterWe = [masterStep.machinesEquipmentDocs]; }
          }
        }
        if (!masterWe.includes(name)) {
          masterWe.push(name);
          await fetch(`${API_BASE_URL}/pfd-steps/${step.linkedPfdStepId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ machinesEquipmentDocs: masterWe }),
          });
        }
      }
      await fetchData();
    }
  };

  const handleConfirmAddWorkElementsMultiple = async (names: string[]) => {
    if (!treeAddTargetStepId) return;
    const step = steps.find(s => s.id === treeAddTargetStepId);
    if (!step) return;

    let currentWe: string[] = [];
    if (step.machinesEquipmentDocs) {
      if (Array.isArray(step.machinesEquipmentDocs)) {
        currentWe = [...step.machinesEquipmentDocs];
      } else if (typeof step.machinesEquipmentDocs === 'string') {
        try { currentWe = JSON.parse(step.machinesEquipmentDocs); } catch { currentWe = [step.machinesEquipmentDocs]; }
      }
    }

    let updated = false;
    for (const name of names) {
      if (!currentWe.includes(name)) {
        currentWe.push(name);
        updated = true;
      }
    }

    if (updated) {
      // Update shadow step
      await fetch(`${API_BASE_URL}/pfd-steps/${treeAddTargetStepId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ machinesEquipmentDocs: currentWe }),
      });
      // Also update master PFD step if linked
      if (step.linkedPfdStepId) {
        let masterWe: string[] = [];
        const masterStep = pfdSteps.find(s => s.id === step.linkedPfdStepId);
        if (masterStep?.machinesEquipmentDocs) {
          if (Array.isArray(masterStep.machinesEquipmentDocs)) {
            masterWe = [...masterStep.machinesEquipmentDocs];
          } else if (typeof masterStep.machinesEquipmentDocs === 'string') {
            try { masterWe = JSON.parse(masterStep.machinesEquipmentDocs); } catch { masterWe = [masterStep.machinesEquipmentDocs]; }
          }
        }
        for (const name of names) {
          if (!masterWe.includes(name)) {
            masterWe.push(name);
          }
        }
        await fetch(`${API_BASE_URL}/pfd-steps/${step.linkedPfdStepId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ machinesEquipmentDocs: masterWe }),
        });
      }
      await fetchData();
    }
  };

  const handleSubmitWorkElementToRepository = async (stepId: string, workElementName: string) => {
    try {
      const targetParentId = `${stepId}::${workElementName}`;
      const weFunctions = structureFunctions.filter(sf => sf.parentType === 'work_element' && sf.parentId === targetParentId);

      const packageData = {
        functions: weFunctions.map(sf => ({
          name: sf.narration,
          description: sf.description || null,
          failures: (sf.failures || []).map((f: any) => ({
            name: f.narration,
            severity: f.severityRating,
            occurrence: f.occurrenceRating,
            detection: f.detectionRating,
            preventionControl: f.currentControlPrevention,
            detectionControl: f.currentControlDetection,
            filterCode: f.filterCode,
          })),
        })),
      };

      const res = await fetch(`${API_BASE_URL}/repository/packages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: workElementName,
          description: `Work element package from project`,
          packageData,
          sourceProjectId: projectId,
        }),
      });

      if (!res.ok) {
        const msg = await parseApiError(res, 'Failed to submit package to repository');
        throw new Error(msg);
      }
    } catch (err: any) {
      const msg = err.message || 'Error submitting to repository';
      showToast(msg, getToastSeverity(msg));
    }
  };

  const handleAddFunctionFromTree = (stepId: string | null, workElementName?: string | null) => {
    setStructFuncEditMode(false);
    setStructFuncEditNodeId(null);
    setStructFuncInitialNarration('');
    setStructFuncInitialLocation('your_plant');

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

  const handleAddFailureFromTree = async (
    stepId: string | null,
    parentContext?: { workElementName?: string | null; functionName: string }
  ) => {
    if (!parentContext) return;
    const { workElementName, functionName } = parentContext;

    let fnNode = null;
    let parentType: 'project' | 'process_step' | 'work_element' = 'project';
    let parentId: string = projectId!;

    if (!stepId && !workElementName) {
      parentType = 'project';
      parentId = projectId!;
      fnNode = structureFunctions.find(
        (f) => f.parentType === 'project' && f.narration === functionName
      );
    } else if (stepId && !workElementName) {
      parentType = 'process_step';
      parentId = stepId;
      fnNode = structureFunctions.find(
        (f) => f.parentType === 'process_step' && f.parentId === stepId && f.narration === functionName
      );
    } else if (stepId && workElementName) {
      parentType = 'work_element';
      parentId = `${stepId}::${workElementName}`;
      fnNode = structureFunctions.find(
        (f) => f.parentType === 'work_element' && f.parentId === `${stepId}::${workElementName}` && f.narration === functionName
      );
    }

    if (!fnNode) {
      try {
        const response = await fetch(`${API_BASE_URL}/structure-functions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            projectId,
            parentType,
            parentId,
            narration: functionName,
            location: 'your_plant',
          }),
        });
        if (!response.ok) {
          const msg = await parseApiError(response, 'API Error');
          throw new Error(msg);
        }
        const createdFunc = await response.json();
        fnNode = createdFunc;

        const structFuncsResponse = await fetch(`${API_BASE_URL}/structure-functions/project/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (structFuncsResponse.ok) {
          const freshFuncs = await structFuncsResponse.json();
          setStructureFunctions(freshFuncs);
        }
      } catch (err: any) {
        const msg = `Cannot add structure failure: Parent structure function not found in DB and auto-creation failed. Details: ${err.message}`;
        setError(msg);
        showToast(msg, getToastSeverity(msg));
        return;
      }
    }

    if (!fnNode) return;

    const roleMap: Record<string, 'effect' | 'mode' | 'cause'> = {
      project: 'effect',
      process_step: 'mode',
      work_element: 'cause',
    };
    const role = roleMap[fnNode.parentType];

    setStructFailEditMode(false);
    setStructFailEditNodeId(null);
    setStructFailInitialNarration('');
    setStructFailInitialSeverityRating(null);
    setStructFailInitialOccurrenceRating(null);
    setStructFailInitialDetectionRating(null);
    setStructFailInitialControlPrevention('');
    setStructFailInitialControlDetection('');
    setStructFailInitialFilterCode('');

    setStructFailRole(role);
    setStructFailFunctionId(fnNode.id);
    setStructFailFunctionNarration(fnNode.narration);
    setStructFailDialogOpen(true);
  };

  const handleEditNodeFromTree = (nodeId: string) => {
    if (!nodeId) return;

    const findStructFunc = (parentType: string, parentId: string | null, name: string) => {
      return structureFunctions.find(
        (sf) => sf.parentType === parentType && 
        (!parentId || sf.parentId === parentId) && 
        sf.narration === name
      );
    };

    // 1. Process Step
    if (nodeId.startsWith('step::')) {
      // Step editing is handled directly in FMEA row table inline edits
      return;
    }

    // 2. Project Function
    if (nodeId.startsWith('root-func::')) {
      const fnName = nodeId.replace('root-func::', '');
      const sf = findStructFunc('project', projectId || null, fnName);
      if (sf) {
        setStructFuncEditMode(true);
        setStructFuncEditNodeId(sf.id);
        setStructFuncInitialNarration(sf.narration);
        setStructFuncInitialLocation(sf.location || 'your_plant');
        setStructFuncParentType('project');
        setStructFuncParentId(projectId!);
        setStructFuncDialogOpen(true);
      }
      return;
    }

    // 3. Step Function
    if (nodeId.startsWith('step-func::')) {
      const withoutPrefix = nodeId.replace('step-func::', '');
      const sepIdx = withoutPrefix.indexOf('::');
      const stepId = sepIdx >= 0 ? withoutPrefix.slice(0, sepIdx) : withoutPrefix;
      const fnName = sepIdx >= 0 ? withoutPrefix.slice(sepIdx + 2) : '';
      const sf = findStructFunc('process_step', stepId, fnName);
      if (sf) {
        setStructFuncEditMode(true);
        setStructFuncEditNodeId(sf.id);
        setStructFuncInitialNarration(sf.narration);
        setStructFuncInitialLocation(sf.location || 'your_plant');
        setStructFuncParentType('process_step');
        setStructFuncParentId(stepId);
        setStructFuncDialogOpen(true);
      }
      return;
    }

    // 4. Work Element Function
    if (nodeId.startsWith('we-func::')) {
      const withoutPrefix = nodeId.replace('we-func::', '');
      const parts = withoutPrefix.split('::');
      const stepId = parts[0];
      const weName = parts[1];
      const fnName = parts.slice(2).join('::');
      const sf = findStructFunc('work_element', `${stepId}::${weName}`, fnName);
      if (sf) {
        setStructFuncEditMode(true);
        setStructFuncEditNodeId(sf.id);
        setStructFuncInitialNarration(sf.narration);
        setStructFuncInitialLocation(sf.location || 'your_plant');
        setStructFuncParentType('work_element');
        setStructFuncParentId(`${stepId}::${weName}`);
        setStructFuncDialogOpen(true);
      }
      return;
    }

    // 5. Failure Mode (linked struct-mode)
    if (nodeId.startsWith('struct-mode::')) {
      const failId = nodeId.replace('struct-mode::', '');
      let foundFail: any = null;
      let foundFunc: any = null;
      for (const sf of structureFunctions) {
        const f = sf.failures?.find((failObj: any) => failObj.id === failId);
        if (f) {
          foundFail = f;
          foundFunc = sf;
          break;
        }
      }
      if (foundFail && foundFunc) {
        setStructFailEditMode(true);
        setStructFailEditNodeId(foundFail.id);
        setStructFailInitialNarration(foundFail.narration);
        setStructFailInitialSeverityRating(foundFail.severityRating);
        setStructFailInitialOccurrenceRating(foundFail.occurrenceRating);
        setStructFailInitialDetectionRating(foundFail.detectionRating);
        setStructFailInitialControlPrevention(foundFail.currentControlPrevention || '');
        setStructFailInitialControlDetection(foundFail.currentControlDetection || '');
        setStructFailInitialFilterCode(foundFail.filterCode || '');
        
        setStructFailRole(foundFail.role);
        setStructFailFunctionId(foundFunc.id);
        setStructFailFunctionNarration(foundFunc.narration);
        setStructFailDialogOpen(true);
      }
      return;
    }

    // 6. Failure Mode (unlinked step-fail)
    if (nodeId.startsWith('step-fail::')) {
      const withoutPrefix = nodeId.replace('step-fail::', '');
      const parts = withoutPrefix.split('::');
      const stepId = parts[0];
      const fnName = parts[1];
      const failName = parts[2];
      
      const sf = findStructFunc('process_step', stepId, fnName);
      const foundFail = sf?.failures?.find((failObj: any) => failObj.narration === failName);
      if (foundFail && sf) {
        setStructFailEditMode(true);
        setStructFailEditNodeId(foundFail.id);
        setStructFailInitialNarration(foundFail.narration);
        setStructFailInitialSeverityRating(foundFail.severityRating);
        setStructFailInitialOccurrenceRating(foundFail.occurrenceRating);
        setStructFailInitialDetectionRating(foundFail.detectionRating);
        setStructFailInitialControlPrevention(foundFail.currentControlPrevention || '');
        setStructFailInitialControlDetection(foundFail.currentControlDetection || '');
        setStructFailInitialFilterCode(foundFail.filterCode || '');
        
        setStructFailRole(foundFail.role);
        setStructFailFunctionId(sf.id);
        setStructFailFunctionNarration(sf.narration);
        setStructFailDialogOpen(true);
      }
      return;
    }

    // 7. Failure Mode (unlinked root-fail)
    if (nodeId.startsWith('root-fail-')) {
      const withoutPrefix = nodeId.replace('root-fail-', '');
      let foundFail: any = null;
      let foundFunc: any = null;
      for (const sf of structureFunctions.filter(f => f.parentType === 'project')) {
        if (withoutPrefix.startsWith(sf.narration + '-')) {
          const failName = withoutPrefix.replace(sf.narration + '-', '');
          const f = sf.failures?.find((failObj: any) => failObj.narration === failName);
          if (f) {
            foundFail = f;
            foundFunc = sf;
            break;
          }
        }
      }
      if (foundFail && foundFunc) {
        setStructFailEditMode(true);
        setStructFailEditNodeId(foundFail.id);
        setStructFailInitialNarration(foundFail.narration);
        setStructFailInitialSeverityRating(foundFail.severityRating);
        setStructFailInitialOccurrenceRating(foundFail.occurrenceRating);
        setStructFailInitialDetectionRating(foundFail.detectionRating);
        setStructFailInitialControlPrevention(foundFail.currentControlPrevention || '');
        setStructFailInitialControlDetection(foundFail.currentControlDetection || '');
        setStructFailInitialFilterCode(foundFail.filterCode || '');
        
        setStructFailRole(foundFail.role);
        setStructFailFunctionId(foundFunc.id);
        setStructFailFunctionNarration(foundFunc.narration);
        setStructFailDialogOpen(true);
      }
      return;
    }
  };



  const doDeleteRow = async (rowId: string) => {
    setConfirmState(null);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/pfmea-rows/${rowId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const msg = await parseApiError(response, 'Failed to delete FMEA row.');
        throw new Error(msg);
      }
      await fetchData();
    } catch (err: any) {
      const msg = err.message || 'Could not delete FMEA row.';
      setError(msg);
      showToast(msg, getToastSeverity(msg));
    }
  };
  const handleDeleteRow = (rowId: string) => {
    setConfirmState({
      open: true,
      title: 'Delete analysis row',
      message: 'Are you sure you want to delete this analysis row?',
      detail: 'This action is permanent.',
      onConfirm: () => doDeleteRow(rowId),
    });
  };

  const doDeleteStep = async (stepId: string) => {
    setConfirmState(null);
    const step = steps.find(s => s.id === stepId);
    if (!step) return;
    const assocRows = rows.filter(r => r.processStepId === stepId);
    setError(null);
    try {
      for (const r of assocRows) {
        const response = await fetch(`${API_BASE_URL}/pfmea-rows/${r.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const msg = await parseApiError(response, `Failed to delete FMEA row: ${r.rowNumber}`);
          throw new Error(msg);
        }
      }
      const response = await fetch(`${API_BASE_URL}/pfd-steps/${stepId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const msg = await parseApiError(response, 'Failed to delete process step.');
        throw new Error(msg);
      }
      await fetchData();
    } catch (err: any) {
      const msg = err.message || 'Could not delete process step.';
      setError(msg);
      showToast(msg, getToastSeverity(msg));
    }
  };
  const handleDeleteStep = (stepId: string) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return;
    const assocRows = rows.filter(r => r.processStepId === stepId);
    let confirmMsg = `Are you sure you want to delete the process step "${step.stepNumber} - ${step.name}"?`;
    let detail: string | undefined;
    if (step.isOrphaned) {
      detail = 'This step is orphaned (original PFD step was deleted). All associated analysis data will be removed.';
    } else if (assocRows.length > 0) {
      detail = `This will also delete ${assocRows.length} associated FMEA analysis row(s).`;
    }
    setConfirmState({ open: true, title: 'Delete process step', message: confirmMsg, detail, onConfirm: () => doDeleteStep(stepId) });
  };

  const handleDeleteNode = async (nodeId: string) => {
    if (!nodeId) return;

    // 1. Process Step
    if (nodeId.startsWith('step::')) {
      const stepId = nodeId.replace('step::', '');
      await handleDeleteStep(stepId);
      return;
    }

    // 2. Work Element (Work Step)
    if (nodeId.startsWith('we::')) {
      const withoutPrefix = nodeId.replace('we::', '');
      const sepIdx = withoutPrefix.indexOf('::');
      const stepId = sepIdx >= 0 ? withoutPrefix.slice(0, sepIdx) : withoutPrefix;
      const weName = sepIdx >= 0 ? withoutPrefix.slice(sepIdx + 2) : '';

      const step = steps.find(s => s.id === stepId);
      if (!step) return;

      const assocRows = rows.filter(r => r.processStepId === stepId && r.workElementName === weName);
      
      let confirmMsg = `Are you sure you want to delete the work element "${weName}"?`;
      if (assocRows.length > 0) {
        confirmMsg = `Deleting this work element will also delete all of its associated FMEA analysis rows (${assocRows.length} rows). Are you sure you want to proceed?`;
      }
      if (!window.confirm(confirmMsg)) return;

      setError(null);
      try {
        for (const r of assocRows) {
          await fetch(`${API_BASE_URL}/pfmea-rows/${r.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
        }

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
        const updatedWe = existingWe.filter(w => w !== weName);

        const response = await fetch(`${API_BASE_URL}/pfd-steps/${stepId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ machinesEquipmentDocs: updatedWe })
        });
        if (!response.ok) {
          const msg = await parseApiError(response, 'Failed to update Process Step.');
          throw new Error(msg);
        }

        await fetchData();
      } catch (err: any) {
        const msg = err.message || 'Could not delete work element.';
        setError(msg);
        showToast(msg, getToastSeverity(msg));
      }
      return;
    }

    const findStructFunc = (parentType: string, parentId: string | null, name: string) => {
      return structureFunctions.find(
        (sf) => sf.parentType === parentType && 
        (!parentId || sf.parentId === parentId) && 
        sf.narration === name
      );
    };

    // 3. Project Function / Step Function / Work Element Function
    let functionToDelete: any = null;
    let funcName = '';
    let parentStepId: string | null = null;
    let parentWeName: string | null = null;

    if (nodeId.startsWith('root-func::')) {
      funcName = nodeId.replace('root-func::', '');
      functionToDelete = findStructFunc('project', projectId || null, funcName);
    } else if (nodeId.startsWith('step-func::')) {
      const withoutPrefix = nodeId.replace('step-func::', '');
      const sepIdx = withoutPrefix.indexOf('::');
      parentStepId = sepIdx >= 0 ? withoutPrefix.slice(0, sepIdx) : withoutPrefix;
      funcName = sepIdx >= 0 ? withoutPrefix.slice(sepIdx + 2) : '';
      functionToDelete = findStructFunc('process_step', parentStepId, funcName);
    } else if (nodeId.startsWith('we-func::')) {
      const withoutPrefix = nodeId.replace('we-func::', '');
      const parts = withoutPrefix.split('::');
      parentStepId = parts[0];
      parentWeName = parts[1];
      funcName = parts.slice(2).join('::');
      functionToDelete = findStructFunc('work_element', `${parentStepId}::${parentWeName}`, funcName);
    }

    if (funcName) {
      if (!window.confirm(`Are you sure you want to delete the function "${funcName}"?`)) return;
      setError(null);
      try {
        if (functionToDelete) {
          const response = await fetch(`${API_BASE_URL}/structure-functions/${functionToDelete.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!response.ok) {
            const msg = await parseApiError(response, 'Failed to delete structure function.');
            throw new Error(msg);
          }
        }

        const matchingRows = rows.filter(r => 
          r.processStepId === parentStepId && 
          r.workElementName === parentWeName &&
          r.functions?.some(f => f.name === funcName)
        );

        for (const row of matchingRows) {
          const updatedFuncs = (row.functions?.map((f: any) => f.name) || []).filter(f => f !== funcName);
          if (updatedFuncs.length === 0 && (row.failureModes?.length || 0) === 0) {
            await fetch(`${API_BASE_URL}/pfmea-rows/${row.id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` }
            });
          } else {
            await fetch(`${API_BASE_URL}/pfmea-rows/${row.id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ functions: updatedFuncs })
            });
          }
        }

        await fetchData();
      } catch (err: any) {
        const msg = err.message || 'Could not delete function.';
        setError(msg);
        showToast(msg, getToastSeverity(msg));
      }
      return;
    }

    // 4. Failure Mode / Cause / Effect
    let failureToDelete: any = null;
    let failName = '';
    let parentFnName = '';
    let stepId: string | null = null;
    let weName: string | null = null;

    if (nodeId.startsWith('struct-mode::')) {
      const failId = nodeId.replace('struct-mode::', '');
      for (const sf of structureFunctions) {
        const f = sf.failures?.find((failObj: any) => failObj.id === failId);
        if (f) {
          failureToDelete = f;
          failName = f.narration;
          parentFnName = sf.narration;
          if (sf.parentType === 'process_step') stepId = sf.parentId;
          else if (sf.parentType === 'work_element') {
            const parts = sf.parentId.split('::');
            stepId = parts[0];
            weName = parts[1];
          }
          break;
        }
      }
    } else if (nodeId.startsWith('root-fail-')) {
      const withoutPrefix = nodeId.replace('root-fail-', '');
      for (const sf of structureFunctions.filter(f => f.parentType === 'project')) {
        if (withoutPrefix.startsWith(sf.narration + '-')) {
          failName = withoutPrefix.replace(sf.narration + '-', '');
          const f = sf.failures?.find((failObj: any) => failObj.narration === failName);
          if (f) failureToDelete = f;
          parentFnName = sf.narration;
          break;
        }
      }
    } else if (nodeId.startsWith('step-fail::')) {
      const parts = nodeId.replace('step-fail::', '').split('::');
      stepId = parts[0];
      parentFnName = parts[1];
      failName = parts[2];
      const sf = findStructFunc('process_step', stepId, parentFnName);
      if (sf) {
        failureToDelete = sf.failures?.find((failObj: any) => failObj.narration === failName);
      }
    } else if (nodeId.startsWith('we-fail::')) {
      const parts = nodeId.replace('we-fail::', '').split('::');
      stepId = parts[0];
      weName = parts[1];
      parentFnName = parts[2];
      failName = parts[3];
      const sf = findStructFunc('work_element', `${stepId}::${weName}`, parentFnName);
      if (sf) {
        failureToDelete = sf.failures?.find((failObj: any) => failObj.narration === failName);
      }
    }

    if (failName) {
      if (!window.confirm(`Are you sure you want to delete the failure "${failName}"?`)) return;
      setError(null);
      try {
        if (failureToDelete) {
          const response = await fetch(`${API_BASE_URL}/structure-failures/${failureToDelete.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!response.ok) {
            const msg = await parseApiError(response, 'Failed to delete structure failure.');
            throw new Error(msg);
          }
        }

        const matchingRows = rows.filter(r => 
          r.processStepId === stepId && 
          r.workElementName === weName &&
          r.functions?.some(f => f.name === parentFnName) &&
          r.failureModes?.some(fm => fm.name === failName)
        );

        for (const row of matchingRows) {
          const updatedFms = (row.failureModes?.map((fm: any) => fm.name) || []).filter(fm => fm !== failName);
          await fetch(`${API_BASE_URL}/pfmea-rows/${row.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ failureModes: updatedFms })
          });
        }

        await fetchData();
      } catch (err: any) {
        const msg = err.message || 'Could not delete failure.';
        setError(msg);
        showToast(msg, getToastSeverity(msg));
      }
      return;
    }
  };

  // Note: handleRatingChange and handleFieldChange were removed as Report View
  // is now read-only (static text). These handlers may be re-enabled if inline
  // editing is reintroduced in a future iteration.



  const getApBadge = (ap: string | null) => {
    if (!ap) return <Chip label="—" size="small" variant="outlined" />;
    switch (ap) {
      case 'H':
      case 'High':
        return (
          <Chip
            label="HIGH AP"
            size="small"
            sx={{
              bgcolor: '#EF4444',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.75rem',
              boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)',
              px: 0.5,
            }}
          />
        );
      case 'M':
      case 'Medium':
        return (
          <Chip
            label="MEDIUM AP"
            size="small"
            sx={{
              bgcolor: '#F59E0B',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.75rem',
              boxShadow: '0 0 10px rgba(245, 158, 11, 0.3)',
              px: 0.5,
            }}
          />
        );
      case 'L':
      case 'Low':
        return (
          <Chip
            label="LOW AP"
            size="small"
            sx={{
              bgcolor: '#10B981',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.75rem',
              boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)',
              px: 0.5,
            }}
          />
        );
      default:
        return <Chip label={ap} size="small" sx={{ fontWeight: 700 }} />;
    }
  };



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
    return <WorkspaceSkeleton />;
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
          <Tab value="tree" label="Tree View" sx={{ fontWeight: 'bold' }} />
          <Tab value="table" label="Report View" sx={{ fontWeight: 'bold' }} />
        </Tabs>
        
        <Stack direction="row" spacing={1.5} sx={{ mt: isMobile ? 1.5 : 0 }}>
          <Button variant="outlined" color="primary" onClick={() => setExporterOpen(true)}>
            Export FMEA
          </Button>
          {activeTab === 'table' && (
            <>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleSyncTreeWithTable}
                disabled={syncingTree}
              >
                {syncingTree ? 'Syncing...' : 'Sync Tree'}
              </Button>
            </>
          )}
        </Stack>
      </Box>



      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* RENDER ACTIVE TAB VIEW */}
      {activeTab === 'tree' ? (() => {
        const allFailures = structureFunctions.flatMap(sf => sf.failures || []);
        const totalFailureModes = allFailures.filter((f: any) => f.role === 'mode').length;
        const linkedFailureModes = allFailures.filter((f: any) => f.role === 'mode' && f.isLinked).length;
        const unlinkedFailureModes = totalFailureModes - linkedFailureModes;
        return (
          <PfmeaStructureTree
            projectName={projectName}
            steps={steps}
            rows={rows}
            onAddStep={() => setAddDialogOpen(true)}
            onEditStep={() => {}}
            onDeleteNode={handleDeleteNode}
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
            onEditNode={handleEditNodeFromTree}
            structureFunctions={structureFunctions}
            linkageStats={{
              total: totalFailureModes,
              linked: linkedFailureModes,
              unlinked: unlinkedFailureModes
            }}
            onSyncPfd={handleImportPfdSteps}
            onSubmitToRepository={handleSubmitWorkElementToRepository}
          />
        );
      })() : activeTab === 'table' ? (
        <>
        <TableContainer component={Paper} sx={{ border: '1px solid rgba(40, 37, 29, 0.1)', borderRadius: 3, bgcolor: 'background.paper', overflowX: 'auto', boxShadow: 'none' }}>
          <Table aria-label="PFMEA rows grid" size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 45, fontWeight: 700, position: 'sticky', left: 0, bgcolor: '#f8fafc', zIndex: 3, borderRight: '1px solid #cbd5e1', borderBottom: '2px solid #cbd5e1', fontSize: '0.85rem', color: '#334155' }}>#</TableCell>
                <TableCell sx={{ minWidth: 180, fontWeight: 700, position: 'sticky', left: 45, bgcolor: '#f8fafc', zIndex: 3, borderRight: '2px solid #cbd5e1', borderBottom: '2px solid #cbd5e1', fontSize: '0.85rem', color: '#334155' }}>Structure / Item</TableCell>
                <TableCell sx={{ minWidth: 240, fontWeight: 700, bgcolor: '#f8fafc', borderRight: '1px solid #cbd5e1', borderBottom: '2px solid #cbd5e1', fontSize: '0.85rem', color: '#334155' }}>Work Element (4M)</TableCell>
                <TableCell sx={{ minWidth: 200, fontWeight: 700, bgcolor: '#f8fafc', borderRight: '1px solid #cbd5e1', borderBottom: '2px solid #cbd5e1', fontSize: '0.85rem', color: '#334155' }}>Function / Focus Element</TableCell>
                <TableCell sx={{ minWidth: 180, fontWeight: 700, bgcolor: '#f8fafc', borderRight: '1px solid #cbd5e1', borderBottom: '2px solid #cbd5e1', fontSize: '0.85rem', color: '#334155' }}>Failure Mode</TableCell>
                <TableCell sx={{ minWidth: 200, fontWeight: 700, bgcolor: '#f8fafc', borderRight: '1px solid #cbd5e1', borderBottom: '2px solid #cbd5e1', fontSize: '0.85rem', color: '#334155' }}>Potential Effects</TableCell>
                <TableCell sx={{ minWidth: 60, fontWeight: 700, textAlign: 'center', bgcolor: '#f8fafc', borderRight: '1px solid #cbd5e1', borderBottom: '2px solid #cbd5e1', fontSize: '0.85rem', color: '#334155' }}>SEV</TableCell>
                <TableCell sx={{ minWidth: 180, fontWeight: 700, bgcolor: '#f8fafc', borderRight: '1px solid #cbd5e1', borderBottom: '2px solid #cbd5e1', fontSize: '0.85rem', color: '#334155' }}>Failure Causes</TableCell>
                <TableCell sx={{ minWidth: 180, fontWeight: 700, bgcolor: '#f8fafc', borderRight: '1px solid #cbd5e1', borderBottom: '2px solid #cbd5e1', fontSize: '0.85rem', color: '#334155' }}>Current Control – Prevention</TableCell>
                <TableCell sx={{ minWidth: 60, fontWeight: 700, textAlign: 'center', bgcolor: '#f8fafc', borderRight: '1px solid #cbd5e1', borderBottom: '2px solid #cbd5e1', fontSize: '0.85rem', color: '#334155' }}>OCC</TableCell>
                <TableCell sx={{ minWidth: 180, fontWeight: 700, bgcolor: '#f8fafc', borderRight: '1px solid #cbd5e1', borderBottom: '2px solid #cbd5e1', fontSize: '0.85rem', color: '#334155' }}>Current Control – Detection</TableCell>
                <TableCell sx={{ minWidth: 60, fontWeight: 700, textAlign: 'center', bgcolor: '#f8fafc', borderRight: '1px solid #cbd5e1', borderBottom: '2px solid #cbd5e1', fontSize: '0.85rem', color: '#334155' }}>DET</TableCell>
                <TableCell sx={{ minWidth: 70, fontWeight: 700, textAlign: 'center', bgcolor: '#f8fafc', borderRight: '1px solid #cbd5e1', borderBottom: '2px solid #cbd5e1', fontSize: '0.85rem', color: '#334155' }}>AP</TableCell>
                <TableCell sx={{ minWidth: 60, fontWeight: 700, textAlign: 'center', bgcolor: '#f8fafc', borderRight: '1px solid #cbd5e1', borderBottom: '2px solid #cbd5e1', fontSize: '0.85rem', color: '#334155' }}>FC</TableCell>
                <TableCell sx={{ minWidth: 200, fontWeight: 700, bgcolor: '#f8fafc', borderRight: '1px solid #cbd5e1', borderBottom: '2px solid #cbd5e1', fontSize: '0.85rem', color: '#334155' }}>Prevention Action</TableCell>
                <TableCell sx={{ minWidth: 200, fontWeight: 700, bgcolor: '#f8fafc', borderRight: '1px solid #cbd5e1', borderBottom: '2px solid #cbd5e1', fontSize: '0.85rem', color: '#334155' }}>Detection Action</TableCell>
                <TableCell sx={{ minWidth: 180, fontWeight: 700, bgcolor: '#f8fafc', borderRight: '1px solid #cbd5e1', borderBottom: '2px solid #cbd5e1', fontSize: '0.85rem', color: '#334155' }}>Responsibility & Target Date</TableCell>
                <TableCell sx={{ minWidth: 180, fontWeight: 700, bgcolor: '#f8fafc', borderRight: '1px solid #cbd5e1', borderBottom: '2px solid #cbd5e1', fontSize: '0.85rem', color: '#334155' }}>Action Taken & Completion Date</TableCell>
                <TableCell sx={{ minWidth: 65, fontWeight: 700, textAlign: 'center', bgcolor: '#f8fafc', borderRight: '1px solid #cbd5e1', borderBottom: '2px solid #cbd5e1', fontSize: '0.85rem', color: '#334155' }}>SEV (rev)</TableCell>
                <TableCell sx={{ minWidth: 65, fontWeight: 700, textAlign: 'center', bgcolor: '#f8fafc', borderRight: '1px solid #cbd5e1', borderBottom: '2px solid #cbd5e1', fontSize: '0.85rem', color: '#334155' }}>OCC (rev)</TableCell>
                <TableCell sx={{ minWidth: 65, fontWeight: 700, textAlign: 'center', bgcolor: '#f8fafc', borderRight: '1px solid #cbd5e1', borderBottom: '2px solid #cbd5e1', fontSize: '0.85rem', color: '#334155' }}>DET (rev)</TableCell>
                <TableCell sx={{ minWidth: 65, fontWeight: 700, textAlign: 'center', bgcolor: '#f8fafc', borderRight: '1px solid #cbd5e1', borderBottom: '2px solid #cbd5e1', fontSize: '0.85rem', color: '#334155' }}>AP (rev)</TableCell>
                <TableCell sx={{ minWidth: 100, fontWeight: 700, bgcolor: '#f8fafc', borderRight: '1px solid #cbd5e1', borderBottom: '2px solid #cbd5e1', fontSize: '0.85rem', color: '#334155' }}>Status</TableCell>
                <TableCell sx={{ minWidth: 160, fontWeight: 700, bgcolor: '#f8fafc', borderRight: '1px solid #cbd5e1', borderBottom: '2px solid #cbd5e1', fontSize: '0.85rem', color: '#334155' }}>Remarks</TableCell>
                <TableCell sx={{ minWidth: 110, fontWeight: 700, textAlign: 'center', bgcolor: '#f8fafc', borderBottom: '2px solid #cbd5e1', fontSize: '0.85rem', color: '#334155' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={25} align="center" sx={{ py: 6, color: 'text.secondary', fontSize: '0.9rem' }}>
                    No PFMEA analysis rows added yet.
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

                  return (
                    <TableRow key={row.id} sx={{ '&:hover': { bgcolor: 'rgba(40, 37, 29, 0.01)' } }}>
                      {/* Row Number */}
                      <TableCell sx={{ fontWeight: 600, position: 'sticky', left: 0, bgcolor: '#fff', zIndex: 1, borderRight: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#334155' }}>{row.rowNumber}</TableCell>

                      {/* Structure / Item */}
                      <TableCell sx={{ position: 'sticky', left: 45, bgcolor: '#fff', zIndex: 1, borderRight: '2px solid #cbd5e1' }}>
                        <Typography sx={{ fontWeight: 500, fontSize: '0.85rem', color: '#334155' }}>
                          {row.processStep?.stepNumber ? `${row.processStep.stepNumber}: ` : ''}
                          {row.processStep?.name || 'Untitled Step'}
                        </Typography>
                      </TableCell>

                      {/* Work Element (4M) */}
                      <TableCell sx={{ borderRight: '1px solid #cbd5e1' }}>
                        <Stack spacing={0.3}>
                          {workElements.map((we, idx) => (
                            <Typography key={idx} sx={{ fontSize: '0.85rem', fontWeight: 400, color: '#334155' }}>
                              {we}
                            </Typography>
                          ))}
                          {workElements.length === 0 && <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>—</Typography>}
                        </Stack>
                      </TableCell>

                      {/* Function / Focus Element */}
                      <TableCell sx={{ borderRight: '1px solid #cbd5e1' }}>
                        <Stack spacing={0.3}>
                          {row.functions?.map((f, i) => (
                            <Typography key={i} sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#334155' }}>{f.name}</Typography>
                          ))}
                          {row.requirements?.map((req, i) => (
                            <Typography key={i} sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 400 }}>R: {req.name}</Typography>
                          ))}
                          {(!row.functions || row.functions.length === 0) && (!row.requirements || row.requirements.length === 0) && '—'}
                        </Stack>
                      </TableCell>

                      {/* Failure Mode */}
                      <TableCell sx={{ borderRight: '1px solid #cbd5e1' }}>
                        <Stack spacing={0.3}>
                          {row.failureModes?.map((fm, i) => (
                            <Typography key={i} sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#334155' }}>{fm.name}</Typography>
                          ))}
                          {(!row.failureModes || row.failureModes.length === 0) && '—'}
                        </Stack>
                      </TableCell>

                      {/* Potential Effects */}
                      <TableCell sx={{ borderRight: '1px solid #cbd5e1' }}>
                        <Stack spacing={0.5}>
                          {row.effects?.map((e, i) => (
                            <Typography key={i} variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 400, color: '#334155' }}>{e.name}</Typography>
                          ))}
                          {(!row.effects || row.effects.length === 0) && '—'}
                        </Stack>
                      </TableCell>

                      {/* SEV */}
                      <TableCell align="center" sx={{ borderRight: '1px solid #cbd5e1' }}>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>{row.severity || '—'}</Typography>
                      </TableCell>

                      {/* Failure Causes */}
                      <TableCell sx={{ borderRight: '1px solid #cbd5e1' }}>
                        <Stack spacing={0.3}>
                          {row.causes?.map((c, i) => (
                            <Typography key={i} sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#334155' }}>{c.name}</Typography>
                          ))}
                          {(!row.causes || row.causes.length === 0) && '—'}
                        </Stack>
                      </TableCell>

                      {/* Current Control – Prevention */}
                      <TableCell sx={{ borderRight: '1px solid #cbd5e1' }}>
                        <Stack spacing={0.5}>
                          {row.controls?.filter(c => c.type === 'prevention').map((c, i) => (
                            <Typography key={i} variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 400, color: '#334155' }}>{c.name}</Typography>
                          ))}
                          {row.controls?.filter(c => c.type === 'prevention').length === 0 && '—'}
                        </Stack>
                      </TableCell>

                      {/* OCC */}
                      <TableCell align="center" sx={{ borderRight: '1px solid #cbd5e1' }}>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>{row.occurrence || '—'}</Typography>
                      </TableCell>

                      {/* Current Control – Detection */}
                      <TableCell sx={{ borderRight: '1px solid #cbd5e1' }}>
                        <Stack spacing={0.5}>
                          {row.controls?.filter(c => c.type === 'detection').map((c, i) => (
                            <Typography key={i} variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 400, color: '#334155' }}>{c.name}</Typography>
                          ))}
                          {row.controls?.filter(c => c.type === 'detection').length === 0 && '—'}
                        </Stack>
                      </TableCell>

                      {/* DET */}
                      <TableCell align="center" sx={{ borderRight: '1px solid #cbd5e1' }}>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>{row.detection || '—'}</Typography>
                      </TableCell>

                      {/* AP - COLOR BADGE KEPT HERE */}
                      <TableCell align="center" sx={{ borderRight: '1px solid #cbd5e1' }}>{getApBadge(row.ap)}</TableCell>

                      {/* FC */}
                      <TableCell align="center" sx={{ borderRight: '1px solid #cbd5e1' }}>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 400, color: '#334155' }}>{row.filterCode || '—'}</Typography>
                      </TableCell>

                      {/* Prevention Action */}
                      <TableCell sx={{ borderRight: '1px solid #cbd5e1' }}>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 400, color: '#334155', minWidth: 200 }}>{row.preventionAction || '—'}</Typography>
                      </TableCell>

                      {/* Detection Action */}
                      <TableCell sx={{ borderRight: '1px solid #cbd5e1' }}>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 400, color: '#334155', minWidth: 200 }}>{row.detectionAction || '—'}</Typography>
                      </TableCell>

                      {/* Responsibility & Target Date */}
                      <TableCell sx={{ borderRight: '1px solid #cbd5e1' }}>
                        <Stack spacing={0.2}>
                          <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#334155' }}>{row.responsibility || '—'}</Typography>
                          {row.targetDate && (
                            <Typography variant="caption" sx={{ fontSize: '0.78rem', color: 'text.secondary', fontWeight: 400 }}>
                              Target: {new Date(row.targetDate).toLocaleDateString()}
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>

                      {/* Action Taken & Completion Date */}
                      <TableCell sx={{ borderRight: '1px solid #cbd5e1' }}>
                        <Stack spacing={0.2}>
                          <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#334155' }}>{row.actionTaken || '—'}</Typography>
                          {row.completionDate && (
                            <Typography variant="caption" sx={{ fontSize: '0.78rem', color: 'text.secondary', fontWeight: 400 }}>
                              Done: {new Date(row.completionDate).toLocaleDateString()}
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>

                      {/* SEV (revised) */}
                      <TableCell align="center" sx={{ borderRight: '1px solid #cbd5e1' }}>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>{row.revisedSeverity || '—'}</Typography>
                      </TableCell>

                      {/* OCC (revised) */}
                      <TableCell align="center" sx={{ borderRight: '1px solid #cbd5e1' }}>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>{row.revisedOccurrence || '—'}</Typography>
                      </TableCell>

                      {/* DET (revised) */}
                      <TableCell align="center" sx={{ borderRight: '1px solid #cbd5e1' }}>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>{row.revisedDetection || '—'}</Typography>
                      </TableCell>

                      {/* AP (revised) - COLOR BADGE KEPT HERE */}
                      <TableCell align="center" sx={{ borderRight: '1px solid #cbd5e1' }}>{getApBadge(row.revisedAp || null)}</TableCell>

                      {/* Status */}
                      <TableCell sx={{ borderRight: '1px solid #cbd5e1' }}>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#334155' }}>
                          {row.status === 'approved' ? 'Closed' : row.status === 'reviewed' ? 'In Progress' : 'Open'}
                        </Typography>
                      </TableCell>

                      {/* Remarks */}
                      <TableCell sx={{ borderRight: '1px solid #cbd5e1' }}>
                        <Typography sx={{ fontSize: '0.85rem', color: '#334155', minWidth: 160 }}>{row.notes || '—'}</Typography>
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="center">
                        <Tooltip title="Manage Action">
                          <IconButton
                            size="small"
                            color="secondary"
                            onClick={() => openManageAction(row)}
                          >
                            <PlaylistAddIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => {
                            const failId = getFailureModeDbId(row);
                            if (failId) {
                              handleEditNodeFromTree(`struct-mode::${failId}`);
                            }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteRow(row.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page-1}
          onPageChange={(_,newPage)=> setPage(newPage+1)}
          rowsPerPage={limit}
          onRowsPerPageChange={e=> { setLimit(parseInt(e.target.value,10)); setPage(1); }}
          rowsPerPageOptions={[10,25,50]}
        />
        </>
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

      {/* Replaced slide drawer edit window */}

      {/* Add Row Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Add PFMEA Analysis Row</DialogTitle>
        <DialogContent sx={{ minWidth: 400, pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Process Step</InputLabel>
              <Select
                {...dialogSelectProps}
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

      {/* Manage Action Dialog — Full action fields matching FMEA report columns */}
      <Dialog
        open={manageActionOpen}
        onClose={() => setManageActionOpen(false)}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 2, p: 1 } } }}
      >
        <DialogTitle sx={{ py: 1.5, px: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Manage Action</Typography>
          <IconButton size="small" onClick={() => setManageActionOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 2, py: 1 }}>
          <Stack spacing={2}>
            {/* Prevention Action(s) */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Typography variant="body2" sx={{ width: 180, fontWeight: 700, pt: 1 }}>
                Prevention Action(s) :
              </Typography>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                value={manageActionForm.preventionAction}
                onChange={(e) => setManageActionForm(f => ({ ...f, preventionAction: e.target.value }))}
                placeholder="Enter prevention action details..."
              />
            </Box>

            {/* Detection Action */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Typography variant="body2" sx={{ width: 180, fontWeight: 700, pt: 1 }}>
                Detection Action :
              </Typography>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                value={manageActionForm.detectionAction}
                onChange={(e) => setManageActionForm(f => ({ ...f, detectionAction: e.target.value }))}
                placeholder="Enter detection action details..."
              />
            </Box>

            {/* Action Taken */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Typography variant="body2" sx={{ width: 180, fontWeight: 700, pt: 1 }}>
                Action Taken :
              </Typography>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                value={manageActionForm.actionTaken}
                onChange={(e) => setManageActionForm(f => ({ ...f, actionTaken: e.target.value }))}
                placeholder="Enter actions taken..."
              />
            </Box>

            {/* Grid for Dates & After Action S/O/D Ratings */}
            <Grid container spacing={2.5} sx={{ mt: 1 }}>
              {/* Left Column: Dates & Responsibility */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={2}>
                  {/* Target Date */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ width: 140, fontWeight: 700 }}>
                      Target Date :
                    </Typography>
                    <TextField
                      type="date"
                      size="small"
                      value={manageActionForm.targetDate}
                      onChange={(e) => setManageActionForm(f => ({ ...f, targetDate: e.target.value }))}
                      sx={{ flexGrow: 1 }}
                    />
                  </Box>

                  {/* Completion Date */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ width: 140, fontWeight: 700 }}>
                      Completion Date :
                    </Typography>
                    <TextField
                      type="date"
                      size="small"
                      value={manageActionForm.completionDate}
                      onChange={(e) => setManageActionForm(f => ({ ...f, completionDate: e.target.value }))}
                      sx={{ flexGrow: 1 }}
                    />
                  </Box>

                  {/* Responsible Person */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ width: 140, fontWeight: 700 }}>
                      Responsible Person :
                    </Typography>
                    <TextField
                      size="small"
                      placeholder="Name or team..."
                      value={manageActionForm.responsibility}
                      onChange={(e) => setManageActionForm(f => ({ ...f, responsibility: e.target.value }))}
                      sx={{ flexGrow: 1 }}
                    />
                  </Box>

                  {/* Status */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ width: 140, fontWeight: 700 }}>
                      Status :
                    </Typography>
                    <TextField
                      select
                      size="small"
                      value={manageActionForm.status}
                      onChange={(e) => setManageActionForm(f => ({ ...f, status: e.target.value }))}
                      sx={{ width: 180 }}
                    >
                      <MenuItem value="Open">Open</MenuItem>
                      <MenuItem value="In Progress">In Progress</MenuItem>
                      <MenuItem value="Completed">Completed</MenuItem>
                      <MenuItem value="Verified">Verified</MenuItem>
                      <MenuItem value="Closed">Closed</MenuItem>
                    </TextField>
                  </Box>
                </Stack>
              </Grid>

              {/* Right Column: After Action S/O/D Ratings (Revised) */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, textAlign: 'center', color: '#0f172a' }}>
                  After Action (Revised Ratings)
                </Typography>

                <Stack spacing={2}>
                  {/* Severity (S) */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ width: 110, fontWeight: 700 }}>
                      Severity (S) :
                    </Typography>
                    <TextField
                      select
                      size="small"
                      value={manageActionForm.revisedSeverity}
                      onChange={(e) => setManageActionForm(f => ({ ...f, revisedSeverity: e.target.value }))}
                      sx={{ width: 80 }}
                    >
                      <MenuItem value="">—</MenuItem>
                      {[1,2,3,4,5,6,7,8,9,10].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                    </TextField>
                  </Box>

                  {/* Occurrence (O) */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ width: 110, fontWeight: 700 }}>
                      Occurrence (O) :
                    </Typography>
                    <TextField
                      select
                      size="small"
                      value={manageActionForm.revisedOccurrence}
                      onChange={(e) => setManageActionForm(f => ({ ...f, revisedOccurrence: e.target.value }))}
                      sx={{ width: 80 }}
                    >
                      <MenuItem value="">—</MenuItem>
                      {[1,2,3,4,5,6,7,8,9,10].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                    </TextField>
                  </Box>

                  {/* Detection (D) */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ width: 110, fontWeight: 700 }}>
                      Detection (D) :
                    </Typography>
                    <TextField
                      select
                      size="small"
                      value={manageActionForm.revisedDetection}
                      onChange={(e) => setManageActionForm(f => ({ ...f, revisedDetection: e.target.value }))}
                      sx={{ width: 80 }}
                    >
                      <MenuItem value="">—</MenuItem>
                      {[1,2,3,4,5,6,7,8,9,10].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                    </TextField>
                  </Box>
                </Stack>
              </Grid>
            </Grid>

            {/* Remarks */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
              <Typography variant="body2" sx={{ width: 180, fontWeight: 700 }}>
                Remarks :
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={manageActionForm.notes}
                onChange={(e) => setManageActionForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Enter remarks..."
              />
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'flex-end', gap: 1 }}>
          <Button variant="contained" onClick={handleSaveManageAction} sx={{ bgcolor: '#0284c7', px: 4, fontWeight: 700 }}>
            Save
          </Button>
          <Button variant="outlined" onClick={() => setManageActionOpen(false)} sx={{ px: 4, fontWeight: 700 }}>
            Cancel
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
          projectName={projectName}
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

      {/* Multi-Add Work Element Dialog (with Repository Import tab) */}
      {treeAddTargetStepId && (
        <MultiAddWorkElementDialog
          open={multiAddWeDialogOpen}
          onClose={() => { setMultiAddWeDialogOpen(false); setTreeAddTargetStepId(null); }}
          processStepId={treeAddTargetStepId}
          revisionId={pfmeaRevisionId || undefined}
          onConfirmSingle={handleConfirmAddWorkElementSingle}
          onConfirmMultiple={handleConfirmAddWorkElementsMultiple}
          onImportSuccess={() => fetchData()}
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
          editMode={structFuncEditMode}
          editNodeId={structFuncEditNodeId}
          initialNarration={structFuncInitialNarration}
          initialLocation={structFuncInitialLocation}
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
          editMode={structFailEditMode}
          editNodeId={structFailEditNodeId}
          initialNarration={structFailInitialNarration}
          initialSeverityRating={structFailInitialSeverityRating}
          initialOccurrenceRating={structFailInitialOccurrenceRating}
          initialDetectionRating={structFailInitialDetectionRating}
          initialControlPrevention={structFailInitialControlPrevention}
          initialControlDetection={structFailInitialControlDetection}
          initialFilterCode={structFailInitialFilterCode}
        />
      )}
      {confirmState && (
        <ConfirmDialog open={confirmState.open} onClose={() => setConfirmState(null)} onConfirm={confirmState.onConfirm} title={confirmState.title} message={confirmState.message} detail={confirmState.detail} severity="warning" />
      )}
    </Box>
  );
};

export default PfmeaWorkspace;