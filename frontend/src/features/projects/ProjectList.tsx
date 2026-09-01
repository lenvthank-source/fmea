import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Grid, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Alert, FormControlLabel, Chip, Radio, RadioGroup,
  Stepper, Step, StepLabel, IconButton, Menu, MenuItem, ListItemIcon, ListItemText,
  TableContainer, Table, TableHead, TableBody, TableRow, TableCell, Paper, Tabs, Tab,
  Card, CardContent, Tooltip, Divider, Stack, Avatar, ToggleButton, ToggleButtonGroup,
  FormControl, InputLabel, Select, Checkbox, Pagination
} from '@mui/material';
import {
  Add as AddIcon, MoreVert as MoreVertIcon, Delete as DeleteIcon, Edit as EditIcon,
  GridView as GridIcon, ViewList as ListIcon, ContentCopy as ContentCopyIcon,
  CheckCircle as CheckCircleIcon, Security as ShieldCheckIcon, TrendingUp as TrendingUpIcon,
  Search as SearchIcon, Bolt as BoltIcon, HistoryEdu as AuditIcon,
  Layers as LayersIcon
} from '@mui/icons-material';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import { dialogSelectProps } from '../../theme/muiSelectConfig';
import { DashboardSkeleton } from '../../components/Layout/DashboardSkeleton';
import { useToast, getToastSeverity } from '../../components/Toast/ToastProvider';
import { parseApiError } from '../../lib/api';
import { unwrapPaginated } from '../../lib/pagination';

interface Project {
  id: string;
  name: string;
  description?: string;
  customer?: string;
  modelYear?: string;
  status: string;
  createdAt: string;
  documentTypes?: string[];
  organisationName?: string;
  organisationCode?: string;
  orgPartNumber?: string;
  organisationPlant?: string;
  customerPartNumber?: string;
  partName?: string;
  keyContact?: string;
  latestChangeLevel?: string;
  drawingRevDate?: string;
  dwgNumber?: string;
  dwgRevNoAndDate?: string;
  preliminaryFinalFlag?: string;
  documentNumber?: string;
  controlPlanNumber?: string;
  assemblyLineNumber?: string;
  originationDate?: string;
  supplierApprovalDate?: string;
  cftMembers?: string[];
  customerEngApprover?: string;
  customerEngApprovalDate?: string;
  customerQualApprover?: string;
  customerQualApprovalDate?: string;
  otherApprover?: string;
  otherApprovalDate2?: string;
  revisionNumber?: string;
  updatedAt: string;
}

