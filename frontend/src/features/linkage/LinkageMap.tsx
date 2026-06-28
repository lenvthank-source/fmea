import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Stack, Grid, CircularProgress,
  Alert, Paper, Chip, Divider
} from '@mui/material';
import {
  AccountTree as PfdIcon,
  HelpOutlined as FunctionIcon,
  Warning as FailureIcon,
  ListAlt as CpIcon,
  AssignmentTurnedIn as ActionsIcon,
  ArrowForward as ArrowIcon
} from '@mui/icons-material';
import { useAuth } from '../auth/AuthContext';
import { API_BASE_URL } from '../../config';
import { DocumentHeader } from '../../components/DocumentHeader';

interface ProcessStep {
  id: string;
  stepNumber: string;
  name: string;
}

interface PfmeaRow {
  id: string;
  processStepId: string;
  rowNumber: number;
  severity: number | null;
  occurrence: number | null;
  detection: number | null;
  ap: string | null;
  functions: { name: string }[];
  failureModes: { name: string }[];
  effects: { name: string }[];
  causes: { name: string }[];
}

interface ControlPlanRow {
  id: string;
  processStepId: string;
  characteristicName: string | null;
  controlMethod: string | null;
}

interface Action {
  id: string;
  description: string;
  status: string;
  fmeaLinks: { fmeaRowId: string }[];
}

