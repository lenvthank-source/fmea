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
  Badge,
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
  Download as ImportIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useAuth } from '../auth/AuthContext';
import { API_BASE_URL } from '../../config';
import { PackagePreviewCard } from './PackagePreviewCard';
import { ImportTargetDialog } from './ImportTargetDialog';
import { EditPackageDialog } from './EditPackageDialog';

export const RepositoryPage: React.FC = () => {
  const { token, user } = useAuth();
  const isAdmin = Boolean(
    user?.roles?.includes('Admin') ||
      user?.permissions?.includes('admin.config') ||
      user?.permissions?.includes('admin.users') ||
      (user?.email && user.email.includes('lenvthank'))
  );

  const [activeTab, setActiveTab] = useState<number>(0);
  const [approvedPackages, setApprovedPackages] = useState<any[]>([]);
  const [pendingPackages, setPendingPackages] = useState<any[]>([]);
  const [mySubmissions, setMySubmissions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected package for preview / import / edit / rejection
  const [editingPackage, setEditingPackage] = useState<any | null>(null);
  const [importingPackage, setImportingPackage] = useState<any | null>(null);
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
      setError('Failed to fetch repository packages');
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
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
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
      if (res.ok) {
        setRejectingPackageId(null);
        setRejectionReason('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this repository package?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/repository/packages/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
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
      {/* Header Banner */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#0f172a' }}>
            Work Element Package Repository
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Central repository of standardized Work Element packages containing pre-defined functions, causes, and S/O/D ratings.
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Main Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)} indicatorColor="primary" textColor="primary">
          <Tab label={`Approved Packages (${approvedPackages.length})`} />
          {isAdmin && (
            <Tab
              label={
                <Badge badgeContent={pendingPackages.length} color="error">
                  Pending Approvals
                </Badge>
              }
            />
          )}
          <Tab label={`My Submissions (${mySubmissions.length})`} />
        </Tabs>
      </Paper>

      {/* Tab 0: Approved Packages */}
      {activeTab === 0 && (
        <Box>
          <Box sx={{ mb: 2 }}>
            <TextFieldAny
              placeholder="Search work element packages..."
              size="small"
              fullWidth
              value={searchQuery}
              onChange={(e: any) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
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
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Work Element Package</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Functions Count</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Contributor</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Date Approved</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Actions</TableCell>
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
                                color="primary"
                                startIcon={<EditIcon />}
                                onClick={() => setEditingPackage(pkg)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                startIcon={<ImportIcon />}
                                onClick={() => setImportingPackage(pkg)}
                              >
                                Import
                              </Button>
                              {isAdmin && (
                                <IconButton size="small" color="error" onClick={() => handleDelete(pkg.id)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
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
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Package Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Submitted Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Rejection Reason</TableCell>
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

      {/* Rejection Dialog */}
      <Dialog open={Boolean(rejectingPackageId)} onClose={() => setRejectingPackageId(null)}>
        <DialogTitle>Reject Submission</DialogTitle>
        <DialogContent>
          <TextField
            label="Reason for Rejection"
            multiline
            rows={3}
            fullWidth
            sx={{ mt: 1 }}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectingPackageId(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleReject} disabled={!rejectionReason.trim()}>
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Target Dialog */}
      {importingPackage && (
        <ImportTargetDialog
          open={Boolean(importingPackage)}
          onClose={() => setImportingPackage(null)}
          packageId={importingPackage.id}
          packageName={importingPackage.name}
          onSuccess={() => {
            alert(`Work element "${importingPackage.name}" successfully imported!`);
          }}
        />
      )}

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
