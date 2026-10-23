import {
  Alert,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  MenuItem,
  Paper,
  Stack,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  Typography,
} from "@mui/material";
import type { CpDocument, SyncPreview } from "./controlPlanDocument";
import { lineFields, getDocLines } from "./controlPlanDocument";
interface Props {
  preview: SyncPreview | null;
  document: CpDocument | null;
  decisions: Record<string, string>;
  reasons: Record<string, string>;
  resolutions: Record<string, Record<string, string>>;
  busy: boolean;
  onDecision: (key: string, action: string) => void;
  onReason: (key: string, value: string) => void;
  onResolution: (key: string, field: string, value: string) => void;
  onClose: () => void;
  onApply: () => void;
}
export function SourceChangeReview({
  preview,
  document,
  decisions,
  reasons,
  resolutions,
  busy,
  onDecision,
  onReason,
  onResolution,
  onClose,
  onApply,
}: Props) {
  const invalid = preview?.changes.some(
    (change) =>
      (decisions[change.key] === "exclude" && !reasons[change.key]?.trim()) ||
      (decisions[change.key] === "update" &&
        change.conflicts.some((field) => !resolutions[change.key]?.[field])),
  );
  return (
    <Dialog
      open={!!preview}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      aria-labelledby="source-change-title"
      slotProps={{ paper: { sx: { maxHeight: "92dvh" } } }}
    >
      <DialogTitle id="source-change-title">Review source changes</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Compare the saved plan with the selected source baseline. Deferred
          proposals stay available for later review. Exclusions require a
          reason.
        </Typography>
        {preview?.warnings.map((warning, index) => (
          <Alert key={index} severity="warning" sx={{ mb: 1 }}>
            {warning}
          </Alert>
        ))}
        {!preview?.changes.length && (
          <Typography>No pending changes for this source baseline.</Typography>
        )}
        {preview?.changes.map((change) => {
          const current = document
            ? getDocLines(document).find((line) => line.id === change.lineId)
            : undefined;
          const fields = Object.keys(
            change.candidate.source?.snapshot ?? {},
          ).filter(
            (field) => !["operationId", "characteristicId"].includes(field),
          );
          return (
            <Paper variant="outlined" key={change.key} sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {change.kind === "add"
                  ? "Proposed addition"
                  : change.kind === "remove"
                    ? "Source removed"
                    : "Source changed"}{" "}
                · {change.candidate.operationNumber}{" "}
                {change.candidate.operationName}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                {change.candidate.characteristicName ||
                  "Characteristic needs definition"}
              </Typography>
              {!!change.conflicts.length && (
                <Alert severity="warning" sx={{ mb: 1 }}>
                  Resolve each changed field that also contains a local
                  refinement before applying this proposal.
                </Alert>
              )}
              {change.kind !== "remove" && (
                <TableContainer sx={{ mb: 2 }}>
                  <Table size="small" aria-label="Source field comparison">
                    <TableHead>
                      <TableRow>
                        <TableCell>Field</TableCell>
                        <TableCell>Current plan</TableCell>
                        <TableCell>Selected source</TableCell>
                        <TableCell>Conflict decision</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {fields.map((field) => {
                        const key = field as keyof typeof change.candidate;
                        const conflict = change.conflicts.includes(field);
                        return (
                          <TableRow key={field}>
                            <TableCell>
                              {lineFields.find(([key]) => key === field)?.[1] ??
                                field}
                            </TableCell>
                            <TableCell
                              sx={{
                                whiteSpace: "pre-wrap",
                                overflowWrap: "anywhere",
                              }}
                            >
                              {String(current?.[key] ?? "—")}
                            </TableCell>
                            <TableCell
                              sx={{
                                whiteSpace: "pre-wrap",
                                overflowWrap: "anywhere",
                              }}
                            >
                              {String(change.candidate[key] ?? "—")}
                            </TableCell>
                            <TableCell>
                              {conflict ? (
                                <TextField
                                  select
                                  size="small"
                                  fullWidth
                                  label="Resolve field"
                                  value={resolutions[change.key]?.[field] ?? ""}
                                  disabled={decisions[change.key] !== "update"}
                                  onChange={(event) =>
                                    onResolution(
                                      change.key,
                                      field,
                                      event.target.value,
                                    )
                                  }
                                >
                                  <MenuItem value="current">
                                    Keep my value
                                  </MenuItem>
                                  <MenuItem value="source">
                                    Use source value
                                  </MenuItem>
                                </TextField>
                              ) : (
                                "No conflict"
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              <Stack spacing={2}>
                <TextField
                  size="small"
                  select
                  fullWidth
                  label="Proposal decision"
                  value={decisions[change.key] ?? "keep"}
                  onChange={(event) =>
                    onDecision(change.key, event.target.value)
                  }
                >
                  <MenuItem value="keep">
                    Defer — keep the current plan
                  </MenuItem>
                  <MenuItem
                    value={
                      change.kind === "add"
                        ? "add"
                        : change.kind === "change"
                          ? "update"
                          : "detach"
                    }
                  >
                    {change.kind === "add"
                      ? "Add proposed control line"
                      : change.kind === "change"
                        ? "Apply reviewed source changes"
                        : "Keep the line and detach removed source"}
                  </MenuItem>
                  {change.kind === "add" && (
                    <MenuItem value="exclude">
                      Exclude this source with justification
                    </MenuItem>
                  )}
                </TextField>
                {decisions[change.key] === "exclude" && (
                  <TextField
                    size="small"
                    required
                    multiline
                    label="Reason for exclusion"
                    value={reasons[change.key] ?? ""}
                    onChange={(event) =>
                      onReason(change.key, event.target.value)
                    }
                  />
                )}
              </Stack>
            </Paper>
          );
        })}
      </DialogContent>
      <DialogActions>
        <Box sx={{ flex: 1 }}>
          {invalid && (
            <Typography variant="caption" color="error">
              Resolve conflicts and required exclusion reasons.
            </Typography>
          )}
        </Box>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={busy || invalid}
          onClick={onApply}
        >
          Apply reviewed decisions
        </Button>
      </DialogActions>
    </Dialog>
  );
}
