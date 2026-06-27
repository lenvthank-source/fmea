import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Grid, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Alert, CircularProgress, CardActionArea, FormControlLabel, Chip, Radio, RadioGroup,
  Stepper, Step, StepLabel
} from '@mui/material';
import { Add as AddIcon, Business as BusinessIcon, AccessTime as AccessTimeIcon } from '@mui/icons-material';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config';

interface Project {
  id: string;
  name: string;
  description?: string;
  customer?: string;
  modelYear?: string;
  status: string;
  createdAt: string;
}

export const ProjectList: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const response = await fetch(`${API_BASE_URL}/projects`, {
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
  }, [token]);

  const handleOpen = () => {
    setOpen(true);
    setStep(1);
    setCreateError(null);
  };

  const handleClose = () => {
    setOpen(false);
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
      if (!name.trim()) return 'Project Name is required';
      if (documentTypes.length === 0) return 'At least one Document Type must be selected';
    } else if (step === 2) {
      if (!organisationName.trim()) return 'Organisation Name is required';
      if (!customer.trim()) return 'Customer is required';
      if (!partName.trim()) return 'Part Name / Description is required';
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
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
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

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : projects.length === 0 ? (
        <Box sx={{ textAlign: 'center', p: 8, border: '1px dashed #e2e8f0', borderRadius: 5, bgcolor: 'background.paper' }}>
          <Typography color="text.secondary" gutterBottom>
            No projects found in this workspace.
          </Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={handleOpen} sx={{ mt: 2 }}>
            Create Your First Project
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={project.id}>
              <Card sx={{ height: '100%' }}>
                <CardActionArea
                  sx={{ height: '100%', p: 1 }}
                  onClick={() => navigate(`/projects/${project.id}/pfd`)}
                >
                  <CardContent>
                    <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                      {project.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, minHeight: 40 }}>
                      {project.description || 'No description provided.'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'text.secondary', fontSize: '0.875rem' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <BusinessIcon fontSize="small" />
                        <Typography variant="caption">{project.customer || 'Internal'}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AccessTimeIcon fontSize="small" />
                        <Typography variant="caption">{project.modelYear || 'N/A'}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* 3-Step Create Project Modal */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', px: 3, pt: 3 }}>
          Create Quality Project
        </DialogTitle>
        <Box sx={{ px: 3, mb: 2 }}>
          <Stepper activeStep={step - 1} alternativeLabel>
            <Step><StepLabel>Basic Info</StepLabel></Step>
            <Step><StepLabel>Organisation & Part Info</StepLabel></Step>
            <Step><StepLabel>Document Control & Approvals</StepLabel></Step>
          </Stepper>
        </Box>

        <Box component="form" onSubmit={handleCreate}>
          <DialogContent sx={{ p: 3 }}>
            {createError && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
                {createError}
              </Alert>
            )}

            {/* Step 1: Basic Info */}
            {step === 1 && (
              <Box>
                <TextField
                  fullWidth
                  label="Project Name *"
                  variant="outlined"
                  margin="normal"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <TextField
                  fullWidth
                  label="Description"
                  variant="outlined"
                  margin="normal"
                  multiline
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <Grid container spacing={2}>
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
                      label="Organisation Part No."
                      variant="outlined"
                      margin="normal"
                      value={orgPartNumber}
                      onChange={(e) => setOrgPartNumber(e.target.value)}
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
                  <Grid size={12}>
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
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      label="Document Number"
                      variant="outlined"
                      margin="normal"
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      helperText="Auto-suggested prefix. Override if desired."
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      label="Control Plan Number"
                      variant="outlined"
                      margin="normal"
                      value={controlPlanNumber}
                      onChange={(e) => setControlPlanNumber(e.target.value)}
                    />
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
            <Button onClick={handleClose} disabled={createLoading}>Cancel</Button>
            <Box sx={{ flexGrow: 1 }} />
            {step > 1 && (
              <Button onClick={handleBack} disabled={createLoading}>Back</Button>
            )}
            {step < 3 ? (
              <Button onClick={handleNext} variant="contained">Next</Button>
            ) : (
              <Button type="submit" variant="contained" disabled={createLoading}>
                {createLoading ? 'Creating...' : 'Create Project'}
              </Button>
            )}
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};
