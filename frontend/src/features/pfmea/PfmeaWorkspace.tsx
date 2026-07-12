import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, IconButton, Alert, Select, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControl, InputLabel, Stack, Tooltip, TextField, Tabs, Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  PlaylistAdd as PlaylistAddIcon,
  AccountTree as AccountTreeIcon
} from '@mui/icons-material';
import { useAuth } from '../auth/AuthContext';
import { WorkspaceSkeleton } from '../../components/Layout/WorkspaceSkeleton';
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


  // Dialog and Drawer states
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
          let errMsg = 'API Error';
          try {
            const body = await response.json();
            errMsg = body.message || JSON.stringify(body);
          } catch {
            errMsg = response.statusText || `${response.status}`;
          }
          throw new Error(errMsg);
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
        setError(`Cannot add structure failure: Parent structure function not found in DB and auto-creation failed. Details: ${err.message}`);
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

  const handleDeleteStep = async (stepId: string) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return;

    const assocRows = rows.filter(r => r.processStepId === stepId);
    
    let confirmMsg = `Are you sure you want to delete the process step "${step.stepNumber} - ${step.name}"?`;
    if (step.isOrphaned) {
      confirmMsg = `This process step is orphaned because the original PFD step was deleted. Deleting it will remove it from FMEA along with all associated analysis data. Do you want to delete it?`;
    } else if (assocRows.length > 0) {
      confirmMsg = `Deleting this process step will also delete all of its associated FMEA analysis rows (${assocRows.length} rows). Are you sure you want to proceed?`;
    }

    if (!window.confirm(confirmMsg)) return;

    setError(null);
    try {
      // 1. Delete associated FMEA rows first (to bypass backend check in pfd-steps deletion)
      for (const r of assocRows) {
        const response = await fetch(`${API_BASE_URL}/pfmea-rows/${r.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error(`Failed to delete FMEA row: ${r.rowNumber}`);
        }
      }

      // 2. Delete the step itself
      const response = await fetch(`${API_BASE_URL}/pfd-steps/${stepId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to delete process step.');
      }

      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Could not delete process step.');
    }
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
        if (!response.ok) throw new Error('Failed to update Process Step.');

        await fetchData();
      } catch (err: any) {
        setError(err.message || 'Could not delete work element.');
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
          if (!response.ok) throw new Error('Failed to delete structure function.');
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
        setError(err.message || 'Could not delete function.');
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
          if (!response.ok) throw new Error('Failed to delete structure failure.');
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
        setError(err.message || 'Could not delete failure.');
      }
      return;
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

  const handleFieldChange = async (rowId: string, field: string, value: any) => {
    setError(null);
    const targetRow = rows.find((r) => r.id === rowId);
    if (!targetRow) return;

    let updatedFields: any = { [field]: value };
    if (field === 'revisedSeverity' || field === 'revisedOccurrence' || field === 'revisedDetection') {
      const rS = field === 'revisedSeverity' ? value : targetRow.revisedSeverity;
      const rO = field === 'revisedOccurrence' ? value : targetRow.revisedOccurrence;
      const rD = field === 'revisedDetection' ? value : targetRow.revisedDetection;
      const localRevisedAp = (rS && rO && rD) ? calculateAP(rS, rO, rD) : null;
      updatedFields.revisedAp = localRevisedAp;
    }

    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, ...updatedFields } : r))
    );

    try {
      const response = await fetch(`${API_BASE_URL}/pfmea-rows/${rowId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedFields),
      });

      if (!response.ok) {
        throw new Error(`Failed to persist update for ${field}.`);
      }

      const updatedRow = await response.json();
      setRows((prev) =>
        prev.map((r) => (r.id === rowId ? { ...r, ...updatedRow } : r))
      );
    } catch (err: any) {
      setError(err.message || 'Failed to update field. Reverting...');
      fetchData();
    }
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

      {/* Failure Modes & Linkage Status Bar */}
      {activeTab !== 'tree' && (() => {
        const allFailures = structureFunctions.flatMap(sf => sf.failures || []);
        const totalFailureModes = allFailures.filter((f: any) => f.role === 'mode').length;
        const linkedFailureModes = allFailures.filter((f: any) => f.role === 'mode' && f.isLinked).length;
        const unlinkedFailureModes = totalFailureModes - linkedFailureModes;
        return (
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 1.5, 
              mb: 3, 
              bgcolor: '#fafafa', 
              border: '1px solid rgba(40, 37, 29, 0.1)', 
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap'
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
              📊 Failure Mode Linkages:
            </Typography>
            <Chip 
              label={`${totalFailureModes} Total Modes`} 
              size="small" 
              sx={{ bgcolor: '#e0f7fa', color: '#006064', fontWeight: 'bold' }} 
            />
            <Chip 
              label={`${linkedFailureModes} Linked`} 
              size="small" 
              color="success" 
              sx={{ fontWeight: 'bold' }} 
            />
            <Chip 
              label={`${unlinkedFailureModes} Unlinked`} 
              size="small" 
              color={unlinkedFailureModes > 0 ? "warning" : "default"} 
              sx={{ fontWeight: 'bold' }} 
            />
          </Paper>
        );
      })()}

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
          />
        );
      })() : activeTab === 'table' ? (
        <TableContainer component={Paper} sx={{ border: '1px solid rgba(40, 37, 29, 0.1)', borderRadius: 3, bgcolor: 'background.paper', overflowX: 'auto', boxShadow: 'none' }}>
          <Table aria-label="PFMEA rows grid" size="small">
            <TableHead>
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ fontWeight: 800, bgcolor: '#f1f5f9', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', fontSize: '0.8rem' }}>Structure Analysis</TableCell>
                <TableCell colSpan={1} align="center" sx={{ fontWeight: 800, bgcolor: '#f1f5f9', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', fontSize: '0.8rem' }}>Function Analysis</TableCell>
                <TableCell colSpan={4} align="center" sx={{ fontWeight: 800, bgcolor: '#f1f5f9', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', fontSize: '0.8rem' }}>Failure Analysis</TableCell>
                <TableCell colSpan={6} align="center" sx={{ fontWeight: 800, bgcolor: '#f1f5f9', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', fontSize: '0.8rem' }}>Risk Analysis</TableCell>
                <TableCell colSpan={10} align="center" sx={{ fontWeight: 800, bgcolor: '#f1f5f9', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', fontSize: '0.8rem' }}>Optimisation</TableCell>
                <TableCell colSpan={1} align="center" sx={{ fontWeight: 800, bgcolor: '#f1f5f9', borderBottom: '1px solid #cbd5e1', fontSize: '0.8rem' }}>Actions</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ minWidth: 40, fontWeight: 'bold', position: 'sticky', left: 0, bgcolor: '#f8fafc', zIndex: 3, borderBottom: '2px solid #cbd5e1', fontSize: '0.78rem' }}>#</TableCell>
                <TableCell sx={{ minWidth: 160, fontWeight: 'bold', position: 'sticky', left: 40, bgcolor: '#f8fafc', zIndex: 3, borderRight: '2px solid #cbd5e1', borderBottom: '2px solid #cbd5e1', fontSize: '0.78rem' }}>Structure / Item</TableCell>
                <TableCell sx={{ minWidth: 140, fontWeight: 'bold', bgcolor: '#f8fafc', borderBottom: '2px solid #cbd5e1', fontSize: '0.78rem' }}>Work Element (4M)</TableCell>
                <TableCell sx={{ minWidth: 180, fontWeight: 'bold', bgcolor: '#f8fafc', borderBottom: '2px solid #cbd5e1', fontSize: '0.78rem' }}>Function / Focus Element</TableCell>
                <TableCell sx={{ minWidth: 160, fontWeight: 'bold', bgcolor: '#f8fafc', borderBottom: '2px solid #cbd5e1', fontSize: '0.78rem' }}>Failure Mode</TableCell>
                <TableCell sx={{ minWidth: 160, fontWeight: 'bold', bgcolor: '#f8fafc', borderBottom: '2px solid #cbd5e1', fontSize: '0.78rem' }}>Potential Effects</TableCell>
                <TableCell sx={{ minWidth: 65, fontWeight: 'bold', textAlign: 'center', bgcolor: '#f8fafc', borderBottom: '2px solid #cbd5e1', fontSize: '0.78rem' }}>SEV</TableCell>
                <TableCell sx={{ minWidth: 160, fontWeight: 'bold', bgcolor: '#f8fafc', borderBottom: '2px solid #cbd5e1', fontSize: '0.78rem' }}>Failure Causes</TableCell>
                <TableCell sx={{ minWidth: 160, fontWeight: 'bold', bgcolor: '#f8fafc', borderBottom: '2px solid #cbd5e1', fontSize: '0.78rem' }}>Current Control – Prevention</TableCell>
                <TableCell sx={{ minWidth: 65, fontWeight: 'bold', textAlign: 'center', bgcolor: '#f8fafc', borderBottom: '2px solid #cbd5e1', fontSize: '0.78rem' }}>OCC</TableCell>
                <TableCell sx={{ minWidth: 160, fontWeight: 'bold', bgcolor: '#f8fafc', borderBottom: '2px solid #cbd5e1', fontSize: '0.78rem' }}>Current Control – Detection</TableCell>
                <TableCell sx={{ minWidth: 65, fontWeight: 'bold', textAlign: 'center', bgcolor: '#f8fafc', borderBottom: '2px solid #cbd5e1', fontSize: '0.78rem' }}>DET</TableCell>
                <TableCell sx={{ minWidth: 65, fontWeight: 'bold', textAlign: 'center', bgcolor: '#f8fafc', borderBottom: '2px solid #cbd5e1', fontSize: '0.78rem' }}>AP</TableCell>
                <TableCell sx={{ minWidth: 60, fontWeight: 'bold', textAlign: 'center', bgcolor: '#f8fafc', borderBottom: '2px solid #cbd5e1', fontSize: '0.78rem' }}>FC</TableCell>
                <TableCell sx={{ minWidth: 200, fontWeight: 'bold', bgcolor: '#f8fafc', borderBottom: '2px solid #cbd5e1', fontSize: '0.78rem' }}>Prevention Action</TableCell>
                <TableCell sx={{ minWidth: 200, fontWeight: 'bold', bgcolor: '#f8fafc', borderBottom: '2px solid #cbd5e1', fontSize: '0.78rem' }}>Detection Action</TableCell>
                <TableCell sx={{ minWidth: 150, fontWeight: 'bold', bgcolor: '#f8fafc', borderBottom: '2px solid #cbd5e1', fontSize: '0.78rem' }}>Responsibility & Target Date</TableCell>
                <TableCell sx={{ minWidth: 150, fontWeight: 'bold', bgcolor: '#f8fafc', borderBottom: '2px solid #cbd5e1', fontSize: '0.78rem' }}>Action Taken & Completion Date</TableCell>
                <TableCell sx={{ minWidth: 65, fontWeight: 'bold', textAlign: 'center', bgcolor: '#f8fafc', borderBottom: '2px solid #cbd5e1', fontSize: '0.78rem' }}>SEV (rev)</TableCell>
                <TableCell sx={{ minWidth: 65, fontWeight: 'bold', textAlign: 'center', bgcolor: '#f8fafc', borderBottom: '2px solid #cbd5e1', fontSize: '0.78rem' }}>OCC (rev)</TableCell>
                <TableCell sx={{ minWidth: 65, fontWeight: 'bold', textAlign: 'center', bgcolor: '#f8fafc', borderBottom: '2px solid #cbd5e1', fontSize: '0.78rem' }}>DET (rev)</TableCell>
                <TableCell sx={{ minWidth: 65, fontWeight: 'bold', textAlign: 'center', bgcolor: '#f8fafc', borderBottom: '2px solid #cbd5e1', fontSize: '0.78rem' }}>AP (rev)</TableCell>
                <TableCell sx={{ minWidth: 90, fontWeight: 'bold', bgcolor: '#f8fafc', borderBottom: '2px solid #cbd5e1', fontSize: '0.78rem' }}>Status</TableCell>
                <TableCell sx={{ minWidth: 160, fontWeight: 'bold', bgcolor: '#f8fafc', borderBottom: '2px solid #cbd5e1', fontSize: '0.78rem' }}>Remarks</TableCell>
                <TableCell sx={{ minWidth: 110, fontWeight: 'bold', textAlign: 'center', bgcolor: '#f8fafc', borderBottom: '2px solid #cbd5e1', fontSize: '0.78rem' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={25} align="center" sx={{ py: 6, color: 'text.secondary' }}>
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

                  return (
                    <TableRow key={row.id} sx={{ '&:hover': { bgcolor: 'rgba(40, 37, 29, 0.01)' } }}>
                      {/* Row Number */}
                      <TableCell sx={{ fontWeight: 'bold', position: 'sticky', left: 0, bgcolor: '#fff', zIndex: 1, fontSize: '0.75rem' }}>{row.rowNumber}</TableCell>

                      {/* Structure / Item */}
                      <TableCell sx={{ position: 'sticky', left: 40, bgcolor: '#fff', zIndex: 1, borderRight: '2px solid #cbd5e1' }}>
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                          <AccountTreeIcon sx={{ fontSize: '0.8rem', color: '#854d0e' }} />
                          <Typography sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                            {row.processStep?.stepNumber ? `${row.processStep.stepNumber}: ` : ''}
                            {row.processStep?.name || 'Untitled Step'}
                          </Typography>
                        </Stack>
                      </TableCell>

                      {/* Work Element (4M) */}
                      <TableCell>
                        <Stack spacing={0.5} direction="row" sx={{ flexWrap: 'wrap' }}>
                          {workElements.map((we, weIdx) => (
                            <Chip key={weIdx} label={we} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.72rem', borderColor: '#f97316', color: '#f97316' }} />
                          ))}
                          {workElements.length === 0 && '—'}
                        </Stack>
                      </TableCell>

                      {/* Function / Focus Element */}
                      <TableCell>
                        <Stack spacing={0.5}>
                          {row.functions?.map((f, i) => (
                            <Chip
                              key={i}
                              icon={<AccountTreeIcon sx={{ fontSize: '0.8rem !important' }} />}
                              label={f.name}
                              size="small"
                              sx={{ bgcolor: '#fef9c3', color: '#854d0e', borderColor: '#fef08a', height: 22, fontSize: '0.72rem', fontWeight: 600 }}
                            />
                          ))}
                          {row.requirements?.map((req, i) => (
                            <Chip key={i} label={`R: ${req.name}`} size="small" color="secondary" variant="outlined" sx={{ height: 22, fontSize: '0.72rem' }} />
                          ))}
                          {(!row.functions || row.functions.length === 0) && (!row.requirements || row.requirements.length === 0) && '—'}
                        </Stack>
                      </TableCell>

                      {/* Failure Mode */}
                      <TableCell>
                        <Stack spacing={0.5}>
                          {row.failureModes?.map((fm, i) => (
                            <Chip
                              key={i}
                              icon={<AccountTreeIcon sx={{ fontSize: '0.8rem !important' }} />}
                              label={fm.name}
                              size="small"
                              sx={{ bgcolor: '#fee2e2', color: '#991b1b', borderColor: '#fecaca', height: 22, fontSize: '0.72rem', fontWeight: 600 }}
                            />
                          ))}
                          {(!row.failureModes || row.failureModes.length === 0) && '—'}
                        </Stack>
                      </TableCell>

                      {/* Potential Effects */}
                      <TableCell>
                        <Stack spacing={0.5}>
                          {row.effects?.map((e, i) => (
                            <Typography key={i} variant="body2" sx={{ fontSize: '0.75rem' }}>{e.name}</Typography>
                          ))}
                          {(!row.effects || row.effects.length === 0) && '—'}
                        </Stack>
                      </TableCell>

                      {/* SEV */}
                      <TableCell align="center">
                        <RatingDropdown
                          ratingType="severity"
                          value={row.severity}
                          onChange={(val) => handleRatingChange(row.id, 'severity', val || 0)}
                          hideLabel
                          size="small"
                        />
                      </TableCell>

                      {/* Failure Causes */}
                      <TableCell>
                        <Stack spacing={0.5}>
                          {row.causes?.map((c, i) => (
                            <Chip
                              key={i}
                              icon={<AccountTreeIcon sx={{ fontSize: '0.8rem !important' }} />}
                              label={c.name}
                              size="small"
                              sx={{ bgcolor: '#ffedd5', color: '#c2410c', borderColor: '#fed7aa', height: 22, fontSize: '0.72rem', fontWeight: 600 }}
                            />
                          ))}
                          {(!row.causes || row.causes.length === 0) && '—'}
                        </Stack>
                      </TableCell>

                      {/* Current Control – Prevention */}
                      <TableCell>
                        <Stack spacing={0.5}>
                          {row.controls?.filter(c => c.type === 'prevention').map((c, i) => (
                            <Typography key={i} variant="body2" sx={{ fontSize: '0.75rem' }}>{c.name}</Typography>
                          ))}
                          {row.controls?.filter(c => c.type === 'prevention').length === 0 && '—'}
                        </Stack>
                      </TableCell>

                      {/* OCC */}
                      <TableCell align="center">
                        <RatingDropdown
                          ratingType="occurrence"
                          value={row.occurrence}
                          onChange={(val) => handleRatingChange(row.id, 'occurrence', val || 0)}
                          hideLabel
                          size="small"
                        />
                      </TableCell>

                      {/* Current Control – Detection */}
                      <TableCell>
                        <Stack spacing={0.5}>
                          {row.controls?.filter(c => c.type === 'detection').map((c, i) => (
                            <Typography key={i} variant="body2" sx={{ fontSize: '0.75rem' }}>{c.name}</Typography>
                          ))}
                          {row.controls?.filter(c => c.type === 'detection').length === 0 && '—'}
                        </Stack>
                      </TableCell>

                      {/* DET */}
                      <TableCell align="center">
                        <RatingDropdown
                          ratingType="detection"
                          value={row.detection}
                          onChange={(val) => handleRatingChange(row.id, 'detection', val || 0)}
                          hideLabel
                          size="small"
                        />
                      </TableCell>

                      {/* AP */}
                      <TableCell align="center">{getApBadge(row.ap)}</TableCell>

                      {/* FC */}
                      <TableCell align="center">
                        <TextField
                          size="small"
                          variant="standard"
                          value={row.filterCode || ''}
                          onChange={(e) => handleFieldChange(row.id, 'filterCode', e.target.value)}
                          sx={{ 
                            width: 45,
                            '& .MuiInput-underline:before': { borderBottom: 'none' },
                            '& .MuiInput-underline:after': { borderBottom: 'none' },
                            '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottom: 'none' },
                            input: { textAlign: 'center', fontSize: '0.75rem' }
                          }}
                        />
                      </TableCell>

                      {/* Prevention Action */}
                      <TableCell>
                        <TextField
                          multiline
                          size="small"
                          variant="standard"
                          value={row.preventionAction || ''}
                          onChange={(e) => handleFieldChange(row.id, 'preventionAction', e.target.value)}
                          placeholder="Action..."
                          sx={{ 
                            minWidth: 180,
                            '& .MuiInput-underline:before': { borderBottom: 'none' },
                            '& .MuiInput-underline:after': { borderBottom: 'none' },
                            '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottom: 'none' },
                            '& .MuiInputBase-root': { fontSize: '0.75rem' }
                          }}
                        />
                      </TableCell>

                      {/* Detection Action */}
                      <TableCell>
                        <TextField
                          multiline
                          size="small"
                          variant="standard"
                          value={row.detectionAction || ''}
                          onChange={(e) => handleFieldChange(row.id, 'detectionAction', e.target.value)}
                          placeholder="Action..."
                          sx={{ 
                            minWidth: 180,
                            '& .MuiInput-underline:before': { borderBottom: 'none' },
                            '& .MuiInput-underline:after': { borderBottom: 'none' },
                            '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottom: 'none' },
                            '& .MuiInputBase-root': { fontSize: '0.75rem' }
                          }}
                        />
                      </TableCell>

                      {/* Responsibility & Target Date */}
                      <TableCell>
                        <TextField
                          size="small"
                          variant="standard"
                          value={row.responsibility || ''}
                          onChange={(e) => handleFieldChange(row.id, 'responsibility', e.target.value)}
                          placeholder="Resp & Date..."
                          sx={{ 
                            minWidth: 120,
                            '& .MuiInput-underline:before': { borderBottom: 'none' },
                            '& .MuiInput-underline:after': { borderBottom: 'none' },
                            '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottom: 'none' },
                            input: { fontSize: '0.75rem' }
                          }}
                        />
                      </TableCell>

                      {/* Action Taken & Completion Date */}
                      <TableCell>
                        <TextField
                          size="small"
                          variant="standard"
                          value={row.actionTaken || ''}
                          onChange={(e) => handleFieldChange(row.id, 'actionTaken', e.target.value)}
                          placeholder="Action taken..."
                          sx={{ 
                            minWidth: 120,
                            '& .MuiInput-underline:before': { borderBottom: 'none' },
                            '& .MuiInput-underline:after': { borderBottom: 'none' },
                            '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottom: 'none' },
                            input: { fontSize: '0.75rem' }
                          }}
                        />
                      </TableCell>

                      {/* SEV (revised) */}
                      <TableCell align="center">
                        <RatingDropdown
                          ratingType="severity"
                          value={row.revisedSeverity}
                          onChange={(val) => handleFieldChange(row.id, 'revisedSeverity', val)}
                          hideLabel
                          size="small"
                        />
                      </TableCell>

                      {/* OCC (revised) */}
                      <TableCell align="center">
                        <RatingDropdown
                          ratingType="occurrence"
                          value={row.revisedOccurrence}
                          onChange={(val) => handleFieldChange(row.id, 'revisedOccurrence', val)}
                          hideLabel
                          size="small"
                        />
                      </TableCell>

                      {/* DET (revised) */}
                      <TableCell align="center">
                        <RatingDropdown
                          ratingType="detection"
                          value={row.revisedDetection}
                          onChange={(val) => handleFieldChange(row.id, 'revisedDetection', val)}
                          hideLabel
                          size="small"
                        />
                      </TableCell>

                      {/* AP (revised) */}
                      <TableCell align="center">{getApBadge(row.revisedAp || null)}</TableCell>

                      {/* Status */}
                      <TableCell>
                        <Select
                          value={row.status || 'draft'}
                          size="small"
                          variant="standard"
                          onChange={(e) => handleFieldChange(row.id, 'status', e.target.value)}
                          sx={{ fontSize: '0.75rem', minWidth: 90 }}
                          disableUnderline
                        >
                          <MenuItem value="draft">Open</MenuItem>
                          <MenuItem value="reviewed">In Progress</MenuItem>
                          <MenuItem value="approved">Closed</MenuItem>
                        </Select>
                      </TableCell>

                      {/* Remarks */}
                      <TableCell>
                        <TextField
                          multiline
                          size="small"
                          variant="standard"
                          value={row.notes || ''}
                          onChange={(e) => handleFieldChange(row.id, 'notes', e.target.value)}
                          placeholder="Remarks..."
                          sx={{ 
                            minWidth: 150,
                            '& .MuiInput-underline:before': { borderBottom: 'none' },
                            '& .MuiInput-underline:after': { borderBottom: 'none' },
                            '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottom: 'none' },
                            '& .MuiInputBase-root': { fontSize: '0.75rem' }
                          }}
                        />
                      </TableCell>

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
    </Box>
  );
};
