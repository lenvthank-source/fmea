import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  Search as SearchIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useAuth } from '../auth/AuthContext';
import { API_BASE_URL } from '../../config';
import { PackagePreviewCard } from './PackagePreviewCard';
import { EditPackageDialog } from './EditPackageDialog';
import { useToast, getToastSeverity } from '../../components/Toast/ToastProvider';
import { parseApiError } from '../../lib/api';

export const RepositoryPage: React.FC = () => {
  const { token, user } = useAuth();
  const { showToast } = useToast();
  const isGuest = Boolean(
    user?.isGuest ||
      user?.roles?.includes('Guest') ||
      (user?.email && user.email.toLowerCase().startsWith('guest'))
  );
  const isAdmin = Boolean(
    !isGuest &&
      (user?.roles?.includes('Admin') ||
        user?.permissions?.includes('admin.config') ||
        user?.permissions?.includes('admin.users') ||
        (user?.email && user.email.includes('lenvthank')))
  );

  const [activeTab, setActiveTab] = useState<number>(0);
  const [approvedPackages, setApprovedPackages] = useState<any[]>([]);
  const [pendingPackages, setPendingPackages] = useState<any[]>([]);
  const [mySubmissions, setMySubmissions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected package for preview / edit / rejection
  const [previewPackage, setPreviewPackage] = useState<any | null>(null);
  const [editingPackage, setEditingPackage] = useState<any | null>(null);
  const [rejectingPackageId, setRejectingPackageId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      // Approved packages
      const appRes = await fetch(`${API_BASE_URL}/repository/packages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (appRes.ok) {
        const appData = await appRes.json();
        setApprovedPackages(Array.isArray(appData) ? appData : []);
      }

      // Pending packages (Admin only)
      if (isAdmin) {
        const pendRes = await fetch(`${API_BASE_URL}/repository/packages/pending`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (pendRes.ok) {
          const pendData = await pendRes.json();
          setPendingPackages(Array.isArray(pendData) ? pendData : []);
        }
      }

      // My submissions
      const myRes = await fetch(`${API_BASE_URL}/repository/packages/my-submissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (myRes.ok) {
        const myData = await myRes.json();
        setMySubmissions(Array.isArray(myData) ? myData : []);
      }
    } catch (err: any) {
      console.error(err);
      const msg = (err as any)?.message || 'Failed to fetch repository packages';
      setError(msg);
      showToast(msg, getToastSeverity(msg));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, isAdmin]);

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/repository/packages/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const msg = await parseApiError(res, 'Failed to approve package');
        throw new Error(msg);
      }
      if (res.ok) {
        fetchData();
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.message || 'Failed to approve package';
      setError(msg);
      showToast(msg, getToastSeverity(msg));
    }
  };

  const handleReject = async () => {
    if (!rejectingPackageId || !rejectionReason.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/repository/packages/${rejectingPackageId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rejectionReason }),
      });
      if (!res.ok) {
        const msg = await parseApiError(res, 'Failed to reject package');
        throw new Error(msg);
      }
      if (res.ok) {
        setRejectingPackageId(null);
        setRejectionReason('');
        fetchData();
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.message || 'Failed to reject package';
      setError(msg);
      showToast(msg, getToastSeverity(msg));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this repository package?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/repository/packages/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const msg = await parseApiError(res, 'Failed to delete repository package');
        throw new Error(msg);
      }
      if (res.ok) {
        fetchData();
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.message || 'Failed to delete repository package';
      setError(msg);
      showToast(msg, getToastSeverity(msg));
    }
  };

  const filteredApproved = approvedPackages.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const TextFieldAny = TextField as any;

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header Banner — Shadcn Admin Layout */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 800, letterSpacing: '-0.03em', color: '#09090b', fontSize: { xs: '1.5rem', sm: '1.875rem' } }}>
          Standard Packages Repository
        </Typography>
        <Typography variant="body2" sx={{ color: '#71717a', fontWeight: 500, mt: 0.5 }}>
          Central library of standardized Work Element packages containing pre-defined functions, causes, and S/O/D ratings.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: '10px', border: '1px solid #fecaca', bgcolor: '#fef2f2', fontSize: '0.825rem' }}>
          {error}
        </Alert>
      )}

      {/* Main Segmented Pill Tabs */}
      <Box sx={{ mb: 3 }}>
        <Paper
          sx={{
            display: 'inline-flex',
            p: 0.5,
            borderRadius: '8px',
            bgcolor: '#f4f4f5',
            border: '1px solid #e4e4e7',
            boxShadow: 'none',
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            sx={{
              minHeight: 34,
              '& .MuiTabs-indicator': { display: 'none' },
              '& .MuiTab-root': {
                minHeight: 32,
                px: 2,
                py: 0.5,
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                textTransform: 'none',
                color: '#71717a',
                transition: 'all 0.15s',
                '&.Mui-selected': {
                  bgcolor: '#ffffff',
                  color: '#09090b',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                },
              },
            }}
          >
            <Tab label={`Approved Packages (${approvedPackages.length})`} />
            {isAdmin && (
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>Pending Approvals</span>
                    {pendingPackages.length > 0 && (
                      <Chip
                        label={pendingPackages.length}
                        size="small"
                        sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#ef4444', color: '#ffffff' }}
                      />
                    )}
                  </Box>
                }
              />
            )}
            <Tab label={`My Submissions (${mySubmissions.length})`} />
          </Tabs>
        </Paper>
      </Box>

      {/* Tab 0: Approved Packages */}
      {activeTab === 0 && (
        <Box>
          <Box sx={{ mb: 2.5 }}>
            <TextFieldAny
              placeholder="Search work element packages... (⌘K)"
              size="small"
              fullWidth
              value={searchQuery}
              onChange={(e: any) => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#a1a1aa', fontSize: '1.1rem' }} />
                    </InputAdornment>
                  ),
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  bgcolor: '#ffffff',
                  '& fieldset': { borderColor: '#e4e4e7' },
                  '&:hover fieldset': { borderColor: '#d4d4d8' },
                  '&.Mui-focused fieldset': { borderColor: '#09090b' },
                }
              }}
            />
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredApproved.length === 0 ? (
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">No approved work element packages found.</Typography>
              </CardContent>
            </Card>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: '10px', border: '1px solid #e4e4e7', boxShadow: 'none', overflow: 'hidden' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#fafafa' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#71717a', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', py: 1.5 }}>Work Element Package</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#71717a', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#71717a', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Functions</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#71717a', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Contributor</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#71717a', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Date Approved</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#71717a', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredApproved.map((pkg) => {
                    const fnCount = (pkg.packageData?.functions || []).length;
                    return (
                      <React.Fragment key={pkg.id}>
                        <TableRow hover>
                          <TableCell sx={{ fontWeight: 600, color: '#0f172a' }}>{pkg.name}</TableCell>
                          <TableCell>{pkg.description || '—'}</TableCell>
                          <TableCell>
                            <Chip label={`${fnCount} functions`} size="small" color="primary" variant="outlined" />
                          </TableCell>
                          <TableCell>{pkg.contributorName}</TableCell>
                          <TableCell>{new Date(pkg.updatedAt).toLocaleDateString()}</TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => setPreviewPackage(previewPackage?.id === pkg.id ? null : pkg)}
                              >
                                {previewPackage?.id === pkg.id ? 'Hide Structure' : 'View Structure'}
                              </Button>
                              {!isGuest && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                  startIcon={<EditIcon />}
                                  onClick={() => setEditingPackage(pkg)}
                                >
                                  Edit
                                </Button>
                              )}
                              {!isGuest && isAdmin && (
                                <IconButton size="small" color="error" onClick={() => handleDelete(pkg.id)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                        {previewPackage?.id === pkg.id && (
                          <TableRow>
                            <TableCell colSpan={6} sx={{ bgcolor: '#fafafa', p: 2 }}>
                              <PackagePreviewCard packageData={pkg.packageData} packageName={pkg.name} />
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* Tab 1: Pending Approvals (Admin) */}
      {isAdmin && activeTab === 1 && (
        <Box>
          {pendingPackages.length === 0 ? (
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">No pending package submissions to review.</Typography>
              </CardContent>
            </Card>
          ) : (
            <Stack spacing={2}>
              {pendingPackages.map((pkg) => (
                <Card key={pkg.id} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {pkg.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Submitted by {pkg.contributorName} on {new Date(pkg.createdAt).toLocaleDateString()}
                        </Typography>
                        {pkg.description && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {pkg.description}
                          </Typography>
                        )}
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<CheckIcon />}
                          onClick={() => handleApprove(pkg.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<CancelIcon />}
                          onClick={() => setRejectingPackageId(pkg.id)}
                        >
                          Reject
                        </Button>
                      </Stack>
                    </Box>
                    <PackagePreviewCard packageData={pkg.packageData} packageName={pkg.name} />
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Box>
      )}

      {/* Tab 2: My Submissions */}
      {(activeTab === 2 || (!isAdmin && activeTab === 1)) && (
        <Box>
          {mySubmissions.length === 0 ? (
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">You have not submitted any work element packages yet.</Typography>
              </CardContent>
            </Card>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: '10px', border: '1px solid #e4e4e7', boxShadow: 'none', overflow: 'hidden' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#fafafa' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#71717a', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', py: 1.5 }}>Package Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#71717a', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#71717a', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Submitted Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#71717a', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Rejection Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mySubmissions.map((pkg) => (
                    <TableRow key={pkg.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{pkg.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={pkg.status.toUpperCase()}
                          size="small"
                          color={
                            pkg.status === 'approved'
                              ? 'success'
                              : pkg.status === 'pending'
                              ? 'warning'
                              : 'error'
                          }
                        />
                      </TableCell>
                      <TableCell>{new Date(pkg.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{pkg.rejectionReason || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* Rejection Dialog — Modernized */}
      <Dialog 
        open={Boolean(rejectingPackageId)} 
        onClose={() => setRejectingPackageId(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: '14px',
              border: '1px solid #e4e4e7',
              boxShadow: '0 20px 50px -10px rgba(0,0,0,0.15)',
              p: 1
            }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#09090b', fontSize: '1.05rem', pt: 2, px: 2.5 }}>
          Reject Submission
        </DialogTitle>
        <DialogContent sx={{ px: 2.5, py: 1 }}>
          <Typography sx={{ color: '#71717a', fontSize: '0.825rem', mb: 1.5 }}>
            Provide feedback explaining why this package does not meet standardization criteria:
          </Typography>
          <TextField
            size="small"
            label="Reason for Rejection *"
            multiline
            rows={3}
            fullWidth
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                '& fieldset': { borderColor: '#e4e4e7' }
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2, pt: 1, gap: 1 }}>
          <Button 
            onClick={() => setRejectingPackageId(null)}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, color: '#71717a', border: '1px solid #e4e4e7' }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleReject} 
            disabled={!rejectionReason.trim()}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, bgcolor: '#ef4444', color: '#ffffff', boxShadow: 'none' }}
          >
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>



      {/* Edit Package Dialog */}
      {editingPackage && (
        <EditPackageDialog
          open={Boolean(editingPackage)}
          onClose={() => setEditingPackage(null)}
          pkg={editingPackage}
          onSuccess={() => {
            fetchData();
          }}
        />
      )}
    </Box>
  );
};

export default RepositoryPage;