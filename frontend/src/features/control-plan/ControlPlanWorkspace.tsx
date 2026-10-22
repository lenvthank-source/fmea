import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  List,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  blankLine,
  lineFields,
  validateImport,
  importControlRows,
} from "./controlPlanDocument";
import { ControlLineEditor } from "./ControlLineEditor";
import { SourceChangeReview } from "./SourceChangeReview";
import type {
  CpDocument,
  CpEnvelope,
  CpLine,
  SyncPreview,
  AnyCpDocument,
} from "./controlPlanDocument";
import { isCpDocumentV2, getDocLines } from "./controlPlanDocument";
import { ControlPlanV2View } from "./ControlPlanV2View";

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
const panel = {
  p: 2,
  border: "1px solid #e3e4db",
  borderRadius: 2,
  boxShadow: "none",
};
export const ControlPlanWorkspace: React.FC = () => {
  const { projectId } = useParams();
  const { token, hasPermission } = useAuth();
  const [project, setProject] = useState<Record<string, unknown>>({});
  const [documents, setDocuments] = useState<DocumentContext[]>([]);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [revisionId, setRevisionId] = useState("");
  const [envelope, setEnvelope] = useState<CpEnvelope | null>(null);
  const [document, setDocument] = useState<AnyCpDocument | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<CpLine | null>(null);

  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradePreview, setUpgradePreview] = useState<{
    expectedVersion: number;
    previewHash: string;
    v2Document: any;
    warnings: string[];
  } | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  const handleOpenUpgrade = async () => {
    if (!envelope || !revisionId) return;
    try {
      setBusy(true);
      const res = await request(
        `/revisions/${revisionId}/control-plan-document/upgrade-preview`,
        {
          method: 'POST',
          body: JSON.stringify({ expectedVersion: envelope.version }),
        },
      );
      setUpgradePreview(res);
      setUpgradeOpen(true);
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const handleApplyUpgrade = async () => {
    if (!upgradePreview || !envelope || !revisionId) return;
    try {
      setUpgrading(true);
      await request(
        `/revisions/${revisionId}/control-plan-document/upgrade-apply`,
        {
          method: 'POST',
          body: JSON.stringify({
            expectedVersion: upgradePreview.expectedVersion,
            previewHash: upgradePreview.previewHash,
          }),
        },
      );
      setUpgradeOpen(false);
      setUpgradePreview(null);
      const env = await request(`/revisions/${revisionId}/control-plan-document`);
      setEnvelope(env);
      setDocument(env.document);
      setNotice('Upgraded to Control Plan Version 2 successfully!');
    } catch (err) {
      fail(err);
    } finally {
      setUpgrading(false);
    }
  };
  const [configOpen, setConfigOpen] = useState(false);
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
  const [operations, setOperations] = useState<
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
    setDocument(value.document);
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
  const update = (value: AnyCpDocument) => {
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
  const groups = useMemo(() => {
    const result = new Map<string, CpLine[]>();
    const lines = isCpDocumentV2(document) ? getDocLines(document) : (document?.lines ?? []);
    lines.forEach((line) => {
      const key = [
        line.operationId,
        line.operationNumber,
        line.operationName,
      ].join("|");
      result.set(key, [...(result.get(key) ?? []), line]);
    });
    return [...result.values()];
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
    rows: (isCpDocumentV2(document) ? getDocLines(document) : (document?.lines ?? [])).map((line) => ({
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
      if (file.name.endsWith(".json")) value = JSON.parse(await file.text());
      else {
        const sheet = await parseEngineeringXlsx(file);
        const missing = lineFields
          .map(([, label]) => label)
          .filter((label) => !sheet.headers.includes(label));
        if (missing.length)
          throw new Error(
            `Missing columns: ${missing.join(", ")}. Use an exported workbook as the template.`,
          );
        value =
          !sheet.worksheetChanged && sheet.model
            ? sheet.model
            : {
                ...((sheet.model as CpDocument) ?? document),
                lines: importControlRows(sheet.rows),
              };
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
    <Box sx={{ minWidth: 0, pb: 3 }}>
      <Stack
        direction="row"
        sx={{
          justifyContent: "space-between",
          alignItems: "start",
          gap: 2,
          flexWrap: "wrap",
          mb: 2,
        }}
      >
        <Box>
          <Typography
            component="h1"
            variant="h4"
            sx={{
              fontWeight: 800,
              letterSpacing: "-.03em",
              fontSize: { xs: 24, sm: 30 },
            }}
          >
            Control Plan
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {String(project.name ?? "")} · Controls, characteristics and
            reviewed source traceability.
          </Typography>
        </Box>
        <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
          <Button onClick={() => setConfigOpen(true)} disabled={!document}>
            Plan details
          </Button>
          {hasPermission("cp.edit") && (
            <Button
              disabled={!envelope?.forkable || !document || dirty || busy}
              onClick={() => setForkOpen(true)}
            >
              New phase / revision
            </Button>
          )}
          <Button
            disabled={!document || busy}
            onClick={() => {
              void exportEngineeringXlsx(exportDocument()).catch(fail);
            }}
          >
            XLSX
          </Button>
          <Button
            disabled={!document}
            onClick={() => {
              try {
                printEngineeringDocument(exportDocument());
              } catch (reason) {
                fail(reason);
              }
            }}
          >
            Print / PDF
          </Button>
          <Button disabled={!document} onClick={downloadJson}>
            JSON
          </Button>
          <Button component="label" disabled={!editable || busy}>
            Import
            <input
              type="file"
              hidden
              accept=".json,.xlsx"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void beginImport(file);
                event.target.value = "";
              }}
            />
          </Button>
          <Button
            variant="contained"
            disabled={!editable || !dirty || busy}
            onClick={save}
          >
            {busy ? "Working…" : "Save changes"}
          </Button>
        </Stack>
      </Stack>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}{" "}
          {dirty &&
            "Your unsaved edits are retained. Save a JSON copy before reloading a conflicting revision."}
        </Alert>
      )}
      {notice && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {notice}
        </Alert>
      )}
      <Paper sx={{ ...panel, mb: 2 }}>
        <Stack
          direction="row"
          sx={{ alignItems: "center", gap: 1, flexWrap: "wrap" }}
        >
          <TextField
            size="small"
            select
            label="Revision"
            disabled={busy}
            value={revisionId}
            sx={{ minWidth: 200 }}
            onChange={(event) => {
              if (
                !dirty ||
                window.confirm(
                  "Discard unsaved edits and open another revision?",
                )
              )
                setRevisionId(event.target.value);
            }}
          >
            {(cpRevisions.length
              ? cpRevisions
              : [{ id: revisionId, revisionNumber: "Current", status: "" }]
            )
              .filter((item) => item.id)
              .map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.revisionNumber} {item.status}
                </MenuItem>
              ))}
          </TextField>
          <Chip
            size="small"
            label={
              dirty
                ? "Unsaved changes"
                : `Saved version ${envelope?.version ?? "—"}`
            }
            color={dirty ? "warning" : "default"}
          />
          <Chip size="small" label={editable ? "Draft editing" : "Read only"} />
          <Typography variant="body2">
            {(isCpDocumentV2(document) ? getDocLines(document) : (document?.lines ?? [])).length} control lines · {groups.length}{" "}
            operations
          </Typography>
          <Button
            disabled={busy || !revisionId}
            onClick={() => {
              if (!dirty || window.confirm("Discard unsaved edits and reload?"))
                void load(revisionId);
            }}
          >
            Reload
          </Button>
          <Button
            disabled={busy || dirty || !revisionId}
            onClick={async () => {
              try {
                setReadiness(
                  await request(
                    `/projects/${projectId}/revisions/${revisionId}/readiness`,
                  ),
                );
              } catch (reason) {
                fail(reason);
              }
            }}
          >
            Check readiness
          </Button>
          {editable && hasPermission("revision.submit") && (
            <Button
              disabled={busy || dirty}
              onClick={() => void transition("submit")}
            >
              Submit for review
            </Button>
          )}
          {revisions.find((item) => item.id === revisionId)?.status === "in_review" &&
            (hasPermission("revision.approve") || hasPermission("revision.review")) && (
            <Button
              disabled={busy || dirty}
              onClick={() => setApprovalOpen(true)}
            >
              Review decision
            </Button>
          )}
        </Stack>
      </Paper>
      {busy && !document && <CircularProgress size={24} />}
      {document && (
        <>
          <Alert severity="info" sx={{ mb: 2 }}>
            Automotive baseline. Customer requirements must be configured
            explicitly. Complete handbook conformity has not been independently
            verified.
          </Alert>
          {envelope?.legacyReviewRequired && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Legacy content is preserved for review. Verify source mappings and
              engineering decisions before release; opening this page does not
              approve or migrate the original records.
            </Alert>
          )}
          <Paper sx={{ ...panel, mb: 2 }}>
            <Stack
              direction="row"
              sx={{ gap: 1, alignItems: "center", flexWrap: "wrap" }}
            >
              <Typography variant="subtitle2">Source review</Typography>
              <TextField
                size="small"
                select
                label="Source revision"
                value={sourceRevisionId}
                sx={{ minWidth: 0, width: { xs: "100%", sm: 240 }, maxWidth: "100%" }}
                onChange={(event) => setSourceRevisionId(event.target.value)}
              >
                {sourceRevisions.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.document?.type ??
                      item.documentType ??
                      documents.find((doc) => doc.id === item.documentId)
                        ?.type}{" "}
                    · {item.revisionNumber} · {item.status}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                disabled={!editable || dirty || busy || !sourceRevisionId}
                onClick={previewSync}
              >
                Preview changes
              </Button>
              <Typography variant="caption" color="text.secondary">
                Save first. Changes require explicit review and preserve your
                execution decisions.
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
              Baselines:{" "}
              {document.sourceBaselines
                .map((source) => `${source.type}: ${source.revisionId}`)
                .join("; ") || "None selected"}
            </Typography>
          </Paper>
          {document && document.schemaVersion === 1 && (
            <Alert
              severity="info"
              sx={{ mb: 2 }}
              action={
                hasPermission("cp.edit") && (
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => handleOpenUpgrade()}
                  >
                    Upgrade to Version 2
                  </Button>
                )
              }
            >
              This Control Plan is running Schema Version 1. Upgrade to Version 2 to unlock operation-wise navigation, execution rules, and field-level content review.
            </Alert>
          )}

          {isCpDocumentV2(document) ? (
            <ControlPlanV2View
              document={isCpDocumentV2(document) ? null : (document as any)}
              revisionId={revisionId}
              version={envelope?.version ?? 0}
              writable={editable}
              token={token || ''}
              onUpdateDocument={(nextDoc) => {
                setDocument(nextDoc);
                setDirty(true);
              }}
              onReload={() => {
                void request(`/revisions/${revisionId}/control-plan-document`).then((env) => {
                  setEnvelope(env);
                  setDocument(env.document);
                  setDirty(false);
                });
              }}
              request={request}
            />
          ) : (
            <>
              <Stack
                direction="row"
                sx={{
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 1,
                  mb: 1,
                }}
              >
                <Typography variant="h6">Operation controls</Typography>
            <Button
              data-tour="control-plan-workflow"
              variant="outlined"
              disabled={!editable}
              onClick={() => setEditing(blankLine())}
            >
              Add control line
            </Button>
          </Stack>
          {groups.length === 0 ? (
            <Paper sx={panel}>
              <Typography>
                No control lines yet. Add a line or preview an explicit
                PFD/PFMEA source revision.
              </Typography>
            </Paper>
          ) : (
            groups.map((lines, index) => (
              <Paper
                key={lines[0].id}
                sx={{ ...panel, p: 0, mb: 1.5, overflow: "hidden" }}
              >
                <Box sx={{ px: 2, py: 1, bgcolor: "#eff2e8" }}>
                  <Typography variant="subtitle2">
                    {lines[0].operationNumber || `Operation ${index + 1}`} ·{" "}
                    {lines[0].operationName || "Name not specified"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {lines[0].equipment || "Equipment not specified"}
                  </Typography>
                </Box>
                <TableContainer sx={{ overflowX: "auto" }}>
                  <Table
                    size="small"
                    aria-label={`Controls for ${lines[0].operationName || index + 1}`}
                  >
                    <TableHead>
                      <TableRow>
                        {[
                          "Characteristic",
                          "Specification",
                          "Evaluation / sampling",
                          "Control / reaction",
                          "Source",
                          "",
                        ].map((heading, i) => (
                          <TableCell key={i}>{heading}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lines.map((line) => (
                        <TableRow key={line.id} hover>
                          <TableCell
                            sx={{ minWidth: 140, overflowWrap: "anywhere" }}
                          >
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600 }}
                            >
                              {line.characteristicNumber}{" "}
                              {line.characteristicName || "Not defined"}
                            </Typography>
                            <Typography variant="caption">
                              {line.characteristicKind} ·{" "}
                              {line.classification || "Unclassified"}
                            </Typography>
                          </TableCell>
                          <TableCell
                            sx={{
                              minWidth: 140,
                              whiteSpace: "pre-wrap",
                              overflowWrap: "anywhere",
                            }}
                          >
                            {line.specification || "—"} {line.tolerance}{" "}
                            {line.unit}
                          </TableCell>
                          <TableCell
                            sx={{ minWidth: 160, whiteSpace: "pre-wrap" }}
                          >
                            {line.evaluationMethod || "—"}
                            <Typography
                              variant="caption"
                              sx={{ display: "block" }}
                            >
                              {[line.sampleSize, line.frequency]
                                .filter(Boolean)
                                .join(" / ") || "Sampling not specified"}
                            </Typography>
                          </TableCell>
                          <TableCell
                            sx={{ minWidth: 180, whiteSpace: "pre-wrap" }}
                          >
                            {line.controlMethod || "—"}
                            <Typography
                              variant="caption"
                              sx={{ display: "block" }}
                            >
                              {line.reactionPlan ||
                                line.reactionProcedure ||
                                "Reaction not specified"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              variant="outlined"
                              label={
                                line.sourceState ??
                                (line.source ? "Linked" : "Manual")
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              onClick={() => setEditing(structuredClone(line))}
                            >
                              {editable ? "Edit" : "View"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            ))
          )}
            </>
          )}
        </>
      )}
      <ControlLineEditor
        line={editing}
        editable={editable}
        existing={!!(isCpDocumentV2(document) ? getDocLines(document) : (document?.lines ?? [])).some((line) => line.id === editing?.id)}
        operations={operations}
        sourceRevisionLabel={
          revisions.find(
            (revision) => revision.id === editing?.source?.revisionId,
          )?.revisionNumber ??
          editing?.source?.revisionId ??
          ""
        }
        onChange={setEditing}
        onClose={() => setEditing(null)}
        onKeep={() => {
          if (!editing || !document) return;
          const docV1 = document as any;
          update({
            ...docV1,
            lines: (docV1.lines || []).some((line: any) => line.id === editing.id)
              ? (docV1.lines || []).map((line: any) =>
                  line.id === editing.id ? editing : line,
                )
              : [...(docV1.lines || []), editing],
          });
          setEditing(null);
        }}
        onRemove={() => {
          if (
            !editing ||
            !document ||
            !window.confirm("Remove this control line from this draft?")
          )
            return;
          const docV1 = document as any;
          update({
            ...docV1,
            lines: (docV1.lines || []).filter((line: any) => line.id !== editing.id),
          });
          setEditing(null);
        }}
      />
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
                    ...document as any,
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
        document={isCpDocumentV2(document) ? null : (document as any)}
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
                {(isCpDocumentV2(importDocument) ? getDocLines(importDocument) : (importDocument?.lines ?? [])).length} control lines passed
                structural validation.
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
            {readiness?.errors.map((finding, index) => {
              const lineNumber = /Control line (\d+)/.exec(finding);
              return (
                <Button
                  key={index}
                  sx={{ justifyContent: "flex-start", textAlign: "left" }}
                  onClick={() => {
                    setReadiness(null);
                    const dLines = isCpDocumentV2(document) ? getDocLines(document) : (document?.lines ?? []);
                    if (
                      lineNumber &&
                      dLines[Number(lineNumber[1]) - 1]
                    )
                      setEditing(
                        structuredClone(
                          dLines[Number(lineNumber[1]) - 1],
                        ),
                      );
                    else setConfigOpen(true);
                  }}
                >
                  {finding}
                </Button>
              );
            })}
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
            {hasPermission("revision.approve") && <TextField
              size="small"
              type="password"
              label="Confirm password for approval"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />}
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
      {/* V2 Upgrade Preview Dialog */}
      <Dialog
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upgrade to Control Plan Schema Version 2</DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>
            This upgrade will convert your flat control lines into structured operations, separate characteristics and controls, and introduce typed execution rules and content-bound field reviews.
          </Alert>
          {upgradePreview && (
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Conversion Summary:
              </Typography>
              <Typography variant="body2">
                • Operations to create: {upgradePreview.v2Document?.operations?.length || 0}
              </Typography>
              <Typography variant="body2">
                • Total characteristics: {upgradePreview.v2Document?.operations?.reduce((acc: number, op: any) => acc + (op.characteristics?.length || 0), 0) || 0}
              </Typography>
              {upgradePreview.warnings?.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#ed6c02' }}>
                    Conversion Warnings:
                  </Typography>
                  <List dense>
                    {upgradePreview.warnings.map((w: string, i: number) => (
                      <ListItemText key={i} primary={`• ${w}`} />
                    ))}
                  </List>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpgradeOpen(false)} disabled={upgrading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleApplyUpgrade}
            disabled={upgrading}
          >
            {upgrading ? 'Upgrading...' : 'Confirm & Upgrade to V2'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
export default ControlPlanWorkspace;
