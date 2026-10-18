import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, IconButton, Collapse, Chip, Divider } from '@mui/material';
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import { useAuth } from '../features/auth/AuthContext';
import { API_BASE_URL } from '../config';

interface DocumentHeaderProps {
  projectId: string;
  docType: 'PFD' | 'PFMEA' | 'CONTROL_PLAN' | 'DFMEA';
  onHeaderLoaded?: (projectData: any) => void;
  drawerOpen?: boolean;
  drawerWidth?: number | string;
  sx?: any;
}

export const DocumentHeader: React.FC<DocumentHeaderProps> = ({
  projectId,
  docType,
  onHeaderLoaded,
  drawerOpen,
  drawerWidth,
  sx: customSx,
}) => {
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
    const docTypes = project.documentTypes || [];
    const isSafe = docTypes.includes('Safe Launch');
    const basePhase = docTypes.includes('Production')
      ? 'Production'
      : docTypes.includes('Pre-Launch')
      ? 'Pre-Launch'
      : 'Prototype';

    const label = isSafe ? `${basePhase.toUpperCase()} (SAFE LAUNCH)` : basePhase.toUpperCase();

    if (basePhase === 'Production') {
      return {
        color: 'success' as const,
        label,
        sx: {
          bgcolor: isSafe ? '#f0fdf4' : '#ecfdf5',
          color: '#16a34a',
          border: '1px solid #bbf7d0',
          fontWeight: 700,
          fontSize: '0.725rem',
          height: 22,
        },
      };
    }
    if (basePhase === 'Pre-Launch') {
      return {
        color: 'info' as const,
        label,
        sx: {
          bgcolor: isSafe ? '#eff6ff' : '#f0f9ff',
          color: '#2563eb',
          border: '1px solid #bfdbfe',
          fontWeight: 700,
          fontSize: '0.725rem',
          height: 22,
        },
      };
    }
    // Prototype
    return {
      color: 'warning' as const,
      label,
      sx: {
        bgcolor: isSafe ? '#fff7ed' : '#fffbeb',
        color: isSafe ? '#ea580c' : '#d97706',
        border: isSafe ? '1px solid #fed7aa' : '1px solid #fde68a',
        fontWeight: 700,
        fontSize: '0.725rem',
        height: 22,
      },
    };
  };

  const statusProps = getStatusChipProps();

  return (
    <Card sx={{ 
      mb: 2.5, 
      border: '1px solid #e4e4e7', 
      borderRadius: '12px', 
      bgcolor: '#ffffff', 
      overflow: 'hidden',
      position: 'sticky',
      top: 0,
      zIndex: 1350, /* Placed above modal backdrops (1300) so it is never dimmed or blurred when adding functions/failures/steps */
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      mr: drawerOpen ? { xs: 0, sm: typeof drawerWidth === 'number' ? `${drawerWidth}px` : (drawerWidth || '520px') } : 0,
      transition: 'margin-right 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      ...customSx,
    }}>
      {/* Header bar always visible */}
      <Box sx={{
        px: 2.5,
        py: 1,
        bgcolor: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.95rem' }}>
            {getDocTypeName()}
          </Typography>
          <Divider orientation="vertical" flexItem sx={{ height: 14, my: 'auto', bgcolor: 'divider' }} />
          <Typography sx={{ fontWeight: 600, fontSize: '0.8125rem', color: 'text.secondary' }}>
            Part: {project.partName || '—'}
          </Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
            • Rev: {project.revisionNumber || '1.0'}
          </Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
            • Cust: {project.customer || '—'}
          </Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
            • Part No: {project.orgPartNumber || '—'}
          </Typography>
        </Box>
        <Box 
          onClick={() => setExpanded(!expanded)}
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', userSelect: 'none' }}
        >
          <Chip
            label={statusProps.label}
            size="small"
            sx={statusProps.sx}
          />
          <Divider orientation="vertical" flexItem sx={{ height: 14, my: 'auto', bgcolor: '#e4e4e7' }} />
          <Typography sx={{ fontWeight: 600, fontSize: '0.78rem', color: '#71717a' }}>
            {expanded ? 'Hide Details' : 'View Full Header'}
          </Typography>
          <IconButton 
            size="small"
            sx={{ border: '1px solid #e4e4e7', borderRadius: '6px', p: 0.25 }}
          >
            {expanded ? <ExpandLessIcon sx={{ fontSize: '0.9rem' }} /> : <ExpandMoreIcon sx={{ fontSize: '0.9rem' }} />}
          </IconButton>
        </Box>
      </Box>

      {/* Expanded Grid */}
      <Collapse in={expanded}>
        <CardContent sx={{ px: 2.5, py: 1.5 }}>
          <Grid container spacing={1.5} sx={{ fontSize: '0.8125rem' }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography color="text.secondary" sx={{ display: 'block', fontWeight: 600, fontSize: '0.75rem' }}>Organisation Name</Typography>
              <Typography sx={{ fontWeight: 600, mt: 0.25, fontSize: '0.85rem' }}>{project.organisationName || '—'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography color="text.secondary" sx={{ display: 'block', fontWeight: 600, fontSize: '0.75rem' }}>Manufacturing Location</Typography>
              <Typography sx={{ fontWeight: 600, mt: 0.25, fontSize: '0.85rem' }}>{project.organisationPlant || '—'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography color="text.secondary" sx={{ display: 'block', fontWeight: 600, fontSize: '0.75rem' }}>Customer Name</Typography>
              <Typography sx={{ fontWeight: 600, mt: 0.25, fontSize: '0.85rem' }}>{project.customer || '—'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography color="text.secondary" sx={{ display: 'block', fontWeight: 600, fontSize: '0.75rem' }}>Assy. Line No.</Typography>
              <Typography sx={{ fontWeight: 600, mt: 0.25, fontSize: '0.85rem' }}>{project.assemblyLineNumber || '—'}</Typography>
            </Grid>

            {/* Row 2 */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography color="text.secondary" sx={{ display: 'block', fontWeight: 600, fontSize: '0.75rem' }}>Subject (Part Name)</Typography>
              <Typography sx={{ fontWeight: 600, mt: 0.25, fontSize: '0.85rem' }}>{project.partName || '—'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography color="text.secondary" sx={{ display: 'block', fontWeight: 600, fontSize: '0.75rem' }}>Document Number</Typography>
              <Typography sx={{ fontWeight: 600, mt: 0.25, fontSize: '0.85rem' }}>{getDerivedDocNumber()}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography color="text.secondary" sx={{ display: 'block', fontWeight: 600, fontSize: '0.75rem' }}>Dwg No.</Typography>
              <Typography sx={{ fontWeight: 600, mt: 0.25, fontSize: '0.85rem' }}>{project.dwgNumber || '—'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography color="text.secondary" sx={{ display: 'block', fontWeight: 600, fontSize: '0.75rem' }}>Dwg Rev No / Date.</Typography>
              <Typography sx={{ fontWeight: 600, mt: 0.25, fontSize: '0.85rem' }}>{project.dwgRevNoAndDate || (project.drawingRevDate ? formatDate(project.drawingRevDate) : '—')}</Typography>
            </Grid>

            {/* Col 3 */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography color="text.secondary" sx={{ display: 'block', fontWeight: 600, fontSize: '0.75rem' }}>Concerned Key Contact</Typography>
              <Typography sx={{ fontWeight: 600, mt: 0.25, fontSize: '0.85rem' }}>{project.keyContact || '—'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography color="text.secondary" sx={{ display: 'block', fontWeight: 600, fontSize: '0.75rem' }}>Status</Typography>
              <Chip
                label={statusProps.label}
                size="small"
                sx={{ ...statusProps.sx, mt: 0.5 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 12, md: 4 }}>
              <Typography color="text.secondary" sx={{ display: 'block', fontWeight: 600, fontSize: '0.75rem' }}>Cross-Functional Team (CFT)</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {project.cftMembers && project.cftMembers.map((member: string) => (
                  <Chip key={member} label={member} size="small" sx={{ height: 20, fontSize: '0.75rem' }} />
                ))}
                {(!project.cftMembers || project.cftMembers.length === 0) && <Typography sx={{ fontStyle: 'italic', color: 'text.secondary', fontSize: '0.85rem' }}>None assigned</Typography>}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Collapse>
    </Card>
  );
};