export const LinkageMap: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [fmeaRows, setFmeaRows] = useState<PfmeaRow[]>([]);
  const [cpRows, setCpRows] = useState<ControlPlanRow[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [projectName, setProjectName] = useState('');

  useEffect(() => {
    const fetchLinkageData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch project document revisions
        const docRes = await fetch(`${API_BASE_URL}/projects/${projectId}/documents`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!docRes.ok) throw new Error('Failed to load project revisions context.');
        const documents = await docRes.json();

        const pfmeaDoc = documents.find((doc: any) => doc.type === 'PFMEA');
        const cpDoc = documents.find((doc: any) => doc.type === 'CONTROL_PLAN');

        if (!pfmeaDoc || !pfmeaDoc.currentRevisionId) {
          throw new Error('PFMEA revision context not initialized.');
        }
        if (!cpDoc || !cpDoc.currentRevisionId) {
          throw new Error('Control Plan revision context not initialized.');
        }

        const pfmeaRevisionId = pfmeaDoc.currentRevisionId;
        const cpRevisionId = cpDoc.currentRevisionId;

        // 2. Fetch steps
        const stepsRes = await fetch(`${API_BASE_URL}/revisions/${pfmeaRevisionId}/pfd-steps`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const stepsData = stepsRes.ok ? await stepsRes.json() : [];

        // 3. Fetch PFMEA rows
        const fmeaRes = await fetch(`${API_BASE_URL}/revisions/${pfmeaRevisionId}/pfmea-rows`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const fmeaData = fmeaRes.ok ? await fmeaRes.json() : [];

        // 4. Fetch Control Plan rows
        const cpRes = await fetch(`${API_BASE_URL}/revisions/${cpRevisionId}/control-plan-rows`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const cpData = cpRes.ok ? await cpRes.json() : [];

        // 5. Fetch actions
        const actionsRes = await fetch(`${API_BASE_URL}/actions?projectId=${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const actionsData = actionsRes.ok ? await actionsRes.json() : [];

        setSteps(stepsData);
        setFmeaRows(fmeaData);
        setCpRows(cpData);
        setActions(actionsData);
      } catch (err: any) {
        setError(err.message || 'An error occurred while loading linkage map.');
      } finally {
        setLoading(false);
      }
    };

    if (projectId && token) {
      fetchLinkageData();
    }
  }, [projectId, token]);

  if (loading) {
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
        docType="PFMEA"
        onHeaderLoaded={(p) => setProjectName(p.name)}
      />

      <Paper
        sx={{
          p: 3,
          mb: 4,
          border: '1px solid rgba(40, 37, 29, 0.1)',
          borderRadius: 3,
          bgcolor: 'background.paper',
          boxShadow: 'none'
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}>
          Quality Lineage Traceability Map - {projectName}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Trace the flow of specifications, risks, controls, and tasks across PFD, PFMEA, Control Plan, and Action Tracker.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Stack spacing={3.5}>
          {steps.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 4 }}>
              No process steps added yet. Add steps in PFD or PFMEA to visualize lineage.
            </Typography>
          ) : (
            steps.map((step) => {
              const stepFmeaRows = fmeaRows.filter(r => r.processStepId === step.id);
              const stepCpRows = cpRows.filter(r => r.processStepId === step.id);

              return (
                <Card 
                  key={step.id} 
                  sx={{ 
                    border: '1px solid rgba(40, 37, 29, 0.08)', 
                    borderRadius: 3, 
                    boxShadow: 'none',
                    bgcolor: '#fafafa',
                    position: 'relative',
                    overflow: 'visible'
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    {/* Process Step Header */}
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2.5 }}>
                      <Box sx={{ p: 0.75, bgcolor: 'rgba(1, 105, 111, 0.08)', borderRadius: 2, display: 'flex', alignItems: 'center' }}>
                        <PfdIcon sx={{ color: 'primary.main', fontSize: '1.25rem' }} />
                      </Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        Step {step.stepNumber}: {step.name}
                      </Typography>
                    </Stack>

                    <Divider sx={{ mb: 2.5 }} />

                    {stepFmeaRows.length === 0 ? (
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontStyle: 'italic', pl: 1 }}>
                        No PFMEA analysis rows associated with this step.
                      </Typography>
                    ) : (
                      <Stack spacing={3}>
                        {stepFmeaRows.map((row) => {
                          const rowActions = actions.filter(act => 
                            act.fmeaLinks?.some(link => link.fmeaRowId === row.id)
                          );

                          return (
                            <Box 
                              key={row.id} 
                              sx={{ 
                                p: 2, 
                                border: '1px solid rgba(40, 37, 29, 0.05)', 
                                borderRadius: 2, 
                                bgcolor: '#ffffff' 
                              }}
                            >
                              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1.5 }}>
                                FMEA Row #{row.rowNumber} (AP: {row.ap || '—'})
                              </Typography>

                              <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                                {/* 1. Function */}
                                <Grid size={{ xs: 12, md: 3 }}>
                                  <Box sx={{ p: 1.25, border: '1px solid #437A22', bgcolor: '#eefcf4', borderRadius: 2 }}>
                                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
                                      <FunctionIcon sx={{ color: '#437A22', fontSize: '0.9rem' }} />
                                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#437A22' }}>FUNCTION</Typography>
                                    </Stack>
                                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                                      {row.functions?.[0]?.name || '—'}
                                    </Typography>
                                  </Box>
                                </Grid>

                                <Grid size={{ xs: 12, md: 0.5 }} sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
                                  <ArrowIcon color="disabled" fontSize="small" />
                                </Grid>

                                {/* 2. Failure Mode & Severity */}
                                <Grid size={{ xs: 12, md: 3.5 }}>
                                  <Box sx={{ p: 1.25, border: '1px solid #A13544', bgcolor: '#fdf2f2', borderRadius: 2 }}>
                                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
                                      <FailureIcon sx={{ color: '#A13544', fontSize: '0.9rem' }} />
                                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#A13544' }}>
                                        FAILURE MODE (S: {row.severity || '—'})
                                      </Typography>
                                    </Stack>
                                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                                      {row.failureModes?.[0]?.name || '—'}
                                    </Typography>
                                  </Box>
                                </Grid>

                                <Grid size={{ xs: 12, md: 0.5 }} sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
                                  <ArrowIcon color="disabled" fontSize="small" />
                                </Grid>

                                {/* 3. Control Plan controls */}
                                <Grid size={{ xs: 12, md: 2.5 }}>
                                  <Box sx={{ p: 1.25, border: '1px solid #01696F', bgcolor: 'rgba(1, 105, 111, 0.04)', borderRadius: 2 }}>
                                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
                                      <CpIcon sx={{ color: 'primary.main', fontSize: '0.9rem' }} />
                                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>CONTROL METHOD</Typography>
                                    </Stack>
                                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                                      {stepCpRows?.[0]?.controlMethod || '—'}
                                    </Typography>
                                  </Box>
                                </Grid>

                                <Grid size={{ xs: 12, md: 0.5 }} sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
                                  <ArrowIcon color="disabled" fontSize="small" />
                                </Grid>

                                {/* 4. Actions status */}
                                <Grid size={{ xs: 12, md: 2 }}>
                                  <Box sx={{ p: 1.25, border: '1px solid #D19900', bgcolor: '#fffbeb', borderRadius: 2 }}>
                                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
                                      <ActionsIcon sx={{ color: '#D19900', fontSize: '0.9rem' }} />
                                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#D19900' }}>CORRECTIVE ACTION</Typography>
                                    </Stack>
                                    {rowActions.length > 0 ? (
                                      <Stack spacing={0.5}>
                                        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          {rowActions[0].description}
                                        </Typography>
                                        <Chip 
                                          label={rowActions[0].status.toUpperCase()} 
                                          size="small" 
                                          sx={{ 
                                            height: 16, 
                                            fontSize: '0.6rem', 
                                            fontWeight: 'bold',
                                            bgcolor: rowActions[0].status === 'completed' ? 'success.main' : 'warning.main',
                                            color: 'white',
                                            alignSelf: 'flex-start'
                                          }}
                                        />
                                      </Stack>
                                    ) : (
                                      <Typography variant="body2" sx={{ fontStyle: 'italic', fontSize: '0.8rem', color: 'text.secondary' }}>
                                        No action linked
                                      </Typography>
                                    )}
                                  </Box>
                                </Grid>
                              </Grid>
                            </Box>
                          );
                        })}
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </Stack>
      </Paper>
    </Box>
  );
};
