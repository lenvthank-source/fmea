import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { API_BASE_URL } from "../../config";
import { parseApiError } from "../../lib/api";
import { PackagePreviewCard } from "./PackagePreviewCard";
import { EditPackageDialog } from "./EditPackageDialog";
import { ImportTargetDialog } from "./ImportTargetDialog";
import { normalizePackage, packageSearchText } from "./packageStructure";
import "./repository.css";
interface Package {
  id: string;
  name: string;
  description?: string;
  packageData: unknown;
  contributorName: string;
  contributorTenantId: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  status: string;
  rejectionReason?: string;
}
export function RepositoryPage() {
  const { token, user } = useAuth();
  const isGuest = !!user?.isGuest || !!user?.roles?.includes("Guest");
  const isAdmin = !isGuest && !!user?.permissions?.includes("admin.config");
  const canImport = !!user?.permissions?.some((p) =>
    ["pfmea.create", "pfmea.edit"].includes(p),
  );
  const [params, setParams] = useSearchParams();
  const tab =
    params.get("tab") === "pending" && isAdmin
      ? "pending"
      : params.get("tab") === "mine" && !isGuest
        ? "mine"
        : "approved";
  const query = params.get("q") || "";
  const filter = params.get("coverage") || "all";
  const [packages, setPackages] = useState<{
    approved: Package[];
    pending: Package[];
    mine: Package[];
  }>({ approved: [], pending: [], mine: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Package | null>(null);
  const [importing, setImporting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const update = (key: string, value: string) =>
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value) next.set(key, value);
        else next.delete(key);
        if (key !== "package") next.delete("package");
        return next;
      },
      { replace: true },
    );
  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const read = async (suffix: string) => {
        const res = await fetch(
          `${API_BASE_URL}/repository/packages${suffix}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok)
          throw new Error(await parseApiError(res, "Unable to load packages"));
        const data = await res.json();
        if (!Array.isArray(data))
          throw new Error("Unexpected repository response");
        return data as Package[];
      };
      const [approved, pending, mine] = await Promise.all([
        read(""),
        isAdmin ? read("/pending") : Promise.resolve([]),
        !isGuest ? read("/my-submissions") : Promise.resolve([]),
      ]);
      setPackages({ approved, pending, mine });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load packages");
    } finally {
      setLoading(false);
    }
  }, [token, isAdmin, isGuest]);
  useEffect(() => {
    void load();
  }, [load]);
  const visible = packages[tab].filter((pkg) => {
    const model = normalizePackage(pkg.packageData, pkg.name);
    return (
      packageSearchText(pkg.packageData, pkg.name, pkg.description).includes(
        query.toLowerCase(),
      ) &&
      (filter === "all" ||
        (filter === "gaps"
          ? model.missingControls > 0 ||
            model.root.children.some((fn) => !fn.children.length) ||
            !model.functions ||
            model.issues.length > 0
          : model.functions > 0 &&
            model.causes > 0 &&
            !model.root.children.some((fn) => !fn.children.length) &&
            model.missingControls === 0 &&
            !model.issues.length))
    );
  });
  const selected =
    visible.find((pkg) => pkg.id === params.get("package")) || visible[0];
  const mutate = async (action: string, method = "POST", body?: unknown) => {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        `${API_BASE_URL}/repository/packages/${selected.id}${action}`,
        {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          ...(body ? { body: JSON.stringify(body) } : {}),
        },
      );
      if (!res.ok)
        throw new Error(await parseApiError(res, "Package action failed"));
      setRejecting(false);
      setReason("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Package action failed");
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="repository-page">
      <h1>Standard Packages Repository</h1>
      <p className="repo-subtitle">
        Reusable work elements. See the function, cause, and control
        relationships before you import.
      </p>
      <div className="repo-tools" aria-label="Package collections">
        <button
          aria-pressed={tab === "approved"}
          onClick={() => update("tab", "")}
        >
          Approved ({packages.approved.length})
        </button>
        {isAdmin && (
          <button
            aria-pressed={tab === "pending"}
            onClick={() => update("tab", "pending")}
          >
            Pending review ({packages.pending.length})
          </button>
        )}
        {!isGuest && (
          <button
            aria-pressed={tab === "mine"}
            onClick={() => update("tab", "mine")}
          >
            My submissions ({packages.mine.length})
          </button>
        )}
      </div>
      {error && (
        <Alert
          severity="error"
          sx={{ my: 2 }}
          action={<Button onClick={load}>Retry</Button>}
        >
          {error}
        </Alert>
      )}
      <div className="repo-search" style={{ marginTop: 16 }}>
        <input
          aria-label="Search packages, functions, causes and controls"
          placeholder="Search packages, functions, causes, controls…"
          value={query}
          onChange={(e) => update("q", e.target.value)}
        />
        <select
          aria-label="Filter structural coverage"
          value={filter}
          onChange={(e) => update("coverage", e.target.value)}
        >
          <option value="all">All structures</option>
          <option value="gaps">Missing structure / controls</option>
          <option value="recorded">Controls recorded for all causes</option>
        </select>
      </div>
      {loading ? (
        <div className="repo-empty" role="status">
          <CircularProgress size={22} /> Loading packages…
        </div>
      ) : !visible.length ? (
        <div className="repo-empty">
          {query || filter !== "all"
            ? "No packages match these filters."
            : "No packages in this collection."}
        </div>
      ) : (
        <div className="repo-library">
          <nav
            className="repo-navigator"
            aria-label="Select work-element package"
          >
            {visible.map((pkg) => {
              const model = normalizePackage(pkg.packageData, pkg.name);
              return (
                <button
                  key={pkg.id}
                  className="repo-package-button"
                  aria-current={selected?.id === pkg.id}
                  onClick={() => update("package", pkg.id)}
                >
                  <strong>{pkg.name}</strong>
                  <small>
                    {model.functions} functions · {model.causes} causes ·{" "}
                    {model.controls} controls
                  </small>
                  <small>
                    {pkg.status} · #{pkg.id.slice(-8)}
                    {model.missingControls
                      ? ` · ${model.missingControls} control gaps`
                      : ""}
                  </small>
                </button>
              );
            })}
          </nav>
          {selected && (
            <div className="repo-library-main">
              <PackagePreviewCard
                key={selected.id}
                packageData={selected.packageData}
                packageName={selected.name}
              />
              <div className="repo-package-actions">
                {canImport && selected.status === "approved" && (
                  <Button
                    variant="contained"
                    onClick={() => setImporting(true)}
                  >
                    Import into a process
                  </Button>
                )}
                {isAdmin && selected.contributorTenantId === user?.tenantId && (
                  <>
                    <Button onClick={() => setEditing(selected)}>
                      Edit package
                    </Button>
                    {selected.status === "pending" && (
                      <>
                        <Button
                          disabled={busy}
                          onClick={() => mutate("/approve")}
                        >
                          Approve
                        </Button>
                        <Button
                          disabled={busy}
                          onClick={() => setRejecting(true)}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    <Button
                      color="error"
                      disabled={busy}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Delete ${selected.name}? This cannot be undone.`,
                          )
                        )
                          void mutate("", "DELETE");
                      }}
                    >
                      Delete
                    </Button>
                  </>
                )}
              </div>
              <p className="repo-note">
                {selected.status} · Contributor:{" "}
                {selected.contributorName || "Not recorded"} ·{" "}
                {selected.reviewedAt
                  ? `Reviewed ${new Date(selected.reviewedAt).toLocaleDateString()}`
                  : `Updated ${new Date(selected.updatedAt).toLocaleDateString()}`}{" "}
                · #{selected.id.slice(-8)}
              </p>
              {selected.description && (
                <p className="repo-note">{selected.description}</p>
              )}
              {selected.rejectionReason && (
                <Alert severity="info">
                  Review feedback: {selected.rejectionReason}
                </Alert>
              )}
            </div>
          )}
        </div>
      )}
      {editing && (
        <EditPackageDialog
          open
          pkg={editing}
          onClose={() => setEditing(null)}
          onSuccess={load}
        />
      )}
      {selected && importing && (
        <ImportTargetDialog
          open
          packageId={selected.id}
          packageName={selected.name}
          onClose={() => setImporting(false)}
          onSuccess={() => setImporting(false)}
        />
      )}
      <Dialog
        open={rejecting}
        onClose={() => setRejecting(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Request package changes</DialogTitle>
        <DialogContent>
          <TextField
            label="Review feedback"
            fullWidth
            multiline
            minRows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejecting(false)}>Cancel</Button>
          <Button
            disabled={busy || !reason.trim()}
            onClick={() =>
              mutate("/reject", "POST", { rejectionReason: reason })
            }
          >
            Reject package
          </Button>
        </DialogActions>
      </Dialog>
    </main>
  );
}
export default RepositoryPage;
