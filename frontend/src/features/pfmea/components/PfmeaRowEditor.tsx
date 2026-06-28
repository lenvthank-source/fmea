import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  Divider,
  Stack,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  AutoAwesome as AiIcon,
  Check as CheckIcon,
  Add as AddIcon,
} from '@mui/icons-material';

interface ProcessStep {
  id: string;
  stepNumber: string;
  name: string;
}

interface PfmeaRow {
  id: string;
  processStepId: string | null;
  workElementName: string | null;
  rowNumber: number;
  severity: number | null;
  occurrence: number | null;
  detection: number | null;
  ap: string | null;
  notes: string;
  filterCode?: string | null;
  status: string;
  accessLevel: string;
  functions: { name: string }[];
  requirements: { name: string }[];
  failureModes: { name: string }[];
  effects: { name: string }[];
  causes: { name: string }[];
  controls: { name: string; type: string; detectionMethod?: string }[];
  characteristics: { name: string; classification: string; unitOfMeasure?: string }[];
}

interface PfmeaRowEditorProps {
  open: boolean;
  onClose: () => void;
  row: PfmeaRow | null;
  steps: ProcessStep[];
  onSave: (updatedRowData: any) => Promise<void>;
  fmeaType?: 'PFMEA' | 'DFMEA';
}

