import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import PfdIcon from "@mui/icons-material/AccountTree";
import { useAuth } from "../auth/AuthContext";
import { API_BASE_URL } from "../../config";
import { DocumentHeader } from "../../components/DocumentHeader";
import { parseApiError } from "../../lib/api";
import {
  controlOperationKey,
  controlsForPfmeaRow,
  normalizeControls,
  normalizePfmeaRows,
} from "./linkageData";
import type {
  JsonRecord,
  LinkageControl,
  LinkagePfmeaRow,
  NamedReference,
  OperationContext,
} from "./linkageData";
interface Revision {
  id: string;
  revisionNumber: string;
  status: string;
  documentId: string;
  document?: { type: string };
}
interface ProjectDocument {
  id: string;
  type: string;
  currentRevisionId: string;
}
interface Context extends OperationContext {
  type: string;
  label: string;
  rows: LinkagePfmeaRow[];
}
interface LinkedAction {
  id: string;
  description: string;
  status: string;
  fmeaLinks?: { fmeaRowId: string }[];
}
const associations = [
  ["functions", "Functions", "#437A22", "#eefcf4"],
  ["failureModes", "Failure modes", "#A13544", "#fdf2f2"],
  ["effects", "Effects", "#A13544", "#fdf2f2"],
  ["causes", "Causes", "#976800", "#fffbeb"],
] as const;
export const LinkageMap: React.FC = () => {
  const { projectId } = useParams();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true),
    [errors, setErrors] = useState<string[]>([]),
    [contexts, setContexts] = useState<Context[]>([]),
    [controls, setControls] = useState<LinkageControl[]>([]),
    [actions, setActions] = useState<LinkedAction[]>([]),
    [baselineIds, setBaselineIds] = useState<string[]>([]),
    [documents, setDocuments] = useState<ProjectDocument[]>([]),
    [projectName, setProjectName] = useState(""),
    [cpLabel, setCpLabel] = useState(""),
    [reload, setReload] = useState(0);
  useEffect(() => {
    if (!projectId || !token) return;
    let active = true;
    const failures: string[] = [];
    const request = async (path: string) => {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok)
        throw new Error(
          await parseApiError(response, `Failed to load ${path}.`),
        );
      return response.json();
    };
    const allRows = async (path: string): Promise<unknown[]> => {
      const result: unknown[] = [];
      for (let page = 1; page <= 10000; page++) {
        const payload = await request(
          `${path}${path.includes("?") ? "&" : "?"}page=${page}&limit=100`,
        );
        if (Array.isArray(payload)) return [...result, ...payload];
        if (!payload || !Array.isArray(payload.data))
          throw new Error(`Invalid paginated response for ${path}.`);
        result.push(...payload.data);
        if (result.length >= payload.total || payload.data.length === 0)
          return result;
      }
      throw new Error("The row response exceeded the supported paging range.");
    };
    const optional = async <T,>(
      label: string,
      task: () => Promise<T>,
      fallback: T,
    ): Promise<T> => {
      try {
        return await task();
      } catch (reason) {
        failures.push(
          `${label}: ${reason instanceof Error ? reason.message : String(reason)}`,
        );
        return fallback;
      }
    };
    (async () => {
      setLoading(true);
      setErrors([]);
      try {
        const [docs, revisions] = await Promise.all([
          request(`/projects/${projectId}/documents`) as Promise<
            ProjectDocument[]
          >,
          request(`/projects/${projectId}/revisions`) as Promise<Revision[]>,
        ]);
        const revisionType = (id: string) => {
          const revision = revisions.find((entry) => entry.id === id);
          return (
            revision?.document?.type ??
            docs.find((doc) => doc.id === revision?.documentId)?.type
          );
        };
        const revisionLabel = (id: string) => {
          const revision = revisions.find((entry) => entry.id === id);
          return revision
            ? `${revisionType(id) ?? "Document"} revision ${revision.revisionNumber} · ${revision.status}`
            : `Source revision ${id}`;
        };
        const cpDoc = docs.find((doc) => doc.type === "CONTROL_PLAN");
        const cp = cpDoc?.currentRevisionId
          ? await optional(
              "Control Plan",
              () =>
                request(
                  `/revisions/${cpDoc.currentRevisionId}/control-plan-document`,
                ),
              null,
            )
          : null;
        const cpLines = cp ? normalizeControls(cp) : [];
        const baselines: JsonRecord[] = Array.isArray(
          cp?.document?.sourceBaselines,
        )
          ? cp.document.sourceBaselines
          : [];
        const ids = new Set<string>();
        docs
          .filter(
            (doc) =>
              ["PFD", "PFMEA"].includes(doc.type) && doc.currentRevisionId,
          )
          .forEach((doc) => ids.add(doc.currentRevisionId));
        baselines.forEach((baseline) => {
          if (typeof baseline.revisionId === "string")
            ids.add(baseline.revisionId);
        });
        cpLines.forEach((line) => {
          if (line.sourceRevisionId) ids.add(line.sourceRevisionId);
        });
        const loaded = await Promise.all(
          [...ids].map(async (id) => {
            const type = revisionType(id);
            if (!type || !["PFD", "PFMEA"].includes(type)) {
              failures.push(
                `Source revision ${id} cannot be resolved to a PFD/PFMEA in this project.`,
              );
              return null;
            }
            const steps = await optional(
              `${revisionLabel(id)} operations`,
              () => request(`/revisions/${id}/pfd-steps`),
              [],
            );
            const rows =
              type === "PFMEA"
                ? await optional(
                    `${revisionLabel(id)} rows`,
                    async () =>
                      normalizePfmeaRows(
                        await allRows(`/revisions/${id}/pfmea-rows`),
                        id,
                      ),
                    [],
                  )
                : [];
            return {
              revisionId: id,
              type,
              label: revisionLabel(id),
              steps,
              rows,
            } as Context;
          }),
        );
        const actionData = await optional(
          "Linked actions",
          () => allRows(`/actions?projectId=${projectId}`),
          [],
        );
        if (active) {
          setDocuments(docs);
          setControls(cpLines);
          setContexts(
            loaded.filter((context): context is Context => !!context),
          );
          setBaselineIds(
            baselines.map((baseline) => String(baseline.revisionId)),
          );
          setActions(actionData as LinkedAction[]);
          setCpLabel(
            cpDoc?.currentRevisionId
              ? revisionLabel(cpDoc.currentRevisionId)
              : "No Control Plan document",
          );
          setErrors(failures);
        }
      } catch (reason) {
        if (active)
          setErrors([
            reason instanceof Error ? reason.message : String(reason),
          ]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [projectId, token, reload]);
  const renderControls = (lines: LinkageControl[]) =>
    lines.map((line) => (
      <Paper
        variant="outlined"
        key={line.id}
        sx={{ p: 1.5, borderColor: "#d8e0d2", overflowWrap: "anywhere" }}
      >
        <Stack
          direction="row"
          sx={{ justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}
        >
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {line.characteristicName || "Characteristic not defined"}
          </Typography>
          <Chip size="small" label={line.sourceState} />
        </Stack>
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
          Control: {line.controlMethod || "Not defined"}
        </Typography>
        <Typography
          variant="caption"
          sx={{ display: "block", whiteSpace: "pre-wrap" }}
        >
          Reaction: {line.reactionPlan || "Not defined"}
        </Typography>
        <Typography variant="caption" sx={{ display: "block" }}>
          Recorded operation: {line.operationNumber}{" "}
          {line.operationName || "Not defined"}
        </Typography>
        {line.sourceRevisionId && (
          <Typography variant="caption" sx={{ display: "block" }}>
            Source:{" "}
            {contexts.find(
              (context) => context.revisionId === line.sourceRevisionId,
            )?.label ?? line.sourceRevisionId}
          </Typography>
        )}
        {line.pfmeaRowId && (
          <Typography variant="caption">
            Explicit PFMEA row reference: {line.pfmeaRowId}
          </Typography>
        )}
      </Paper>
    ));
  const renderRow = (row: LinkagePfmeaRow) => {
    const rowControls = controlsForPfmeaRow(controls, row),
      rowActions = actions.filter((action) =>
        action.fmeaLinks?.some((link) => link.fmeaRowId === row.id),
      );
    return (
      <Box
        key={row.id}
        sx={{
          p: 2,
          border: "1px solid #e3e4db",
          borderRadius: 2,
          bgcolor: "#fff",
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          PFMEA row {row.rowNumber} · AP {row.ap || "—"} · Severity{" "}
          {row.severity || "—"}
        </Typography>
        <Grid container spacing={2}>
          {associations.map(([key, label, color, bgcolor]) => (
            <Grid key={key} size={{ xs: 12, sm: 6, lg: 3 }}>
              <Box
                sx={{
                  p: 1.25,
                  border: `1px solid ${color}`,
                  borderRadius: 2,
                  bgcolor,
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700, color }}>
                  {label}
                </Typography>
                {row[key].length ? (
                  row[key].map((entry: NamedReference, index) => (
                    <Typography
                      key={entry.id || index}
                      variant="body2"
                      sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
                    >
                      {entry.name || entry.id}
                    </Typography>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Not authored
                  </Typography>
                )}
              </Box>
            </Grid>
          ))}
        </Grid>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 1 }}
        >
          These records are explicitly associated with this row; their listing
          does not establish additional structure failure-chain relationships.
        </Typography>
        {!!rowControls.length && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Linked to {rowControls.length} Control Plan{" "}
            {rowControls.length === 1 ? "line" : "lines"} by source revision and
            PFMEA row ID.
          </Typography>
        )}
        {rowActions.length > 0 && (
          <Stack spacing={1} sx={{ mt: 1 }}>
            {rowActions.map((action) => (
              <Box key={action.id}>
                <Chip size="small" label={action.status} />
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {action.description}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    );
  };
  const unassigned = controls.filter(
    (line) => !controlOperationKey(line, contexts, baselineIds),
  );
  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  return (
    <Box sx={{ minWidth: 0 }}>
      <DocumentHeader
        projectId={projectId!}
        docType={
          documents.some((doc) => doc.type === "PFMEA")
            ? "PFMEA"
            : documents.some((doc) => doc.type === "CONTROL_PLAN")
              ? "CONTROL_PLAN"
              : "PFD"
        }
        onHeaderLoaded={(project) => setProjectName(project.name)}
      />
      <Paper
        sx={{
          p: { xs: 2, sm: 3 },
          mb: 3,
          border: "1px solid #e3e4db",
          borderRadius: 3,
          boxShadow: "none",
        }}
      >
        <Stack
          direction="row"
          sx={{ justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Quality Lineage Traceability Map — {projectName}
          </Typography>
          <Button onClick={() => setReload((value) => value + 1)}>
            Refresh
          </Button>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Trace recorded operation, risk, control and action references. Names
          and display numbers never create a link.
        </Typography>
        {errors.map((error, index) => (
          <Alert key={index} severity="error" sx={{ mb: 1 }}>
            {error}
          </Alert>
        ))}
        <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", mb: 2 }}>
          <Chip label={`${controls.length} Control Plan lines`} />
          <Chip
            label={`${contexts.reduce((total, context) => total + context.rows.length, 0)} PFMEA rows`}
          />
          <Chip label={cpLabel} />
        </Stack>
        {!documents.some((doc) => doc.type === "PFMEA") && (
          <Alert severity="info" sx={{ mb: 2 }}>
            This project has no PFMEA document. PFD and Control Plan references
            are shown independently.
          </Alert>
        )}
        <Stack spacing={3}>
          {contexts.map((context) => (
            <Box key={context.revisionId}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                {context.label}
                {baselineIds.includes(context.revisionId)
                  ? " · Selected source baseline"
                  : ""}
              </Typography>
              <Stack spacing={2}>
                {context.steps.map((step) => {
                  const stepRows = context.rows.filter(
                      (row) => row.processStepId === step.id,
                    ),
                    stepControls = controls.filter(
                      (control) =>
                        controlOperationKey(control, contexts, baselineIds) ===
                        `${context.revisionId}:${step.id}`,
                    );
                  return (
                    <Card
                      key={step.id}
                      sx={{
                        border: "1px solid #e3e4db",
                        borderRadius: 3,
                        boxShadow: "none",
                        bgcolor: "#fafafa",
                      }}
                    >
                      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Stack
                          direction="row"
                          spacing={1.5}
                          sx={{ alignItems: "center", mb: 2 }}
                        >
                          <PfdIcon fontSize="small" />
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 700 }}
                          >
                            Step {step.stepNumber}: {step.name}
                          </Typography>
                        </Stack>
                        <Divider sx={{ mb: 2 }} />
                        <Stack spacing={2}>
                          {stepRows.map(renderRow)}
                          {context.type === "PFMEA" && !stepRows.length && (
                            <Typography variant="body2" color="text.secondary">
                              No authored PFMEA row references this operation
                              ID.
                            </Typography>
                          )}
                          {stepControls.length > 0 && (
                            <Box>
                              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Control Plan — {stepControls.length}{" "}
                                {stepControls.length === 1 ? "line" : "lines"}
                              </Typography>
                              <Stack spacing={1}>
                                {renderControls(stepControls)}
                              </Stack>
                            </Box>
                          )}
                          {context.type === "PFD" && !stepControls.length && (
                            <Typography variant="body2" color="text.secondary">
                              No Control Plan line explicitly references this
                              operation in this revision.
                            </Typography>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                })}
                {context.rows
                  .filter(
                    (row) =>
                      !context.steps.some(
                        (step) => step.id === row.processStepId,
                      ),
                  )
                  .map(renderRow)}
                {!context.steps.length && !context.rows.length && (
                  <Typography variant="body2" color="text.secondary">
                    No operations or analysis rows in this revision.
                  </Typography>
                )}
              </Stack>
            </Box>
          ))}
        </Stack>
        {!!unassigned.length && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Control Plan lines requiring source mapping ({unassigned.length})
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              No unambiguous operation reference was found in the selected
              revision context. These lines remain visible without inferred
              links.
            </Typography>
            <Stack spacing={1}>{renderControls(unassigned)}</Stack>
          </Box>
        )}
        {!contexts.length && !controls.length && !errors.length && (
          <Typography variant="body2">
            No PFD, PFMEA or Control Plan records are available yet.
          </Typography>
        )}
      </Paper>
    </Box>
  );
};
export default LinkageMap;
