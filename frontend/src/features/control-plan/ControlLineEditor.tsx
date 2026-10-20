import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { editorSections, lineFields } from "./controlPlanDocument";
import type { CpLine } from "./controlPlanDocument";

interface Props {
  line: CpLine | null;
  editable: boolean;
  existing: boolean;
  operations: { id: string; stepNumber: string; name: string }[];
  sourceRevisionLabel: string;
  onChange: (line: CpLine) => void;
  onClose: () => void;
  onKeep: () => void;
  onRemove: () => void;
}
export function ControlLineEditor({
  line,
  editable,
  existing,
  operations,
  sourceRevisionLabel,
  onChange,
  onClose,
  onKeep,
  onRemove,
}: Props) {
  return (
    <Dialog
      open={!!line}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      aria-labelledby="control-line-title"
      slotProps={{ paper: { sx: { maxHeight: "92dvh", borderRadius: 2 } } }}
    >
      <DialogTitle id="control-line-title">
        {editable ? "Control line" : "Control line details"}
      </DialogTitle>
      <DialogContent dividers>
        {line && (
          <Stack spacing={3}>
            {editorSections.map((section, index) => (
              <Box
                component="section"
                key={section.title}
                aria-label={section.title}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {section.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {section.description}
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 2.5,
                  }}
                >
                  {index === 0 && (
                    <TextField
                      select
                      size="small"
                      disabled={!editable}
                      label="Manufacturing operation"
                      value={line.operationId}
                      onChange={(event) => {
                        const operation = operations.find(
                          (value) => value.id === event.target.value,
                        );
                        onChange({
                          ...line,
                          operationId: event.target.value,
                          ...(operation
                            ? {
                                operationNumber: operation.stepNumber,
                                operationName: operation.name,
                              }
                            : {}),
                        });
                      }}
                    >
                      <MenuItem value="">Unlinked draft operation</MenuItem>
                      {line.operationId &&
                        !operations.some(
                          (operation) => operation.id === line.operationId,
                        ) && (
                          <MenuItem value={line.operationId}>
                            {line.operationNumber} {line.operationName} (source
                            baseline)
                          </MenuItem>
                        )}
                      {operations.map((operation) => (
                        <MenuItem key={operation.id} value={operation.id}>
                          {operation.stepNumber} · {operation.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                  {section.fields.map((key) => {
                    const label = lineFields.find(
                      ([field]) => field === key,
                    )![1];
                    const options =
                      key === "characteristicKind"
                        ? ["unspecified", "product", "process"]
                        : key === "controlType"
                          ? ["unspecified", "prevention", "detection"]
                          : null;
                    return (
                      <TextField
                        key={key}
                        size="small"
                        fullWidth
                        disabled={!editable}
                        label={label}
                        value={line[key]}
                        select={!!options}
                        multiline={!options}
                        minRows={1}
                        onChange={(event) =>
                          onChange({ ...line, [key]: event.target.value })
                        }
                      >
                        {options?.map((value) => (
                          <MenuItem key={value} value={value}>
                            {value}
                          </MenuItem>
                        ))}
                      </TextField>
                    );
                  })}
                </Box>
              </Box>
            ))}
            {line.source && (
              <Box component="section">
                <Typography variant="subtitle2">
                  Reviewed source provenance
                </Typography>
                <Typography variant="body2">
                  {sourceRevisionLabel} ·{" "}
                  {line.source.pfmeaRowId
                    ? "PFMEA-linked control"
                    : "PFD-linked operation"}
                </Typography>
                <Typography variant="caption">
                  Review state: {line.sourceState ?? "current"}. Review source
                  changes from the workspace to resolve changes explicitly.
                </Typography>
              </Box>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ flexWrap: "wrap", gap: 1 }}>
        {editable && existing && (
          <Button color="error" onClick={onRemove}>
            Remove line
          </Button>
        )}
        <Button onClick={onClose}>Close</Button>
        {editable && (
          <Button variant="contained" onClick={onKeep}>
            Keep draft changes
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
