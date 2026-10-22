import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import type {
  CpDocumentV2,
  CpOperationV2,
  CpCharacteristicV2,
} from './controlPlanDocument';

interface ValidationFinding {
  ruleId: string;
  category: 'blocker' | 'warning' | 'information';
  locator: string;
  message: string;
}

interface ValidationRunResult {
  runId: string;
  isValid: boolean;
  findings: ValidationFinding[];
}

interface ControlPlanV2ViewProps {
  document: CpDocumentV2;
  revisionId: string;
  version: number;
  writable: boolean;
  token: string;
  onUpdateDocument: (nextDoc: CpDocumentV2) => void;
  onReload: () => void;
  request: (path: string, options?: RequestInit) => Promise<any>;
}

export const ControlPlanV2View: React.FC<ControlPlanV2ViewProps> = ({
  document,
  revisionId,
  version,
  writable,
  onUpdateDocument,
  onReload,
  request,
}) => {
  const [selectedOpIndex, setSelectedOpIndex] = useState(0);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationRunResult | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalComment, setApprovalComment] = useState('');
  const [approvalProgress, setApprovalProgress] = useState<string | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{
    kind: 'operation' | 'characteristic' | 'control' | 'resource';
    id: string;
    label: string;
    value: unknown;
  } | null>(null);
  const [reviewDecision, setReviewDecision] = useState<string>('accept');
  const [reviewReason, setReviewReason] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'worksheet' | 'validation' | 'header'>('worksheet');

  const operations = document.operations || [];
  const currentOp: CpOperationV2 | undefined = operations[selectedOpIndex];

  // Run Profile Validation
  const handleRunValidation = async () => {
    setValidating(true);
    try {
      const res = await request(`/revisions/${revisionId}/control-plan-document/validate`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setValidationResult(res);
      setActiveTab('validation');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Validation failed');
    } finally {
      setValidating(false);
    }
  };

  // Download PDF Report
  const handleExportPdf = async (scope: 'full' | 'selected' = 'full') => {
    setExportingPdf(true);
    try {
      const body: any = { format: 'pdf', scope };
      if (scope === 'selected' && currentOp) {
        body.selectedOperationIds = [currentOp.id];
      }
      const response = await fetch(
        `/api/v1/revisions/${revisionId}/control-plan-document/reports`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          },
          body: JSON.stringify(body),
        },
      );
      if (!response.ok) throw new Error('PDF export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `control-plan-${document.header.controlPlanNumber || 'report'}.pdf`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExportingPdf(false);
    }
  };

  // Open Review Dialog
  const openReview = (
    kind: 'operation' | 'characteristic' | 'control' | 'resource',
    id: string,
    label: string,
    value: unknown,
  ) => {
    setReviewTarget({ kind, id, label, value });
    setReviewDecision('accept');
    setReviewReason('');
    setReviewDialogOpen(true);
  };

  // Submit Review Decision
  const submitReview = async () => {
    if (!reviewTarget) return;
    try {
      await request(`/revisions/${revisionId}/control-plan-document/reviews`, {
        method: 'POST',
        body: JSON.stringify({
          observedDocumentVersion: version,
          targetKind: reviewTarget.kind,
          targetId: reviewTarget.id,
          value: reviewTarget.value,
          decision: reviewDecision,
          reason: reviewReason.trim() || undefined,
        }),
      });
      setReviewDialogOpen(false);
      setReviewTarget(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Review recording failed');
    }
  };

  // Approval Intent
  const handleApprove = async () => {
    if (!validationResult?.runId) {
      alert('Please run profile validation first before approving.');
      return;
    }
    setApproving(true);
    setApprovalProgress('Recording approval intent...');
    try {
      setApprovalProgress('Rendering PDF and archiving package...');
      await request(`/revisions/${revisionId}/control-plan-document/approval-intent`, {
        method: 'POST',
        body: JSON.stringify({
          expectedVersion: version,
          validationRunId: validationResult.runId,
          comment: approvalComment,
        }),
      });
      setApprovalProgress('Finalized successfully!');
      setTimeout(() => {
        setApprovalDialogOpen(false);
        setApproving(false);
        setApprovalProgress(null);
        onReload();
      }, 1000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Approval failed');
      setApproving(false);
      setApprovalProgress(null);
    }
  };

  // Add Operation
  const handleAddOperation = () => {
    const nextOp: CpOperationV2 = {
      id: `op_${Date.now()}`,
      order: (operations.length + 1) * 10,
      number: String((operations.length + 1) * 10),
      name: 'New Operation',
      applicability: 'standard',
      resources: [],
      characteristics: [],
    };
    const nextDoc: CpDocumentV2 = {
      ...document,
      operations: [...operations, nextOp],
    };
    onUpdateDocument(nextDoc);
    setSelectedOpIndex(operations.length);
  };

  // Add Characteristic
  const handleAddCharacteristic = () => {
    if (!currentOp) return;
    const nextChar: CpCharacteristicV2 = {
      id: `char_${Date.now()}`,
      number: String((currentOp.characteristics.length || 0) + 1),
      kind: 'product',
      name: 'New Characteristic',
      description: 'New Characteristic',
      classification: 'standard',
      criteria: {
        kind: 'unspecified',
        specification: '',
        tolerance: '',
      },
      controls: [
        {
          id: `ctrl_${Date.now()}`,
          controlType: 'prevention',
          method: 'Standard Setup Verification',
          evaluationMethod: 'Visual Check',
          executionRule: {
            mode: 'event',
            summary: 'At Setup',
          },
          reaction: {
            trigger: 'At Setup Failure',
            plan: 'Halt production, notify supervisor',
            responsible: 'Operator / Lead',
          },
          responsibility: 'Operator / Lead',
          measurementEquipment: '',
          recordReference: '',
        },
      ],
    };

    const updatedOps = [...operations];
    updatedOps[selectedOpIndex] = {
      ...currentOp,
      characteristics: [...currentOp.characteristics, nextChar],
    };
    onUpdateDocument({ ...document, operations: updatedOps });
  };

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      {/* Top Action Toolbar */}
      <Paper sx={{ p: 2, mb: 2, border: '1px solid #e3e4db', boxShadow: 'none' }}>
        <Stack
          direction="row"
          sx={{
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a252f' }}>
              Control Plan V2
            </Typography>
            <Chip
              label={document.config.phase.toUpperCase()}
              size="small"
              color={document.config.phase === 'production' ? 'success' : 'primary'}
            />
            {document.config.safeLaunch.enabled && (
              <Chip label="Safe Launch" size="small" color="warning" />
            )}
            <Chip
              label={`${operations.length} Operations`}
              size="small"
              variant="outlined"
            />
          </Stack>

          <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleRunValidation}
              disabled={validating}
              startIcon={validating ? <CircularProgress size={16} /> : undefined}
            >
              {validating ? 'Validating...' : 'Validate Profile'}
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleExportPdf('full')}
              disabled={exportingPdf}
            >
              {exportingPdf ? 'Exporting...' : 'Export PDF'}
            </Button>
            {writable && (
              <Button
                variant="contained"
                size="small"
                color="success"
                onClick={() => setApprovalDialogOpen(true)}
              >
                Approve Plan
              </Button>
            )}
          </Stack>
        </Stack>

        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{ mt: 1, minHeight: 36 }}
        >
          <Tab label="Operations & Controls" value="worksheet" sx={{ minHeight: 36, py: 0.5 }} />
          <Tab
            label={`Validation Findings ${validationResult ? `(${validationResult.findings.length})` : ''}`}
            value="validation"
            sx={{ minHeight: 36, py: 0.5 }}
          />
          <Tab label="Header & Metadata" value="header" sx={{ minHeight: 36, py: 0.5 }} />
        </Tabs>
      </Paper>

      {/* Main Content Area */}
      {activeTab === 'worksheet' && (
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
          {/* Operations Navigator (Left Column) */}
          <Box sx={{ width: { xs: '100%', md: 280 }, flexShrink: 0 }}>
            <Paper sx={{ p: 1.5, border: '1px solid #e3e4db', boxShadow: 'none' }}>
              <Stack
                direction="row"
                sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Operations
                </Typography>
                {writable && (
                  <Button size="small" variant="text" onClick={handleAddOperation}>
                    + Add Op
                  </Button>
                )}
              </Stack>
              <List dense sx={{ maxHeight: 600, overflowY: 'auto' }}>
                {operations.map((op, idx) => (
                  <ListItemButton
                    key={op.id || idx}
                    selected={idx === selectedOpIndex}
                    onClick={() => setSelectedOpIndex(idx)}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      '&.Mui-selected': {
                        bgcolor: '#eef2f6',
                        borderLeft: '4px solid #1976d2',
                      },
                    }}
                  >
                    <ListItemText
                      primary={`Op ${op.number}: ${op.name}`}
                      secondary={`${op.characteristics?.length || 0} characteristics`}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Paper>
          </Box>

          {/* Operation Details & Control Grid (Right Column) */}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            {currentOp ? (
              <Stack spacing={2}>
                {/* Operation Summary Header */}
                <Paper sx={{ p: 2, border: '1px solid #e3e4db', boxShadow: 'none' }}>
                  <Stack
                    direction="row"
                    sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}
                  >
                    <Box>
                      <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 600 }}>
                        Op {currentOp.number}: {currentOp.name}
                      </Typography>
                      {/* Shared Manufacturing Resources */}
                      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mt: 1 }}>
                        <Typography variant="caption" sx={{ color: '#666', fontWeight: 600 }}>
                          Equipment:
                        </Typography>
                        {currentOp.resources?.length ? (
                          currentOp.resources.map((res, rIdx) => (
                            <Chip
                              key={res.id || rIdx}
                              label={res.text}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: 11 }}
                            />
                          ))
                        ) : (
                          <Typography variant="caption" sx={{ color: '#999', fontStyle: 'italic' }}>
                            None specified
                          </Typography>
                        )}
                      </Stack>
                    </Box>

                    <Stack direction="row" sx={{ gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleExportPdf('selected')}
                      >
                        Print Op
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => openReview('operation', currentOp.id, `Op ${currentOp.number}`, currentOp)}
                      >
                        Review Op
                      </Button>
                      {writable && (
                        <Button size="small" variant="contained" onClick={handleAddCharacteristic}>
                          + Characteristic
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                </Paper>

                {/* Characteristics & Controls Cards */}
                {currentOp.characteristics?.map((char, cIdx) => (
                  <Paper
                    key={char.id || cIdx}
                    sx={{ p: 2, border: '1px solid #e3e4db', borderRadius: 2, boxShadow: 'none' }}
                  >
                    {/* Characteristic Header */}
                    <Stack
                      direction="row"
                      sx={{ justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: 14 }}>
                          #{char.number || cIdx + 1}: {char.description}
                        </Typography>
                        <Chip
                          label={char.kind.toUpperCase()}
                          size="small"
                          color={char.kind === 'product' ? 'info' : 'secondary'}
                          sx={{ fontSize: 10, height: 20 }}
                        />
                        {char.classification && (
                          <Chip
                            label={char.classification}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: 10, height: 20 }}
                          />
                        )}
                      </Stack>

                      <Button
                        size="small"
                        variant="text"
                        onClick={() => openReview('characteristic', char.id, char.description || '', char)}
                      >
                        Review
                      </Button>
                    </Stack>

                    {/* Criteria / Spec */}
                    <Box sx={{ mt: 1, p: 1, bgcolor: '#f9fafb', borderRadius: 1 }}>
                      <Typography variant="caption" sx={{ color: '#555' }}>
                        <strong>Spec:</strong> {char.criteria.specification || '—'} &nbsp;|&nbsp;
                        <strong>Tol:</strong> {char.criteria.tolerance || '—'} &nbsp;|&nbsp;
                        <strong>Unit:</strong> {char.criteria.unit || '—'}
                      </Typography>
                    </Box>

                    {/* Controls Table */}
                    <Box sx={{ mt: 1.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#333' }}>
                        Controls ({char.controls?.length || 0}):
                      </Typography>
                      {char.controls?.map((ctrl, ctrlIdx) => (
                        <Box
                          key={ctrl.id || ctrlIdx}
                          sx={{
                            mt: 1,
                            p: 1.5,
                            border: '1px solid #eee',
                            borderRadius: 1,
                            bgcolor: '#fff',
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: 2,
                            alignItems: 'center',
                          }}
                        >
                          <Box sx={{ flex: 2 }}>
                            <Typography variant="caption" sx={{ color: '#888' }}>
                              Method & Evaluation
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {ctrl.method}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#555' }}>
                              Eval: {ctrl.evaluationMethod || '—'}
                            </Typography>
                          </Box>

                          <Box sx={{ flex: 2 }}>
                            <Typography variant="caption" sx={{ color: '#888' }}>
                              Sample / Rule
                            </Typography>
                            <Typography variant="body2">
                              {ctrl.executionRule.mode === 'count'
                                ? `${ctrl.executionRule.sampleSize} pcs / ${ctrl.executionRule.frequency}`
                                : ctrl.executionRule.summary || ctrl.executionRule.mode}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#555' }}>
                              Resp: {ctrl.responsibility || '—'}
                            </Typography>
                          </Box>

                          <Box sx={{ flex: 2 }}>
                            <Typography variant="caption" sx={{ color: '#888' }}>
                              Reaction Plan
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: 12 }}>
                              {ctrl.reaction.plan || '—'}
                            </Typography>
                          </Box>

                          <Box sx={{ flexShrink: 0 }}>
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => openReview('control', ctrl.id, ctrl.method, ctrl)}
                            >
                              Review
                            </Button>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Alert severity="info">No operations defined. Click &quot;+ Add Op&quot; to begin.</Alert>
            )}
          </Box>
        </Box>
      )}

      {/* Validation Findings View */}
      {activeTab === 'validation' && (
        <Paper sx={{ p: 3, border: '1px solid #e3e4db', boxShadow: 'none' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Profile Validation Results
          </Typography>
          {validationResult ? (
            validationResult.isValid ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                Document satisfies all baseline profile completeness rules! Ready for release submission.
              </Alert>
            ) : (
              <Stack spacing={1.5}>
                <Alert severity="warning">
                  Found {validationResult.findings.filter((f) => f.category === 'blocker').length} blocker(s)
                  and {validationResult.findings.filter((f) => f.category === 'warning').length} warning(s).
                </Alert>
                <List dense>
                  {validationResult.findings.map((f, idx) => (
                    <Paper
                      key={idx}
                      sx={{
                        p: 1.5,
                        mb: 1,
                        borderLeft: `4px solid ${f.category === 'blocker' ? '#d32f2f' : '#ed6c02'}`,
                      }}
                    >
                      <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={f.category.toUpperCase()}
                          size="small"
                          color={f.category === 'blocker' ? 'error' : 'warning'}
                          sx={{ fontSize: 10, height: 20 }}
                        />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: 13 }}>
                          [{f.ruleId}] {f.message}
                        </Typography>
                      </Stack>
                      <Typography variant="caption" sx={{ color: '#666', mt: 0.5, display: 'block' }}>
                        Locator: <code>{f.locator}</code>
                      </Typography>
                    </Paper>
                  ))}
                </List>
              </Stack>
            )
          ) : (
            <Alert severity="info">
              Click &quot;Validate Profile&quot; on the toolbar to check your control plan against the customer-neutral baseline profile.
            </Alert>
          )}
        </Paper>
      )}

      {/* Header & Metadata View */}
      {activeTab === 'header' && (
        <Paper sx={{ p: 3, border: '1px solid #e3e4db', boxShadow: 'none' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Control Plan Header Information
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2 }}>
            {Object.entries(document.header).map(([key, val]) => (
              <Box key={key}>
                <Typography variant="caption" sx={{ color: '#888', fontWeight: 600 }}>
                  {key}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {String(val || '—')}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Field Review Decision</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: '#555' }}>
            Target: <strong>{reviewTarget?.label}</strong> ({reviewTarget?.kind})
          </Typography>
          <TextField
            select
            fullWidth
            label="Decision"
            value={reviewDecision}
            onChange={(e) => setReviewDecision(e.target.value)}
            sx={{ mb: 2 }}
          >
            <MenuItem value="accept">Accept (Confirm applicability and correctness)</MenuItem>
            <MenuItem value="modify_accept">Modify & Accept (Requires reason)</MenuItem>
            <MenuItem value="reject">Reject (Requires reason)</MenuItem>
            <MenuItem value="not_applicable">Not Applicable (Requires reason)</MenuItem>
            <MenuItem value="retain_current">Retain Current (Preserve local value)</MenuItem>
            <MenuItem value="defer">Defer (Leave pending review)</MenuItem>
          </TextField>

          {['modify_accept', 'reject', 'not_applicable', 'retain_current'].includes(reviewDecision) && (
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Engineering Reason / Justification *"
              value={reviewReason}
              onChange={(e) => setReviewReason(e.target.value)}
              placeholder="State rationale for this decision..."
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={submitReview}
            disabled={
              ['modify_accept', 'reject', 'not_applicable', 'retain_current'].includes(reviewDecision) &&
              !reviewReason.trim()
            }
          >
            Record Decision
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approval Intent Dialog */}
      <Dialog open={approvalDialogOpen} onClose={() => setApprovalDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Control Plan Release</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Approving this Control Plan will execute the durable approval package pipeline, render the certified PDF artifact with approver stamp, lock the revision, and finalize the release.
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Approval Comments / Decision Notes"
            value={approvalComment}
            onChange={(e) => setApprovalComment(e.target.value)}
            placeholder="Document release justification, customer approval reference, etc."
          />
          {approvalProgress && (
            <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mt: 2 }}>
              <CircularProgress size={16} />
              <Typography variant="caption">{approvalProgress}</Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialogOpen(false)} disabled={approving}>
            Cancel
          </Button>
          <Button variant="contained" color="success" onClick={handleApprove} disabled={approving}>
            {approving ? 'Finalizing...' : 'Confirm & Finalize Approval'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
