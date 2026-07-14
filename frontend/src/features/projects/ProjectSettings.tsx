import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, Alert, CircularProgress, Grid, Card, CardContent,
  FormControlLabel, Chip, Radio, RadioGroup, Tabs, Tab, Switch,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Tooltip, Collapse, Stack
} from '@mui/material';
import {
  Save as SaveIcon, ArrowBack as BackIcon, Add as AddIcon,
  Star as StarIcon, Edit as EditIcon, Delete as DeleteIcon,
  SwapHoriz as ActivateIcon, ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon, History as HistoryIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useAuth } from '../auth/AuthContext';
import { API_BASE_URL } from '../../config';

export const ProjectSettings: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { token, user } = useAuth();
  const isAdmin = user?.roles?.includes('Admin');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [tabValue, setTabValue] = useState(0);

  // Form states
  const [name, setName] = useState('');
  const [autohideSidebar, setAutohideSidebar] = useState(true);
  const [description, setDescription] = useState('');
  const [modelYear, setModelYear] = useState('');
  const [documentTypes, setDocumentTypes] = useState<string[]>([]);
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
  const [dwgNumber, setDwgNumber] = useState('');
  const [dwgRevNoAndDate, setDwgRevNoAndDate] = useState('');
  const [preliminaryFinalFlag, setPreliminaryFinalFlag] = useState('preliminary');
  const [documentNumber, setDocumentNumber] = useState('');
  const [controlPlanNumber, setControlPlanNumber] = useState('');
  const [assemblyLineNumber, setAssemblyLineNumber] = useState('');
  const [originationDate, setOriginationDate] = useState('');
  const [supplierApprovalDate, setSupplierApprovalDate] = useState('');

  // CFT Members
  const [cftMembers, setCftMembers] = useState<string[]>([]);
  const [newCftMember, setNewCftMember] = useState('');

  // Approvals
  const [customerEngApprover, setCustomerEngApprover] = useState('');
  const [customerEngApprovalDate, setCustomerEngApprovalDate] = useState('');
  const [customerQualApprover, setCustomerQualApprover] = useState('');
  const [customerQualApprovalDate, setCustomerQualApprovalDate] = useState('');
  const [otherApprover, setOtherApprover] = useState('');
  const [otherApprovalDate2, setOtherApprovalDate2] = useState('');

  // Revision states
  const [revisions, setRevisions] = useState<any[]>([]);
  const [revisionsLoading, setRevisionsLoading] = useState(false);
  const [createRevisionOpen, setCreateRevisionOpen] = useState(false);
  const [changeDesc, setChangeDesc] = useState('');
  const [createRevisionLoading, setCreateRevisionLoading] = useState(false);
  const [newRevisionNumber, setNewRevisionNumber] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newEffectiveFrom, setNewEffectiveFrom] = useState('');
  const [newEffectiveTo, setNewEffectiveTo] = useState('');

  // Edit revision states
  const [editRevisionOpen, setEditRevisionOpen] = useState(false);
  const [editRevision, setEditRevision] = useState<any>(null);
  const [editRevNumber, setEditRevNumber] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editChangeDesc, setEditChangeDesc] = useState('');
  const [editEffFrom, setEditEffFrom] = useState('');
  const [editEffTo, setEditEffTo] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Delete revision states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteRevisionTarget, setDeleteRevisionTarget] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Audit log / expand states
  const [expandedRevisionId, setExpandedRevisionId] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<Record<string, any[]>>({});
  const [auditLoading, setAuditLoading] = useState(false);



  const fetchRevisions = async () => {
    setRevisionsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/revisions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to load revisions');
      const data = await response.json();
      setRevisions(data);
    } catch (err: any) {
      setError(err.message || 'Could not load revision history');
    } finally {
      setRevisionsLoading(false);
    }
  };

  const handleCreateRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeDesc.trim()) return;

    setCreateRevisionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/revisions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          changeDesc: changeDesc.trim(),
          revisionNumber: newRevisionNumber.trim() || undefined,
          summary: newSummary.trim() || undefined,
          effectiveFrom: newEffectiveFrom || undefined,
          effectiveTo: newEffectiveTo || undefined,
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to create revision');
      }

      setSuccess('Project revision created successfully with data snapshot.');
      setChangeDesc('');
      setNewRevisionNumber('');
      setNewSummary('');
      setNewEffectiveFrom('');
      setNewEffectiveTo('');
      setCreateRevisionOpen(false);
      fetchRevisions();
    } catch (err: any) {
      setError(err.message || 'Could not create revision');
    } finally {
      setCreateRevisionLoading(false);
    }
  };

  const handleEditRevisionSubmit = async () => {
    if (!editRevision) return;
    setEditLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/projects/revisions/${editRevision.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          revisionNumber: editRevNumber.trim() || undefined,
          summary: editSummary.trim() || undefined,
          changeDescription: editChangeDesc.trim() || undefined,
          effectiveFrom: editEffFrom || undefined,
          effectiveTo: editEffTo || undefined,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to update revision');
      }
      setSuccess('Revision updated successfully.');
      setEditRevisionOpen(false);
      fetchRevisions();
    } catch (err: any) {
      setError(err.message || 'Could not update revision');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteRevision = async () => {
    if (!deleteRevisionTarget) return;
    setDeleteLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/projects/revisions/${deleteRevisionTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to delete revision');
      }
      setSuccess('Revision deleted successfully.');
      setDeleteConfirmOpen(false);
      setDeleteRevisionTarget(null);
      fetchRevisions();
    } catch (err: any) {
      setError(err.message || 'Could not delete revision');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleActivateRevision = async (rev: any) => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/projects/revisions/${rev.id}/activate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to activate revision');
      }
      setSuccess(`Revision ${rev.revisionNumber} is now active.`);
      fetchRevisions();
    } catch (err: any) {
      setError(err.message || 'Could not activate revision');
    }
  };

  const fetchAuditLogs = async (revisionId: string) => {
    setAuditLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/revisions/${revisionId}/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(prev => ({ ...prev, [revisionId]: data }));
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  const toggleExpandRevision = (revisionId: string) => {
    if (expandedRevisionId === revisionId) {
      setExpandedRevisionId(null);
    } else {
      setExpandedRevisionId(revisionId);
      if (!auditLogs[revisionId]) {
        fetchAuditLogs(revisionId);
      }
    }
  };

  const openEditDialog = (rev: any) => {
    setEditRevision(rev);
    setEditRevNumber(rev.revisionNumber || '');
    setEditSummary(rev.summary || '');
    setEditChangeDesc(rev.changeDescription || '');
    setEditEffFrom(rev.effectiveFrom ? rev.effectiveFrom.split('T')[0] : '');
    setEditEffTo(rev.effectiveTo ? rev.effectiveTo.split('T')[0] : '');
    setEditRevisionOpen(true);
  };

  const getRevisionChipColor = (rev: any): 'success' | 'primary' | 'default' | 'warning' => {
    if (rev.document?.currentRevisionId === rev.id) return 'success';
    if (rev.lockedAt) return 'warning';
    if (rev.status === 'draft') return 'primary';
    return 'default';
  };

  const getSuggestedNextRevision = (): string => {
    if (revisions.length === 0) return '2.0';
    const maxRev = revisions.reduce((max: number, r: any) => {
      const num = parseFloat(r.revisionNumber || '0');
      return num > max ? num : max;
    }, 0);
    return (maxRev + 1.0).toFixed(1);
  };

  useEffect(() => {
    if (tabValue === 5 && projectId && token) {
      fetchRevisions();
    }
  }, [tabValue, projectId, token]);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to load project settings');
        }
        const data = await response.json();
        
        // Map to states
        setName(data.name || '');
        setDescription(data.description || '');
        setModelYear(data.modelYear || '');
        setDocumentTypes(data.documentTypes || []);
        setOrganisationName(data.organisationName || '');
        setOrganisationCode(data.organisationCode || '');
        setOrgPartNumber(data.orgPartNumber || '');
        setOrganisationPlant(data.organisationPlant || '');
        setCustomer(data.customer || '');
        setCustomerPartNumber(data.customerPartNumber || '');
        setPartName(data.partName || '');
        setKeyContact(data.keyContact || '');
        setLatestChangeLevel(data.latestChangeLevel || '');
        setDrawingRevDate(data.drawingRevDate ? data.drawingRevDate.split('T')[0] : '');
        setDwgNumber(data.dwgNumber || '');
        setDwgRevNoAndDate(data.dwgRevNoAndDate || '');
        setPreliminaryFinalFlag(data.preliminaryFinalFlag || 'preliminary');
        setDocumentNumber(data.documentNumber || '');
        setControlPlanNumber(data.controlPlanNumber || '');
        setAssemblyLineNumber(data.assemblyLineNumber || '');
        setOriginationDate(data.originationDate ? data.originationDate.split('T')[0] : '');
        setSupplierApprovalDate(data.supplierApprovalDate ? data.supplierApprovalDate.split('T')[0] : '');
        setCftMembers(data.cftMembers || []);
        
        if (data.uiSettings) {
          try {
            const parsed = typeof data.uiSettings === 'string' ? JSON.parse(data.uiSettings) : data.uiSettings;
            setAutohideSidebar(parsed.autohideSidebar !== false);
          } catch {
            setAutohideSidebar(true);
          }
        } else {
          setAutohideSidebar(true);
        }
        
        setCustomerEngApprover(data.customerEngApprover || '');
        setCustomerEngApprovalDate(data.customerEngApprovalDate ? data.customerEngApprovalDate.split('T')[0] : '');
        setCustomerQualApprover(data.customerQualApprover || '');
        setCustomerQualApprovalDate(data.customerQualApprovalDate ? data.customerQualApprovalDate.split('T')[0] : '');
        setOtherApprover(data.otherApprover || '');
        setOtherApprovalDate2(data.otherApprovalDate2 ? data.otherApprovalDate2.split('T')[0] : '');
      } catch (err: any) {
        setError(err.message || 'Error occurred while loading project settings.');
      } finally {
        setLoading(false);
      }
    };

    if (projectId && token) {
      fetchProjectDetails();
    }
  }, [projectId, token]);


  const addCftMember = () => {
    if (newCftMember.trim() && !cftMembers.includes(newCftMember.trim())) {
      setCftMembers([...cftMembers, newCftMember.trim()]);
      setNewCftMember('');
    }
  };

  const removeCftMember = (member: string) => {
    setCftMembers(cftMembers.filter((m) => m !== member));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setError(null);
    setSuccess(null);

    // Validate required fields
    if (!name.trim()) {
      setError('Project Name is required');
      setSaveLoading(false);
      return;
    }
    if (!organisationName.trim()) {
      setError('Organisation Name is required');
      setSaveLoading(false);
      return;
    }
    if (!customer.trim()) {
      setError('Customer is required');
      setSaveLoading(false);
      return;
    }
    if (!partName.trim()) {
      setError('Part Name / Description is required');
      setSaveLoading(false);
      return;
    }
    if (documentTypes.length === 0) {
      setError('At least one Document Type must be selected');
      setSaveLoading(false);
      return;
    }

    const payload = {
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
      uiSettings: {
        autohideSidebar,
      },
    };

    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to save project settings');
      }

      setSuccess('Project settings updated successfully.');
    } catch (err: any) {
      setError(err.message || 'Could not update project settings.');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate(`/app/projects/${projectId}/pfd`)}
          sx={{ mr: 2 }}
        >
          Back to Workspace
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Project Settings
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 3 }}>{success}</Alert>}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, val) => setTabValue(val)}>
          <Tab label="General & Organisation" />
          <Tab label="Part & Customer Info" />
          <Tab label="Document Control & CFT" />
          <Tab label="Approval Sign-offs" />
          <Tab label="UI Settings" />
          <Tab label="Revision History" />
        </Tabs>
      </Box>

      <Box component="form" onSubmit={handleSave}>
        <Card sx={{ p: 2 }}>
          <CardContent>
            {/* Tab 0: General & Organisation */}
            {tabValue === 0 && (
              <Grid container spacing={2.5}>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="Project Name *"
                    variant="outlined"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    variant="outlined"
                    multiline
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Organisation Name *"
                    variant="outlined"
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
                    value={organisationCode}
                    onChange={(e) => setOrganisationCode(e.target.value)}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Organisation / Plant"
                    variant="outlined"
                    value={organisationPlant}
                    onChange={(e) => setOrganisationPlant(e.target.value)}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Model Year"
                    variant="outlined"
                    value={modelYear}
                    onChange={(e) => setModelYear(e.target.value)}
                  />
                </Grid>
                <Grid size={12}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5, color: 'text.secondary', fontWeight: 'bold' }}>
                    Document Type *
                  </Typography>
                  <RadioGroup
                    value={documentTypes[0] || 'Prototype'}
                    onChange={(e) => setDocumentTypes([e.target.value])}
                  >
                    {['Prototype', 'Pre-Launch', 'Production'].map((type) => (
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
            )}

            {/* Tab 1: Part & Customer Info */}
            {tabValue === 1 && (
              <Grid container spacing={2.5}>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Customer Name *"
                    variant="outlined"
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
                    value={customerPartNumber}
                    onChange={(e) => setCustomerPartNumber(e.target.value)}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Organisation Part No."
                    variant="outlined"
                    value={orgPartNumber}
                    onChange={(e) => setOrgPartNumber(e.target.value)}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Part Name / Description *"
                    variant="outlined"
                    value={partName}
                    onChange={(e) => setPartName(e.target.value)}
                    required
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Key Contact / Phone"
                    variant="outlined"
                    value={keyContact}
                    onChange={(e) => setKeyContact(e.target.value)}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Latest Change Level"
                    variant="outlined"
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
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={drawingRevDate}
                    onChange={(e) => setDrawingRevDate(e.target.value)}
                  />
                </Grid>
              </Grid>
            )}

            {/* Tab 2: Document Control & CFT */}
            {tabValue === 2 && (
              <Grid container spacing={2.5}>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Dwg No."
                    variant="outlined"
                    value={dwgNumber}
                    onChange={(e) => setDwgNumber(e.target.value)}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Dwg Rev No / Date"
                    variant="outlined"
                    value={dwgRevNoAndDate}
                    onChange={(e) => setDwgRevNoAndDate(e.target.value)}
                  />
                </Grid>
                <Grid size={12}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5, color: 'text.secondary', fontWeight: 'bold' }}>
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
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Document Number"
                    variant="outlined"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Control Plan Number"
                    variant="outlined"
                    value={controlPlanNumber}
                    onChange={(e) => setControlPlanNumber(e.target.value)}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Assembly Line No."
                    variant="outlined"
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
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={supplierApprovalDate}
                    onChange={(e) => setSupplierApprovalDate(e.target.value)}
                  />
                </Grid>

                {/* CFT Members Tag Input */}
                <Grid size={12} sx={{ mt: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Core CFT Members (Press Add or Enter)
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1.5 }}>
                    <TextField
                      fullWidth
                      label="CFT Member Name"
                      variant="outlined"
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
              </Grid>
            )}

            {/* Tab 3: Approval Sign-offs */}
            {tabValue === 3 && (
              <Grid container spacing={2.5}>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Customer Eng. Approver"
                    variant="outlined"
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
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={customerQualApprovalDate}
                    onChange={(e) => setCustomerQualApprovalDate(e.target.value)}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Other Approver"
                    variant="outlined"
                    value={otherApprover}
                    onChange={(e) => setOtherApprover(e.target.value)}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Other Approval Date"
                    type="date"
                    variant="outlined"
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={otherApprovalDate2}
                    onChange={(e) => setOtherApprovalDate2(e.target.value)}
                  />
                </Grid>
              </Grid>
            )}

            {/* Tab 4: UI Settings */}
            {tabValue === 4 && (
              <Grid container spacing={2.5}>
                <Grid size={12}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: 'text.primary' }}>
                    Workspace Customizations & UI Preferences
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Configure the workspace layout and interactive UI settings for this project.
                  </Typography>
                </Grid>
                <Grid size={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                    <Box sx={{ mr: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        Autohide Navigation Sidebar
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Collapses the left navigation menu automatically when mouse leaves the sidebar for 1 second. Hovering over the left edge expands it instantly.
                      </Typography>
                    </Box>
                    <Switch
                      checked={autohideSidebar}
                      onChange={(e) => setAutohideSidebar(e.target.checked)}
                      color="primary"
                    />
                  </Box>
                </Grid>
              </Grid>
            )}

            {/* Tab 5: Revision History */}
            {tabValue === 5 && (
              <Box sx={{ mt: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                      Document Revision Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Create, view, edit, and manage document revisions with full data snapshots and audit trail.
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => { setNewRevisionNumber(getSuggestedNextRevision()); setCreateRevisionOpen(true); }}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    Create Revision
                  </Button>
                </Box>

                {revisionsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={30} />
                  </Box>
                ) : revisions.length === 0 ? (
                  <Alert severity="info" sx={{ borderRadius: 3 }}>
                    No document revisions found. Rev 1.0 is active.
                  </Alert>
                ) : (
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold', width: 40 }}></TableCell>
                          <TableCell sx={{ fontWeight: 'bold', width: 120 }}>Revision</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', width: 90 }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', width: 90 }}>Doc Type</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Change Description</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', width: 140 }}>Created By</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', width: 160 }}>Created At</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', width: 200, textAlign: 'center' }}>Data Counts</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', width: 140, textAlign: 'center' }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {revisions.map((rev) => {
                          const isActive = rev.document?.currentRevisionId === rev.id;
                          const isLocked = !!rev.lockedAt;
                          const canEdit = !isLocked && rev.status === 'draft';
                          const canDelete = isAdmin && !isActive && !isLocked && revisions.filter((r: any) => r.documentId === rev.documentId).length > 1;
                          const isExpanded = expandedRevisionId === rev.id;

                          return (
                            <React.Fragment key={rev.id}>
                              <TableRow sx={{ bgcolor: isActive ? 'rgba(16, 185, 129, 0.04)' : 'transparent', '&:hover': { bgcolor: 'action.hover' } }}>
                                <TableCell>
                                  <IconButton size="small" onClick={() => toggleExpandRevision(rev.id)}>
                                    {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                                  </IconButton>
                                </TableCell>
                                <TableCell>
                                  <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                                    {isActive && <StarIcon sx={{ fontSize: 14, color: '#f59e0b' }} />}
                                    <Chip
                                      label={`v${rev.revisionNumber}`}
                                      size="small"
                                      color={getRevisionChipColor(rev)}
                                      variant={isActive ? 'filled' : 'outlined'}
                                      sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}
                                    />
                                  </Stack>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={isActive ? 'Active' : isLocked ? 'Locked' : rev.status === 'superseded' ? 'Superseded' : 'Draft'}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                      fontSize: '0.7rem', height: 22,
                                      borderColor: isActive ? '#10b981' : isLocked ? '#f59e0b' : rev.status === 'superseded' ? '#94a3b8' : '#3b82f6',
                                      color: isActive ? '#10b981' : isLocked ? '#f59e0b' : rev.status === 'superseded' ? '#94a3b8' : '#3b82f6',
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="caption" sx={{ fontWeight: 500 }}>{rev.document?.type || '—'}</Typography>
                                </TableCell>
                                <TableCell sx={{ whiteSpace: 'pre-wrap', maxWidth: 300 }}>
                                  <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{rev.changeDescription || '—'}</Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{rev.creator?.name || rev.creator?.email || 'System'}</Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{new Date(rev.createdAt).toLocaleString()}</Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Stack direction="row" spacing={1} sx={{ justifyContent: 'center' }}>
                                    {rev._count?.processSteps != null && (
                                      <Chip label={`PFD: ${rev._count.processSteps}`} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                                    )}
                                    {rev._count?.pfmeaRows != null && (
                                      <Chip label={`FMEA: ${rev._count.pfmeaRows}`} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                                    )}
                                    {rev._count?.controlPlanRows != null && (
                                      <Chip label={`CP: ${rev._count.controlPlanRows}`} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                                    )}
                                  </Stack>
                                </TableCell>
                                <TableCell align="center">
                                  <Stack direction="row" spacing={0} sx={{ justifyContent: 'center' }}>
                                    {!isActive && (
                                      <Tooltip title="Activate this revision">
                                        <IconButton size="small" color="success" onClick={() => handleActivateRevision(rev)}>
                                          <ActivateIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                    {canEdit && (
                                      <Tooltip title="Edit revision">
                                        <IconButton size="small" color="primary" onClick={() => openEditDialog(rev)}>
                                          <EditIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                    {canDelete && (
                                      <Tooltip title="Delete revision (Admin)">
                                        <IconButton size="small" color="error" onClick={() => { setDeleteRevisionTarget(rev); setDeleteConfirmOpen(true); }}>
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                  </Stack>
                                </TableCell>
                              </TableRow>

                              {/* Expanded Detail Row */}
                              <TableRow>
                                <TableCell colSpan={9} sx={{ p: 0, borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none' }}>
                                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                    <Box sx={{ p: 2.5, bgcolor: '#fafafa' }}>
                                      <Grid container spacing={2}>
                                        <Grid size={4}>
                                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Summary</Typography>
                                          <Typography variant="body2">{rev.summary || '—'}</Typography>
                                        </Grid>
                                        <Grid size={4}>
                                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Effective From</Typography>
                                          <Typography variant="body2">{rev.effectiveFrom ? new Date(rev.effectiveFrom).toLocaleDateString() : '—'}</Typography>
                                        </Grid>
                                        <Grid size={4}>
                                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Effective To</Typography>
                                          <Typography variant="body2">{rev.effectiveTo ? new Date(rev.effectiveTo).toLocaleDateString() : '—'}</Typography>
                                        </Grid>
                                      </Grid>

                                      {/* Audit Log Timeline */}
                                      <Box sx={{ mt: 2 }}>
                                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
                                          <HistoryIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Audit Trail</Typography>
                                        </Stack>
                                        {auditLoading && expandedRevisionId === rev.id ? (
                                          <CircularProgress size={20} />
                                        ) : (auditLogs[rev.id] || []).length === 0 ? (
                                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>No audit entries for this revision.</Typography>
                                        ) : (
                                          <Stack spacing={1}>
                                            {(auditLogs[rev.id] || []).map((log: any, logIdx: number) => (
                                              <Box key={logIdx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, pl: 1, borderLeft: '2px solid #cbd5e1' }}>
                                                <Box sx={{ minWidth: 120 }}>
                                                  <Typography variant="caption" color="text.secondary">{new Date(log.timestamp).toLocaleString()}</Typography>
                                                </Box>
                                                <Chip
                                                  label={log.action}
                                                  size="small"
                                                  color={log.action === 'create' ? 'success' : log.action === 'delete' ? 'error' : log.action === 'activate' ? 'info' : 'primary'}
                                                  variant="outlined"
                                                  sx={{ fontSize: '0.65rem', height: 20, textTransform: 'capitalize' }}
                                                />
                                                <Typography variant="body2" sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                                                  {log.newValue?.revisionNumber ? `Rev ${log.newValue.revisionNumber}` : ''}
                                                  {log.newValue?.changeDescription ? ` — ${log.newValue.changeDescription}` : ''}
                                                </Typography>
                                              </Box>
                                            ))}
                                          </Stack>
                                        )}
                                      </Box>
                                    </Box>
                                  </Collapse>
                                </TableCell>
                              </TableRow>
                            </React.Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}
          </CardContent>
          
          {tabValue !== 5 && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, p: 2, borderTop: '1px solid #e2e8f0' }}>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={saveLoading}
              >
                {saveLoading ? 'Saving...' : 'Save Settings'}
              </Button>
            </Box>
          )}
        </Card>
      </Box>

      {/* Create Revision Dialog */}
      <Dialog
        open={createRevisionOpen}
        onClose={(_, reason) => { if (reason !== 'backdropClick') setCreateRevisionOpen(false); }}
        maxWidth="sm"
        fullWidth
      >
        <Box component="form" onSubmit={handleCreateRevision}>
          <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Create New Revision
            <IconButton size="small" onClick={() => setCreateRevisionOpen(false)}><CloseIcon fontSize="small" /></IconButton>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Creates a new revision and copies all data (PFD steps, FMEA rows, Control Plan rows) from the current active revision as a starting point.
            </Typography>
            <Stack spacing={2.5}>
              <TextField
                fullWidth
                label="Revision Number"
                placeholder="e.g. 2.0, 1.1"
                value={newRevisionNumber}
                onChange={(e) => setNewRevisionNumber(e.target.value)}
                variant="outlined"
                size="small"
                helperText="Format: X.Y (e.g. 2.0, 1.1). Leave empty to auto-increment."
              />
              <TextField
                required
                fullWidth
                multiline
                rows={3}
                label="Change Description"
                placeholder="e.g. Incorporated customer review feedback on operation 20 drilling spec."
                value={changeDesc}
                onChange={(e) => setChangeDesc(e.target.value)}
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Summary"
                placeholder="Brief summary of this revision"
                value={newSummary}
                onChange={(e) => setNewSummary(e.target.value)}
                variant="outlined"
                size="small"
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  type="date"
                  label="Effective From"
                  value={newEffectiveFrom}
                  onChange={(e) => setNewEffectiveFrom(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  size="small"
                />
                <TextField
                  fullWidth
                  type="date"
                  label="Effective To"
                  value={newEffectiveTo}
                  onChange={(e) => setNewEffectiveTo(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  size="small"
                />
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setCreateRevisionOpen(false)} variant="outlined">Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={createRevisionLoading || !changeDesc.trim()}
            >
              {createRevisionLoading ? 'Creating...' : 'Create Revision'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Edit Revision Dialog */}
      <Dialog
        open={editRevisionOpen}
        onClose={() => setEditRevisionOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Edit Revision {editRevision?.revisionNumber}
          <IconButton size="small" onClick={() => setEditRevisionOpen(false)}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Revision Number"
              value={editRevNumber}
              onChange={(e) => setEditRevNumber(e.target.value)}
              variant="outlined"
              size="small"
              helperText="Format: X.Y (e.g. 2.0, 1.1)"
            />
            <TextField
              fullWidth
              label="Change Description"
              multiline
              rows={3}
              value={editChangeDesc}
              onChange={(e) => setEditChangeDesc(e.target.value)}
              variant="outlined"
            />
            <TextField
              fullWidth
              label="Summary"
              value={editSummary}
              onChange={(e) => setEditSummary(e.target.value)}
              variant="outlined"
              size="small"
            />
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                type="date"
                label="Effective From"
                value={editEffFrom}
                onChange={(e) => setEditEffFrom(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                size="small"
              />
              <TextField
                fullWidth
                type="date"
                label="Effective To"
                value={editEffTo}
                onChange={(e) => setEditEffTo(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                size="small"
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setEditRevisionOpen(false)} variant="outlined">Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleEditRevisionSubmit}
            disabled={editLoading}
          >
            {editLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: '#dc2626' }}>Delete Revision</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            This action is permanent and cannot be undone.
          </Alert>
          <Typography variant="body2" sx={{ mb: 1 }}>
            You are about to delete revision <strong>v{deleteRevisionTarget?.revisionNumber}</strong> and all its associated data:
          </Typography>
          <Stack spacing={0.5} sx={{ pl: 2, mb: 1 }}>
            {deleteRevisionTarget?._count?.processSteps > 0 && (
              <Typography variant="body2" color="text.secondary">• {deleteRevisionTarget._count.processSteps} PFD step(s)</Typography>
            )}
            {deleteRevisionTarget?._count?.pfmeaRows > 0 && (
              <Typography variant="body2" color="text.secondary">• {deleteRevisionTarget._count.pfmeaRows} PFMEA row(s)</Typography>
            )}
            {deleteRevisionTarget?._count?.controlPlanRows > 0 && (
              <Typography variant="body2" color="text.secondary">• {deleteRevisionTarget._count.controlPlanRows} Control Plan row(s)</Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} variant="outlined">Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteRevision}
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