export const ProjectList: React.FC = () => {
  const { token, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(9);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');

  // Wizard Dialog State
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Step 1: Basic Info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [modelYear, setModelYear] = useState('');
  const [documentTypes, setDocumentTypes] = useState<string[]>(['Prototype']); // default

  // Step 2: Organisation & Part Info
  const [organisationName, setOrganisationName] = useState('');
  const [organisationCode, setOrganisationCode] = useState('');
  const [orgPartNumber, setOrgPartNumber] = useState('');
  const [organisationPlant, setOrganisationPlant] = useState('');
  const [customer, setCustomer] = useState('');
  const [customerPartNumber, setCustomerPartNumber] = useState('');
  const [partName, setPartName] = useState('');
  const [keyContact, setKeyContact] = useState('');
  const [latestChangeLevel, setLatestChangeLevel] = useState('');
  const [drawingRevDate, setDrawingRevDate] = useState('');

  // Step 3: Document Control & Approvals
  const [dwgNumber, setDwgNumber] = useState('');
  const [dwgRevNoAndDate, setDwgRevNoAndDate] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [controlPlanNumber, setControlPlanNumber] = useState('');
  const [assemblyLineNumber, setAssemblyLineNumber] = useState('');
  const [originationDate, setOriginationDate] = useState(new Date().toISOString().split('T')[0]);
  const [supplierApprovalDate, setSupplierApprovalDate] = useState('');
  
  // Import from existing project state
  const [sourceProjectId, setSourceProjectId] = useState('');
  const [importTypes, setImportTypes] = useState<string[]>([]);

  // CFT Members
  const [cftMembers, setCftMembers] = useState<string[]>([]);
  const [newCftMember, setNewCftMember] = useState('');

  // Approval fields
  const [customerEngApprover, setCustomerEngApprover] = useState('');
  const [customerEngApprovalDate, setCustomerEngApprovalDate] = useState('');
  const [customerQualApprover, setCustomerQualApprover] = useState('');
  const [customerQualApprovalDate, setCustomerQualApprovalDate] = useState('');
  const [otherApprover, setOtherApprover] = useState('');
  const [otherApprovalDate2, setOtherApprovalDate2] = useState('');

  // Delete project state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuProjectId, setMenuProjectId] = useState<string | null>(null);

  // Edit project state
  const [isEditing, setIsEditing] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => (localStorage.getItem('dashboard-view-mode') as 'grid' | 'table') || 'grid');

  // Auto-suggest Document Number when step 3 is reached
  useEffect(() => {
    if (step === 3 && !documentNumber) {
      const year = new Date().getFullYear();
      const count = String(total + 1).padStart(4, '0');
      setDocumentNumber(`DOC-${year}-${count}`);
    }
  }, [step, total]);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (activeTab === 'archived') params.set('status', 'archived');
      if (searchQuery) params.set('search', searchQuery);
      const url = `${API_BASE_URL}/projects?${params.toString()}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const msg = await parseApiError(response, 'Failed to load projects');
        throw new Error(msg);
      }
      const payload = await response.json();
      const { data, total: t } = unwrapPaginated<Project>(payload);
      setProjects(data);
      setTotal(t);
    } catch (err: any) {
      const msg = err.message || 'An error occurred';
      setError(msg);
      showToast(msg, getToastSeverity(msg));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const h = setTimeout(() => { setPage(1); setSearchQuery(searchInput); }, 350);
    return () => clearTimeout(h);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  useEffect(() => {
    if (token) {
      fetchProjects();
    }
  }, [token, activeTab, page, limit, searchQuery]);

  const handleDeleteProject = async () => {
    if (!deleteTargetId) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/projects/${deleteTargetId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const msg = await parseApiError(res, 'Failed to delete project');
        throw new Error(msg);
      }
      // keep local optimistic update but also refresh from server to fix pagination total
      setProjects(prev => prev.filter(p => p.id !== deleteTargetId));
      setTotal(prev => Math.max(0, prev - 1));
      fetchProjects();
    } catch (err: any) {
      const msg = err.message || 'Failed to delete project';
      setError(msg);
      showToast(msg, getToastSeverity(msg));
    } finally {
      setDeleteLoading(false);
      setDeleteConfirmOpen(false);
      setDeleteTargetId(null);
    }
  };

  const handleArchiveProject = async (projectId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'archived' })
      });
      if (!res.ok) {
        const msg = await parseApiError(res, 'Failed to archive project');
        throw new Error(msg);
      }
      fetchProjects();
    } catch (err: any) {
      const msg = err.message || 'Failed to archive project';
      setError(msg);
      showToast(msg, getToastSeverity(msg));
    }
  };

  const handleRestoreProject = async (projectId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'active' })
      });
      if (!res.ok) {
        const msg = await parseApiError(res, 'Failed to restore project');
        throw new Error(msg);
      }
      fetchProjects();
    } catch (err: any) {
      const msg = err.message || 'Failed to restore project';
      setError(msg);
      showToast(msg, getToastSeverity(msg));
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setIsEditing(false);
    setEditingProjectId(null);
    setStep(1);
    setCreateError(null);
  };

  const handleEditClick = (project: Project) => {
    setIsEditing(true);
    setEditingProjectId(project.id);
    setName(project.name || '');
    setDescription(project.description || '');
    setCustomer(project.customer || '');
    setModelYear(project.modelYear || '');
    setDocumentTypes(project.documentTypes || ['Prototype']);
    setOrganisationName(project.organisationName || '');
    setOrganisationCode(project.organisationCode || '');
    setOrgPartNumber(project.orgPartNumber || '');
    setOrganisationPlant(project.organisationPlant || '');
    setCustomerPartNumber(project.customerPartNumber || '');
    setPartName(project.partName || '');
    setKeyContact(project.keyContact || '');
    setLatestChangeLevel(project.latestChangeLevel || '');
    setDrawingRevDate(project.drawingRevDate ? new Date(project.drawingRevDate).toISOString().split('T')[0] : '');
    setDwgNumber(project.dwgNumber || '');
    setDwgRevNoAndDate(project.dwgRevNoAndDate || '');
    setDocumentNumber(project.documentNumber || '');
    setControlPlanNumber(project.controlPlanNumber || '');
    setAssemblyLineNumber(project.assemblyLineNumber || '');
    setOriginationDate(project.originationDate ? new Date(project.originationDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setSupplierApprovalDate(project.supplierApprovalDate ? new Date(project.supplierApprovalDate).toISOString().split('T')[0] : '');
    setCftMembers(project.cftMembers || []);
    setCustomerEngApprover(project.customerEngApprover || '');
    setCustomerEngApprovalDate(project.customerEngApprovalDate ? new Date(project.customerEngApprovalDate).toISOString().split('T')[0] : '');
    setCustomerQualApprover(project.customerQualApprover || '');
    setCustomerQualApprovalDate(project.customerQualApprovalDate ? new Date(project.customerQualApprovalDate).toISOString().split('T')[0] : '');
    setOtherApprover(project.otherApprover || '');
    setOtherApprovalDate2(project.otherApprovalDate2 ? new Date(project.otherApprovalDate2).toISOString().split('T')[0] : '');
    
    setOpen(true);
    setStep(1);
    setCreateError(null);
  };

  const handleDuplicateClick = (project: Project) => {
    setIsEditing(false);
    setEditingProjectId(null);
    setName(`${project.partName || project.name || 'Untitled'} — copy`);
    setDescription(project.description || '');
    setCustomer('');
    setModelYear(project.modelYear || '');
    setDocumentTypes(project.documentTypes || ['Prototype']);
    setOrganisationName(project.organisationName || '');
    setOrganisationCode(project.organisationCode || '');
    setOrgPartNumber('');
    setOrganisationPlant(project.organisationPlant || '');
    setCustomerPartNumber('');
    setPartName(project.partName || '');
    setKeyContact(project.keyContact || '');
    setLatestChangeLevel(project.latestChangeLevel || '');
    setDrawingRevDate('');
    setDwgNumber(project.dwgNumber || '');
    setDwgRevNoAndDate(project.dwgRevNoAndDate || '');
    setDocumentNumber('');
    setControlPlanNumber(project.controlPlanNumber || '');
    setAssemblyLineNumber(project.assemblyLineNumber || '');
    setOriginationDate(new Date().toISOString().split('T')[0]);
    setSupplierApprovalDate('');
    setCftMembers(project.cftMembers || []);
    setCustomerEngApprover(project.customerEngApprover || '');
    setCustomerEngApprovalDate('');
    setCustomerQualApprover(project.customerQualApprover || '');
    setCustomerQualApprovalDate('');
    setOtherApprover(project.otherApprover || '');
    setOtherApprovalDate2('');
    setSourceProjectId(project.id);
    setImportTypes(['PFD', 'PFMEA', 'DFMEA', 'CONTROL_PLAN']);
    setOpen(true);
    setStep(1);
    setCreateError(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      handleNext();
      return;
    }

    setCreateLoading(true);
    setCreateError(null);

    const projectPayload = {
      name,
      description,
      customer,
      modelYear,
      documentTypes,
      organisationName,
      organisationCode: organisationCode || null,
      orgPartNumber: orgPartNumber || null,
      organisationPlant: organisationPlant || null,
      customerPartNumber: customerPartNumber || null,
      partName,
      keyContact: keyContact || null,
      latestChangeLevel: latestChangeLevel || null,
      drawingRevDate: drawingRevDate || null,
      documentNumber: documentNumber || null,
      controlPlanNumber: controlPlanNumber || null,
      assemblyLineNumber: assemblyLineNumber || null,
      originationDate: originationDate || null,
      supplierApprovalDate: supplierApprovalDate || null,
      cftMembers,
      customerEngApprover: customerEngApprover || null,
      customerEngApprovalDate: customerEngApprovalDate || null,
      customerQualApprover: customerQualApprover || null,
      customerQualApprovalDate: customerQualApprovalDate || null,
      otherApprover: otherApprover || null,
      otherApprovalDate2: otherApprovalDate2 || null,
      dwgNumber: dwgNumber || null,
      dwgRevNoAndDate: dwgRevNoAndDate || null,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/projects/${editingProjectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(projectPayload),
      });

      if (!response.ok) {
        const msg = await parseApiError(response, 'Failed to update project');
        throw new Error(msg);
      }

      await fetchProjects();
      handleClose();
    } catch (err: any) {
      const msg = err.message || 'Could not update project';
      setCreateError(msg);
      showToast(msg, getToastSeverity(msg));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setIsEditing(false);
    setEditingProjectId(null);
    // Reset all fields
    setName('');
    setDescription('');
    setCustomer('');
    setModelYear('');
    setDocumentTypes(['Prototype']);
    setOrganisationName('');
    setOrganisationCode('');
    setOrgPartNumber('');
    setOrganisationPlant('');
    setCustomerPartNumber('');
    setPartName('');
    setKeyContact('');
    setLatestChangeLevel('');
    setDrawingRevDate('');
    setDwgNumber('');
    setDwgRevNoAndDate('');
    setDocumentNumber('');
    setControlPlanNumber('');
    setAssemblyLineNumber('');
    setOriginationDate(new Date().toISOString().split('T')[0]);
    setSupplierApprovalDate('');
    setCftMembers([]);
    setNewCftMember('');
    setCustomerEngApprover('');
    setCustomerEngApprovalDate('');
    setCustomerQualApprover('');
    setCustomerQualApprovalDate('');
    setOtherApprover('');
    setOtherApprovalDate2('');
    setSourceProjectId('');
    setImportTypes([]);
    setStep(1);
    setCreateError(null);
  };


  const validateStep = () => {
    if (step === 1) {
      if (!partName.trim()) return 'Part Name / Description is required';
      if (!orgPartNumber.trim()) return 'Organisation Part No. is required';
      if (documentTypes.length === 0) return 'At least one Document Type must be selected';
    } else if (step === 2) {
      if (!organisationName.trim()) return 'Organisation Name is required';
      if (!customer.trim()) return 'Customer is required';
    }
    return null;
  };

  const handleNext = () => {
    const validationError = validateStep();
    if (validationError) {
      setCreateError(validationError);
      return;
    }
    setCreateError(null);
    setStep(step + 1);
  };

  const handleBack = () => {
    setCreateError(null);
    setStep(step - 1);
  };

  const addCftMember = () => {
    if (newCftMember.trim() && !cftMembers.includes(newCftMember.trim())) {
      setCftMembers([...cftMembers, newCftMember.trim()]);
      setNewCftMember('');
    }
  };

  const removeCftMember = (member: string) => {
    setCftMembers(cftMembers.filter((m) => m !== member));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      handleNext();
      return;
    }

    setCreateLoading(true);
    setCreateError(null);

    const projectPayload = {
      name,
      description,
      customer,
      modelYear,
      documentTypes,
      organisationName,
      organisationCode: organisationCode || null,
      orgPartNumber: orgPartNumber || null,
      organisationPlant: organisationPlant || null,
      customerPartNumber: customerPartNumber || null,
      partName,
      keyContact: keyContact || null,
      latestChangeLevel: latestChangeLevel || null,
      drawingRevDate: drawingRevDate || null,
      documentNumber: documentNumber || null,
      controlPlanNumber: controlPlanNumber || null,
      assemblyLineNumber: assemblyLineNumber || null,
      originationDate: originationDate || null,
      supplierApprovalDate: supplierApprovalDate || null,
      cftMembers,
      customerEngApprover: customerEngApprover || null,
      customerEngApprovalDate: customerEngApprovalDate || null,
      customerQualApprover: customerQualApprover || null,
      customerQualApprovalDate: customerQualApprovalDate || null,
      otherApprover: otherApprover || null,
      otherApprovalDate2: otherApprovalDate2 || null,
      dwgNumber: dwgNumber || null,
      dwgRevNoAndDate: dwgRevNoAndDate || null,
      sourceProjectId: sourceProjectId || null,
      importTypes: sourceProjectId ? importTypes : [],
    };

    try {
      const response = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(projectPayload),
      });

      if (!response.ok) {
        const msg = await parseApiError(response, 'Failed to create project');
        throw new Error(msg);
      }

      await fetchProjects();
      handleClose();
    } catch (err: any) {
      const msg = err.message || 'Could not create project';
      setCreateError(msg);
      showToast(msg, getToastSeverity(msg));
    } finally {
      setCreateLoading(false);
    }
  };

  // Phase filter for fast filtering
  const [phaseFilter, setPhaseFilter] = useState<string>('All');

  // Simulated recent quality activities for the Shadcn Recent Activity widget
  const recentActivities = [
    { id: '1', initials: 'JD', color: '#09090b', title: 'Rev C Revision Locked & Signed', sub: 'Drive Unit Housing · 21 CFR Part 11', time: '2h ago' },
    { id: '2', initials: 'MK', color: '#ef4444', title: 'High-AP Action ACT-102 Verified', sub: 'Bearing Seat Press-Fit · Evidence in R2', time: '5h ago' },
    { id: '3', initials: 'SL', color: '#10b981', title: 'PFD ↔ PFMEA Synchronized', sub: 'Transducer Torque Station · 0 Orphans', time: '1d ago' },
    { id: '4', initials: 'AK', color: '#816729', title: 'Control Plan Rev B Generated', sub: 'Laser Weld Bracket Assembly', time: '2d ago' },
    { id: '5', initials: 'TC', color: '#6366f1', title: 'Safe Launch Checklist Completed', sub: 'EOL Vision Inspection Gate', time: '3d ago' },
  ];

  return (
    <Box sx={{ maxWidth: '1440px', mx: 'auto', px: { xs: 1, sm: 2, md: 3 }, py: { xs: 1.5, sm: 2.5 } }}>
      {/* ── Shadcn Top Dashboard Header ───────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 800, letterSpacing: '-0.03em', color: '#09090b', fontSize: { xs: '1.5rem', sm: '1.875rem' } }}>
            Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: '#71717a', fontWeight: 500, mt: 0.5 }}>
            Manage manufacturing quality programs, AIAG-VDA risk matrices, and 21 CFR Part 11 control plans.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', width: { xs: '100%', sm: 'auto' } }}>
          <Button 
            variant="contained" 
            startIcon={<AddIcon fontSize="small" />} 
            onClick={handleOpen}
            sx={{ 
              borderRadius: '8px', 
              height: 38, 
              px: 2.5, 
              fontWeight: 600, 
              textTransform: 'none', 
              fontSize: '0.825rem',
              bgcolor: '#09090b',
              color: '#ffffff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              '&:hover': { bgcolor: '#27272a', boxShadow: 'none' }
            }}
          >
            + Create Project
          </Button>
        </Stack>
      </Box>

      {/* ── Shadcn Segmented Tab Navigation ───────────────────── */}
      <Box sx={{ mb: 3 }}>
        <Paper
          sx={{
            display: 'inline-flex',
            p: 0.5,
            borderRadius: '8px',
            bgcolor: '#f4f4f5',
            border: '1px solid #e4e4e7',
            boxShadow: 'none'
          }}
        >
          <Tabs 
            value={activeTab} 
            onChange={(_, newValue) => { setActiveTab(newValue); setPage(1); }} 
            sx={{ 
              minHeight: 32,
              '& .MuiTabs-indicator': { display: 'none' },
              '& .MuiTab-root': { 
                minHeight: 32, 
                py: 0.5, 
                px: 2, 
                borderRadius: '6px', 
                fontSize: '0.825rem', 
                fontWeight: 600, 
                textTransform: 'none',
                color: '#71717a',
                '&.Mui-selected': { 
                  bgcolor: '#ffffff', 
                  color: '#09090b', 
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)' 
                }
              }
            }}
          >
            <Tab label="Overview" value="active" />
            <Tab label="Archived Programs" value="archived" />
          </Tabs>
        </Paper>
      </Box>

      {/* ── Shadcn 4-Card Bento KPI Grid ──────────────────────── */}
      {(() => {
        const productionCount = projects.filter(p => p.documentTypes?.[0] === 'Production').length;
        const prototypeCount = projects.filter(p => p.documentTypes?.[0] === 'Prototype').length;
        const preLaunchCount = projects.filter(p => p.documentTypes?.[0] === 'Pre-Launch').length;
        const safeLaunchCount = projects.filter(p => p.documentTypes?.[0] === 'Safe Launch').length;

        return (
          <Grid container spacing={2} sx={{ mb: 3.5 }}>
            {/* KPI 1: Active Programs */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper sx={{ p: 2.5, borderRadius: '12px', border: '1px solid #e4e4e7', bgcolor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'all 0.2s', '&:hover': { borderColor: '#d4d4d8' } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#71717a', fontSize: '0.75rem' }}>
                    Active Programs
                  </Typography>
                  <LayersIcon sx={{ fontSize: 18, color: '#71717a' }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#09090b', letterSpacing: '-0.02em', my: 0.5 }}>
                  {projects.length}
                </Typography>
                <Typography variant="caption" sx={{ color: '#71717a', display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.75rem' }}>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>↑ +2</span> this quarter · 100% tenant-isolated
                </Typography>
              </Paper>
            </Grid>

            {/* KPI 2: Production Phase */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper sx={{ p: 2.5, borderRadius: '12px', border: '1px solid #e4e4e7', bgcolor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'all 0.2s', '&:hover': { borderColor: '#d4d4d8' } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#71717a', fontSize: '0.75rem' }}>
                    Production Phase
                  </Typography>
                  <ShieldCheckIcon sx={{ fontSize: 18, color: '#10b981' }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#09090b', letterSpacing: '-0.02em', my: 0.5 }}>
                  {productionCount}
                </Typography>
                <Typography variant="caption" sx={{ color: '#71717a', display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.75rem' }}>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>● Active</span> Serialized production lines
                </Typography>
              </Paper>
            </Grid>

            {/* KPI 3: Pre-Production & Prototypes */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper sx={{ p: 2.5, borderRadius: '12px', border: '1px solid #e4e4e7', bgcolor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'all 0.2s', '&:hover': { borderColor: '#d4d4d8' } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#71717a', fontSize: '0.75rem' }}>
                    Prototypes & Launches
                  </Typography>
                  <TrendingUpIcon sx={{ fontSize: 18, color: '#f59e0b' }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#09090b', letterSpacing: '-0.02em', my: 0.5 }}>
                  {prototypeCount + preLaunchCount + safeLaunchCount}
                </Typography>
                <Typography variant="caption" sx={{ color: '#71717a', display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.75rem' }}>
                  <span style={{ color: '#f59e0b', fontWeight: 700 }}>⚡ Gated</span> Safe Launch verification active
                </Typography>
              </Paper>
            </Grid>

            {/* KPI 4: Audit Readiness */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper sx={{ p: 2.5, borderRadius: '12px', border: '1px solid #e4e4e7', bgcolor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'all 0.2s', '&:hover': { borderColor: '#d4d4d8' } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#71717a', fontSize: '0.75rem' }}>
                    Audit Readiness
                  </Typography>
                  <CheckCircleIcon sx={{ fontSize: 18, color: '#0284c7' }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#09090b', letterSpacing: '-0.02em', my: 0.5 }}>
                  99.8%
                </Typography>
                <Typography variant="caption" sx={{ color: '#71717a', display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.75rem' }}>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>✓ Compliant</span> 21 CFR Part 11 signatures
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        );
      })()}

      {activeTab === 'archived' && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: '8px', fontWeight: 550, bgcolor: '#fffbeb', border: '1px solid #fde68a' }}>
          ⚠️ Archived projects are hidden from active workspaces and will be permanently deleted after 30 days.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '8px', bgcolor: '#fef2f2', border: '1px solid #fecaca' }}>
          {error}
        </Alert>
      )}

      {/* ── Main Dashboard Content ────────────────────────────── */}
      {(() => {
        const filteredProjects = phaseFilter === 'All' 
          ? projects 
          : projects.filter(p => p.documentTypes?.[0] === phaseFilter);

        return (
          <Grid container spacing={3}>
            {/* Left Column: Programs (8 cols on desktop, 12 on mobile) */}
            <Grid size={{ xs: 12, lg: activeTab === 'archived' ? 12 : 8 }}>
              <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: '14px', border: '1px solid #e4e4e7', bgcolor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                {/* Search, Filter Pills & View Toggles */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 750, color: '#09090b', letterSpacing: '-0.01em' }}>
                      {activeTab === 'archived' ? 'Archived Quality Workspaces' : 'Quality Programs'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#71717a' }}>
                      {filteredProjects.length} program{filteredProjects.length === 1 ? '' : 's'} with linked PFD, PFMEA, and Control Plans
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1.5} sx={{ width: { xs: '100%', sm: 'auto' }, alignItems: 'center' }}>
                    <TextField
                      placeholder="Search programs... (⌘K)"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      size="small"
                      variant="outlined"
                      slotProps={{
                        input: {
                          startAdornment: <SearchIcon sx={{ fontSize: 18, color: '#a1a1aa', mr: 1 }} />
                        }
                      }}
                      sx={{ 
                        width: { xs: '100%', sm: 240 }, 
                        '& .MuiOutlinedInput-root': {
                          height: 36,
                          borderRadius: '8px',
                          fontSize: '0.825rem',
                          bgcolor: '#f4f4f5',
                          '& fieldset': { borderColor: '#e4e4e7' },
                          '&:hover fieldset': { borderColor: '#d4d4d8' },
                        }
                      }}
                    />

                    <ToggleButtonGroup
                      value={viewMode}
                      exclusive
                      onChange={(_, value) => value && setViewMode(value)}
                      size="small"
                      sx={{ bgcolor: '#f4f4f5', p: 0.25, borderRadius: '8px', border: '1px solid #e4e4e7' }}
                    >
                      <ToggleButton value="grid" sx={{ border: 'none', borderRadius: '6px', px: 1, py: 0.5, '&.Mui-selected': { bgcolor: '#ffffff', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' } }}>
                        <GridIcon fontSize="small" sx={{ fontSize: 18 }} />
                      </ToggleButton>
                      <ToggleButton value="table" sx={{ border: 'none', borderRadius: '6px', px: 1, py: 0.5, '&.Mui-selected': { bgcolor: '#ffffff', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' } }}>
                        <ListIcon fontSize="small" sx={{ fontSize: 18 }} />
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Stack>
                </Box>

                {/* Phase Filter Pills (Shadcn style) */}
                {activeTab !== 'archived' && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                    {['All', 'Prototype', 'Pre-Launch', 'Safe Launch', 'Production'].map((phase) => (
                      <Button
                        key={phase}
                        size="small"
                        onClick={() => setPhaseFilter(phase)}
                        sx={{
                          borderRadius: '6px',
                          textTransform: 'none',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          py: 0.4,
                          px: 1.5,
                          minWidth: 0,
                          border: '1px solid',
                          borderColor: phaseFilter === phase ? '#09090b' : '#e4e4e7',
                          bgcolor: phaseFilter === phase ? '#09090b' : '#ffffff',
                          color: phaseFilter === phase ? '#ffffff' : '#71717a',
                          '&:hover': {
                            bgcolor: phaseFilter === phase ? '#27272a' : '#f4f4f5',
                            borderColor: phaseFilter === phase ? '#27272a' : '#d4d4d8',
                          }
                        }}
                      >
                        {phase}
                      </Button>
                    ))}
                  </Box>
                )}

                {/* Content: Skeleton, Empty or Grid/Table */}
                {loading ? (
                  <DashboardSkeleton showMascot={!token} />
                ) : filteredProjects.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8, px: 3, border: '1px dashed #e4e4e7', borderRadius: '12px', bgcolor: '#fafafa' }}>
                    <Typography color="text.secondary" gutterBottom sx={{ fontWeight: 500, fontSize: '0.9rem' }}>
                      {searchQuery 
                        ? 'No programs matched your search query.' 
                        : (activeTab === 'archived' ? 'No archived programs found.' : 'No projects found in this workspace.')
                      }
                    </Typography>
                    {!searchQuery && activeTab !== 'archived' && (
                      <Button variant="outlined" startIcon={<AddIcon />} onClick={handleOpen} sx={{ mt: 2, borderRadius: '8px', fontWeight: 600, textTransform: 'none', borderColor: '#e4e4e7', color: '#09090b' }}>
                        Create Your First Program
                      </Button>
                    )}
                  </Box>
                ) : viewMode === 'grid' ? (
                  <>
                  <Grid container spacing={2.5}>
                    {filteredProjects.map((project) => {
                      const docType = project.documentTypes?.[0] || 'Prototype';
                      let docBadgeBg = '#fef3c7';
                      let docBadgeColor = '#b45309';
                      let docBorder = '#fde68a';
                      if (docType === 'Production') {
                        docBadgeBg = '#ecfdf5';
                        docBadgeColor = '#047857';
                        docBorder = '#a7f3d0';
                      } else if (docType === 'Safe Launch') {
                        docBadgeBg = '#f3e8ff';
                        docBadgeColor = '#6b21a8';
                        docBorder = '#d8b4fe';
                      } else if (docType === 'Pre-Launch') {
                        docBadgeBg = '#eff6ff';
                        docBadgeColor = '#1d4ed8';
                        docBorder = '#bfdbfe';
                      }

                      return (
                        <Grid size={{ xs: 12, sm: 6 }} key={project.id}>
                          <Card 
                            sx={{ 
                              height: '100%', 
                              display: 'flex', 
                              flexDirection: 'column', 
                              borderRadius: '12px', 
                              border: '1px solid #e4e4e7',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                              bgcolor: '#ffffff',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 8px 24px -8px rgba(0,0,0,0.12)',
                                borderColor: '#a1a1aa',
                              }
                            }}
                          >
                            <CardContent sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                <span 
                                  style={{ 
                                    padding: '2px 8px', 
                                    borderRadius: '9999px', 
                                    fontSize: '0.7rem', 
                                    fontWeight: 700, 
                                    backgroundColor: docBadgeBg, 
                                    color: docBadgeColor,
                                    border: `1px solid ${docBorder}`
                                  }}
                                >
                                  {docType}
                                </span>
                                <IconButton 
                                  size="small" 
                                  onClick={(e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); setMenuProjectId(project.id); }}
                                  sx={{ p: 0.5, color: '#71717a', '&:hover': { bgcolor: '#f4f4f5' } }}
                                >
                                  <MoreVertIcon fontSize="small" sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Box>

                              <Typography 
                                variant="subtitle1" 
                                component="div" 
                                onClick={() => navigate(`/app/projects/${project.id}/pfd`)}
                                sx={{ 
                                  fontWeight: 700, 
                                  color: '#09090b', 
                                  fontSize: '0.95rem', 
                                  cursor: 'pointer',
                                  mb: 0.5,
                                  lineHeight: 1.35,
                                  '&:hover': { color: '#09090b', textDecoration: 'underline' },
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  minHeight: '2.6rem'
                                }}
                              >
                                {project.partName || 'Untitled Program'}
                              </Typography>

                              <Typography variant="caption" sx={{ color: '#71717a', fontWeight: 600, display: 'block', mb: 2, fontSize: '0.75rem', fontFamily: 'monospace' }}>
                                PART NO: {project.orgPartNumber || '—'}
                              </Typography>

                              <Divider sx={{ my: 1.5, borderColor: '#f4f4f5' }} />

                              <Stack spacing={0.75} sx={{ flexGrow: 1, mb: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                  <Typography variant="caption" sx={{ color: '#71717a' }}>Customer:</Typography>
                                  <Typography variant="caption" sx={{ color: '#09090b', fontWeight: 600 }}>{project.customer || '—'}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                  <Typography variant="caption" sx={{ color: '#71717a' }}>Revision:</Typography>
                                  <Typography variant="caption" sx={{ color: '#09090b', fontWeight: 600 }}>v{project.revisionNumber || '1.0'}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                  <Typography variant="caption" sx={{ color: '#71717a' }}>Last Updated:</Typography>
                                  <Typography variant="caption" sx={{ color: '#09090b', fontWeight: 600 }}>
                                    {new Date(project.updatedAt).toLocaleDateString()}
                                  </Typography>
                                </Box>
                              </Stack>

                              <Divider sx={{ my: 1.5, borderColor: '#f4f4f5' }} />

                              <Stack direction="row" spacing={1} sx={{ mt: 'auto' }}>
                                <Tooltip title="Process Flow Diagram">
                                  <Button 
                                    size="small" 
                                    variant="outlined" 
                                    onClick={() => navigate(`/app/projects/${project.id}/pfd`)}
                                    sx={{ py: 0.5, px: 1, minWidth: 0, flexGrow: 1, fontSize: '0.7rem', fontWeight: 700, borderRadius: '6px', borderColor: '#e4e4e7', color: '#09090b', textTransform: 'none', '&:hover': { bgcolor: '#f4f4f5', borderColor: '#d4d4d8' } }}
                                  >
                                    PFD
                                  </Button>
                                </Tooltip>
                                <Tooltip title="Process FMEA">
                                  <Button 
                                    size="small" 
                                    variant="outlined" 
                                    onClick={() => navigate(`/app/projects/${project.id}/pfmea`)}
                                    sx={{ py: 0.5, px: 1, minWidth: 0, flexGrow: 1, fontSize: '0.7rem', fontWeight: 700, borderRadius: '6px', borderColor: '#e4e4e7', color: '#09090b', textTransform: 'none', '&:hover': { bgcolor: '#f4f4f5', borderColor: '#d4d4d8' } }}
                                  >
                                    PFMEA
                                  </Button>
                                </Tooltip>
                                <Tooltip title="Control Plan">
                                  <Button 
                                    size="small" 
                                    variant="outlined" 
                                    onClick={() => navigate(`/app/projects/${project.id}/control-plan`)}
                                    sx={{ py: 0.5, px: 1, minWidth: 0, flexGrow: 1, fontSize: '0.7rem', fontWeight: 700, borderRadius: '6px', borderColor: '#e4e4e7', color: '#09090b', textTransform: 'none', '&:hover': { bgcolor: '#f4f4f5', borderColor: '#d4d4d8' } }}
                                  >
                                    CP
                                  </Button>
                                </Tooltip>
                              </Stack>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                  <Box sx={{ display:'flex', justifyContent:'center', mt:3, alignItems:'center', gap:2, flexWrap:'wrap' }}>
                    <Pagination count={Math.max(1, Math.ceil(total/limit))} page={page} onChange={(_,v)=> setPage(v)} color="primary" />
                    <FormControl size="small" sx={{ minWidth:110 }}><InputLabel>Per page</InputLabel><Select value={limit} label="Per page" onChange={e=> {setLimit(Number(e.target.value)); setPage(1);}}>{[9,12,24,48].map(n=> <MenuItem key={n} value={n}>{n}</MenuItem>)}</Select></FormControl>
                    <Typography variant="caption" color="text.secondary">{total} projects</Typography>
                  </Box>
                  </>
                ) : (
                  <>
                  <TableContainer component={Paper} sx={{ border: '1px solid #e4e4e7', borderRadius: '10px', overflowX: 'auto', mt: 1, boxShadow: 'none' }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#fafafa' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#71717a' }}>Part Name</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#71717a' }}>Part Number</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#71717a' }}>Customer</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#71717a' }}>Phase</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#71717a' }}>Rev</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#71717a' }}>Updated</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#71717a', width: 60 }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredProjects.map((project) => (
                        <TableRow key={project.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                          <TableCell>
                            <Typography
                              onClick={() => navigate(`/app/projects/${project.id}/pfd`)}
                              sx={{ 
                                fontWeight: 650, 
                                color: '#09090b', 
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                '&:hover': { textDecoration: 'underline' }
                              }}
                            >
                              {project.partName || 'Untitled'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#71717a' }}>
                              {project.orgPartNumber || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{project.customer || '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={project.documentTypes?.[0] || 'Prototype'} 
                              size="small" 
                              sx={{ fontWeight: 650, fontSize: '0.7rem', height: 22 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={project.revisionNumber || '1.0'}
                              size="small"
                              sx={{ fontWeight: 600, fontSize: '0.7rem', height: 20, bgcolor: '#f4f4f5' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                              {new Date(project.updatedAt).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={(e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); setMenuProjectId(project.id); }}
                            >
                              <MoreVertIcon fontSize="small" sx={{ fontSize: 16 }} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box sx={{ display:'flex', justifyContent:'center', mt:3, alignItems:'center', gap:2, flexWrap:'wrap' }}>
                  <Pagination count={Math.max(1, Math.ceil(total/limit))} page={page} onChange={(_,v)=> setPage(v)} color="primary" />
                  <FormControl size="small" sx={{ minWidth:110 }}><InputLabel>Per page</InputLabel><Select value={limit} label="Per page" onChange={e=> {setLimit(Number(e.target.value)); setPage(1);}}>{[9,12,24,48].map(n=> <MenuItem key={n} value={n}>{n}</MenuItem>)}</Select></FormControl>
                  <Typography variant="caption" color="text.secondary">{total} projects</Typography>
                </Box>
                </>
              )}
            </Paper>
          </Grid>

          {/* Right Column: Recent Activity & Quick Actions (Only in Overview) */}
          {activeTab !== 'archived' && (
            <Grid size={{ xs: 12, lg: 4 }}>
              <Stack spacing={3}>
                {/* Recent Quality Activity Card (Shadcn Recent Sales pattern) */}
                <Paper sx={{ p: 3, borderRadius: '14px', border: '1px solid #e4e4e7', bgcolor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <Box sx={{ mb: 2.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 750, color: '#09090b', letterSpacing: '-0.01em' }}>
                      Recent Activity & Audits
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#71717a' }}>
                      Latest locks, digital sign-offs, and corrective actions.
                    </Typography>
                  </Box>

                  <Stack spacing={2.5}>
                    {recentActivities.map((act) => (
                      <Box key={act.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                        <Avatar sx={{ width: 34, height: 34, fontSize: '0.75rem', fontWeight: 700, bgcolor: act.color, color: '#ffffff' }}>
                          {act.initials}
                        </Avatar>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 650, fontSize: '0.825rem', color: '#09090b', lineHeight: 1.3 }}>
                            {act.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#71717a', display: 'block', fontSize: '0.75rem', mt: 0.25 }}>
                            {act.sub}
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: '#a1a1aa', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                          {act.time}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Paper>

                {/* Quick Quality Actions */}
                <Paper sx={{ p: 3, borderRadius: '14px', border: '1px solid #e4e4e7', bgcolor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 750, color: '#09090b', mb: 0.5 }}>
                    Quick Shortcuts
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#71717a', display: 'block', mb: 2 }}>
                    Fast actions for quality engineering CFT leads.
                  </Typography>

                  <Stack spacing={1.5}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<BoltIcon sx={{ color: '#ff682c' }} />}
                      onClick={handleOpen}
                      sx={{ 
                        justifyContent: 'flex-start', 
                        borderRadius: '8px', 
                        py: 1, 
                        textTransform: 'none', 
                        fontWeight: 600, 
                        fontSize: '0.825rem', 
                        borderColor: '#e4e4e7', 
                        color: '#09090b',
                        '&:hover': { bgcolor: '#f4f4f5', borderColor: '#d4d4d8' }
                      }}
                    >
                      + Create New Quality Program
                    </Button>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<AuditIcon sx={{ color: '#816729' }} />}
                      onClick={() => navigate('/app/actions')}
                      sx={{ 
                        justifyContent: 'flex-start', 
                        borderRadius: '8px', 
                        py: 1, 
                        textTransform: 'none', 
                        fontWeight: 600, 
                        fontSize: '0.825rem', 
                        borderColor: '#e4e4e7', 
                        color: '#09090b',
                        '&:hover': { bgcolor: '#f4f4f5', borderColor: '#d4d4d8' }
                      }}
                    >
                      Open Actions & Evidence Dashboard
                    </Button>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<ShieldCheckIcon sx={{ color: '#10b981' }} />}
                      onClick={() => navigate('/admin')}
                      sx={{ 
                        justifyContent: 'flex-start', 
                        borderRadius: '8px', 
                        py: 1, 
                        textTransform: 'none', 
                        fontWeight: 600, 
                        fontSize: '0.825rem', 
                        borderColor: '#e4e4e7', 
                        color: '#09090b',
                        '&:hover': { bgcolor: '#f4f4f5', borderColor: '#d4d4d8' }
                      }}
                    >
                      S/O/D Rating Scales Configuration
                    </Button>
                  </Stack>
                </Paper>
              </Stack>
            </Grid>
          )}
        </Grid>
      );
    })()}


      {/* Project Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => { setMenuAnchor(null); setMenuProjectId(null); }}
        sx={{ '& .MuiPaper-root': { borderRadius: 2, minWidth: 180, boxShadow: '0 4px 20px rgba(0,0,0,0.12)' } }}
      >
        {activeTab === 'active' ? (
          <>
            <MenuItem
              onClick={() => {
                const selectedProj = projects.find(p => p.id === menuProjectId);
                if (selectedProj) {
                  handleEditClick(selectedProj);
                }
                setMenuAnchor(null);
                setMenuProjectId(null);
              }}
            >
              <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Edit Project</ListItemText>
            </MenuItem>

            <MenuItem
              onClick={() => {
                const selectedProj = projects.find(p => p.id === menuProjectId);
                if (selectedProj) {
                  handleDuplicateClick(selectedProj);
                }
                setMenuAnchor(null);
                setMenuProjectId(null);
              }}
            >
              <ListItemIcon><ContentCopyIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Duplicate for new customer</ListItemText>
            </MenuItem>
            
            <MenuItem
              onClick={() => {
                if (menuProjectId) {
                  handleArchiveProject(menuProjectId);
                }
                setMenuAnchor(null);
                setMenuProjectId(null);
              }}
            >
              <ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Archive Project</ListItemText>
            </MenuItem>

            {user?.roles?.includes('Admin') && (
              <MenuItem
                onClick={() => {
                  setDeleteTargetId(menuProjectId);
                  setDeleteConfirmOpen(true);
                  setMenuAnchor(null);
                  setMenuProjectId(null);
                }}
                sx={{ color: 'error.main' }}
              >
                <ListItemIcon><DeleteIcon fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
                <ListItemText>Permanent Delete</ListItemText>
              </MenuItem>
            )}
          </>
        ) : (
          <>
            <MenuItem
              onClick={() => {
                if (menuProjectId) {
                  handleRestoreProject(menuProjectId);
                }
                setMenuAnchor(null);
                setMenuProjectId(null);
              }}
            >
              <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Restore Project</ListItemText>
            </MenuItem>

            {user?.roles?.includes('Admin') && (
              <MenuItem
                onClick={() => {
                  setDeleteTargetId(menuProjectId);
                  setDeleteConfirmOpen(true);
                  setMenuAnchor(null);
                  setMenuProjectId(null);
                }}
                sx={{ color: 'error.main' }}
              >
                <ListItemIcon><DeleteIcon fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
                <ListItemText>Permanent Delete</ListItemText>
              </MenuItem>
            )}
          </>
        )}
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'error.main' }}>Delete Project?</DialogTitle>
        <DialogContent>
          <Typography>This action is permanent and will delete all associated documents, process steps, FMEA rows, and control plans. This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} disabled={deleteLoading}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteProject} disabled={deleteLoading}>
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 3-Step Create/Edit Project Modal */}
      <Dialog open={open} onClose={handleClose} maxWidth={false} fullWidth sx={{ '& .MuiDialog-paper': { width: '80vw', maxWidth: '80vw' } }}>
        <DialogTitle sx={{ fontWeight: 'bold', px: 3, pt: 3 }}>
          {isEditing ? 'Edit Quality Project' : 'Create Quality Project'}
        </DialogTitle>
        <Box sx={{ px: 3, mb: 2 }}>
          <Stepper activeStep={step - 1} alternativeLabel>
            <Step><StepLabel>Basic Info</StepLabel></Step>
            <Step><StepLabel>Organisation & Part Info</StepLabel></Step>
            <Step><StepLabel>Document Control & Approvals</StepLabel></Step>
          </Stepper>
        </Box>

        <Box>
          <DialogContent sx={{ p: 3 }}>
            {createError && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
                {createError}
              </Alert>
            )}

            {/* Step 1: Basic Info */}
            {step === 1 && (
              <Box>
                <Grid container spacing={2}>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      label="Part Name / Description *"
                      variant="outlined"
                      margin="normal"
                      value={partName}
                      onChange={(e) => setPartName(e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      label="Organisation Part No. *"
                      variant="outlined"
                      margin="normal"
                      value={orgPartNumber}
                      onChange={(e) => setOrgPartNumber(e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      label="Model Year"
                      variant="outlined"
                      margin="normal"
                      value={modelYear}
                      onChange={(e) => setModelYear(e.target.value)}
                    />
                  </Grid>
                  <Grid size={6} sx={{ mt: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5, color: 'text.secondary', fontWeight: 'bold' }}>
                      Document Type *
                    </Typography>
                    <RadioGroup
                      value={
                        documentTypes.includes('Production')
                          ? 'Production'
                          : documentTypes.includes('Pre-Launch') || documentTypes.includes('Safe Launch')
                          ? 'Pre-Launch'
                          : 'Prototype'
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'Pre-Launch') {
                          const isSafe = documentTypes.includes('Safe Launch');
                          setDocumentTypes(isSafe ? ['Pre-Launch', 'Safe Launch'] : ['Pre-Launch']);
                        } else {
                          setDocumentTypes([val]);
                        }
                      }}
                    >
                      <FormControlLabel value="Prototype" control={<Radio />} label="Prototype" />
                      <FormControlLabel value="Pre-Launch" control={<Radio />} label="Pre-Launch" />
                      {(documentTypes.includes('Pre-Launch') || documentTypes.includes('Safe Launch')) && !documentTypes.includes('Prototype') && !documentTypes.includes('Production') && (
                        <Box sx={{ pl: 4, my: 0.5 }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                size="small"
                                checked={documentTypes.includes('Safe Launch')}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setDocumentTypes(['Pre-Launch', 'Safe Launch']);
                                  } else {
                                    setDocumentTypes(['Pre-Launch']);
                                  }
                                }}
                              />
                            }
                            label={<Typography variant="body2" sx={{ fontWeight: 600, color: 'secondary.main' }}>Safe Launch</Typography>}
                          />
                        </Box>
                      )}
                      <FormControlLabel value="Production" control={<Radio />} label="Production" />
                    </RadioGroup>
                  </Grid>
                  <Grid size={12}>
                    <Box sx={{ mt: 2, p: 2, border: '1px solid #cbd5e1', borderRadius: 2, bgcolor: '#f8fafc' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1.5, color: '#334155' }}>
                        Import Template / Data from Existing Project (Optional)
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid size={12}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Select Project to Import From</InputLabel>
                            <Select
                              {...dialogSelectProps}
                              value={sourceProjectId}
                              onChange={(e) => {
                                const val = e.target.value as string;
                                setSourceProjectId(val);
                                if (val) {
                                  setImportTypes(['PFD', 'PFMEA', 'DFMEA', 'CONTROL_PLAN']);
                                } else {
                                  setImportTypes([]);
                                }
                              }}
                              label="Select Project to Import From"
                            >
                              <MenuItem value=""><em>None (Create Empty Project)</em></MenuItem>
                              {projects.map((proj) => (
                                <MenuItem key={proj.id} value={proj.id}>
                                  {proj.partName || proj.name} ({proj.orgPartNumber || 'N/A'}) - {proj.customer}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        {sourceProjectId && (
                          <Grid size={12}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                              Choose Document Types to Import:
                            </Typography>
                            <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
                              {['PFD', 'PFMEA', 'DFMEA', 'CONTROL_PLAN'].map((type) => {
                                const label = type === 'CONTROL_PLAN' ? 'Control Plan' : type;
                                const isChecked = importTypes.includes(type);
                                return (
                                  <FormControlLabel
                                    key={type}
                                    control={
                                      <Checkbox
                                        checked={isChecked}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setImportTypes([...importTypes, type]);
                                          } else {
                                            setImportTypes(importTypes.filter((t) => t !== type));
                                          }
                                        }}
                                        size="small"
                                      />
                                    }
                                    label={label}
                                  />
                                );
                              })}
                            </Stack>
                            <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 1 }}>
                              * Active revision content (items, rows, linkages) of the checked documents will copy into the new project automatically.
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Step 2: Organisation & Part Info */}
            {step === 2 && (
              <Box>
                <Grid container spacing={2}>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      label="Organisation Name *"
                      variant="outlined"
                      margin="normal"
                      value={organisationName}
                      onChange={(e) => setOrganisationName(e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      label="Organisation Code"
                      variant="outlined"
                      margin="normal"
                      value={organisationCode}
                      onChange={(e) => setOrganisationCode(e.target.value)}
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      label="Organisation / Plant"
                      variant="outlined"
                      margin="normal"
                      value={organisationPlant}
                      onChange={(e) => setOrganisationPlant(e.target.value)}
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      label="Customer *"
                      variant="outlined"
                      margin="normal"
                      value={customer}
                      onChange={(e) => setCustomer(e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      label="Customer Part Number"
                      variant="outlined"
                      margin="normal"
                      value={customerPartNumber}
                      onChange={(e) => setCustomerPartNumber(e.target.value)}
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      label="Concerned Key Contact"
                      variant="outlined"
                      margin="normal"
                      value={keyContact}
                      onChange={(e) => setKeyContact(e.target.value)}
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      label="Document Latest Change Level"
                      variant="outlined"
                      margin="normal"
                      value={latestChangeLevel}
                      onChange={(e) => setLatestChangeLevel(e.target.value)}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Step 3: Document Control & Approvals */}
            {step === 3 && (
              <Box sx={{ maxHeight: '60vh', overflowY: 'auto', pr: 1 }}>
                <Grid container spacing={2}>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      label="Dwg No."
                      variant="outlined"
                      margin="normal"
                      value={dwgNumber}
                      onChange={(e) => setDwgNumber(e.target.value)}
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      label="Drawing Revision Date"
                      type="date"
                      variant="outlined"
                      margin="normal"
                      slotProps={{ inputLabel: { shrink: true } }}
                      value={drawingRevDate}
                      onChange={(e) => setDrawingRevDate(e.target.value)}
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      label="Dwg Rev No / Date"
                      variant="outlined"
                      margin="normal"
                      value={dwgRevNoAndDate}
                      onChange={(e) => setDwgRevNoAndDate(e.target.value)}
                    />
                  </Grid>
                  <Grid size={12}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, mt: 1 }}>
                      Auto-Derived Document Numbers
                    </Typography>
                    <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body2">
                        <strong>PFD Document No:</strong> PFD{orgPartNumber || '—'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>PFMEA Document No:</strong> PFMEA{orgPartNumber || '—'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Control Plan No:</strong> CP{orgPartNumber || '—'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      label="Assembly Line No."
                      variant="outlined"
                      margin="normal"
                      value={assemblyLineNumber}
                      onChange={(e) => setAssemblyLineNumber(e.target.value)}
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      label="Origination Date"
                      type="date"
                      variant="outlined"
                      margin="normal"
                      slotProps={{ inputLabel: { shrink: true } }}
                      value={originationDate}
                      onChange={(e) => setOriginationDate(e.target.value)}
                    />
                  </Grid>
                  <Grid size={12}>
                    <TextField
                      fullWidth
                      label="Supplier / Plant Approval Date"
                      type="date"
                      variant="outlined"
                      margin="normal"
                      slotProps={{ inputLabel: { shrink: true } }}
                      value={supplierApprovalDate}
                      onChange={(e) => setSupplierApprovalDate(e.target.value)}
                    />
                  </Grid>

                  {/* CFT Members Input */}
                  <Grid size={12} sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                      Core CFT Members (Press Add or Enter)
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1.5 }}>
                      <TextField
                        fullWidth
                        label="CFT Member Name"
                        value={newCftMember}
                        onChange={(e) => setNewCftMember(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCftMember();
                          }
                        }}
                      />
                      <Button variant="outlined" onClick={addCftMember}>Add</Button>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                      {cftMembers.map((member) => (
                        <Chip
                          key={member}
                          label={member}
                          onDelete={() => removeCftMember(member)}
                        />
                      ))}
                      {cftMembers.length === 0 && (
                        <Typography variant="caption" color="text.secondary">No CFT members added yet.</Typography>
                      )}
                    </Box>
                  </Grid>

                  {/* Approvals section */}
                  <Grid size={12} sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
                      Initial Approval Sign-offs (Optional)
                    </Typography>
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      label="Customer Eng. Approver"
                      variant="outlined"
                      margin="normal"
                      value={customerEngApprover}
                      onChange={(e) => setCustomerEngApprover(e.target.value)}
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      label="Customer Eng. Approval Date"
                      type="date"
                      variant="outlined"
                      margin="normal"
                      slotProps={{ inputLabel: { shrink: true } }}
                      value={customerEngApprovalDate}
                      onChange={(e) => setCustomerEngApprovalDate(e.target.value)}
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      label="Customer Quality Approver"
                      variant="outlined"
                      margin="normal"
                      value={customerQualApprover}
                      onChange={(e) => setCustomerQualApprover(e.target.value)}
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      label="Customer Quality Approval Date"
                      type="date"
                      variant="outlined"
                      margin="normal"
                      slotProps={{ inputLabel: { shrink: true } }}
                      value={customerQualApprovalDate}
                      onChange={(e) => setCustomerQualApprovalDate(e.target.value)}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 3, borderTop: '1px solid #e2e8f0' }}>
            <Button type="button" onClick={handleClose} disabled={createLoading}>Cancel</Button>
            <Box sx={{ flexGrow: 1 }} />
            {step > 1 && (
              <Button type="button" onClick={handleBack} disabled={createLoading}>Back</Button>
            )}
            {step < 3 ? (
              <Button type="button" onClick={handleNext} variant="contained">Next</Button>
            ) : (
              <Button
                type="button"
                variant="contained"
                disabled={createLoading}
                onClick={(e) => {
                  if (isEditing) {
                    handleUpdate(e as any);
                  } else {
                    handleCreate(e as any);
                  }
                }}
              >
                {createLoading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Project')}
              </Button>
            )}
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};