import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Box, Tabs, Tab, Button, Paper, TableContainer, Table, TableHead,
  TableRow, TableCell, TableBody, IconButton, Stack, Typography,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Alert, CircularProgress, Select, MenuItem, Collapse
} from '@mui/material';
import {
  Add as AddIcon,
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowUp as ExpandLessIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AssignmentTurnedIn as ActionsIcon
} from '@mui/icons-material';
import { useAuth } from '../auth/AuthContext';
import { PfmeaRowEditor } from '../pfmea/components/PfmeaRowEditor';
import { DfmeaStructureTree } from './components/DfmeaStructureTree';
import { ReportExporter } from '../reports/ReportExporter';
import { API_BASE_URL } from '../../config';
import { DocumentHeader } from '../../components/DocumentHeader';

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
  filterCode?: string | null;
  status: string;
  accessLevel: string;
  functions: { name: string }[];
  requirements: { name: string }[];
  failureModes: { name: string }[];
  effects: { name: string }[];
  causes: { name: string }[];
  controls: { name: string; type: string; detectionMethod?: string }[];
  characteristics: { name: string; classification: string; unitOfMeasure?: string }[];
}

interface ProcessStep {
  id: string;
  stepNumber: string;
  name: string;
  machinesEquipmentDocs?: any;
  isOrphaned?: boolean;
}

