import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, IconButton, Collapse, Chip, Divider } from '@mui/material';
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import { useAuth } from '../features/auth/AuthContext';
import { API_BASE_URL } from '../config';

interface DocumentHeaderProps {
  projectId: string;
  docType: 'PFD' | 'PFMEA' | 'CONTROL_PLAN' | 'DFMEA';
  onHeaderLoaded?: (projectData: any) => void;
}

export const DocumentHeader: React.FC<DocumentHeaderProps> = ({ projectId, docType, onHeaderLoaded }) => {
  const { token } = useAuth();
  const [project, setProject] = useState<any>(null);
  const [expanded, setExpanded] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchHeaderDetails = async () => {
      try {
        // 1. Fetch project details
        const projectRes = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!projectRes.ok) throw new Error('Failed to fetch project');
        const projectData = await projectRes.json();
        setProject(projectData);
        if (onHeaderLoaded) {
          const formattedName = projectData.partName ? `${projectData.partName} (${projectData.orgPartNumber || 'N/A'})` : (projectData.name || 'Untitled');
          onHeaderLoaded({ ...projectData, name: formattedName });
        }
      } catch (err) {
        console.error('Error fetching document header info:', err);
      } finally {
        setLoading(false);
      }
    };

    if (projectId && token) {
      fetchHeaderDetails();
    }
  }, [projectId, token, docType]);

  if (loading || !project) {
    return null;
  }

  // Formatting helpers
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDocTypeName = () => {
    switch (docType) {
      case 'PFD': return 'Process Flow Diagram';
      case 'PFMEA': return 'PFMEA';
      case 'CONTROL_PLAN': return 'Control Plan';
      case 'DFMEA': return 'DFMEA';
      default: return docType;
    }
  };

  const getDerivedDocNumber = () => {
    const partNo = project.orgPartNumber || '—';
    if (docType === 'PFD') return `PFD${partNo}`;
    if (docType === 'PFMEA') return `PFMEA${partNo}`;
    if (docType === 'DFMEA') return `DFMEA${partNo}`;
    if (docType === 'CONTROL_PLAN') return `CP${partNo}`;
    return partNo;
  };

  const getStatusChipProps = () => {
    const status = (project.documentTypes?.[0] || 'Prototype');
    switch (status) {
      case 'Production': return { color: 'success' as const, label: 'PRODUCTION' };
      case 'Safe Launch': return { color: 'secondary' as const, label: 'SAFE LAUNCH' };
      case 'Pre-Launch': return { color: 'info' as const, label: 'PRE-LAUNCH' };
      default: return { color: 'warning' as const, label: 'PROTOTYPE' };
    }
  };

  const statusProps = getStatusChipProps();

  return (
    <Card sx={{ mb: 3, border: '1px solid #e2e8f0', borderRadius: 4, bgcolor: 'background.paper', overflow: 'hidden' }}>
      {/* Header bar always visible */}
      <Box sx={{
        px: 3,
        py: 1.5,
        bgcolor: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant={docType === 'PFD' ? "h6" : "subtitle1"} sx={{ fontWeight: 700, color: 'primary.main', fontSize: docType === 'PFD' ? '1.25rem' : '1.05rem' }}>
            {getDocTypeName()}
          </Typography>
          <Divider orientation="vertical" flexItem sx={{ height: 16, my: 'auto', bgcolor: 'divider' }} />
          <Typography sx={{ fontWeight: 600, fontSize: docType === 'PFD' ? '0.95rem' : '0.88rem', color: 'text.secondary' }}>
            Part: {project.partName || '—'}
          </Typography>
          <Typography sx={{ fontSize: docType === 'PFD' ? '0.95rem' : '0.88rem', color: 'text.secondary' }}>
            • Rev: {project.revisionNumber || '1.0'}
          </Typography>
          <Typography sx={{ fontSize: docType === 'PFD' ? '0.95rem' : '0.88rem', color: 'text.secondary' }}>
            • Cust: {project.customer || '—'}
          </Typography>
          <Typography sx={{ fontSize: docType === 'PFD' ? '0.95rem' : '0.88rem', color: 'text.secondary' }}>
            • Part No: {project.orgPartNumber || '—'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: 'text.secondary' }}>
            {expanded ? 'Hide Details' : 'View Full Header'}
          </Typography>
          <IconButton onClick={() => setExpanded(!expanded)} size="small">
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>

      {/* Expanded Grid */}
      <Collapse in={expanded}>
        <CardContent sx={{ px: 3, py: 2.5 }}>
          <Grid container spacing={3} sx={{ fontSize: '0.85rem' }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography color="text.secondary" sx={{ display: 'block', fontWeight: 600, fontSize: '0.90rem' }}>Organisation Name</Typography>
              <Typography sx={{ fontWeight: 600, mt: 0.5, fontSize: '0.98rem' }}>{project.organisationName || '—'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography color="text.secondary" sx={{ display: 'block', fontWeight: 600, fontSize: '0.90rem' }}>Manufacturing Location</Typography>
              <Typography sx={{ fontWeight: 600, mt: 0.5, fontSize: '0.98rem' }}>{project.organisationPlant || '—'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography color="text.secondary" sx={{ display: 'block', fontWeight: 600, fontSize: '0.90rem' }}>Customer Name</Typography>
              <Typography sx={{ fontWeight: 600, mt: 0.5, fontSize: '0.98rem' }}>{project.customer || '—'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography color="text.secondary" sx={{ display: 'block', fontWeight: 600, fontSize: '0.90rem' }}>Assy. Line No.</Typography>
              <Typography sx={{ fontWeight: 600, mt: 0.5, fontSize: '0.98rem' }}>{project.assemblyLineNumber || '—'}</Typography>
            </Grid>

            {/* Row 2 */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography color="text.secondary" sx={{ display: 'block', fontWeight: 600, fontSize: '0.90rem' }}>Subject (Part Name)</Typography>
              <Typography sx={{ fontWeight: 600, mt: 0.5, fontSize: '0.98rem' }}>{project.partName || '—'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography color="text.secondary" sx={{ display: 'block', fontWeight: 600, fontSize: '0.90rem' }}>Document Number</Typography>
              <Typography sx={{ fontWeight: 600, mt: 0.5, fontSize: '0.98rem' }}>{getDerivedDocNumber()}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography color="text.secondary" sx={{ display: 'block', fontWeight: 600, fontSize: '0.90rem' }}>Dwg No.</Typography>
              <Typography sx={{ fontWeight: 600, mt: 0.5, fontSize: '0.98rem' }}>{project.dwgNumber || '—'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography color="text.secondary" sx={{ display: 'block', fontWeight: 600, fontSize: '0.90rem' }}>Dwg Rev No / Date.</Typography>
              <Typography sx={{ fontWeight: 600, mt: 0.5, fontSize: '0.98rem' }}>{project.dwgRevNoAndDate || (project.drawingRevDate ? formatDate(project.drawingRevDate) : '—')}</Typography>
            </Grid>

            {/* Col 3 */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography color="text.secondary" sx={{ display: 'block', fontWeight: 600, fontSize: '0.90rem' }}>Process Responsibility</Typography>
              <Typography sx={{ fontWeight: 600, mt: 0.5, fontSize: '0.98rem' }}>{project.keyContact || '—'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography color="text.secondary" sx={{ display: 'block', fontWeight: 600, fontSize: '0.90rem' }}>Status</Typography>
              <Chip
                label={statusProps.label}
                color={statusProps.color}
                variant="outlined"
                size="small"
                sx={{ mt: 0.5, fontWeight: 'bold', height: 24, fontSize: '0.80rem' }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 12, md: 4 }}>
              <Typography color="text.secondary" sx={{ display: 'block', fontWeight: 600, fontSize: '0.90rem' }}>Cross-Functional Team (CFT)</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {project.cftMembers && project.cftMembers.map((member: string) => (
                  <Chip key={member} label={member} size="small" sx={{ height: 22, fontSize: '0.80rem' }} />
                ))}
                {(!project.cftMembers || project.cftMembers.length === 0) && <Typography sx={{ fontStyle: 'italic', color: 'text.secondary', fontSize: '0.95rem' }}>None assigned</Typography>}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Collapse>
    </Card>
  );
};


