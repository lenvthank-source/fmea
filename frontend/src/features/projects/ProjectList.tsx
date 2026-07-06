import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Grid, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Alert, FormControlLabel, Chip, Radio, RadioGroup,
  Stepper, Step, StepLabel, IconButton, Menu, MenuItem, ListItemIcon, ListItemText,
  TableContainer, Table, TableHead, TableBody, TableRow, TableCell, Paper, Tabs, Tab
} from '@mui/material';
import { Add as AddIcon, MoreVert as MoreVertIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import { DashboardSkeleton } from '../../components/Layout/DashboardSkeleton';

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
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

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
  const [preliminaryFinalFlag, setPreliminaryFinalFlag] = useState('preliminary');
  const [documentNumber, setDocumentNumber] = useState('');
  const [controlPlanNumber, setControlPlanNumber] = useState('');
  const [assemblyLineNumber, setAssemblyLineNumber] = useState('');
  const [originationDate, setOriginationDate] = useState(new Date().toISOString().split('T')[0]);
  const [supplierApprovalDate, setSupplierApprovalDate] = useState('');
  
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

  // Auto-suggest Document Number when step 3 is reached
  useEffect(() => {
    if (step === 3 && !documentNumber) {
      const year = new Date().getFullYear();
      const count = String(projects.length + 1).padStart(4, '0');
      setDocumentNumber(`DOC-${year}-${count}`);
    }
  }, [step, projects.length]);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = activeTab === 'archived'
        ? `${API_BASE_URL}/projects?status=archived`
        : `${API_BASE_URL}/projects`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to load projects');
      }
      const data = await response.json();
      setProjects(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProjects();
    }
  }, [token, activeTab]);

  const handleDeleteProject = async () => {
    if (!deleteTargetId) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/projects/${deleteTargetId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete project');
      setProjects(prev => prev.filter(p => p.id !== deleteTargetId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete project');
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
      if (!res.ok) throw new Error('Failed to archive project');
      fetchProjects();
    } catch (err: any) {
      setError(err.message || 'Failed to archive project');
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
      if (!res.ok) throw new Error('Failed to restore project');
      fetchProjects();
    } catch (err: any) {
      setError(err.message || 'Failed to restore project');
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
    setPreliminaryFinalFlag(project.preliminaryFinalFlag || 'preliminary');
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
      preliminaryFinalFlag,
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
        const err = await response.json();
        throw new Error(err.message || 'Failed to update project');
      }

      await fetchProjects();
      handleClose();
    } catch (err: any) {
      setCreateError(err.message || 'Could not update project');
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
    setPreliminaryFinalFlag('preliminary');
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
      preliminaryFinalFlag,
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
        const err = await response.json();
        throw new Error(err.message || 'Failed to create project');
      }

      await fetchProjects();
      handleClose();
    } catch (err: any) {
      setCreateError(err.message || 'Could not create project');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: '1440px', mx: 'auto', px: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Projects Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your manufacturing programs and FMEA assessments
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
          Create Project
        </Button>
      </Box>

      <Tabs 
        value={activeTab} 
        onChange={(_, newValue) => setActiveTab(newValue)} 
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
      >
        <Tab label="Active Projects" value="active" />
        <Tab label="Archived Projects" value="archived" />
      </Tabs>

      {activeTab === 'archived' && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          ⚠️ <strong>Warning:</strong> Archived projects are hidden from active workspaces and will be permanently deleted after 30 days.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <DashboardSkeleton showMascot={!token} />
      ) : projects.length === 0 ? (
        <Box sx={{ textAlign: 'center', p: 8, border: '1px dashed #e2e8f0', borderRadius: 5, bgcolor: 'background.paper' }}>
          <Typography color="text.secondary" gutterBottom>
            {activeTab === 'archived' ? 'No archived projects found.' : 'No projects found in this workspace.'}
          </Typography>
          {activeTab !== 'archived' && (
            <Button variant="outlined" startIcon={<AddIcon />} onClick={handleOpen} sx={{ mt: 2 }}>
              Create Your First Project
            </Button>
          )}
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ border: '1px solid #e2e8f0', borderRadius: 4, overflowX: 'auto', mt: 1, boxShadow: 'none' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Part Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Part Number</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Document Type</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Created At</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Modified At</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', width: 60 }}>Rev</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.9rem', width: 80 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell>
                    <Typography
                      onClick={() => navigate(`/projects/${project.id}/pfd`)}
                      sx={{ 
                        fontWeight: 'bold', 
                        color: 'primary.main', 
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                    >
                      {project.partName || 'Untitled'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                      {project.orgPartNumber || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{project.customer || '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={project.documentTypes?.[0] || 'Prototype'} 
                      size="small" 
                      color={
                        project.documentTypes?.[0] === 'Production' ? 'success' :
                        project.documentTypes?.[0] === 'Safe Launch' ? 'secondary' :
                        project.documentTypes?.[0] === 'Pre-Launch' ? 'info' : 'warning'
                      }
                      variant="outlined"
                      sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                      {new Date(project.createdAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={project.revisionNumber || '1.0'}
                      size="small"
                      sx={{ fontWeight: 'bold', fontSize: '0.75rem', bgcolor: '#f1f5f9', color: '#475569' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={(e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); setMenuProjectId(project.id); }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

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
                    <Typography variant="subtitle2" sx={{ mb: 0.5, color: 'text.secondary' }}>
                      Document Type *
                    </Typography>
                    <RadioGroup
                      value={documentTypes[0] || 'Prototype'}
                      onChange={(e) => setDocumentTypes([e.target.value])}
                    >
                      {['Prototype', 'Pre-Launch', 'Safe Launch', 'Production'].map((type) => (
                        <FormControlLabel
                           key={type}
                           value={type}
                           control={<Radio />}
                           label={type}
                        />
                      ))}
                    </RadioGroup>
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
                      label="Key Contact / Phone"
                      variant="outlined"
                      margin="normal"
                      value={keyContact}
                      onChange={(e) => setKeyContact(e.target.value)}
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      label="Latest Change Level"
                      variant="outlined"
                      margin="normal"
                      value={latestChangeLevel}
                      onChange={(e) => setLatestChangeLevel(e.target.value)}
                    />
                  </Grid>
                  <Grid size={12}>
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
                      label="Dwg Rev No / Date"
                      variant="outlined"
                      margin="normal"
                      value={dwgRevNoAndDate}
                      onChange={(e) => setDwgRevNoAndDate(e.target.value)}
                    />
                  </Grid>
                  <Grid size={12}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5, color: 'text.secondary' }}>
                      Status Flag
                    </Typography>
                    <RadioGroup
                      row
                      value={preliminaryFinalFlag}
                      onChange={(e) => setPreliminaryFinalFlag(e.target.value)}
                    >
                      <FormControlLabel value="preliminary" control={<Radio />} label="Preliminary" />
                      <FormControlLabel value="final" control={<Radio />} label="Final" />
                    </RadioGroup>
                  </Grid>
                  <Grid size={12}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, mt: 1 }}>
                      Auto-Derived Document Numbers
                    </Typography>
                    <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body2">
                        <strong>PFD Document No:</strong> PFD-{orgPartNumber || '—'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>PFMEA Document No:</strong> PFMEA-{orgPartNumber || '—'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Control Plan No:</strong> CP-{orgPartNumber || '—'}
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
