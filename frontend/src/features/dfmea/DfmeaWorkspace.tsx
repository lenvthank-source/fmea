import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { API_BASE_URL } from "../../config";
import { parseApiError } from "../../lib/api";
import { dfmeaReadiness, emptyDfmea, validateDfmea } from "./dfmeaDocument";
import type {
  DfmeaData,
  DesignChain,
  DesignCause,
  DesignAction,
} from "./dfmeaDocument";
import {
  exportEngineeringXlsx,
  parseEngineeringXlsx,
  printEngineeringDocument,
} from "../shared/engineeringDocumentExport";
import "./dfmea.css";
import { DesignContextDiagrams } from "./components/DesignContextDiagrams";
import { DesignResultsSummary } from "./components/DesignResultsSummary";
import { FailureReferenceReview } from "./components/FailureReferenceReview";
import { validateFailureReferences } from "./dfmea-failure-references";

const uid = () => crypto.randomUUID();
const phases = [
  "Planning",
  "Structure",
  "Functions",
  "Failures",
  "Risk analysis",
  "Optimization",
  "Results",
];
type Evaluation = {
  chainId: string;
  causeId: string;
  severity: number | null;
  ap: string | null;
  revisedAp: string | null;
  revisedOccurrence?: number | null;
  revisedDetection?: number | null;
  reassessmentActionId?: string | null;
  reassessmentState?: string;
};
type Legacy = {
  id: string;
  rowNumber: number;
  processStep?: { name: string };
  functions?: { function: { name: string } }[];
  failureModes?: { failureMode: { name: string } }[];
  effects?: { effect: { name: string } }[];
  causes?: { cause: { name: string } }[];
  severity: number | null;
  occurrence: number | null;
  detection: number | null;
};
type Revision = { id: string; revisionNumber?: string; status: string };
function Text({
  label,
  value,
  change,
  date = false,
}: {
  label: string;
  value: string;
  change: (v: string) => void;
  date?: boolean;
}) {
  return (
    <label className="df-field">
      {label}
      {date ? (
        <input
          type="date"
          value={value}
          onChange={(e) => change(e.target.value)}
        />
      ) : (
        <textarea
          rows={2}
          value={value}
          onChange={(e) => change(e.target.value)}
        />
      )}
    </label>
  );
}
function Rating({
  label,
  value,
  change,
  disabled = false,
}: {
  label: string;
  value: number | null;
  change: (v: number | null) => void;
  disabled?: boolean;
}) {
  return (
    <label className="df-field">
      {label}
      <select
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => change(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">Unrated</option>
        {Array.from({ length: 10 }, (_, i) => (
          <option key={i} value={i + 1}>
            {i + 1}
          </option>
        ))}
      </select>
    </label>
  );
}
const cause = (): DesignCause => ({
  id: uid(),
  elementId: null,
  text: "",
  preventionControl: "",
  detectionControl: "",
  occurrence: null,
  detection: null,
  actions: [],
});
const action = (): DesignAction => ({
  id: uid(),
  type: "prevention",
  description: "",
  owner: "",
  targetDate: "",
  status: "open",
  taken: "",
  completionDate: "",
  evidence: "",
  decision: "",
  revisedOccurrence: null,
  revisedDetection: null,
});

export function DfmeaWorkspace() {
  const { projectId } = useParams();
  const { token, hasPermission } = useAuth();
  const [initialLoading, setInitialLoading] = useState(true);
  const [missingDocument, setMissingDocument] = useState(false);
  const [data, setData] = useState<DfmeaData>(emptyDfmea);
  const [revision, setRevision] = useState("");
  const [history, setHistory] = useState<Revision[]>([]);
  const [name, setName] = useState("Design analysis");
  const [version, setVersion] = useState(0);
  const [writable, setWritable] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [phase, setPhase] = useState(0);
  const [selected, setSelected] = useState("");
  const [worksheet, setWorksheet] = useState(false);
  const [legacy, setLegacy] = useState<Legacy[]>([]);
  const [downstreamTargets, setDownstreamTargets] = useState<
    {
      revisionId: string;
      revisionNumber: string;
      characteristicId: string;
      name: string;
    }[]
  >([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [actionBaseline, setActionBaseline] = useState<
    Record<string, DesignAction["status"]>
  >({});
  const [criteriaProfile, setCriteriaProfile] = useState<{
    id: string;
    analysisType: string;
    numericalVerification: string;
    verifiedEdition: string | null;
    referenceTitle: string;
    referenceCatalogEdition: string;
    source: string;
    note: string;
  } | null>(null);
  const baseline = (model: DfmeaData) =>
    Object.fromEntries(
      model.chains.flatMap((c) =>
        c.causes.flatMap((x) => x.actions.map((a) => [a.id, a.status])),
      ),
    );
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [comment, setComment] = useState("");
  const [forkOpen, setForkOpen] = useState(false);
  const [forkable, setForkable] = useState(false);
  const [forkNumber, setForkNumber] = useState("");
  const [mappingRow, setMappingRow] = useState<Legacy | null>(null);
  const [mappingFunction, setMappingFunction] = useState("");
  const [mappingMode, setMappingMode] = useState("");
  const [mappingCause, setMappingCause] = useState("");
  const [mappingEffects, setMappingEffects] = useState<string[]>([]);
  const [mappingRatings, setMappingRatings] = useState(false);
  const [imported, setImported] = useState<DfmeaData | null>(null);
  const request = useCallback(
    async (path: string, init?: RequestInit) => {
      const response = await fetch(API_BASE_URL + path, {
        ...init,
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok)
        throw new Error(await parseApiError(response, "Request failed"));
      return response.json();
    },
    [token],
  );
  useEffect(() => {
    if (!projectId || !token) return;
    let stop = false;
    setInitialLoading(true);
    setMissingDocument(false);
    setRevision("");
    void (async () => {
      try {
        const docs = await request("/projects/" + projectId + "/documents");
        const doc = docs.find((d: { type: string }) => d.type === "DFMEA");
        if (!doc) {
          if (!stop) setMissingDocument(true);
          return;
        }
        if (stop) return;
        const revs = await request("/projects/" + projectId + "/revisions");
        setHistory(
          revs.filter(
            (r: { document: { type: string } }) => r.document.type === "DFMEA",
          ),
        );
        setRevision(doc.currentRevisionId ?? "");
        const p = await request("/projects/" + projectId);
        if (!stop) setName(p.name ?? p.partName ?? "Design analysis");
      } catch (e) {
        if (!stop) setError(String(e));
      } finally {
        if (!stop) setInitialLoading(false);
      }
    })();
    return () => {
      stop = true;
    };
  }, [projectId, token, request]);
  useEffect(() => {
    if (!revision) return;
    let stop = false;
    setBusy(true);
    void (async () => {
      try {
        const result = await request(
          "/revisions/" + revision + "/dfmea-document",
        );
        if (stop) return;
        setData(result.data);
        setVersion(result.version);
        setWritable(result.writable);
        setForkable(result.forkable);
        setLegacy(result.legacy?.rows ?? []);
        setEvaluations(result.evaluations ?? []);
        setActionBaseline(baseline(result.data));
        setCriteriaProfile(result.criteriaProfile ?? null);
        setDownstreamTargets(result.downstreamTargets ?? []);
        setSelected(result.data.elements[0]?.id ?? "");
        setDirty(false);
        setError("");
      } catch (e) {
        if (!stop) setError(String(e));
      } finally {
        if (!stop) setBusy(false);
      }
    })();
    return () => {
      stop = true;
    };
  }, [revision, token, request]);
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  const edit = (fn: (draft: DfmeaData) => void) => {
    if (!writable) return;
    setData((d) => {
      const next = structuredClone(d);
      fn(next);
      const refs = new Set(
        next.chains.flatMap((c) =>
          c.specialCharacteristicRefs.map((r) => r.id),
        ),
      );
      next.downstreamLinks = next.downstreamLinks?.filter((l) =>
        refs.has(l.designCharacteristicId),
      );
      return next;
    });
    setDirty(true);
    setMessage("");
  };
  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const result = await request(
        "/revisions/" + revision + "/dfmea-document",
        {
          method: "PUT",
          body: JSON.stringify({ expectedVersion: version, data }),
        },
      );
      setVersion(result.version);
      setEvaluations(result.evaluations ?? []);
      setActionBaseline(baseline(data));
      setCriteriaProfile(result.criteriaProfile ?? null);
      setDirty(false);
      setMessage(
        "Draft saved. Priorities calculated with the configured, unverified profile.",
      );
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  const transition = async (action: "submit" | "approve" | "reject") => {
    setBusy(true);
    try {
      await request(`/projects/${projectId}/revisions/${revision}/${action}`, {
        method: "POST",
        body: JSON.stringify(
          action === "approve"
            ? { password, comment }
            : action === "reject"
              ? { comment }
              : {},
        ),
      });
      setPassword("");
      setReleaseOpen(false);
      const result = await request(`/revisions/${revision}/dfmea-document`);
      setWritable(result.writable && hasPermission("dfmea.edit"));
      const revs = await request(`/projects/${projectId}/revisions`);
      setHistory(
        revs.filter(
          (r: { document: { type: string } }) => r.document.type === "DFMEA",
        ),
      );
      setMessage(
        `Revision ${action === "submit" ? "submitted for review" : action === "approve" ? "approved" : "returned to draft"}`,
      );
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  const fork = async () => {
    setBusy(true);
    try {
      const result = await request(
        `/revisions/${revision}/dfmea-document/fork`,
        {
          method: "POST",
          body: JSON.stringify({
            revisionNumber: forkNumber,
            summary: "Design revision " + forkNumber,
          }),
        },
      );
      const revs = await request(`/projects/${projectId}/revisions`);
      setHistory(
        revs.filter(
          (r: { document: { type: string } }) => r.document.type === "DFMEA",
        ),
      );
      setRevision(result.revisionId);
      setForkOpen(false);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  const chainEdit = (id: string, fn: (c: DesignChain) => void) => {
    const next = structuredClone(data);
    const chain = next.chains.find((c) => c.id === id);
    if (!chain) return;
    fn(chain);
    const issues = validateFailureReferences(next);
    if (issues.length) {
      setError(
        "Remove or reassign explicit failure references before removing their source/target records. " +
          issues.join(" "),
      );
      return;
    }
    edit((d) => Object.assign(d, next));
  };
  const causeEdit = (
    chainId: string,
    id: string,
    fn: (c: DesignCause) => void,
  ) =>
    chainEdit(chainId, (c) => {
      const x = c.causes.find((x) => x.id === id);
      if (x) fn(x);
    });
  const actionEdit = (
    chainId: string,
    causeId: string,
    id: string,
    fn: (a: DesignAction) => void,
  ) =>
    causeEdit(chainId, causeId, (c) => {
      const a = c.actions.find((a) => a.id === id);
      if (a) fn(a);
    });
  const focus = data.elements.find((e) => e.id === selected);
  const functions = data.functions.filter((f) => f.elementId === selected);
  const chains = data.chains.filter((c) => c.focusElementId === selected);
  const readiness = useMemo(() => {
    const result = dfmeaReadiness(data);
    if (!dirty)
      for (const evaluation of evaluations) {
        const chain = data.chains.find((c) => c.id === evaluation.chainId);
        if (evaluation.ap === "H" && chain && !chain.reviewDecision.trim())
          result.errors.push(
            (chain.mode || chain.id) +
              ": High AP requires a documented team review/action-or-justification decision (product policy).",
          );
      }
    return {
      ...result,
      errors: [...new Set(result.errors)],
      ready: result.errors.length === 0,
    };
  }, [data, dirty, evaluations]);
  const addElement = (parentId: string | null) => {
    const id = uid();
    edit((d) =>
      d.elements.push({
        id,
        parentId,
        kind: parentId ? "component" : "system",
        name: parentId ? "New component" : "New system",
        description: "",
      }),
    );
    setSelected(id);
  };
  const removeElement = () => {
    if (
      data.elements.some((e) => e.parentId === selected) ||
      data.functions.some((f) => f.elementId === selected) ||
      data.interfaces.some(
        (i) => i.sourceId === selected || i.targetId === selected,
      ) ||
      data.chains.some(
        (c) =>
          c.focusElementId === selected ||
          c.effects.some((e) => e.elementId === selected) ||
          c.causes.some((x) => x.elementId === selected),
      )
    ) {
      setError(
        "Move or remove linked children, functions, interfaces and failure analysis first.",
      );
      return;
    }
    edit((d) => {
      d.elements = d.elements.filter((e) => e.id !== selected);
      d.scopeExclusions = d.scopeExclusions?.filter(
        (x) => x.elementId !== selected,
      );
    });
    setSelected("");
  };
  const tree = (parentId: string | null, depth = 0): ReactNode =>
    data.elements
      .filter((e) => e.parentId === parentId)
      .map((e) => (
        <div key={e.id}>
          <button
            className={"df-node " + (e.id === selected ? "selected" : "")}
            style={{ paddingLeft: 12 + depth * 16 }}
            onClick={() => setSelected(e.id)}
          >
            <span aria-hidden="true">
              {e.kind === "system" ? "◈" : e.kind === "subsystem" ? "◇" : "·"}
            </span>
            <span>
              {e.name || "Unnamed element"}
              <small>{e.kind}</small>
            </span>
          </button>
          {tree(e.id, depth + 1)}
        </div>
      ));
  const elementSelect = (
    value: string | null,
    change: (v: string | null) => void,
    skip?: string,
  ) => (
    <select
      value={value ?? ""}
      onChange={(e) => change(e.target.value || null)}
    >
      <option value="">External / root / unspecified</option>
      {data.elements
        .filter((e) => e.id !== skip)
        .map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
    </select>
  );
  const rows = data.chains.flatMap((c) =>
    (c.causes.length ? c.causes : [null]).map((x) => ({
      chainId: c.id,
      causeId: x?.id ?? "",
      element: data.elements.find((e) => e.id === c.focusElementId)?.name ?? "",
      function: data.functions.find((f) => f.id === c.functionId)?.text ?? "",
      requirement:
        data.functions.find((f) => f.id === c.functionId)?.requirement ?? "",
      effects: c.effects
        .map((e) => e.text + " [S: " + (e.severity ?? "?") + "]")
        .join("\n"),
      mode: c.mode,
      cause: x?.text ?? "",
      prevention: x?.preventionControl ?? "",
      occurrence: x?.occurrence ?? null,
      detectionControl: x?.detectionControl ?? "",
      detection: x?.detection ?? null,
      ap: dirty
        ? "Save to calculate"
        : (evaluations.find((e) => e.chainId === c.id && e.causeId === x?.id)
            ?.ap ?? "Unrated"),
      revisedAp: dirty
        ? "Save to calculate"
        : (evaluations.find((e) => e.chainId === c.id && e.causeId === x?.id)
            ?.revisedAp ?? ""),
      revisedOccurrence: dirty
        ? "Save to calculate"
        : (evaluations.find((e) => e.chainId === c.id && e.causeId === x?.id)
            ?.revisedOccurrence ?? ""),
      revisedDetection: dirty
        ? "Save to calculate"
        : (evaluations.find((e) => e.chainId === c.id && e.causeId === x?.id)
            ?.revisedDetection ?? ""),
      reassessment: dirty
        ? "Unsaved draft"
        : (evaluations.find((e) => e.chainId === c.id && e.causeId === x?.id)
            ?.reassessmentState ?? "unassessed"),
      decision: c.reviewDecision,
      characteristics: c.specialCharacteristicRefs
        .map(
          (r) =>
            r.characteristic +
            " · " +
            r.classification +
            " · " +
            r.source +
            " · " +
            r.reviewedBy,
        )
        .join("\n"),
      actions:
        x?.actions
          .map(
            (a) =>
              a.type +
              ": " +
              a.description +
              "; owner " +
              a.owner +
              "; due " +
              a.targetDate +
              "; " +
              a.status +
              "; result " +
              a.taken +
              "; completed " +
              a.completionDate +
              "; evidence " +
              a.evidence +
              "; decision " +
              a.decision +
              "; revised O/D " +
              (a.revisedOccurrence ?? "-") +
              "/" +
              (a.revisedDetection ?? "-"),
          )
          .join("\n") ?? "",
    })),
  );
  const report = {
    canonicalModel: data,
    title: name + " — Design FMEA",
    fileName: name.replace(/[^a-z0-9-]/gi, "_") + "_DFMEA",
    metadata: {
      revision,
      revisionNumber:
        history.find((r) => r.id === revision)?.revisionNumber ??
        "Not available",
      status: dirty
        ? "Unsaved draft (saved revision: " +
          (history.find((r) => r.id === revision)?.status ??
            "status unavailable") +
          ")"
        : (history.find((r) => r.id === revision)?.status ??
          "Status unavailable"),
      criteria: data.planning.criteriaProfile || "Not recorded",
      AP: "legacy-configured-unverified",
      scope: data.planning.scope,
      boundary: data.planning.boundary,
      scopeExclusions: (data.scopeExclusions ?? [])
        .map(
          (x) =>
            (data.elements.find((e) => e.id === x.elementId)?.name ??
              x.elementId) +
            ": " +
            x.reason,
        )
        .join("\n"),
      failureReferences: (data.failureReferences ?? [])
        .map(
          (ref) =>
            `${ref.sourceChainId}/${ref.sourceRole}/${ref.sourceFailureId} → ${ref.targetChainId}/${ref.targetRole}/${ref.targetFailureId}; accepted: ${ref.snapshot.text}; S:${ref.snapshot.severity ?? "-"}; reviewer:${ref.reviewedBy}; decision:${ref.decision}`,
        )
        .join("\n"),
      downstreamLinks: (data.downstreamLinks ?? [])
        .map(
          (link) =>
            `${link.designCharacteristicId} → PFMEA revision ${link.targetRevisionId || "Explicit exclusion"} / characteristic ${link.targetCharacteristicId || "Not linked"}; decision:${link.reviewDecision}`,
        )
        .join("\n"),
      team: data.planning.team,
      timing: data.planning.timing,
      parameterContext: Object.entries(data.parameterContext)
        .map(([key, value]) => key + ": " + value)
        .join("\n"),
      coverage:
        data.functions.filter((f) =>
          data.chains.some((c) => c.functionId === f.id),
        ).length +
        "/" +
        data.functions.length +
        " functions analyzed",
      reviewItems:
        readiness.errors.join("\n") ||
        "Application completeness checks passed; engineering review still required",
    },
    columns: [
      ["element", "Focus element"],
      ["function", "Function"],
      ["chainId", "Analysis ID"],
      ["causeId", "Cause ID"],
      ["requirement", "Requirement"],
      ["effects", "Effects / severity"],
      ["mode", "Failure mode"],
      ["cause", "Cause"],
      ["prevention", "Prevention"],
      ["occurrence", "O"],
      ["detectionControl", "Detection"],
      ["detection", "D"],
      ["ap", "AP (unverified profile)"],
      ["revisedAp", "Reassessed AP (unverified profile)"],
      ["revisedOccurrence", "Reassessed O"],
      ["revisedDetection", "Reassessed D"],
      ["reassessment", "Reassessment status"],
      ["decision", "Team review decision"],
      ["characteristics", "Reviewed characteristics"],
      ["actions", "Actions and evidence"],
    ].map(([key, label]) => ({ key, label })),
    rows,
  };
  const exportModel = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify({ format: "FMEApex DFMEA", data }, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = report.fileName + ".json";
    a.click();
    URL.revokeObjectURL(url);
  };
  const importModel = async (file: File) => {
    try {
      let parsed: unknown;
      if (file.name.toLowerCase().endsWith(".xlsx")) {
        const workbook = await parseEngineeringXlsx(file);
        if (workbook.worksheetChanged)
          throw new Error(
            "The narrative worksheet was edited. Its many-to-many relationships cannot be inferred safely. Import a complete-model JSON file or use the design editor to apply the reviewed changes.",
          );
        parsed = workbook.model;
      } else parsed = JSON.parse(await file.text());
      const candidate =
        parsed && typeof parsed === "object" && "data" in parsed
          ? (parsed as { data: unknown }).data
          : parsed;
      const issues = validateDfmea(candidate);
      if (issues.length) throw new Error(issues.join("\n"));
      setImported(candidate as DfmeaData);
    } catch (e) {
      setError(String(e));
    }
  };
  const analysis = (optimization = false) => (
    <>
      {chains.length === 0 && (
        <p className="df-empty">Add a failure analysis for a focus function.</p>
      )}
      {chains.map((c) => (
        <article
          className="df-chain"
          key={c.id}
          id={"df-record-" + c.id}
          tabIndex={-1}
        >
          <div className="df-row">
            <h3>{c.mode || "Failure analysis"}</h3>
            <button
              onClick={() => {
                if (
                  data.failureReferences?.some(
                    (ref) =>
                      ref.sourceChainId === c.id || ref.targetChainId === c.id,
                  )
                ) {
                  setError(
                    "Remove explicit failure references before deleting this analysis.",
                  );
                  return;
                }
                if (window.confirm("Remove analysis and its actions?"))
                  edit((d) => {
                    d.chains = d.chains.filter((x) => x.id !== c.id);
                    d.legacyMappings = d.legacyMappings?.filter(
                      (m) => m.chainId !== c.id,
                    );
                  });
              }}
            >
              Remove analysis
            </button>
          </div>
          <div className="df-grid">
            <label className="df-field">
              Focus function
              <select
                value={c.functionId}
                onChange={(e) =>
                  chainEdit(c.id, (x) => {
                    x.functionId = e.target.value;
                  })
                }
              >
                {functions.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.text || "Unnamed function"}
                  </option>
                ))}
              </select>
            </label>
            <Text
              label="Failure mode — how this function fails"
              value={c.mode}
              change={(v) =>
                chainEdit(c.id, (x) => {
                  x.mode = v;
                })
              }
            />
          </div>
          {!optimization && (
            <>
              <h4>Effects on higher level / end user</h4>
              {c.effects.map((e) => (
                <div className="df-effect" key={e.id}>
                  <Text
                    label="Failure effect"
                    value={e.text}
                    change={(v) =>
                      chainEdit(c.id, (x) => {
                        x.effects.find((a) => a.id === e.id)!.text = v;
                      })
                    }
                  />
                  <label className="df-field">
                    Affected element
                    {elementSelect(e.elementId, (v) =>
                      chainEdit(c.id, (x) => {
                        x.effects.find((a) => a.id === e.id)!.elementId = v;
                      }),
                    )}
                  </label>
                  <Rating
                    label="Severity"
                    value={e.severity}
                    change={(v) =>
                      chainEdit(c.id, (x) => {
                        x.effects.find((a) => a.id === e.id)!.severity = v;
                      })
                    }
                  />
                  <button
                    onClick={() =>
                      chainEdit(c.id, (x) => {
                        x.effects = x.effects.filter((a) => a.id !== e.id);
                      })
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                onClick={() =>
                  chainEdit(c.id, (x) =>
                    x.effects.push({
                      id: uid(),
                      elementId: null,
                      text: "",
                      severity: null,
                    }),
                  )
                }
              >
                + Effect
              </button>
            </>
          )}
          <h4>
            {optimization
              ? "Optimization and verified results"
              : "Design causes and current controls"}
          </h4>
          {c.causes.map((x) => (
            <section className="df-cause" key={x.id}>
              <div className="df-grid">
                <Text
                  label="Design cause"
                  value={x.text}
                  change={(v) =>
                    causeEdit(c.id, x.id, (a) => {
                      a.text = v;
                    })
                  }
                />
                <label className="df-field">
                  Cause element
                  {elementSelect(x.elementId, (v) =>
                    causeEdit(c.id, x.id, (a) => {
                      a.elementId = v;
                    }),
                  )}
                </label>
              </div>
              {!optimization && (
                <>
                  <div className="df-grid">
                    <Text
                      label="Design prevention control"
                      value={x.preventionControl}
                      change={(v) =>
                        causeEdit(c.id, x.id, (a) => {
                          a.preventionControl = v;
                        })
                      }
                    />
                    <Text
                      label="Design detection / verification control"
                      value={x.detectionControl}
                      change={(v) =>
                        causeEdit(c.id, x.id, (a) => {
                          a.detectionControl = v;
                        })
                      }
                    />
                    <Rating
                      label="Occurrence"
                      value={x.occurrence}
                      change={(v) =>
                        causeEdit(c.id, x.id, (a) => {
                          a.occurrence = v;
                        })
                      }
                    />
                    <Rating
                      label="Detection"
                      value={x.detection}
                      change={(v) =>
                        causeEdit(c.id, x.id, (a) => {
                          a.detection = v;
                        })
                      }
                    />
                  </div>
                  <p className="df-note">
                    S:{" "}
                    {c.effects.length &&
                    c.effects.every((e) => e.severity !== null)
                      ? Math.max(...c.effects.map((e) => e.severity!))
                      : "Unrated"}{" "}
                    · AP:{" "}
                    {dirty
                      ? "Save to calculate"
                      : (evaluations.find((e) => e.causeId === x.id)?.ap ??
                        "Unrated")}{" "}
                    · Configured profile, unverified
                  </p>
                  <button
                    onClick={() => {
                      if (window.confirm("Remove cause and its actions?"))
                        chainEdit(c.id, (a) => {
                          a.causes = a.causes.filter((y) => y.id !== x.id);
                        });
                    }}
                  >
                    Remove cause
                  </button>
                </>
              )}
              {optimization && (
                <>
                  {x.actions.map((a) => (
                    <fieldset
                      disabled={actionBaseline[a.id] === "verified"}
                      className="df-action"
                      key={a.id}
                      id={"df-record-" + a.id}
                      tabIndex={-1}
                    >
                      <legend>
                        {actionBaseline[a.id] === "verified"
                          ? "Verified evidence · protected record"
                          : "Action lifecycle · save each transition before continuing"}
                      </legend>
                      <div className="df-grid">
                        <label className="df-field">
                          Action type
                          <select
                            value={a.type}
                            onChange={(e) =>
                              actionEdit(c.id, x.id, a.id, (z) => {
                                z.type = e.target.value as DesignAction["type"];
                              })
                            }
                          >
                            <option value="prevention">Prevention</option>
                            <option value="detection">Detection</option>
                          </select>
                        </label>
                        {(
                          [
                            "description",
                            "owner",
                            "targetDate",
                            "taken",
                            "completionDate",
                            "evidence",
                            "decision",
                          ] as const
                        ).map((k) => (
                          <Text
                            key={k}
                            label={
                              {
                                description: "Recommended action",
                                owner: "Responsible person",
                                targetDate: "Target date",
                                taken: "Action taken and results",
                                completionDate: "Completion date",
                                evidence: "Evidence / test report reference",
                                decision:
                                  "Effectiveness decision and rating rationale",
                              }[k]
                            }
                            value={a[k]}
                            date={k === "targetDate" || k === "completionDate"}
                            change={(v) =>
                              actionEdit(c.id, x.id, a.id, (z) => {
                                z[k] = v;
                              })
                            }
                          />
                        ))}
                        <label className="df-field">
                          Status
                          <select
                            value={a.status}
                            onChange={(e) =>
                              actionEdit(c.id, x.id, a.id, (z) => {
                                z.status = e.target
                                  .value as DesignAction["status"];
                                if (z.status !== "verified") {
                                  z.revisedOccurrence = null;
                                  z.revisedDetection = null;
                                }
                              })
                            }
                          >
                            {[
                              "open",
                              "in_progress",
                              "completed",
                              "verified",
                            ].map((s) => (
                              <option
                                key={s}
                                value={s}
                                disabled={
                                  !(
                                    actionBaseline[a.id]
                                      ? [
                                          actionBaseline[a.id],
                                          ...(
                                            {
                                              open: ["in_progress"],
                                              in_progress: [
                                                "open",
                                                "completed",
                                              ],
                                              completed: [
                                                "in_progress",
                                                "verified",
                                              ],
                                              verified: [],
                                            } as Record<string, string[]>
                                          )[actionBaseline[a.id]],
                                        ]
                                      : ["open"]
                                  ).includes(s)
                                }
                              >
                                {s.replace("_", " ")}
                              </option>
                            ))}
                          </select>
                        </label>
                        <Rating
                          label="Revised occurrence"
                          value={a.revisedOccurrence}
                          disabled={a.status !== "verified"}
                          change={(v) =>
                            actionEdit(c.id, x.id, a.id, (z) => {
                              z.revisedOccurrence = v;
                            })
                          }
                        />
                        <Rating
                          label="Revised detection"
                          value={a.revisedDetection}
                          disabled={a.status !== "verified"}
                          change={(v) =>
                            actionEdit(c.id, x.id, a.id, (z) => {
                              z.revisedDetection = v;
                            })
                          }
                        />
                      </div>
                      <p className="df-note">
                        Reassessment is an explicit complete O and D snapshot
                        with justification, or no recorded reassessment. Partial
                        values are never combined with the baseline or another
                        action (product integrity policy).
                        {actionBaseline[a.id] === "verified" &&
                          (a.revisedOccurrence === null) !==
                            (a.revisedDetection === null) && (
                            <strong>
                              {" "}
                              Historical partial reassessment — preserved,
                              unreviewed and not used to calculate reassessed
                              AP.
                            </strong>
                          )}
                        Detection improvements do not reduce effect severity.
                        Changes to the effect need a reviewed design analysis.
                      </p>
                      <button
                        onClick={() => {
                          if (window.confirm("Remove action?"))
                            causeEdit(c.id, x.id, (z) => {
                              z.actions = z.actions.filter(
                                (b) => b.id !== a.id,
                              );
                            });
                        }}
                      >
                        Remove action
                      </button>
                    </fieldset>
                  ))}
                  <button
                    onClick={() =>
                      causeEdit(c.id, x.id, (z) => z.actions.push(action()))
                    }
                  >
                    + Action
                  </button>
                </>
              )}
            </section>
          ))}
          {!optimization && (
            <button
              onClick={() => chainEdit(c.id, (x) => x.causes.push(cause()))}
            >
              + Cause
            </button>
          )}
          <Text
            label="Team review / action or justification decision"
            value={c.reviewDecision}
            change={(v) =>
              chainEdit(c.id, (x) => {
                x.reviewDecision = v;
              })
            }
          />
          <h4>Reviewed downstream characteristic references</h4>
          <p className="df-note">
            A design reference does not automatically approve a manufacturing
            control.
          </p>
          {c.specialCharacteristicRefs.map((ref) => (
            <div className="df-cause df-grid" key={ref.id}>
              {(
                [
                  "characteristic",
                  "classification",
                  "source",
                  "reviewedBy",
                ] as const
              ).map((k) => (
                <Text
                  key={k}
                  label={
                    {
                      characteristic: "Characteristic",
                      classification: "Customer classification",
                      source: "Specification / source",
                      reviewedBy: "Reviewed by",
                    }[k]
                  }
                  value={ref[k]}
                  change={(v) =>
                    chainEdit(c.id, (x) => {
                      x.specialCharacteristicRefs.find((r) => r.id === ref.id)![
                        k
                      ] = v;
                    })
                  }
                />
              ))}
              <button
                onClick={() =>
                  chainEdit(c.id, (x) => {
                    x.specialCharacteristicRefs =
                      x.specialCharacteristicRefs.filter(
                        (r) => r.id !== ref.id,
                      );
                  })
                }
              >
                Remove reference
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              chainEdit(c.id, (x) =>
                x.specialCharacteristicRefs.push({
                  id: uid(),
                  characteristic: "",
                  classification: "",
                  source: "",
                  reviewedBy: "",
                }),
              )
            }
          >
            + Characteristic reference
          </button>
        </article>
      ))}
    </>
  );
  if (initialLoading || !revision)
    return (
      <main className="df-workspace" aria-busy={initialLoading}>
        <header className="df-heading">
          <div>
            <span className="df-eyebrow">DESIGN ENGINEERING</span>
            <h1>Design FMEA</h1>
          </div>
        </header>
        {initialLoading ? (
          <p role="status">Loading design documents…</p>
        ) : (
          <section className="df-panel">
            <h2>
              {missingDocument
                ? "No Design FMEA in this program"
                : "Design document unavailable"}
            </h2>
            <p>
              {missingDocument
                ? "This program does not contain a Design FMEA document. Open a program with DFMEA enabled, or include Design FMEA when creating a new program."
                : error || "No revision is selected for this document."}
            </p>
            <Link to="/app/projects">Back to programs</Link>
          </section>
        )}
      </main>
    );
  return (
    <main className="df-workspace">
      <header className="df-heading">
        <div>
          <span className="df-eyebrow">DESIGN ENGINEERING</span>
          <h1>Design FMEA</h1>
          <p>{name} · Functions, failure chains and verified action.</p>
        </div>
        <div className="df-tools">
          <label className="df-field">
            Revision
            <select
              value={revision}
              onChange={(e) => {
                if (!dirty || window.confirm("Discard unsaved changes?"))
                  setRevision(e.target.value);
              }}
            >
              {!history.some((r) => r.id === revision) && revision && (
                <option value={revision}>Current revision</option>
              )}
              {history.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.revisionNumber ?? r.id.slice(0, 8)} · {r.status}
                </option>
              ))}
            </select>
          </label>
          {hasPermission("dfmea.edit") && (
            <button
              disabled={busy || dirty || !revision || !forkable}
              title={
                !forkable
                  ? "A saved canonical model in an editable project is required to create a revision"
                  : undefined
              }
              onClick={() => setForkOpen(true)}
            >
              New revision
            </button>
          )}
          {writable && hasPermission("revision.submit") && (
            <button
              disabled={busy || dirty}
              onClick={() => void transition("submit")}
            >
              Submit for review
            </button>
          )}
          {history.find((item) => item.id === revision)?.status ===
            "in_review" &&
            (hasPermission("revision.approve") ||
              hasPermission("revision.review")) && (
              <button
                disabled={busy || dirty}
                onClick={() => setReleaseOpen(true)}
              >
                Review decision
              </button>
            )}
          <button
            className="df-primary"
            disabled={!dirty || !writable || busy}
            onClick={save}
          >
            {busy ? "Working…" : dirty ? "Save draft" : "Saved"}
          </button>
        </div>
      </header>
      <div className="df-status">
        <span>{writable ? "Editable draft" : "Read-only revision"}</span>
        <span>{data.elements.length} elements</span>
        <span>{data.functions.length} functions</span>
        <span>{data.chains.length} analyses</span>
        <span>
          Version {version}
          {dirty ? " · Unsaved" : ""}
        </span>
      </div>
      {error && (
        <div className="df-alert error" role="alert">
          {error}
          <button onClick={() => setError("")}>Dismiss</button>
        </div>
      )}
      {message && (
        <div className="df-alert" role="status">
          {message}
        </div>
      )}
      <nav className="df-phases" aria-label="Seven analysis activities">
        {phases.map((p, i) => (
          <button
            key={p}
            aria-current={phase === i ? "step" : undefined}
            onClick={() => setPhase(i)}
          >
            <b>{i + 1}</b>
            {p}
          </button>
        ))}
      </nav>
      <section className="df-panel">
        <div className="df-row">
          <h2>
            {phase + 1}. {phases[phase]}
          </h2>
          <p className="df-note">
            Revisit any activity. Saving does not approve the analysis.
          </p>
        </div>
        {phase === 0 && (
          <fieldset disabled={!writable}>
            <div className="df-grid">
              {(
                [
                  "scope",
                  "boundary",
                  "team",
                  "timing",
                  "criteriaProfile",
                ] as const
              ).map((k) => (
                <Text
                  key={k}
                  label={
                    {
                      scope: "Scope and exclusions",
                      boundary: "Boundary and operating context",
                      team: "Cross-functional team",
                      timing: "Milestones and review dates",
                      criteriaProfile:
                        "Applicable handbook / customer criteria and edition",
                    }[k]
                  }
                  value={data.planning[k]}
                  change={(v) =>
                    edit((d) => {
                      d.planning[k] = v;
                    })
                  }
                />
              ))}
            </div>
            <h3>Explicit analysis exclusions</h3>
            <p className="df-note">
              Keep external or context-only elements in the boundary diagram
              while explicitly documenting why their own functions are outside
              this analysis. No element is excluded automatically. Existing
              authored functions and chains still require review.
            </p>
            {(data.scopeExclusions ?? []).map((exclusion, index) => (
              <div className="df-cause df-grid" key={index}>
                <label className="df-field">
                  Excluded element
                  <select
                    value={exclusion.elementId}
                    onChange={(e) =>
                      edit((d) => {
                        d.scopeExclusions![index].elementId = e.target.value;
                      })
                    }
                  >
                    {data.elements
                      .filter(
                        (e) =>
                          e.id === exclusion.elementId ||
                          !data.scopeExclusions?.some(
                            (x) => x.elementId === e.id,
                          ),
                      )
                      .map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name}
                        </option>
                      ))}
                  </select>
                </label>
                <Text
                  label="Exclusion rationale / responsibility boundary"
                  value={exclusion.reason}
                  change={(v) =>
                    edit((d) => {
                      d.scopeExclusions![index].reason = v;
                    })
                  }
                />
                <button
                  onClick={() =>
                    edit((d) => {
                      d.scopeExclusions = d.scopeExclusions?.filter(
                        (_, i) => i !== index,
                      );
                    })
                  }
                >
                  Include in analysis
                </button>
              </div>
            ))}
            <button
              disabled={
                !data.elements.some(
                  (e) =>
                    !data.scopeExclusions?.some((x) => x.elementId === e.id),
                )
              }
              onClick={() =>
                edit((d) => {
                  const element = d.elements.find(
                    (e) =>
                      !d.scopeExclusions?.some((x) => x.elementId === e.id),
                  );
                  if (element)
                    d.scopeExclusions = [
                      ...(d.scopeExclusions ?? []),
                      { elementId: element.id, reason: "" },
                    ];
                })
              }
            >
              + Document exclusion
            </button>
            <div className="df-criteria-status">
              <strong>
                Executable criteria: {criteriaProfile?.id ?? "Loading profile"}
              </strong>
              <dl>
                <dt>Analysis</dt>
                <dd>{criteriaProfile?.analysisType ?? "DFMEA"}</dd>
                <dt>Numerical verification</dt>
                <dd>
                  {criteriaProfile?.numericalVerification ??
                    "Pending authorized reference"}
                </dd>
                <dt>Verified numerical edition</dt>
                <dd>
                  {criteriaProfile?.verifiedEdition ??
                    "Not independently verified"}
                </dd>
                <dt>Reference catalog</dt>
                <dd>
                  {criteriaProfile?.referenceTitle} ·{" "}
                  {criteriaProfile?.referenceCatalogEdition}
                </dd>
              </dl>
              <p>
                {criteriaProfile?.note} The applicability note above does not
                change the configured lookup. AP is calculated on the server
                after saving.
              </p>
              <a
                href={
                  criteriaProfile?.source ??
                  "https://www.aiag.org/expertise-areas/quality/quality-core-tools"
                }
                target="_blank"
                rel="noreferrer"
              >
                Official reference catalog
              </a>
            </div>
            <h3>Parameter context</h3>
            <div className="df-grid">
              {(
                [
                  "idealFunction",
                  "inputs",
                  "outputs",
                  "noiseFactors",
                  "controlFactors",
                ] as const
              ).map((k) => (
                <Text
                  key={k}
                  label={
                    {
                      idealFunction: "Ideal function",
                      inputs: "Inputs / energy / signals",
                      outputs: "Intended outputs",
                      noiseFactors: "Noise factors and conditions",
                      controlFactors: "Design control factors",
                    }[k]
                  }
                  value={data.parameterContext[k]}
                  change={(v) =>
                    edit((d) => {
                      d.parameterContext[k] = v;
                    })
                  }
                />
              ))}
            </div>
          </fieldset>
        )}
        {phase === 0 && (
          <DesignContextDiagrams
            data={data}
            onFocus={(id) => {
              setSelected(id);
              setPhase(1);
            }}
          />
        )}
        {phase > 0 && phase < 6 && (
          <div className="df-layout">
            <aside className="df-tree">
              <div className="df-row">
                <h3>Design structure</h3>
                <button disabled={!writable} onClick={() => addElement(null)}>
                  + Root
                </button>
              </div>
              {tree(null)}
              {!data.elements.length && (
                <p className="df-empty">
                  Add a system and its subsystems / components.
                </p>
              )}
            </aside>
            <div className="df-detail">
              <fieldset disabled={!writable}>
                {!focus ? (
                  <p className="df-empty">Select a design element.</p>
                ) : (
                  <>
                    <h3>{focus.name}</h3>
                    {phase === 1 && (
                      <>
                        <div className="df-grid">
                          <Text
                            label="Element name"
                            value={focus.name}
                            change={(v) =>
                              edit((d) => {
                                d.elements.find(
                                  (e) => e.id === selected,
                                )!.name = v;
                              })
                            }
                          />
                          <label className="df-field">
                            Level
                            <select
                              value={focus.kind}
                              onChange={(e) =>
                                edit((d) => {
                                  d.elements.find(
                                    (x) => x.id === selected,
                                  )!.kind = e.target.value as typeof focus.kind;
                                })
                              }
                            >
                              {["system", "subsystem", "component"].map((k) => (
                                <option key={k} value={k}>
                                  {k}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="df-field">
                            Parent / move element
                            {elementSelect(
                              focus.parentId,
                              (v) => {
                                const next = structuredClone(data);
                                next.elements.find(
                                  (e) => e.id === selected,
                                )!.parentId = v;
                                const issues = validateDfmea(next);
                                if (issues.length) setError(issues.join(" "));
                                else
                                  edit((d) => {
                                    d.elements = next.elements;
                                  });
                              },
                              selected,
                            )}
                          </label>
                          <Text
                            label="Description / boundary"
                            value={focus.description}
                            change={(v) =>
                              edit((d) => {
                                d.elements.find(
                                  (e) => e.id === selected,
                                )!.description = v;
                              })
                            }
                          />
                        </div>
                        <div className="df-tools">
                          <button onClick={() => addElement(selected)}>
                            + Child
                          </button>
                          <button onClick={removeElement}>
                            Delete element
                          </button>
                        </div>
                        <h3>Interfaces</h3>
                        {data.interfaces
                          .filter(
                            (l) =>
                              l.sourceId === selected ||
                              l.targetId === selected,
                          )
                          .map((l) => (
                            <div className="df-link" key={l.id}>
                              <span>
                                {
                                  data.elements.find((e) => e.id === l.sourceId)
                                    ?.name
                                }{" "}
                                â†’{" "}
                                {
                                  data.elements.find((e) => e.id === l.targetId)
                                    ?.name
                                }
                              </span>
                              <Text
                                label="Physical / energy / material / signal interaction"
                                value={l.description}
                                change={(v) =>
                                  edit((d) => {
                                    d.interfaces.find(
                                      (x) => x.id === l.id,
                                    )!.description = v;
                                  })
                                }
                              />
                              <button
                                onClick={() =>
                                  edit((d) => {
                                    d.interfaces = d.interfaces.filter(
                                      (x) => x.id !== l.id,
                                    );
                                  })
                                }
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        <label className="df-field">
                          Add interface to
                          {elementSelect(
                            "",
                            (v) => {
                              if (v)
                                edit((d) =>
                                  d.interfaces.push({
                                    id: uid(),
                                    sourceId: selected,
                                    targetId: v,
                                    description: "",
                                  }),
                                );
                            },
                            selected,
                          )}
                        </label>
                      </>
                    )}
                    {phase === 2 && (
                      <>
                        {functions.map((f) => (
                          <div className="df-cause" key={f.id}>
                            <div className="df-grid">
                              <Text
                                label="Function — verb and noun"
                                value={f.text}
                                change={(v) =>
                                  edit((d) => {
                                    d.functions.find(
                                      (x) => x.id === f.id,
                                    )!.text = v;
                                  })
                                }
                              />
                              <Text
                                label="Measurable requirement / specification"
                                value={f.requirement}
                                change={(v) =>
                                  edit((d) => {
                                    d.functions.find(
                                      (x) => x.id === f.id,
                                    )!.requirement = v;
                                  })
                                }
                              />
                            </div>
                            <button
                              onClick={() => {
                                if (
                                  data.chains.some(
                                    (c) => c.functionId === f.id,
                                  ) ||
                                  data.functionLinks.some(
                                    (l) =>
                                      l.sourceId === f.id ||
                                      l.targetId === f.id,
                                  )
                                ) {
                                  setError(
                                    "Remove linked analyses and function relationships first.",
                                  );
                                  return;
                                }
                                edit((d) => {
                                  d.functions = d.functions.filter(
                                    (x) => x.id !== f.id,
                                  );
                                });
                              }}
                            >
                              Remove function
                            </button>
                            <h4>Function relationships</h4>
                            {data.functionLinks
                              .filter((l) => l.sourceId === f.id)
                              .map((l) => (
                                <div className="df-link" key={l.id}>
                                  <span>
                                    â†’{" "}
                                    {
                                      data.functions.find(
                                        (x) => x.id === l.targetId,
                                      )?.text
                                    }
                                  </span>
                                  <Text
                                    label="Relationship"
                                    value={l.description}
                                    change={(v) =>
                                      edit((d) => {
                                        d.functionLinks.find(
                                          (x) => x.id === l.id,
                                        )!.description = v;
                                      })
                                    }
                                  />
                                  <button
                                    onClick={() =>
                                      edit((d) => {
                                        d.functionLinks =
                                          d.functionLinks.filter(
                                            (x) => x.id !== l.id,
                                          );
                                      })
                                    }
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                            <label className="df-field">
                              Link function
                              <select
                                value=""
                                onChange={(e) => {
                                  if (e.target.value)
                                    edit((d) =>
                                      d.functionLinks.push({
                                        id: uid(),
                                        sourceId: f.id,
                                        targetId: e.target.value,
                                        description: "",
                                      }),
                                    );
                                }}
                              >
                                <option value="">Choose function</option>
                                {data.functions
                                  .filter((x) => x.id !== f.id)
                                  .map((x) => (
                                    <option key={x.id} value={x.id}>
                                      {
                                        data.elements.find(
                                          (e) => e.id === x.elementId,
                                        )?.name
                                      }
                                      : {x.text}
                                    </option>
                                  ))}
                              </select>
                            </label>
                          </div>
                        ))}
                        <button
                          onClick={() =>
                            edit((d) =>
                              d.functions.push({
                                id: uid(),
                                elementId: selected,
                                text: "",
                                requirement: "",
                              }),
                            )
                          }
                        >
                          + Function
                        </button>
                      </>
                    )}
                    {(phase === 3 || phase === 4) && (
                      <>
                        <div className="df-tools">
                          <button onClick={() => setWorksheet(false)}>
                            Focus analysis
                          </button>
                          <button onClick={() => setWorksheet(true)}>
                            Full worksheet
                          </button>
                          <button
                            disabled={!functions.length}
                            onClick={() =>
                              edit((d) =>
                                d.chains.push({
                                  id: uid(),
                                  focusElementId: selected,
                                  functionId: functions[0].id,
                                  mode: "",
                                  effects: [],
                                  causes: [],
                                  reviewDecision: "",
                                  specialCharacteristicRefs: [],
                                }),
                              )
                            }
                          >
                            + Failure analysis
                          </button>
                        </div>
                        {worksheet ? (
                          <div className="df-table-wrap">
                            <table>
                              <thead>
                                <tr>
                                  {report.columns.map((c) => (
                                    <th key={c.key}>{c.label}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {rows.map((r, i) => (
                                  <tr key={i}>
                                    {report.columns.map((c) => (
                                      <td key={c.key}>
                                        {String(
                                          r[c.key as keyof typeof r] ?? "—",
                                        )}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          analysis()
                        )}
                      </>
                    )}
                    {phase === 5 && analysis(true)}
                  </>
                )}
              </fieldset>
            </div>
          </div>
        )}
        {(phase === 3 || phase === 4) && (
          <FailureReferenceReview
            data={data}
            writable={writable}
            onChange={(next) => edit((d) => Object.assign(d, next))}
            onTrace={(chainId) => {
              const chain = data.chains.find((c) => c.id === chainId);
              if (chain) {
                setSelected(chain.focusElementId);
                setPhase(4);
                setWorksheet(false);
                window.setTimeout(() => {
                  const node = document.getElementById("df-record-" + chain.id);
                  node?.scrollIntoView({ behavior: "smooth", block: "center" });
                  node?.focus({ preventScroll: true });
                }, 100);
              }
            }}
          />
        )}
        {phase === 6 && (
          <DesignResultsSummary
            data={data}
            evaluations={evaluations}
            dirty={dirty}
            onRecord={(id, nextPhase, recordId) => {
              setSelected(id);
              setPhase(nextPhase);
              setWorksheet(false);
              if (recordId)
                window.setTimeout(() => {
                  const node = document.getElementById("df-record-" + recordId);
                  node?.scrollIntoView({ behavior: "smooth", block: "center" });
                  node?.focus({ preventScroll: true });
                }, 100);
            }}
          />
        )}
        {phase === 6 && (
          <div className="df-grid">
            <div>
              <h3>Review completeness</h3>
              <p>
                {readiness.ready
                  ? "Application completeness passed; engineering review remains required."
                  : readiness.errors.length + " review items"}
              </p>
              <ul className="df-review">
                {readiness.errors.map((e, i) => (
                  <li key={i}>
                    <button
                      onClick={() => {
                        const reference = data.failureReferences?.find((ref) =>
                          e.includes(ref.id),
                        );
                        const chain = reference
                          ? data.chains.find(
                              (c) => c.id === reference.targetChainId,
                            )
                          : data.chains.find((c) =>
                              e.startsWith((c.mode || c.id) + ":"),
                            );
                        const element = data.elements.find((x) =>
                          e.startsWith((x.name || x.id) + ":"),
                        );
                        const fn = data.functions.find((f) =>
                          e.startsWith((f.text || f.id) + ":"),
                        );
                        if (chain) {
                          setSelected(chain.focusElementId);
                          setPhase(
                            e.includes("action ")
                              ? 5
                              : e.includes("O/D") ||
                                  e.includes("severity") ||
                                  e.includes("High AP")
                                ? 4
                                : 3,
                          );
                          const actionId = e.match(/action ([^ ]+)/)?.[1];
                          window.setTimeout(() => {
                            const node = document.getElementById(
                              "df-record-" + (actionId ?? chain.id),
                            );
                            node?.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            });
                            node?.focus({ preventScroll: true });
                          }, 100);
                        } else if (element) {
                          setSelected(element.id);
                          setPhase(e.includes("scope exclusion") ? 0 : 2);
                        } else if (fn) {
                          setSelected(fn.elementId);
                          setPhase(3);
                        } else setPhase(e.includes("Planning") ? 0 : 3);
                      }}
                    >
                      {e}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Reviewed characteristic flow-down</h3>
              {data.chains
                .flatMap((c) => c.specialCharacteristicRefs)
                .map((ref) => {
                  const link = data.downstreamLinks?.find(
                    (l) => l.designCharacteristicId === ref.id,
                  );
                  const assign = (
                    patch: Partial<
                      NonNullable<DfmeaData["downstreamLinks"]>[number]
                    >,
                  ) =>
                    edit((d) => {
                      d.downstreamLinks = [
                        ...(d.downstreamLinks ?? []).filter(
                          (l) => l.designCharacteristicId !== ref.id,
                        ),
                        {
                          designCharacteristicId: ref.id,
                          targetRevisionId: link?.targetRevisionId ?? "",
                          targetCharacteristicId:
                            link?.targetCharacteristicId ?? "",
                          reviewDecision: link?.reviewDecision ?? "",
                          ...patch,
                        },
                      ];
                    });
                  return (
                    <fieldset key={ref.id} disabled={!writable}>
                      <h4>{ref.characteristic}</h4>
                      <label className="df-field">
                        PFMEA characteristic
                        <select
                          value={
                            link?.targetRevisionId
                              ? `${link.targetRevisionId}:${link.targetCharacteristicId}`
                              : ""
                          }
                          onChange={(e) => {
                            const [
                              targetRevisionId = "",
                              targetCharacteristicId = "",
                            ] = e.target.value.split(":");
                            assign({
                              targetRevisionId,
                              targetCharacteristicId,
                            });
                          }}
                        >
                          <option value="">
                            Not mapped — record applicability / exclusion
                          </option>
                          {downstreamTargets.map((t) => (
                            <option
                              key={`${t.revisionId}:${t.characteristicId}`}
                              value={`${t.revisionId}:${t.characteristicId}`}
                            >
                              {t.name} · PFMEA {t.revisionNumber}
                            </option>
                          ))}
                        </select>
                      </label>
                      <Text
                        label="Review decision / exclusion justification"
                        value={link?.reviewDecision ?? ""}
                        change={(reviewDecision) => assign({ reviewDecision })}
                      />
                    </fieldset>
                  );
                })}
              <h3>Results and criteria</h3>
              {readiness.warnings.map((w) => (
                <p className="df-note" key={w}>
                  {w}
                </p>
              ))}
              <p>
                Submission and approval remain separate project revision
                actions. Exports cover the entire selected document, including
                marked unsaved draft content.
              </p>
              <div className="df-tools">
                <button
                  onClick={() =>
                    exportEngineeringXlsx(report).catch((e) =>
                      setError(String(e)),
                    )
                  }
                >
                  Worksheet XLSX
                </button>
                <button onClick={() => printEngineeringDocument(report)}>
                  Print / Save PDF
                </button>
                <button onClick={exportModel}>Export complete model</button>
                <label className="df-import">
                  Import complete model
                  <input
                    type="file"
                    accept=".json,.xlsx,application/json"
                    disabled={!writable}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void importModel(file);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </section>
      {legacy.length > 0 && (
        <details className="df-panel">
          <summary>
            Legacy analysis · {legacy.length} rows · read-only / unreviewed
          </summary>
          <p>
            Legacy records do not identify unique design hierarchies or
            cause-level chains. Review source records before creating structured
            analysis. Nothing was automatically split or approved.
          </p>
          <div className="df-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Focus</th>
                  <th>Functions</th>
                  <th>Modes</th>
                  <th>Effects</th>
                  <th>Causes</th>
                  <th>S/O/D</th>
                  <th>Mapping</th>
                </tr>
              </thead>
              <tbody>
                {legacy.map((r) => (
                  <tr key={r.id}>
                    <td>{r.rowNumber}</td>
                    <td>{r.processStep?.name}</td>
                    <td>
                      {r.functions?.map((x) => x.function.name).join("\n")}
                    </td>
                    <td>
                      {r.failureModes
                        ?.map((x) => x.failureMode.name)
                        .join("\n")}
                    </td>
                    <td>{r.effects?.map((x) => x.effect.name).join("\n")}</td>
                    <td>{r.causes?.map((x) => x.cause.name).join("\n")}</td>
                    <td>
                      {r.severity ?? "-"}/{r.occurrence ?? "-"}/
                      {r.detection ?? "-"}
                    </td>
                    <td>
                      <button
                        disabled={!writable || !data.functions.length}
                        onClick={() => {
                          setMappingRow(r);
                          setMappingFunction("");
                          setMappingMode("");
                          setMappingCause("");
                          setMappingEffects([]);
                          setMappingRatings(false);
                        }}
                      >
                        Map selected chain
                      </button>
                      {data.legacyMappings?.some(
                        (m) => m.sourceRowId === r.id,
                      ) && <small>Mapping recorded</small>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
      <Dialog
        open={!!mappingRow}
        onClose={() => setMappingRow(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Map legacy row {mappingRow?.rowNumber}</DialogTitle>
        <DialogContent dividers>
          <p>
            Choose the actual relationships. Each mapping creates one
            cause-level analysis; the original row remains unchanged. Define
            design elements and functions first.
          </p>
          <div className="df-grid">
            <label className="df-field">
              Focus function
              <select
                value={mappingFunction}
                onChange={(e) => setMappingFunction(e.target.value)}
              >
                <option value="">Choose function</option>
                {data.functions.map((f) => (
                  <option key={f.id} value={f.id}>
                    {data.elements.find((e) => e.id === f.elementId)?.name}:{" "}
                    {f.text}
                  </option>
                ))}
              </select>
            </label>
            <label className="df-field">
              Failure mode
              <select
                value={mappingMode}
                onChange={(e) => setMappingMode(e.target.value)}
              >
                <option value="">Choose mode</option>
                {mappingRow?.failureModes?.map((m, i) => (
                  <option key={i} value={m.failureMode.name}>
                    {m.failureMode.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="df-field">
              Cause
              <select
                value={mappingCause}
                onChange={(e) => setMappingCause(e.target.value)}
              >
                <option value="">Choose cause</option>
                {mappingRow?.causes?.map((c, i) => (
                  <option key={i} value={c.cause.name}>
                    {c.cause.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="df-field">
              Applicable effects
              <select
                multiple
                value={mappingEffects}
                onChange={(e) =>
                  setMappingEffects(
                    Array.from(e.target.selectedOptions, (o) => o.value),
                  )
                }
              >
                {mappingRow?.effects?.map((x, i) => (
                  <option key={i} value={x.effect.name}>
                    {x.effect.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            <input
              type="checkbox"
              checked={mappingRatings}
              onChange={(e) => setMappingRatings(e.target.checked)}
            />{" "}
            I reviewed the legacy row's S/O/D and explicitly assign them to this
            selected chain; controls and applicability still need review.
          </label>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMappingRow(null)}>Cancel</Button>
          <Button
            disabled={
              !mappingRow ||
              !mappingFunction ||
              !mappingMode ||
              !mappingCause ||
              !mappingEffects.length
            }
            onClick={() => {
              if (!mappingRow) return;
              const f = data.functions.find((f) => f.id === mappingFunction)!;
              const id = uid();
              edit((d) => {
                d.chains.push({
                  id,
                  focusElementId: f.elementId,
                  functionId: f.id,
                  mode: mappingMode,
                  effects: mappingEffects.map((text) => ({
                    id: uid(),
                    elementId: null,
                    text,
                    severity: mappingRatings ? mappingRow.severity : null,
                  })),
                  causes: [
                    {
                      ...cause(),
                      text: mappingCause,
                      occurrence: mappingRatings ? mappingRow.occurrence : null,
                      detection: mappingRatings ? mappingRow.detection : null,
                    },
                  ],
                  reviewDecision: "",
                  specialCharacteristicRefs: [],
                });
                d.legacyMappings = [
                  ...(d.legacyMappings ?? []),
                  { sourceRowId: mappingRow.id, chainId: id },
                ];
              });
              setSelected(f.elementId);
              setPhase(3);
              setMappingRow(null);
            }}
          >
            Create draft mapping
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={forkOpen}
        onClose={() => setForkOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>New DFMEA revision</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            sx={{ mt: 2 }}
            label="Revision number (X.Y)"
            value={forkNumber}
            onChange={(e) => setForkNumber(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setForkOpen(false)}>Cancel</Button>
          <Button
            disabled={busy || !forkable || !/^\d+\.\d+$/.test(forkNumber)}
            onClick={() => void fork()}
          >
            Create draft
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={releaseOpen}
        onClose={() => setReleaseOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Controlled review decision</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Review decision / justification"
              multiline
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            {hasPermission("revision.approve") && (
              <TextField
                label="Approval password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReleaseOpen(false)}>Cancel</Button>
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
              disabled={busy || !comment.trim() || !password}
              onClick={() => void transition("approve")}
            >
              Approve
            </Button>
          )}
        </DialogActions>
      </Dialog>
      {imported && (
        <div
          className="df-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Review DFMEA import"
        >
          <div>
            <h2>Review complete-model import</h2>
            <p>
              {imported.elements.length} elements · {imported.functions.length}{" "}
              functions · {imported.chains.length} analyses
            </p>
            <p>
              Loading replaces the editable model when saved. Legacy records and
              revision history remain intact. Review imported ratings, links and
              evidence.
            </p>
            {imported.chains.some((c) =>
              c.causes.some((x) =>
                x.actions.some(
                  (a) => !actionBaseline[a.id] && a.status !== "open",
                ),
              ),
            ) && (
              <p className="df-note">
                This model contains historical action statuses that are new to
                this revision. They cannot be treated as verified evidence here.
                Choose “Restart new actions as open” to preserve source evidence
                text while clearing reassessment ratings and requiring the
                reviewed lifecycle again.
              </p>
            )}
            <div className="df-tools">
              <button onClick={() => setImported(null)}>Cancel</button>
              <button
                disabled={imported.chains.some((c) =>
                  c.causes.some((x) =>
                    x.actions.some(
                      (a) => !actionBaseline[a.id] && a.status !== "open",
                    ),
                  ),
                )}
                className="df-primary"
                onClick={() => {
                  edit((d) => Object.assign(d, imported));
                  setSelected(imported.elements[0]?.id ?? "");
                  setImported(null);
                  setMessage(
                    "Import loaded as unsaved draft. Review before saving.",
                  );
                }}
              >
                Load draft
              </button>
              {imported.chains.some((c) =>
                c.causes.some((x) =>
                  x.actions.some(
                    (a) => !actionBaseline[a.id] && a.status !== "open",
                  ),
                ),
              ) && (
                <button
                  onClick={() =>
                    setImported((current) => {
                      if (!current) return null;
                      const next = structuredClone(current);
                      for (const c of next.chains)
                        for (const x of c.causes)
                          for (const a of x.actions)
                            if (!actionBaseline[a.id]) {
                              a.status = "open";
                              a.revisedOccurrence = null;
                              a.revisedDetection = null;
                            }
                      return next;
                    })
                  }
                >
                  Restart new actions as open
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
export default DfmeaWorkspace;
