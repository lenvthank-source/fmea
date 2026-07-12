import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, Alert, CircularProgress, Grid, Card, CardContent,
  FormControlLabel, Chip, Radio, RadioGroup, Tabs, Tab, Switch,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as BackIcon, Add as AddIcon } from '@mui/icons-material';
import { useAuth } from '../auth/AuthContext';
import { API_BASE_URL } from '../../config';

export const ProjectSettings: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { token } = useAuth();
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
        body: JSON.stringify({ changeDesc: changeDesc.trim() })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to create revision');
      }

      setSuccess('Project revision created successfully. Current revision has been incremented.');
      setChangeDesc('');
      setCreateRevisionOpen(false);
      fetchRevisions();
    } catch (err: any) {
      setError(err.message || 'Could not create revision');
    } finally {
      setCreateRevisionLoading(false);
    }
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
                      Project Revision History Log
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      View all revisions, changes, and historical releases of this project workspace.
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => setCreateRevisionOpen(true)}
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
                    No project revisions found. Rev 1.0 is active.
                  </Alert>
                ) : (
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: 'action.hover' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold', width: 100 }}>Revision</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', width: 180 }}>Created At</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Change Description</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', width: 180 }}>Author</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {revisions.map((rev) => (
                          <TableRow key={rev.id}>
                            <TableCell sx={{ fontWeight: 'bold' }}>
                              <Chip label={rev.revisionNumber} size="small" color="primary" variant="outlined" />
                            </TableCell>
                            <TableCell>
                              {new Date(rev.createdAt).toLocaleString()}
                            </TableCell>
                            <TableCell sx={{ whiteSpace: 'pre-wrap' }}>
                              {rev.changeDescription}
                            </TableCell>
                            <TableCell>
                              {rev.createdBy?.name || rev.createdBy?.email || 'System'}
                            </TableCell>
                          </TableRow>
                        ))}
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
        onClose={() => setCreateRevisionOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <Box component="form" onSubmit={handleCreateRevision}>
          <DialogTitle sx={{ fontWeight: 'bold' }}>Create Project Revision</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Creating a revision increments the project's version number (e.g. 1.0 → 2.0) and snapshots the current state of PFD, FMEAs, and Control Plans.
            </Typography>
            <TextField
              required
              fullWidth
              multiline
              rows={4}
              label="Change Description"
              placeholder="e.g. Incorporated customer review feedback on operation 20 drilling spec."
              value={changeDesc}
              onChange={(e) => setChangeDesc(e.target.value)}
              variant="outlined"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setCreateRevisionOpen(false)} variant="outlined">
              Cancel
            </Button>
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
    </Box>
  );
};
