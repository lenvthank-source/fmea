import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Alert,
  CircularProgress,
  Typography,
} from "@mui/material";
import { PackagePreviewCard } from "./PackagePreviewCard";
import { useAuth } from "../auth/AuthContext";
import { API_BASE_URL } from "../../config";
import { dialogSelectProps } from "../../theme/muiSelectConfig";
import {
  useToast,
  getToastSeverity,
} from "../../components/Toast/ToastProvider";
import { parseApiError } from "../../lib/api";

interface ImportTargetDialogProps {
  open: boolean;
  onClose: () => void;
  packageId: string;
  packageName: string;
  onSuccess: () => void;
}

export const ImportTargetDialog: React.FC<ImportTargetDialogProps> = ({
  open,
  onClose,
  packageId,
  packageName,
  onSuccess,
}) => {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [previewData, setPreviewData] = useState<unknown>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedRevisionId, setSelectedRevisionId] = useState<string>("");
  const [processSteps, setProcessSteps] = useState<any[]>([]);
  const [selectedProcessStepId, setSelectedProcessStepId] =
    useState<string>("");

  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingSteps, setLoadingSteps] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !token) return;
    let current = true;
    setSelectedProjectId("");
    setSelectedRevisionId("");
    setSelectedProcessStepId("");
    setProcessSteps([]);
    setPreviewData(null);
    fetch(`${API_BASE_URL}/repository/packages/${packageId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok)
          throw new Error(
            await parseApiError(res, "Unable to preview package"),
          );
        return res.json();
      })
      .then((pkg) => {
        if (current) setPreviewData(pkg.packageData);
      })
      .catch((err) => {
        if (current) setError(err.message);
      });
    return () => {
      current = false;
    };
  }, [open, token, packageId]);

  // Fetch projects on mount
  useEffect(() => {
    if (open && token) {
      setLoadingProjects(true);
      setError(null);
      fetch(`${API_BASE_URL}/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(async (res) => {
          if (!res.ok)
            throw new Error(
              await parseApiError(res, "Unable to load import destinations"),
            );
          return res.json();
        })
        .then((data) => {
          setProjects(
            (Array.isArray(data) ? data : data.data || []).filter(
              (project: any) =>
                project.status === "active" &&
                !project.uiSettings?.isDemo &&
                project.id !== "c439cfbe-548a-4e25-a37c-0194652b8526",
            ),
          );
          setLoadingProjects(false);
        })
        .catch((err: any) => {
          console.error(err);
          const msg = err.message || "Failed to load projects";
          setError(msg);
          showToast(msg, getToastSeverity(msg));
          setLoadingProjects(false);
        });
    }
  }, [open, token, showToast]);

  // When project changes, fetch its active revision and process steps
  useEffect(() => {
    setSelectedRevisionId("");
    setSelectedProcessStepId("");
    setProcessSteps([]);
    if (selectedProjectId && token) {
      setLoadingSteps(true);
      fetch(`${API_BASE_URL}/projects/${selectedProjectId}/revisions`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(async (res) => {
          if (!res.ok)
            throw new Error(
              await parseApiError(res, "Unable to load import destinations"),
            );
          return res.json();
        })
        .then((revs) => {
          const revList = Array.isArray(revs) ? revs : [];
          const activeRev = revList.find(
            (r: any) =>
              r.status === "draft" && !r.lockedAt && r.document?.type === "PFD",
          );
          if (activeRev) {
            setSelectedRevisionId(activeRev.id);
            // Fetch process steps for active revision
            fetch(`${API_BASE_URL}/revisions/${activeRev.id}/pfd-steps`, {
              headers: { Authorization: `Bearer ${token}` },
            })
              .then(async (res) => {
                if (!res.ok)
                  throw new Error(
                    await parseApiError(
                      res,
                      "Unable to load import destinations",
                    ),
                  );
                return res.json();
              })
              .then((steps) => {
                setProcessSteps(Array.isArray(steps) ? steps : []);
                setLoadingSteps(false);
              })
              .catch((err) => {
                console.error(err);
                setLoadingSteps(false);
              });
          } else {
            setError("This project has no writable draft revision.");
            setLoadingSteps(false);
          }
        })
        .catch((err) => {
          console.error(err);
          setLoadingSteps(false);
        });
    }
  }, [selectedProjectId, token]);

  const handleImport = async () => {
    if (!selectedRevisionId || !selectedProcessStepId) {
      setError("Please select a target project and process step.");
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE_URL}/repository/packages/${packageId}/import`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            revisionId: selectedRevisionId,
            processStepId: selectedProcessStepId,
          }),
        },
      );

      if (!res.ok) {
        const msg = await parseApiError(res, "Failed to import package");
        throw new Error(msg);
      }

      setImporting(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.message || "Failed to import package";
      setError(msg);
      showToast(msg, getToastSeverity(msg));
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ fontWeight: "bold" }}>
        Import Work Element: {packageName}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {previewData !== null && (
            <PackagePreviewCard
              packageData={previewData}
              packageName={packageName}
            />
          )}
          {error && <Alert severity="error">{error}</Alert>}

          <Typography variant="body2" color="text.secondary">
            Select the destination project and process step to import this work
            element package into.
          </Typography>

          <FormControl fullWidth size="small">
            <InputLabel>Target Project</InputLabel>
            <Select
              {...dialogSelectProps}
              value={selectedProjectId}
              label="Target Project"
              onChange={(e) => setSelectedProjectId(e.target.value)}
              disabled={loadingProjects}
            >
              {projects.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name} {p.orgPartNumber ? `(${p.orgPartNumber})` : ""}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedProjectId && (
            <FormControl fullWidth size="small">
              <InputLabel>Target Process Step</InputLabel>
              <Select
                {...dialogSelectProps}
                value={selectedProcessStepId}
                label="Target Process Step"
                onChange={(e) => setSelectedProcessStepId(e.target.value)}
                disabled={loadingSteps}
              >
                {processSteps.map((step) => (
                  <MenuItem key={step.id} value={step.id}>
                    Step {step.stepNumber}: {step.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={importing}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleImport}
          disabled={
            importing ||
            loadingSteps ||
            !selectedRevisionId ||
            !selectedProcessStepId ||
            previewData === null
          }
          startIcon={
            importing ? <CircularProgress size={18} color="inherit" /> : null
          }
        >
          {importing ? "Importing..." : "Confirm Import"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
