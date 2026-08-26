import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Tabs,
  Tab,
  Box,
  Stack,
  IconButton,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Download as ImportIcon,
} from '@mui/icons-material';
import { useAuth } from '../../auth/AuthContext';
import { API_BASE_URL } from '../../../config';
import { dialogSelectProps } from '../../../theme/muiSelectConfig';
import { PackagePreviewCard } from '../../repository/PackagePreviewCard';
import { useToast, getToastSeverity } from '../../../components/Toast/ToastProvider';
import { parseApiError } from '../../../lib/api';

interface MultiAddWorkElementDialogProps {
  open: boolean;
  onClose: () => void;
  processStepId: string;
  revisionId?: string;
  onConfirmSingle: (name: string) => void;
  onConfirmMultiple: (names: string[]) => void;
  onImportSuccess: () => void;
}

export const MultiAddWorkElementDialog: React.FC<MultiAddWorkElementDialogProps> = ({
  open,
  onClose,
  processStepId,
  revisionId,
  onConfirmSingle,
  onConfirmMultiple,
  onImportSuccess,
}) => {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<number>(0); // 0: Single, 1: Multiple, 2: Import from Repo

  // Single mode state
  const [singleName, setSingleName] = useState('');

  // Multiple mode state
  const [multipleNames, setMultipleNames] = useState<string[]>(['', '']);

  // Repository import mode state
  const [approvedPackages, setApprovedPackages] = useState<any[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSingleName('');
      setMultipleNames(['', '']);
      setSelectedPackageId('');
      setError(null);
      setActiveTab(0);
    }
  }, [open]);

  // Fetch approved packages when switching to Import tab
  useEffect(() => {
    if (open && activeTab === 2 && token) {
      setLoadingPackages(true);
      fetch(`${API_BASE_URL}/repository/packages`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setApprovedPackages(Array.isArray(data) ? data : []);
          setLoadingPackages(false);
        })
        .catch((err: any) => {
          console.error(err);
          const msg = err.message || 'Failed to fetch repository packages';
          setError(msg);
          showToast(msg, getToastSeverity(msg));
          setLoadingPackages(false);
        });
    }
  }, [open, activeTab, token]);

  const handleAddRow = () => {
    setMultipleNames((prev) => [...prev, '']);
  };

  const handleRemoveRow = (index: number) => {
    if (multipleNames.length <= 1) return;
    setMultipleNames((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, val: string) => {
    setMultipleNames((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleSubmit = async () => {
    if (activeTab === 0) {
      if (!singleName.trim()) return;
      onConfirmSingle(singleName.trim());
      onClose();
    } else if (activeTab === 1) {
      const validNames = multipleNames.map((n) => n.trim()).filter((n) => n.length > 0);
      if (validNames.length === 0) return;
      onConfirmMultiple(validNames);
      onClose();
    } else if (activeTab === 2) {
      if (!selectedPackageId || !revisionId || !processStepId) {
        const msg = 'Please select a package to import.';
      setError(msg);
      showToast(msg, getToastSeverity(msg));
        return;
      }

      setImporting(true);
      setError(null);

      try {
        const res = await fetch(`${API_BASE_URL}/repository/packages/${selectedPackageId}/import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            revisionId,
            processStepId,
          }),
        });

        if (!res.ok) {
          const msg = await parseApiError(res, 'Failed to import package');
          throw new Error(msg);
        }

        setImporting(false);
        onImportSuccess();
        onClose();
      } catch (err: any) {
        const msg = err.message || 'Failed to import package';
        setError(msg);
        showToast(msg, getToastSeverity(msg));
        setImporting(false);
      }
    }
  };

  const selectedPkg = approvedPackages.find((p) => p.id === selectedPackageId);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold' }}>Add Work Element (4M)</DialogTitle>
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
            <Tab label="Single Work Element" />
            <Tab label="Multiple Work Elements" />
            <Tab label="Import from Repository" />
          </Tabs>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Tab 0: Single Mode */}
        {activeTab === 0 && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Work Element Name (e.g. CNC Machine, Operator)"
              fullWidth
              autoFocus
              value={singleName}
              onChange={(e) => setSingleName(e.target.value)}
            />
          </Stack>
        )}

        {/* Tab 1: Multiple Mode */}
        {activeTab === 1 && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Enter multiple work element names below. Each row will be added to this process step.
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#0f172a' }}>
                  <TableRow sx={{ bgcolor: '#0f172a' }}>
                    <TableCell sx={{ bgcolor: '#0f172a !important', color: '#ffffff !important', fontWeight: 'bold', fontSize: '0.75rem', letterSpacing: '0.04em', textTransform: 'uppercase', borderRight: '1px solid #334155' }}>
                      Work Element Name
                    </TableCell>
                    <TableCell sx={{ bgcolor: '#0f172a !important', color: '#ffffff !important', fontWeight: 'bold', fontSize: '0.75rem', letterSpacing: '0.04em', textTransform: 'uppercase', width: 60, textAlign: 'center' }}>
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {multipleNames.map((name, idx) => (
                    <TableRow key={idx} sx={{ bgcolor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <TableCell sx={{ p: 1, borderRight: '1px solid #e2e8f0' }}>
                        <TextField
                          value={name}
                          onChange={(e) => handleRowChange(idx, e.target.value)}
                          placeholder="e.g. CNC Machine, Operator..."
                          size="small"
                          fullWidth
                          variant="outlined"
                          sx={{ bgcolor: '#ffffff' }}
                        />
                      </TableCell>
                      <TableCell sx={{ p: 1, textAlign: 'center' }}>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleRemoveRow(idx)}
                          disabled={multipleNames.length <= 1}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={handleAddRow} sx={{ alignSelf: 'flex-start' }}>
              Add Row
            </Button>
          </Stack>
        )}

        {/* Tab 2: Import from Repository Mode */}
        {activeTab === 2 && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            {loadingPackages ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : approvedPackages.length === 0 ? (
              <Alert severity="info">No approved work element packages in the repository yet.</Alert>
            ) : (
              <>
                <FormControl fullWidth size="small">
                  <InputLabel>Select Work Element Package</InputLabel>
                  <Select
                    {...dialogSelectProps}
                    value={selectedPackageId}
                    label="Select Work Element Package"
                    onChange={(e) => setSelectedPackageId(e.target.value)}
                  >
                    {approvedPackages.map((pkg) => (
                      <MenuItem key={pkg.id} value={pkg.id}>
                        {pkg.name} — ({pkg.packageData?.functions?.length || 0} functions)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {selectedPkg && (
                  <PackagePreviewCard packageData={selectedPkg.packageData} packageName={selectedPkg.name} />
                )}
              </>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={importing}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={
            importing ||
            (activeTab === 0 && !singleName.trim()) ||
            (activeTab === 1 && multipleNames.every((n) => !n.trim())) ||
            (activeTab === 2 && !selectedPackageId)
          }
          startIcon={activeTab === 2 ? <ImportIcon /> : undefined}
        >
          {activeTab === 2 ? (importing ? 'Importing...' : 'Import Package') : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};