export const DfmeaWorkspace: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'tree';

  // Project Document Revisions
  const [dfmeaRevisionId, setDfmeaRevisionId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>('');

  // Data states
  const [rows, setRows] = useState<PfmeaRow[]>([]);
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Expanded Rows state
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Dialog and Drawer states
  const [editorOpen, setEditorOpen] = useState(false);
  const [activeRow, setActiveRow] = useState<PfmeaRow | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Exporter Dialog state
  const [exporterOpen, setExporterOpen] = useState(false);

  // Add row form state
  const [selectedStepId, setSelectedStepId] = useState('');

  // Generic Tree Element Add Dialog states
  const [treeAddType, setTreeAddType] = useState<'workElement' | 'function' | 'failure' | null>(null);
  const [treeAddTargetStepId, setTreeAddTargetStepId] = useState<string | null>(null);
  const [treeAddWorkElementName, setTreeAddWorkElementName] = useState<string | null>(null);
  const [treeAddFunctionName, setTreeAddFunctionName] = useState<string | null>(null);
  const [treeAddValue, setTreeAddValue] = useState('');

  // Corrective action creation state
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedRowForAction, setSelectedRowForAction] = useState<PfmeaRow | null>(null);
  const [actionDescription, setActionDescription] = useState('');
  const [actionPriority, setActionPriority] = useState('medium');
  const [actionOwnerId, setActionOwnerId] = useState('');
  const [actionDueDate, setActionDueDate] = useState('');
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);

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
          fmeaType: 'DFMEA',
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

        const dfmeaDoc = documents.find((doc: any) => doc.type === 'DFMEA');

        if (!dfmeaDoc || !dfmeaDoc.currentRevisionId) {
          throw new Error('DFMEA Document context not found or revision uninitialized.');
        }

        setDfmeaRevisionId(dfmeaDoc.currentRevisionId);
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
    if (!dfmeaRevisionId) return;
    try {
      // 1. Fetch DFMEA elements (System Elements)
      const stepsResponse = await fetch(`${API_BASE_URL}/revisions/${dfmeaRevisionId}/pfd-steps`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!stepsResponse.ok) throw new Error('Failed to load System Elements');
      const stepsData = await stepsResponse.json();
      setSteps(stepsData);

      // 2. Fetch FMEA rows
      const rowsResponse = await fetch(`${API_BASE_URL}/revisions/${dfmeaRevisionId}/pfmea-rows`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!rowsResponse.ok) throw new Error('Failed to load DFMEA analysis rows');
      const rowsData = await rowsResponse.json();
      setRows(rowsData);
    } catch (err: any) {
      setError(err.message || 'Could not load DFMEA workspace data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dfmeaRevisionId) {
      fetchData();
    }
  }, [dfmeaRevisionId]);

  const handleAddRow = async () => {
    if (!selectedStepId) return;
    setError(null);
    setAddDialogOpen(false);
    try {
      const nextRowNumber = rows.length > 0 ? Math.max(...rows.map((r) => r.rowNumber)) + 1 : 1;

      const response = await fetch(`${API_BASE_URL}/revisions/${dfmeaRevisionId}/pfmea-rows`, {
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
    setTreeAddTargetStepId(stepId);
    setTreeAddWorkElementName(workElementName || null);
    setTreeAddFunctionName(null);
    setTreeAddType('function');
    setTreeAddValue('');
  };

  const handleAddFailureFromTree = (
    stepId: string | null,
    parentContext?: { workElementName?: string | null; functionName: string }
  ) => {
    setTreeAddTargetStepId(stepId);
    setTreeAddWorkElementName(parentContext?.workElementName || null);
    setTreeAddFunctionName(parentContext?.functionName || null);
    setTreeAddType('failure');
    setTreeAddValue('');
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
        if (!response.ok) throw new Error('Failed to save Component Element');
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
          const createResponse = await fetch(`${API_BASE_URL}/revisions/${dfmeaRevisionId}/pfmea-rows`, {
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

  const handleRatingChange = async (rowId: string, field: 'severity' | 'occurrence' | 'detection' | 'filterCode', value: any) => {
    setError(null);
    try {
      const payload: any = {};
      payload[field] = field === 'filterCode' ? value : Number(value);

      const response = await fetch(`${API_BASE_URL}/pfmea-rows/${rowId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Failed to update rating.');
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Could not update rating.');
    }
  };

  const handleSaveEditorRow = async (updatedData: any) => {
    if (!activeRow) return;
    try {
      const response = await fetch(`${API_BASE_URL}/pfmea-rows/${activeRow.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      });
      if (!response.ok) throw new Error('Failed to update FMEA row details.');
      await fetchData();
    } catch (err: any) {
      throw new Error(err.message || 'Could not save modifications.');
    }
  };

  const toggleRowExpansion = (rowId: string) => {
    setExpandedRows(prev => ({ ...prev, [rowId]: !prev[rowId] }));
  };

  const ratingOptions = Array.from({ length: 10 }, (_, i) => i + 1);

  if (loading && !dfmeaRevisionId) {
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
        docType="DFMEA"
        onHeaderLoaded={(p) => setProjectName(p.name)}
      />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setSearchParams({ tab: val })}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab value="tree" label="Structure Tree" sx={{ fontWeight: 'bold' }} />
          <Tab value="table" label="Analysis Table" sx={{ fontWeight: 'bold' }} />
        </Tabs>
        
        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" color="primary" onClick={() => setExporterOpen(true)}>
            Export DFMEA
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
        <DfmeaStructureTree
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
        />
      ) : (
        <TableContainer component={Paper} sx={{ border: '1px solid rgba(40, 37, 29, 0.1)', borderRadius: 3, bgcolor: 'background.paper', overflowX: 'auto', boxShadow: 'none' }}>
          <Table aria-label="DFMEA rows grid" size="small">
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell sx={{ minWidth: 40, fontWeight: 'bold' }}>#</TableCell>
                <TableCell sx={{ minWidth: 140, fontWeight: 'bold' }}>Higher Level (System)</TableCell>
                <TableCell sx={{ minWidth: 140, fontWeight: 'bold' }}>Focus Element (System Element)</TableCell>
                <TableCell sx={{ minWidth: 150, fontWeight: 'bold' }}>Component Element</TableCell>
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
                <TableCell sx={{ minWidth: 100, fontWeight: 'bold' }}>Filter Code</TableCell>
                <TableCell sx={{ minWidth: 90, fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={17} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No DFMEA analysis rows added yet. Click "Add Analysis Row" to begin.
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
                  workElements = workElements.map(w => w.trim()).filter(Boolean);

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

                        {/* Higher Level (System) */}
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {projectName || 'System (Root)'}
                          </Typography>
                        </TableCell>

                        {/* Focus Element (System Element) */}
                        <TableCell>
                          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {step?.stepNumber}
                            </Typography>
                            <Typography variant="body2">
                              {step?.name}
                            </Typography>
                          </Stack>
                        </TableCell>

                        {/* Component Element */}
                        <TableCell>
                          <Stack spacing={0.5}>
                            {workElements.map((we, index) => (
                              <Chip 
                                key={index} 
                                label={we} 
                                size="small" 
                                sx={{ bgcolor: 'rgba(249, 115, 22, 0.08)', color: '#f97316', fontWeight: 500, fontSize: '0.75rem', height: 20 }}
                              />
                            ))}
                          </Stack>
                        </TableCell>

                        {/* Functions / Requirements */}
                        <TableCell>
                          <Stack spacing={0.5}>
                            {row.functions?.map((f, i) => (
                              <Typography key={i} variant="body2" sx={{ fontSize: '0.8rem', color: 'text.primary' }}>
                                • {f.name}
                              </Typography>
                            ))}
                          </Stack>
                        </TableCell>

                        {/* Failure Effects */}
                        <TableCell>
                          <Stack spacing={0.5}>
                            {row.effects?.map((eff, i) => (
                              <Typography key={i} variant="body2" sx={{ fontSize: '0.8rem', color: 'text.primary' }}>
                                • {eff.name}
                              </Typography>
                            ))}
                          </Stack>
                        </TableCell>

                        {/* Severity */}
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Select
                            value={row.severity || ''}
                            onChange={(e) => handleRatingChange(row.id, 'severity', e.target.value)}
                            size="small"
                            variant="standard"
                            disableUnderline
                            sx={{
                              fontSize: '0.85rem',
                              fontWeight: 'bold',
                              color: row.severity && row.severity >= 8 ? 'error.main' : 'text.primary'
                            }}
                          >
                            <MenuItem value="">-</MenuItem>
                            {ratingOptions.map(o => (
                              <MenuItem key={o} value={o}>{o}</MenuItem>
                            ))}
                          </Select>
                        </TableCell>

                        {/* Failure Modes */}
                        <TableCell>
                          <Stack spacing={0.5}>
                            {row.failureModes?.map((fm, i) => (
                              <Typography key={i} variant="body2" sx={{ fontSize: '0.8rem', color: 'text.primary' }}>
                                • {fm.name}
                              </Typography>
                            ))}
                          </Stack>
                        </TableCell>

                        {/* Failure Causes */}
                        <TableCell>
                          <Stack spacing={0.5}>
                            {row.causes?.map((c, i) => (
                              <Typography key={i} variant="body2" sx={{ fontSize: '0.8rem', color: 'text.primary' }}>
                                • {c.name}
                              </Typography>
                            ))}
                          </Stack>
                        </TableCell>

                        {/* Prevention Controls */}
                        <TableCell>
                          <Stack spacing={0.5}>
                            {row.controls?.filter(c => c.type === 'prevention').map((c, i) => (
                              <Typography key={i} variant="body2" sx={{ fontSize: '0.8rem', color: 'text.primary' }}>
                                • {c.name}
                              </Typography>
                            ))}
                          </Stack>
                        </TableCell>

                        {/* Occurrence */}
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Select
                            value={row.occurrence || ''}
                            onChange={(e) => handleRatingChange(row.id, 'occurrence', e.target.value)}
                            size="small"
                            variant="standard"
                            disableUnderline
                            sx={{
                              fontSize: '0.85rem',
                              fontWeight: 'bold',
                              color: row.occurrence && row.occurrence >= 8 ? 'error.main' : 'text.primary'
                            }}
                          >
                            <MenuItem value="">-</MenuItem>
                            {ratingOptions.map(o => (
                              <MenuItem key={o} value={o}>{o}</MenuItem>
                            ))}
                          </Select>
                        </TableCell>

                        {/* Detection Controls */}
                        <TableCell>
                          <Stack spacing={0.5}>
                            {row.controls?.filter(c => c.type === 'detection').map((c, i) => (
                              <Typography key={i} variant="body2" sx={{ fontSize: '0.8rem', color: 'text.primary' }}>
                                • {c.name}
                              </Typography>
                            ))}
                          </Stack>
                        </TableCell>

                        {/* Detection */}
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Select
                            value={row.detection || ''}
                            onChange={(e) => handleRatingChange(row.id, 'detection', e.target.value)}
                            size="small"
                            variant="standard"
                            disableUnderline
                            sx={{
                              fontSize: '0.85rem',
                              fontWeight: 'bold',
                              color: row.detection && row.detection >= 8 ? 'error.main' : 'text.primary'
                            }}
                          >
                            <MenuItem value="">-</MenuItem>
                            {ratingOptions.map(o => (
                              <MenuItem key={o} value={o}>{o}</MenuItem>
                            ))}
                          </Select>
                        </TableCell>

                        {/* AP */}
                        <TableCell sx={{ textAlign: 'center' }}>
                          {row.ap ? (
                            <Chip
                              label={row.ap}
                              size="small"
                              sx={{
                                fontWeight: 'bold',
                                color: 'white',
                                bgcolor: row.ap === 'H' ? 'error.main' : row.ap === 'M' ? 'warning.main' : 'success.main'
                              }}
                            />
                          ) : '-'}
                        </TableCell>

                        {/* Filter Code */}
                        <TableCell>
                          <TextField
                            {...({
                              value: row.filterCode || '',
                              onChange: (e: any) => handleRatingChange(row.id, 'filterCode', e.target.value),
                              placeholder: "Add code...",
                              size: "small",
                              variant: "standard",
                              InputProps: { disableUnderline: true }
                            } as any)}
                            sx={{ '& .MuiInputBase-input': { fontSize: '0.825rem', py: 0.25 } }}
                          />
                        </TableCell>

                        {/* Row actions */}
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'center' }}>
                            <IconButton 
                              size="small" 
                              onClick={() => {
                                setActiveRow(row);
                                setEditorOpen(true);
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeleteRow(row.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>

                      {/* Expanded actions section */}
                      <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={17}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ margin: 2 }}>
                              <Typography variant="subtitle2" gutterBottom component="div" sx={{ fontWeight: 'bold' }}>
                                Corrective Actions (AIAG-VDA Step 6)
                              </Typography>
                              
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<ActionsIcon />}
                                onClick={() => {
                                  setSelectedRowForAction(row);
                                  setActionDialogOpen(true);
                                }}
                                sx={{ mb: 2 }}
                              >
                                Create Corrective Action
                              </Button>
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
        onSave={handleSaveEditorRow}
        fmeaType="DFMEA"
      />

      {/* Add Row Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Append DFMEA Row</DialogTitle>
        <DialogContent sx={{ minWidth: 350 }}>
          <Stack spacing={2} sx={{ mt: 1.5 }}>
            <Select
              value={selectedStepId}
              onChange={(e) => setSelectedStepId(e.target.value as string)}
              displayEmpty
              fullWidth
              size="small"
            >
              <MenuItem value="" disabled>Select Focus Element</MenuItem>
              {steps.map(s => (
                <MenuItem key={s.id} value={s.id}>{s.stepNumber} - {s.name}</MenuItem>
              ))}
            </Select>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={() => setAddDialogOpen(false)} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleAddRow} variant="contained" disabled={!selectedStepId}>
            Append Row
          </Button>
        </DialogActions>
      </Dialog>

      {/* Corrective Action Dialog */}
      <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Create Corrective Action (DFMEA)</DialogTitle>
        <DialogContent sx={{ minWidth: 400 }}>
          <Stack spacing={2.5} sx={{ mt: 1.5 }}>
            <TextField
              label="Action Description"
              value={actionDescription}
              onChange={(e) => setActionDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
              size="small"
            />
            <Select
              value={actionOwnerId}
              onChange={(e) => setActionOwnerId(e.target.value as string)}
              displayEmpty
              fullWidth
              size="small"
            >
              <MenuItem value="" disabled>Select Responsible Owner</MenuItem>
              {users.map(u => (
                <MenuItem key={u.id} value={u.id}>{u.name} ({u.email})</MenuItem>
              ))}
            </Select>
            <TextField
              {...({
                type: "date",
                label: "Target Completion Date",
                value: actionDueDate,
                onChange: (e: any) => setActionDueDate(e.target.value),
                fullWidth: true,
                size: "small",
                InputLabelProps: { shrink: true }
              } as any)}
            />
            <Select
              value={actionPriority}
              onChange={(e) => setActionPriority(e.target.value as string)}
              fullWidth
              size="small"
            >
              <MenuItem value="low">Low Priority</MenuItem>
              <MenuItem value="medium">Medium Priority</MenuItem>
              <MenuItem value="high">High Priority</MenuItem>
            </Select>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={() => setActionDialogOpen(false)} variant="outlined">
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

      {/* Generic Add Tree Element Dialog */}
      <Dialog open={treeAddType !== null} onClose={() => setTreeAddType(null)}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Add {treeAddType === 'workElement' ? 'Component Element' : treeAddType === 'function' ? 'Function' : 'Failure'}
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
        docType="DFMEA"
        projectName={projectName}
        data={rows}
        steps={steps}
      />
    </Box>
  );
};
