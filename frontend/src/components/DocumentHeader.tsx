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
  const [documentInfo, setDocumentInfo] = useState<any>(null);
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
          onHeaderLoaded(projectData);
        }

        // 2. Fetch project documents to get current revision information
        const docsRes = await fetch(`${API_BASE_URL}/projects/${projectId}/documents`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (docsRes.ok) {
          const docs = await docsRes.json();
          const targetDoc = docs.find((d: any) => d.type === docType);
          setDocumentInfo(targetDoc);
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
      case 'PFD': return 'Process Flow Diagram (PFD)';
      case 'PFMEA': return 'Process Failure Mode & Effects Analysis (PFMEA)';
      case 'CONTROL_PLAN': return 'Process Control Plan (CP)';
      case 'DFMEA': return 'Design Failure Mode & Effects Analysis (DFMEA)';
      default: return docType;
    }
  };

  // Get preliminary/final checkboxes
  const isFinal = project.preliminaryFinalFlag === 'final';

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
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
            {getDocTypeName()}
          </Typography>
          <Divider orientation="vertical" flexItem sx={{ height: 16, my: 'auto', bgcolor: 'divider' }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            Part: {project.partName || '—'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            • Rev: {documentInfo?.currentRevisionId ? '1.0' : '1.0'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            • Cust: {project.customer || '—'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            • Part No: {project.customerPartNumber || project.orgPartNumber || '—'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
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
          <Grid container spacing={2} sx={{ fontSize: '0.85rem' }}>
            {/* Row 1 */}
            <Grid size={3}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Organisation Name</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{project.organisationName || '—'}</Typography>
            </Grid>
            <Grid size={3}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Customer</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{project.customer || '—'}</Typography>
            </Grid>
            <Grid size={3}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Part Description</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{project.partName || '—'}</Typography>
            </Grid>
            <Grid size={3}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Organisation Part No.</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{project.orgPartNumber || '—'}</Typography>
            </Grid>

            {/* Row 2 */}
            <Grid size={3}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>CFT Members</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {project.cftMembers && project.cftMembers.map((member: string) => (
                  <Chip key={member} label={member} size="small" sx={{ height: 20, fontSize: '0.75rem' }} />
                ))}
                {(!project.cftMembers || project.cftMembers.length === 0) && <Typography variant="body2">—</Typography>}
              </Box>
            </Grid>
            <Grid size={2}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Dwg No.</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{project.dwgNumber || '—'}</Typography>
            </Grid>
            <Grid size={2}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Dwg Rev No / Date</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{project.dwgRevNoAndDate || '—'}</Typography>
            </Grid>
            <Grid size={2}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Document Origin Date</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDate(project.originationDate)}</Typography>
            </Grid>
            <Grid size={1.5}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Assy. Line No.</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{project.assemblyLineNumber || '—'}</Typography>
            </Grid>
            <Grid size={1.5} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', width: '100%', textAlign: 'right' }}>Status</Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Chip
                  label="PRELIMINARY"
                  color={!isFinal ? 'primary' : 'default'}
                  variant={!isFinal ? 'filled' : 'outlined'}
                  size="small"
                  sx={{ height: 20, fontSize: '0.7rem', fontWeight: 'bold' }}
                />
                <Chip
                  label="FINAL"
                  color={isFinal ? 'success' : 'default'}
                  variant={isFinal ? 'filled' : 'outlined'}
                  size="small"
                  sx={{ height: 20, fontSize: '0.7rem', fontWeight: 'bold' }}
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Collapse>
    </Card>
  );
};


