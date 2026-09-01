import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
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
  Close as CloseIcon,
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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: '12px',
            border: '1px solid #e4e4e7',
            boxShadow: '0 20px 40px -8px rgba(0,0,0,0.12)',
            p: 0,
            overflow: 'hidden'
          }
        }
      }}
    >
      <DialogTitle sx={{ px: 3, py: 2, borderBottom: '1px solid #f4f4f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#ffffff' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#09090b' }}>
              Add Work Element (4M)
            </Typography>
            <Box
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: '4px',
                fontSize: '0.675rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                bgcolor: '#eff6ff',
                color: '#2563eb'
              }}
            >
              4M / System
            </Box>
          </Box>
          <Typography sx={{ fontSize: '0.75rem', color: '#71717a', mt: 0.25 }}>
            Assign Man, Machine, Material, or Method resources to process step
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: '#71717a', '&:hover': { bgcolor: '#f4f4f5' } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ px: 3, py: 2.5, bgcolor: '#ffffff' }}>
        <Box sx={{ mb: 2.5, display: 'inline-flex', p: '3px', bgcolor: '#f4f4f5', borderRadius: '8px', border: '1px solid #e4e4e7', flexWrap: 'wrap' }}>
          {[
            { id: 0, label: 'Single Element' },
            { id: 1, label: 'Multiple (Batch)' },
            { id: 2, label: 'Repository Package' },
          ].map((t) => (
            <Box
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              sx={{
                px: 1.75,
                py: 0.65,
                borderRadius: '6px',
                cursor: 'pointer',
                bgcolor: activeTab === t.id ? '#ffffff' : 'transparent',
                color: activeTab === t.id ? '#09090b' : '#71717a',
                fontWeight: activeTab === t.id ? 700 : 500,
                fontSize: '0.8rem',
                boxShadow: activeTab === t.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              {t.label}
            </Box>
          ))}
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
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #f4f4f5', bgcolor: '#fafafa' }}>
        <Button
          onClick={onClose}
          disabled={importing}
          size="small"
          sx={{
            color: '#71717a',
            fontSize: '0.8125rem',
            fontWeight: 600,
            textTransform: 'none',
            borderRadius: '6px',
            border: '1px solid #e4e4e7',
            bgcolor: '#ffffff',
            px: 2,
            '&:hover': { bgcolor: '#f4f4f5', borderColor: '#d4d4d8' }
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={
            importing ||
            (activeTab === 0 && !singleName.trim()) ||
            (activeTab === 1 && multipleNames.every((n) => !n.trim())) ||
            (activeTab === 2 && !selectedPackageId)
          }
          size="small"
          variant="contained"
          sx={{
            bgcolor: '#09090b',
            color: '#ffffff',
            fontSize: '0.8125rem',
            fontWeight: 600,
            textTransform: 'none',
            borderRadius: '6px',
            px: 2.5,
            boxShadow: 'none',
            '&:hover': { bgcolor: '#27272a', boxShadow: 'none' }
          }}
          startIcon={activeTab === 2 ? <ImportIcon fontSize="small" /> : undefined}
        >
          {activeTab === 2 ? (importing ? 'Importing...' : 'Import Package') : 'Save Element'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};