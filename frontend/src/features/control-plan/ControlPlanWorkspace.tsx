import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useAuth } from "../auth/AuthContext";
import { API_BASE_URL } from "../../config";
import { parseApiError } from "../../lib/api";
import {
  exportEngineeringXlsx,
  parseEngineeringXlsx,
  printEngineeringDocument,
} from "../shared/engineeringDocumentExport";
import type { EngineeringDocument } from "../shared/engineeringDocumentExport";
import {
  lineFields,
  validateImport,
  importControlRows,
  applyV1ToV2Conversion,
  emptyCpDocumentV2,
  isCpDocumentV2,
  getDocLines,
} from "./controlPlanDocument";
import { SourceChangeReview } from "./SourceChangeReview";
import type {
  CpDocument,
  CpEnvelope,
  SyncPreview,
} from "./controlPlanDocument";
import { ControlPlanV2View } from "./ControlPlanV2View";
import { ControlPlanToolbar } from "./ControlPlanToolbar";

interface Revision {
  id: string;
  revisionNumber: string;
  status: string;
  document?: { type: string };
  documentType?: string;
  documentId?: string;
}

interface DocumentContext {
  id: string;
  type: string;
  currentRevisionId: string;
}

export const ControlPlanWorkspace: React.FC = () => {
  const { projectId } = useParams();
  const { token, hasPermission } = useAuth();
  const [project, setProject] = useState<Record<string, unknown>>({});
  const [documents, setDocuments] = useState<DocumentContext[]>([]);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [revisionId, setRevisionId] = useState("");
  const [envelope, setEnvelope] = useState<CpEnvelope | null>(null);
  const [document, setDocument] = useState<CpDocument | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [configOpen, setConfigOpen] = useState(false);
  const [sourcesExpanded, setSourcesExpanded] = useState(false);
  const [sourceRevisionId, setSourceRevisionId] = useState("");
  const [preview, setPreview] = useState<SyncPreview | null>(null);
  const [decisions, setDecisions] = useState<Record<string, string>>({});
  const [exclusionReasons, setExclusionReasons] = useState<
    Record<string, string>
  >({});
  const [resolutions, setResolutions] = useState<
    Record<string, Record<string, string>>
  >({});
  const [importDocument, setImportDocument] = useState<CpDocument | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [readiness, setReadiness] = useState<{
    ready: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [comment, setComment] = useState("");
  const [forkOpen, setForkOpen] = useState(false);
  const [forkNumber, setForkNumber] = useState("");
  const [forkPhase, setForkPhase] = useState("prototype");
  const [, setOperations] = useState<
    { id: string; stepNumber: string; name: string }[]
  >([]);

  const editable = !!envelope?.writable && hasPermission("cp.edit") && !busy;

  const request = async (path: string, options: RequestInit = {}) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
    if (!response.ok)
      throw new Error(await parseApiError(response, "The request failed."));
    return response.json();
  };

  useEffect(() => {
    if (!token || !documents.length) return;
    let active = true;
    const baselineIds =
      document?.sourceBaselines
        .filter((source) => source.type === "PFD")
        .map((source) => source.revisionId) ?? [];
    const sources = baselineIds.length
      ? baselineIds.map((id) => ({ currentRevisionId: id }))
      : documents.filter((d) => d.type === "PFD" && d.currentRevisionId);
    void Promise.all(
      sources.map((d) =>
        request(`/revisions/${d.currentRevisionId}/pfd-steps`),
      ),
    )
      .then((values) => {
        if (active) setOperations(values.flat());
      })
      .catch(fail);
    return () => {
      active = false;
    };
  }, [documents, token, JSON.stringify(document?.sourceBaselines ?? [])]);

  useEffect(() => {
    const listener = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", listener);
    return () => window.removeEventListener("beforeunload", listener);
  }, [dirty]);

  const fork = async () => {
    setBusy(true);
    try {
      const result = await request(
        `/revisions/${revisionId}/control-plan-document/fork`,
        {
          method: "POST",
          body: JSON.stringify({
            revisionNumber: forkNumber,
            phase: forkPhase,
            summary: `${forkPhase} Control Plan`,
          }),
        },
      );
      setRevisions(await request(`/projects/${projectId}/revisions`));
      setRevisionId(result.revisionId);
      setForkOpen(false);
    } catch (reason) {
      fail(reason);
    } finally {
      setBusy(false);
    }
  };

  const fail = (reason: unknown) =>
    setError(reason instanceof Error ? reason.message : String(reason));

  const accept = (value: CpEnvelope) => {
    setEnvelope(value);
    setDocument(value.document as CpDocument);
    setDirty(false);
  };

  const load = async (id: string) => {
    setBusy(true);
    setError("");
    try {
      accept(await request(`/revisions/${id}/control-plan-document`));
    } catch (reason) {
      fail(reason);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!token || !projectId) return;
    let active = true;
    (async () => {
      setBusy(true);
      try {
        const [projectValue, docs, revs] = await Promise.all([
          request(`/projects/${projectId}`),
          request(`/projects/${projectId}/documents`),
          request(`/projects/${projectId}/revisions`),
        ]);
        if (!active) return;
        setProject(projectValue);
        setDocuments(docs);
        setRevisions(Array.isArray(revs) ? revs : (revs.data ?? []));
        setRevisionId(
          docs.find((item: DocumentContext) => item.type === "CONTROL_PLAN")
            ?.currentRevisionId ?? "",
        );
      } catch (reason) {
        if (active) fail(reason);
      } finally {
        if (active) setBusy(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [projectId, token]);

  useEffect(() => {
    if (revisionId && token) {
      setReadiness(null);
      setEnvelope(null);
      setDocument(null);
      void load(revisionId);
    }
  }, [revisionId, token]);

  const update = (value: CpDocument) => {
    setDocument(value);
    setDirty(true);
    setNotice("");
  };

  const save = async () => {
    if (!document || !envelope) return;
    setBusy(true);
    setError("");
    try {
      accept(
        await request(`/revisions/${revisionId}/control-plan-document`, {
          method: "PUT",
          body: JSON.stringify({ expectedVersion: envelope.version, document }),
        }),
      );
      setNotice("Revision saved.");
    } catch (reason) {
      fail(reason);
    } finally {
      setBusy(false);
    }
  };

  const cpDoc = documents.find((item) => item.type === "CONTROL_PLAN");
  const cpRevisions = revisions.filter(
    (item) =>
      item.document?.type === "CONTROL_PLAN" ||
      item.documentType === "CONTROL_PLAN" ||
      item.documentId === cpDoc?.id,
  );
  const sourceRevisions = revisions.filter((item) =>
    ["PFD", "PFMEA"].includes(
      item.document?.type ??
        item.documentType ??
        documents.find((doc) => doc.id === item.documentId)?.type ??
        "",
    ),
  );

  const lines = useMemo(() => {
    return document ? getDocLines(document) : [];
  }, [document]);

  const selectedRevision = revisions.find((item) => item.id === revisionId);

  const exportDocument = (): EngineeringDocument => ({
    canonicalModel: document,
    printIdentityKeys: ["operationNumber", "characteristicNumber", "id"],
    title: `Control Plan — ${String(project.name ?? "")}`,
    fileName: `control-plan-${selectedRevision?.revisionNumber ?? revisionId}`,
    metadata: {
      ...document!.header,
      Revision: selectedRevision?.revisionNumber ?? revisionId,
      Status: selectedRevision?.status ?? "",
      Phase: document!.config.phase,
      "Standard profile": document!.config.standardProfile,
      "Customer requirements": document!.config.customerRequirements,
      "Source exception justification":
        document!.config.sourceExceptionJustification,
      "Source baselines": JSON.stringify(document!.sourceBaselines),
      "Reviewed exclusions": JSON.stringify(document!.sourceExclusions ?? []),
      "Safe launch": JSON.stringify(document!.config.safeLaunch),
      Verification:
        "Handbook criteria require authorized independent verification.",
    },
    columns: [
      { key: "id", label: "Line ID" },
      ...lineFields.map(([key, label]) => ({ key, label })),
      { key: "source", label: "Source provenance" },
      { key: "sourceState", label: "Source review state" },
    ],
    rows: lines.map((line) => ({
      ...line,
      source: line.source ? JSON.stringify(line.source) : "",
    })),
  });

  const downloadJson = () => {
    const link = window.document.createElement("a");
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(document, null, 2)], {
        type: "application/json",
      }),
    );
    link.href = url;
    link.download = `control-plan-${revisionId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const beginImport = async (file: File) => {
    setImportOpen(true);
    setImportErrors([]);
    setImportDocument(null);
    try {
      let value: unknown;
      if (file.name.endsWith(".json")) {
        const parsed = JSON.parse(await file.text());
        value = isCpDocumentV2(parsed) ? parsed : applyV1ToV2Conversion(parsed);
      } else {
        const sheet = await parseEngineeringXlsx(file);
        const missing = lineFields
          .map(([, label]) => label)
          .filter((label) => !sheet.headers.includes(label));
        if (missing.length)
          throw new Error(
            `Missing columns: ${missing.join(", ")}. Use an exported workbook as the template.`,
          );
        const importedLines = importControlRows(sheet.rows);
        const baseDoc =
          sheet.model && isCpDocumentV2(sheet.model)
            ? sheet.model
            : (document ?? emptyCpDocumentV2());
        value = applyV1ToV2Conversion({
          ...baseDoc,
          schemaVersion: 1,
          lines: importedLines,
        });
      }
      const errors = validateImport(value);
      setImportErrors(errors);
      if (!errors.length) setImportDocument(value as CpDocument);
    } catch (reason) {
      setImportErrors([
        reason instanceof Error ? reason.message : String(reason),
      ]);
    }
  };

  const previewSync = async () => {
    setBusy(true);
    setError("");
    try {
      const value: SyncPreview = await request(
        `/revisions/${revisionId}/control-plan-document/sync-preview`,
        { method: "POST", body: JSON.stringify({ sourceRevisionId }) },
      );
      setPreview(value);
      setExclusionReasons({});
      setResolutions({});
      setDecisions(
        Object.fromEntries(value.changes.map((change) => [change.key, "keep"])),
      );
    } catch (reason) {
      fail(reason);
    } finally {
      setBusy(false);
    }
  };

  const applySync = async () => {
    if (!preview) return;
    setBusy(true);
    setError("");
    try {
      accept(
        await request(
          `/revisions/${revisionId}/control-plan-document/sync-apply`,
          {
            method: "POST",
            body: JSON.stringify({
              expectedVersion: preview.expectedVersion,
              sourceRevisionId: preview.sourceRevisionId,
              sourceFingerprint: preview.sourceFingerprint,
              decisions: Object.entries(decisions).map(([key, action]) => ({
                key,
                action,
                ...(action === "exclude"
                  ? { reason: exclusionReasons[key] }
                  : {}),
                ...(action === "update"
                  ? { resolutions: resolutions[key] ?? {} }
                  : {}),
              })),
            }),
          },
        ),
      );
      setPreview(null);
      setNotice("Reviewed source changes applied.");
    } catch (reason) {
      fail(reason);
    } finally {
      setBusy(false);
    }
  };

  const transition = async (action: "submit" | "approve" | "reject") => {
    setBusy(true);
    setError("");
    try {
      await request(
        `/projects/${projectId}/revisions/${revisionId}/${action}`,
        {
          method: "POST",
          body: JSON.stringify(
            action === "approve"
              ? { password, comment }
              : action === "reject"
                ? { comment }
                : {},
          ),
        },
      );
      setApprovalOpen(false);
      setPassword("");
      await load(revisionId);
      setRevisions(await request(`/projects/${projectId}/revisions`));
      setNotice(
        `Revision ${action === "submit" ? "submitted" : action === "approve" ? "approved" : "returned to draft"}.`,
      );
    } catch (reason) {
      fail(reason);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ minWidth: 0, pb: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError("")}>
          {error}{" "}
          {dirty && "Your unsaved edits are retained. Save a JSON copy before reloading a conflicting revision."}
        </Alert>
      )}
      {notice && <Alert severity="success" sx={{ mb: 1 }} onClose={() => setNotice("")}>{notice}</Alert>}
      {!document && <Stack direction="row" sx={{ alignItems: "center", gap: 1.5, py: 1 }}><Typography component="h1" variant="h5">Control Plan</Typography>{busy && <CircularProgress size={20} />}</Stack>}
      {document && (
        <>
          {envelope?.legacyReviewRequired && (
            <Alert severity="warning" sx={{ mb: 1 }}>
              Legacy content is preserved for review. Verify source mappings and engineering decisions before release; opening this page does not approve or migrate the original records.
            </Alert>
          )}
          <ControlPlanV2View
            key={revisionId}
            document={document}
            revisionId={revisionId}
            version={envelope?.version ?? 0}
            writable={editable}
            canUseSavedDocument={!dirty && !busy}
            token={token || ""}
            onOpenSources={() => setSourcesExpanded(true)}
            renderToolbar={(actions) => (
              <ControlPlanToolbar
                projectName={String(project.name || project.partName || "")}
                revisionId={revisionId}
                revisions={(cpRevisions.length ? cpRevisions : [{ id: revisionId, revisionNumber: "Current", status: "" }]).filter(item => item.id)}
                phase={document.config.phase}
                safeLaunch={document.config.safeLaunch.enabled}
                version={envelope?.version ?? 0}
                dirty={dirty}
                busy={busy}
                writable={!!envelope?.writable && hasPermission("cp.edit")}
                canEdit={hasPermission("cp.edit")}
                canFork={!!envelope?.forkable}
                canSubmit={editable && hasPermission("revision.submit")}
                canApprove={editable && hasPermission("revision.approve")}
                canReviewDecision={selectedRevision?.status === "in_review" && (hasPermission("revision.approve") || hasPermission("revision.review"))}
                operationCount={document.operations.length}
                controlCount={lines.length}
                sources={sourceRevisions.map(item => ({ ...item, type: item.document?.type ?? item.documentType ?? documents.find(doc => doc.id === item.documentId)?.type ?? "" }))}
                baselines={document.sourceBaselines}
                sourceRevisionId={sourceRevisionId}
                sourcesExpanded={sourcesExpanded}
                validating={actions.validating}
                exportingPdf={actions.exportingPdf}
                onRevisionChange={id => {
                  if (!dirty || window.confirm("Discard unsaved edits and open another revision?")) setRevisionId(id);
                }}
                onSave={() => void save()}
                onDetails={() => setConfigOpen(true)}
                onFork={() => setForkOpen(true)}
                onReload={() => {
                  if (!dirty || window.confirm("Discard unsaved edits and reload?")) void load(revisionId);
                }}
                onImport={file => void beginImport(file)}
                onExportXlsx={() => void exportEngineeringXlsx(exportDocument()).catch(fail)}
                onExportPdf={() => void actions.exportPdf()}
                onExportJson={downloadJson}
                onPrint={() => { try { printEngineeringDocument(exportDocument()); } catch (reason) { fail(reason); } }}
                onValidate={() => void actions.validateProfile()}
                onReadiness={() => {
                  void request(`/projects/${projectId}/revisions/${revisionId}/readiness`).then(setReadiness).catch(fail);
                }}
                onSubmit={() => void transition("submit")}
                onApprove={actions.openApproval}
                onReviewDecision={() => setApprovalOpen(true)}
                onToggleSources={() => setSourcesExpanded(value => !value)}
                onSourceChange={setSourceRevisionId}
                onPreview={previewSync}
              />
            )}
            onUpdateDocument={(nextDoc) => {
              setDocument(nextDoc);
              setDirty(true);
            }}
            onReload={() => {
              void request(`/revisions/${revisionId}/control-plan-document`).then((env) => {
                setEnvelope(env);
                setDocument(env.document as CpDocument);
                setDirty(false);
              });
            }}
            request={request}
          />
        </>
      )}
      <Dialog
        open={forkOpen}
        onClose={() => setForkOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Create controlled plan revision</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2">
              Copies this plan into an independent draft. Existing approved
              phase plans remain unchanged.
            </Typography>
            <TextField
              size="small"
              label="Revision number (X.Y)"
              value={forkNumber}
              onChange={(e) => setForkNumber(e.target.value)}
            />
            <TextField
              select
              size="small"
              label="Plan phase"
              value={forkPhase}
              onChange={(e) => setForkPhase(e.target.value)}
            >
              {["prototype", "pre-launch", "production"].map((p) => (
                <MenuItem key={p} value={p}>
                  {p}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setForkOpen(false)}>Cancel</Button>
          <Button
            disabled={busy || !/^\d+\.\d+$/.test(forkNumber)}
            onClick={() => void fork()}
          >
            Create draft
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={configOpen && !!document}
        onClose={() => setConfigOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Plan details and phase</DialogTitle>
        <DialogContent dividers>
          {document && (
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              <TextField
                size="small"
                select
                disabled={!editable}
                label="Phase"
                value={document.config.phase}
                onChange={(event) =>
                  update({
                    ...document,
                    config: { ...document.config, phase: event.target.value },
                  })
                }
              >
                {["unspecified", "prototype", "pre-launch", "production"].map(
                  (value) => (
                    <MenuItem key={value} value={value}>
                      {value}
                    </MenuItem>
                  ),
                )}
              </TextField>
              {(
                [
                  "standardProfile",
                  "customerRequirements",
                  "sourceExceptionJustification",
                ] as const
              ).map((key) => (
                <TextField
                  key={key}
                  size="small"
                  multiline
                  disabled={!editable}
                  label={
                    key === "standardProfile"
                      ? "Standard profile and edition"
                      : key === "customerRequirements"
                        ? "Applicable customer requirements"
                        : "Source baseline exception justification"
                  }
                  value={document.config[key]}
                  onChange={(event) =>
                    update({
                      ...document,
                      config: { ...document.config, [key]: event.target.value },
                    })
                  }
                />
              ))}
              <Typography variant="subtitle2">
                Source baseline selection
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Select the exact revisions covered by this plan. Source review
                previews remain separate; selecting a baseline does not generate
                control lines.
              </Typography>
              {sourceRevisions.map((source) => {
                const type =
                  source.document?.type ??
                  source.documentType ??
                  documents.find((entry) => entry.id === source.documentId)
                    ?.type ??
                  "";
                return (
                  <FormControlLabel
                    key={source.id}
                    label={`${type} ${source.revisionNumber} · ${source.status}`}
                    control={
                      <Checkbox
                        disabled={!editable}
                        checked={document.sourceBaselines.some(
                          (baseline) => baseline.revisionId === source.id,
                        )}
                        onChange={(event) =>
                          update({
                            ...document,
                            sourceBaselines: event.target.checked
                              ? [
                                  ...document.sourceBaselines,
                                  { revisionId: source.id, type },
                                ]
                              : document.sourceBaselines.filter(
                                  (baseline) =>
                                    baseline.revisionId !== source.id,
                                ),
                          })
                        }
                      />
                    }
                  />
                );
              })}
              <Typography variant="subtitle2">
                Reviewed source exclusions
              </Typography>
              {!document.sourceExclusions?.length && (
                <Typography variant="body2" color="text.secondary">
                  No source candidates have been excluded.
                </Typography>
              )}
              {document.sourceExclusions?.map((exclusion) => (
                <Paper key={exclusion.key} variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="body2">{exclusion.reason}</Typography>
                  <Typography
                    variant="caption"
                    sx={{ display: "block", overflowWrap: "anywhere" }}
                  >
                    Source revision:{" "}
                    {revisions.find(
                      (revision) => revision.id === exclusion.revisionId,
                    )?.revisionNumber ?? exclusion.revisionId}
                  </Typography>
                  {editable && (
                    <Button
                      onClick={() =>
                        update({
                          ...document,
                          sourceExclusions: document.sourceExclusions?.filter(
                            (entry) => entry.key !== exclusion.key,
                          ),
                        })
                      }
                    >
                      Remove exclusion for another review
                    </Button>
                  )}
                </Paper>
              ))}
              <Typography variant="subtitle2">Revision-owned header</Typography>
              {[
                "controlPlanNumber",
                "issueDate",
                "customer",
                "organisationName",
                "organisationPlant",
                "partName",
                "engineeringChangeLevel",
                "keyContact",
                "orgPartNumber",
                "commonPlanDesignation",
              ]
                .filter((key) => !(key in document.header))
                .map((key) => (
                  <TextField
                    key={key}
                    size="small"
                    disabled={!editable}
                    label={key}
                    value=""
                    onChange={(event) =>
                      update({
                        ...document,
                        header: {
                          ...document.header,
                          [key]: event.target.value,
                        },
                      })
                    }
                  />
                ))}
              {Object.entries(document.header).map(([key, value]) => (
                <TextField
                  key={key}
                  size="small"
                  disabled={!editable}
                  label={key}
                  value={value}
                  onChange={(event) =>
                    update({
                      ...document,
                      header: { ...document.header, [key]: event.target.value },
                    })
                  }
                />
              ))}
              {editable && (
                <Button
                  onClick={() => {
                    const key = window.prompt("Header field name");
                    if (key?.trim())
                      update({
                        ...document,
                        header: { ...document.header, [key.trim()]: "" },
                      });
                  }}
                >
                  Add header field
                </Button>
              )}
              <FormControlLabel
                label="Safe-launch controls apply"
                control={
                  <Checkbox
                    checked={document.config.safeLaunch.enabled}
                    disabled={!editable}
                    onChange={(event) =>
                      update({
                        ...document,
                        config: {
                          ...document.config,
                          safeLaunch: {
                            ...document.config.safeLaunch,
                            enabled: event.target.checked,
                          },
                        },
                      })
                    }
                  />
                }
              />
              {(
                ["entryCriteria", "exitCriteria", "additionalControls"] as const
              ).map((key) => (
                <TextField
                  key={key}
                  size="small"
                  multiline
                  disabled={!editable}
                  label={
                    key === "entryCriteria"
                      ? "Safe-launch entry criteria"
                      : key === "exitCriteria"
                        ? "Safe-launch exit criteria"
                        : "Additional safe-launch controls"
                  }
                  value={document.config.safeLaunch[key]}
                  onChange={(event) =>
                    update({
                      ...document,
                      config: {
                        ...document.config,
                        safeLaunch: {
                          ...document.config.safeLaunch,
                          [key]: event.target.value,
                        },
                      },
                    })
                  }
                />
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigOpen(false)}>Done</Button>
        </DialogActions>
      </Dialog>
      <SourceChangeReview
        preview={preview}
        document={document}
        decisions={decisions}
        reasons={exclusionReasons}
        resolutions={resolutions}
        busy={busy}
        onDecision={(key, action) =>
          setDecisions({ ...decisions, [key]: action })
        }
        onReason={(key, value) =>
          setExclusionReasons({ ...exclusionReasons, [key]: value })
        }
        onResolution={(key, field, value) =>
          setResolutions({
            ...resolutions,
            [key]: { ...resolutions[key], [field]: value },
          })
        }
        onClose={() => setPreview(null)}
        onApply={applySync}
      />
      <Dialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Import preview</DialogTitle>
        <DialogContent dividers>
          {importErrors.length ? (
            importErrors.map((message, index) => (
              <Alert key={index} severity="error">
                {message}
              </Alert>
            ))
          ) : (
            <>
              <Typography>
                {(importDocument ? getDocLines(importDocument) : []).length}{" "}
                control lines passed structural validation.
              </Typography>
              <Alert severity="warning" sx={{ mt: 2 }}>
                This replaces the current draft in memory. Review every field
                before saving. Native workbooks preserve the complete model,
                configuration and provenance. Worksheet-only files use the
                current plan configuration and require source review.
              </Alert>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportOpen(false)}>Cancel</Button>
          <Button
            disabled={!importDocument || !!importErrors.length}
            onClick={() => {
              if (importDocument) {
                update(importDocument);
                setImportOpen(false);
              }
            }}
          >
            Use imported draft
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={!!readiness}
        onClose={() => setReadiness(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Revision readiness</DialogTitle>
        <DialogContent dividers>
          <Alert
            severity={readiness?.ready ? "success" : "warning"}
            sx={{ mb: 2 }}
          >
            {readiness?.ready
              ? "Application completeness checks passed. Engineering approval remains separate."
              : `${readiness?.errors.length ?? 0} review findings`}
          </Alert>
          <Stack spacing={1}>
            {readiness?.errors.map((finding, index) => (
              <Button
                key={index}
                sx={{ justifyContent: "flex-start", textAlign: "left" }}
                onClick={() => {
                  setReadiness(null);
                  setConfigOpen(true);
                }}
              >
                {finding}
              </Button>
            ))}
            {readiness?.warnings.map((warning, index) => (
              <Typography key={index} variant="caption" color="text.secondary">
                {warning}
              </Typography>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReadiness(null)}>Close</Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={approvalOpen}
        onClose={() => setApprovalOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Revision review decision</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField
              size="small"
              label="Decision comment"
              multiline
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
            {hasPermission("revision.approve") && (
              <TextField
                size="small"
                type="password"
                label="Confirm password for approval"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalOpen(false)}>Cancel</Button>
          {hasPermission("revision.review") && (
            <Button
              disabled={busy || !comment.trim()}
              onClick={() => void transition("reject")}
            >
              Return to draft
            </Button>
          )}
          {hasPermission("revision.approve") && (
            <Button
              variant="contained"
              disabled={busy || !password || !comment.trim()}
              onClick={() => void transition("approve")}
            >
              Approve revision
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ControlPlanWorkspace;