export const PfmeaRowEditor: React.FC<PfmeaRowEditorProps> = ({
  open,
  onClose,
  row,
  steps,
  onSave,
  fmeaType = 'PFMEA',
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [notes, setNotes] = useState('');
  const [filterCode, setFilterCode] = useState('');
  const [accessLevel, setAccessLevel] = useState('public');
  const [status, setStatus] = useState('draft');

  // Many-to-many list states
  const [functions, setFunctions] = useState<string[]>([]);
  const [requirements, setRequirements] = useState<string[]>([]);
  const [failureModes, setFailureModes] = useState<string[]>([]);
  const [effects, setEffects] = useState<string[]>([]);
  const [causes, setCauses] = useState<string[]>([]);

  // Individual tag text inputs
  const [funcInput, setFuncInput] = useState('');
  const [reqInput, setReqInput] = useState('');
  const [fmInput, setFmInput] = useState('');
  const [effectInput, setEffectInput] = useState('');
  const [causeInput, setCauseInput] = useState('');

  // Complex lists
  const [controls, setControls] = useState<{ name: string; type: string; detectionMethod?: string }[]>([]);
  const [characteristics, setCharacteristics] = useState<
    { name: string; classification: string; unitOfMeasure?: string }[]
  >([]);

  // Control form states
  const [newControlName, setNewControlName] = useState('');
  const [newControlType, setNewControlType] = useState('prevention');
  const [newControlDetMethod, setNewControlDetMethod] = useState('');

  // Characteristic form states
  const [newCharName, setNewCharName] = useState('');
  const [newCharClass, setNewCharClass] = useState('standard');
  const [newCharUnit, setNewCharUnit] = useState('');

  // AI Copilot state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuccess, setAiSuccess] = useState(false);

  // Sync state with row prop
  useEffect(() => {
    if (row) {
      setNotes(row.notes || '');
      setFilterCode(row.filterCode || '');
      setAccessLevel(row.accessLevel || 'public');
      setStatus(row.status || 'draft');
      setFunctions(row.functions.map((f) => f.name));
      setRequirements(row.requirements.map((r) => r.name));
      setFailureModes(row.failureModes.map((fm) => fm.name));
      setEffects(row.effects.map((e) => e.name));
      setCauses(row.causes.map((c) => c.name));
      setControls(row.controls);
      setCharacteristics(row.characteristics);
      setFuncInput('');
      setReqInput('');
      setFmInput('');
      setEffectInput('');
      setCauseInput('');
      setError(null);
      setAiSuccess(false);
    }
  }, [row]);

  if (!row) return null;

  const currentStep = steps.find((s) => s.id === row.processStepId);

  const handleAddControl = () => {
    if (!newControlName.trim()) return;
    setControls([
      ...controls,
      { name: newControlName.trim(), type: newControlType, detectionMethod: newControlDetMethod.trim() || undefined },
    ]);
    setNewControlName('');
    setNewControlDetMethod('');
  };

  const handleRemoveControl = (index: number) => {
    setControls(controls.filter((_, i) => i !== index));
  };

  const handleAddChar = () => {
    if (!newCharName.trim()) return;
    setCharacteristics([
      ...characteristics,
      { name: newCharName.trim(), classification: newCharClass, unitOfMeasure: newCharUnit.trim() || undefined },
    ]);
    setNewCharName('');
    setNewCharUnit('');
  };

  const handleRemoveChar = (index: number) => {
    setCharacteristics(characteristics.filter((_, i) => i !== index));
  };

  const handleAddTag = (
    input: string,
    setInput: React.Dispatch<React.SetStateAction<string>>,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const trimmed = input.trim();
    if (trimmed && !list.includes(trimmed)) {
      setList([...list, trimmed]);
      setInput('');
    }
  };

  const handleRemoveTag = (index: number, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    setList(list.filter((_, i) => i !== index));
  };

  const handleTriggerAiCopilot = () => {
    setAiLoading(true);
    setAiSuccess(false);
    setError(null);

    // Simulate AI Copilot generation delay (RAG retrieval representation)
    setTimeout(() => {
      setAiLoading(false);
      setAiSuccess(true);

      const stepNameLower = currentStep?.name.toLowerCase() || '';

      if (stepNameLower.includes('drill') || stepNameLower.includes('hole')) {
        setFunctions(['Drill through hole to specs', 'Provide mating point for assembly']);
        setRequirements(['Hole diameter: 10.0mm +/- 0.1mm', 'Position tolerance within 0.05mm']);
        setFailureModes(['Hole diameter too large (oversize)', 'Hole location off-center']);
        setEffects(['Bolt cannot be secured, loose joint', 'Assembly interference in next station']);
        setCauses(['Drill bit wear/dulled tip', 'Spindle runout or loose fixture clamp']);
        setControls([
          { name: 'Drill bit lifetime cycle tracking counter', type: 'prevention' },
          { name: 'Automatic dial gauge caliper sample check', type: 'detection', detectionMethod: '100% laser scanner' },
        ]);
        setCharacteristics([
          { name: 'Hole diameter dimension', classification: 'special', unitOfMeasure: 'mm' },
        ]);
      } else if (stepNameLower.includes('weld') || stepNameLower.includes('join')) {
        setFunctions(['Join metal sheets structurally', 'Seal weld joint from moisture']);
        setRequirements(['Weld penetration depth >= 2.5mm', 'Zero visual pinholes or cracks']);
        setFailureModes(['Insufficient weld penetration depth', 'Surface weld porosities']);
        setEffects(['Underload fatigue failure of frame', 'Water ingress causing internal corrosion']);
        setCauses(['Fluctuating current setting', 'Inadequate shielding gas flow rate']);
        setControls([
          { name: 'Automated weld voltage log tracking', type: 'prevention' },
          { name: 'Ultrasonic weld integrity scan', type: 'detection', detectionMethod: 'ultrasonic' },
        ]);
        setCharacteristics([
          { name: 'Penetration depth', classification: 'critical', unitOfMeasure: 'mm' },
        ]);
      } else {
        // Fallback generic suggestion
        setFunctions([`Perform operation ${currentStep?.name || ''}`]);
        setRequirements(['Process parameter tolerances met']);
        setFailureModes(['Process parameter deviation']);
        setEffects(['Degradation of primary product function']);
        setCauses(['Operator error or machine tool misalignment']);
        setControls([
          { name: 'Standard operating procedure validation', type: 'prevention' },
          { name: 'End of line visual check', type: 'detection' },
        ]);
      }
    }, 1500);
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      await onSave({
        notes,
        filterCode,
        accessLevel,
        status,
        functions,
        requirements,
        failureModes,
        effects,
        causes,
        controls,
        characteristics,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save FMEA row modifications.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 550, p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Row Details — # {row.rowNumber}
          </Typography>
          <IconButton onClick={onClose} edge="end">
            <CloseIcon />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Step: <strong>{currentStep?.stepNumber} - {currentStep?.name}</strong>
        </Typography>

        <Divider sx={{ mb: 3 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* AI Copilot Section */}
        <Card sx={{ mb: 3, border: aiSuccess ? '1px solid #00e5ff' : '1px dashed #2e2e36', bgcolor: '#1a1d24' }}>
          <CardContent>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AiIcon sx={{ color: 'secondary.main' }} />
                  AI Copilot Suggestions
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Retrieved from standard templates and past approved FMEAs.
                </Typography>
              </Box>
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                startIcon={aiLoading ? <CircularProgress size={16} color="inherit" /> : <AiIcon />}
                onClick={handleTriggerAiCopilot}
                disabled={aiLoading}
              >
                {aiLoading ? 'Retreiving...' : 'Propose via AI'}
              </Button>
            </Stack>
            {aiSuccess && (
              <Alert severity="info" icon={<CheckIcon />} sx={{ mt: 2, py: 0 }}>
                AI recommendations successfully generated. Modify or save below.
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Form Controls */}
        <Stack spacing={3}>
          {/* Step 3: Functions */}
          <Stack spacing={1}>
            <TextField
              label="Functions"
              value={funcInput}
              onChange={(e) => setFuncInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag(funcInput, setFuncInput, functions, setFunctions);
                }
              }}
              placeholder="Type a function and press Enter"
              size="small"
              helperText="Define what the step should accomplish (Step 3)"
            />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {functions.map((f, i) => (
                <Chip key={i} label={f} size="small" color="primary" variant="outlined" onDelete={() => handleRemoveTag(i, functions, setFunctions)} />
              ))}
            </Box>
          </Stack>

          {/* Requirements */}
          <Stack spacing={1}>
            <TextField
              label="Requirements"
              value={reqInput}
              onChange={(e) => setReqInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag(reqInput, setReqInput, requirements, setRequirements);
                }
              }}
              placeholder="Type a requirement and press Enter"
              size="small"
              helperText="Measurable criteria or product specification"
            />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {requirements.map((r, i) => (
                <Chip key={i} label={r} size="small" color="primary" variant="outlined" onDelete={() => handleRemoveTag(i, requirements, setRequirements)} />
              ))}
            </Box>
          </Stack>

          {/* Step 4: Failure Modes */}
          <Stack spacing={1}>
            <TextField
              label="Failure Modes"
              value={fmInput}
              onChange={(e) => setFmInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag(fmInput, setFmInput, failureModes, setFailureModes);
                }
              }}
              placeholder="Type a failure mode and press Enter"
              size="small"
              helperText="How can the step fail (Step 4)"
            />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {failureModes.map((fm, i) => (
                <Chip key={i} label={fm} size="small" color="error" variant="outlined" onDelete={() => handleRemoveTag(i, failureModes, setFailureModes)} />
              ))}
            </Box>
          </Stack>

          {/* Effects */}
          <Stack spacing={1}>
            <TextField
              label="Effects of Failure"
              value={effectInput}
              onChange={(e) => setEffectInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag(effectInput, setEffectInput, effects, setEffects);
                }
              }}
              placeholder="Type an effect and press Enter"
              size="small"
              helperText="Consequences at customer or final assembly"
            />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {effects.map((e, i) => (
                <Chip key={i} label={e} size="small" color="error" onDelete={() => handleRemoveTag(i, effects, setEffects)} />
              ))}
            </Box>
          </Stack>

          {/* Causes */}
          <Stack spacing={1}>
            <TextField
              label="Causes of Failure"
              value={causeInput}
              onChange={(e) => setCauseInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag(causeInput, setCauseInput, causes, setCauses);
                }
              }}
              placeholder="Type a cause and press Enter"
              size="small"
              helperText="Root causes (e.g. tool wear, operator error)"
            />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {causes.map((c, i) => (
                <Chip key={i} label={c} size="small" color="warning" variant="outlined" onDelete={() => handleRemoveTag(i, causes, setCauses)} />
              ))}
            </Box>
          </Stack>

          <Divider />

          {/* Controls List */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Step 5: Current Controls ({controls.length})
            </Typography>
            <Stack direction="row" sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
              {controls.map((ctrl, i) => (
                <Tooltip title={`${ctrl.type} - ${ctrl.detectionMethod || 'No spec'}`} key={i}>
                  <Chip
                    label={`${ctrl.type === 'prevention' ? '🛡️' : '🔍'} ${ctrl.name}`}
                    size="small"
                    onDelete={() => handleRemoveControl(i)}
                    color={ctrl.type === 'prevention' ? 'primary' : 'success'}
                    variant="outlined"
                  />
                </Tooltip>
              ))}
            </Stack>

            <Stack direction="row" spacing={1}>
              <TextField
                label="Control Name"
                value={newControlName}
                onChange={(e) => setNewControlName(e.target.value)}
                size="small"
                fullWidth
              />
              <FormControl size="small" sx={{ width: 150 }}>
                <Select value={newControlType} onChange={(e) => setNewControlType(e.target.value)}>
                  <MenuItem value="prevention">Prevention</MenuItem>
                  <MenuItem value="detection">Detection</MenuItem>
                </Select>
              </FormControl>
              <IconButton color="primary" onClick={handleAddControl}>
                <AddIcon />
              </IconButton>
            </Stack>
          </Box>

          <Divider />

          {/* Characteristics List */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Special Characteristics ({characteristics.length})
            </Typography>
            <Stack direction="row" sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
              {characteristics.map((char, i) => (
                <Chip
                  key={i}
                  label={`${char.classification.toUpperCase()}: ${char.name}`}
                  size="small"
                  onDelete={() => handleRemoveChar(i)}
                  color={char.classification === 'standard' ? 'default' : 'secondary'}
                />
              ))}
            </Stack>

            <Stack direction="row" spacing={1}>
              <TextField
                label="Char Name"
                value={newCharName}
                onChange={(e) => setNewCharName(e.target.value)}
                size="small"
                fullWidth
              />
              <FormControl size="small" sx={{ width: 150 }}>
                <Select value={newCharClass} onChange={(e) => setNewCharClass(e.target.value)}>
                  <MenuItem value="standard">Standard</MenuItem>
                  <MenuItem value="special">Special</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                  <MenuItem value="safety">Safety</MenuItem>
                </Select>
              </FormControl>
              <IconButton color="primary" onClick={handleAddChar}>
                <AddIcon />
              </IconButton>
            </Stack>
          </Box>

          <Divider />

          {/* Metadata Section */}
          <Stack direction="row" spacing={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Access Level</InputLabel>
              <Select value={accessLevel} label="Access Level" onChange={(e) => setAccessLevel(e.target.value)}>
                <MenuItem value="public">Public</MenuItem>
                <MenuItem value="confidential">Confidential</MenuItem>
                <MenuItem value="restricted">Restricted</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value)}>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="reviewed">Reviewed</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {fmeaType === 'DFMEA' && (
            <TextField
              label="Filter Code"
              value={filterCode}
              onChange={(e) => setFilterCode(e.target.value)}
              placeholder="e.g. F01, FC-Critical"
              fullWidth
              size="small"
            />
          )}

          <TextField
            label="Engineering Notes"
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add comments, regulatory references, or calculations"
            fullWidth
            size="small"
          />

          {/* Save & Cancel */}
          <Stack direction="row" spacing={2} sx={{ mt: 3, pb: 4 }}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleSave}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
            >
              Save Changes
            </Button>
            <Button variant="outlined" color="inherit" fullWidth onClick={onClose} disabled={loading}>
              Cancel
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  );
};
