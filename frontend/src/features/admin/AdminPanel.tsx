import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Button, Alert, CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Stack,
  Tabs, Tab, Badge, IconButton, Tooltip
} from '@mui/material';
import {
  Delete as DeleteIcon, Edit as EditIcon, CheckCircle as ResolveIcon,
  MarkEmailRead as MarkReadIcon
} from '@mui/icons-material';
import { useAuth } from '../auth/AuthContext';
import { API_BASE_URL } from '../../config';

// ── Interfaces ──────────────────────────────────────────────

interface UserItem {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
  isGuest?: boolean;
  guestExpiresAt?: string | null;
  userRoles: Array<{
    role: {
      name: string;
    };
  }>;
}

interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  company: string;
  type: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

interface FeedbackItem {
  id: string;
  userId: string | null;
  userEmail: string | null;
  isGuest: boolean;
  type: string;
  message: string;
  pageUrl: string;
  createdAt: string;
  status: string; // 'open' | 'resolved'
}

const FEEDBACK_EMOJI: Record<string, string> = {
  bug: '🐛',
  suggestion: '💡',
  frustration: '😤',
  praise: '🎉',
};

// ── Tab Panel Helper ────────────────────────────────────────

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <Box role="tabpanel" hidden={value !== index} sx={{ pt: 3 }}>
    {value === index && children}
  </Box>
);

// ── Main Component ──────────────────────────────────────────

export const AdminPanel: React.FC = () => {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  // Users state
  const [users, setUsers] = useState<UserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

  // Edit User Dialog States
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  // Contact Inquiries state
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(true);

  // Feedback state
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(true);

  // ── Fetch Functions ───────────────────────────────────────

  const fetchUsers = async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to load users list');
      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      setUsersError(err.message || 'An error occurred');
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchInquiries = async () => {
    setInquiriesLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/contact-inquiries`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setInquiries(data);
      }
    } catch (err) {
      console.error('Failed to load contact inquiries:', err);
    } finally {
      setInquiriesLoading(false);
    }
  };

  const fetchFeedback = async () => {
    setFeedbackLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/feedback`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setFeedback(data);
      }
    } catch (err) {
      console.error('Failed to load feedback:', err);
    } finally {
      setFeedbackLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers();
      fetchInquiries();
      fetchFeedback();
    }
  }, [token]);

  // ── User Actions ──────────────────────────────────────────

  const handleOpenEdit = (userItem: UserItem) => {
    setEditingUser(userItem);
    setEditRole(userItem.userRoles[0]?.role?.name || 'Viewer');
    setEditPassword('');
    setEditDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    setSaveLoading(true);
    try {
      const payload: any = { roleName: editRole };
      if (editPassword.trim()) {
        payload.password = editPassword;
      }
      const response = await fetch(`${API_BASE_URL}/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to update user');
      }
      setEditDialogOpen(false);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Could not update user');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteUser = async (targetUserId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
      return;
    }
    setDeleteLoadingId(targetUserId);
    try {
      const res = await fetch(`${API_BASE_URL}/users/${targetUserId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }
      setUsers((prev) => prev.filter((u) => u.id !== targetUserId));
    } catch (err: any) {
      alert(err.message || 'Could not delete user');
    } finally {
      setDeleteLoadingId(null);
    }
  };

  // ── Inquiry Actions ───────────────────────────────────────

  const handleMarkRead = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/contact-inquiries/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setInquiries((prev) =>
          prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
        );
      }
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  // ── Feedback Actions ──────────────────────────────────────

  const handleResolveFeedback = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/feedback/${id}/resolve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setFeedback((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: 'resolved' } : item))
        );
      }
    } catch (err) {
      console.error('Failed to resolve feedback:', err);
    }
  };

  // ── Badge Counts ──────────────────────────────────────────

  const unreadInquiries = inquiries.filter((i) => !i.isRead).length;
  const openFeedback = feedback.filter((f) => f.status === 'open').length;

  // ── Auth Guard ────────────────────────────────────────────

  if (!user?.roles.includes('Admin')) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Access Denied. Only administrators are allowed to access this panel.
        </Alert>
      </Box>
    );
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <Box sx={{ width: '100%', maxWidth: '1440px', mx: 'auto', p: 1 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
          Administration Control Panel
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage system users, view contact inquiries, and review user feedback.
        </Typography>
      </Box>

      <Tabs
        value={activeTab}
        onChange={(_, val) => setActiveTab(val)}
        sx={{
          borderBottom: '1px solid rgba(40, 37, 29, 0.08)',
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.9rem' },
        }}
      >
        <Tab label="Users" />
        <Tab
          label={
            <Badge badgeContent={unreadInquiries} color="error" max={99}>
              <span style={{ paddingRight: unreadInquiries > 0 ? 8 : 0 }}>Contact Inquiries</span>
            </Badge>
          }
        />
        <Tab
          label={
            <Badge badgeContent={openFeedback} color="warning" max={99}>
              <span style={{ paddingRight: openFeedback > 0 ? 8 : 0 }}>User Feedback</span>
            </Badge>
          }
        />
      </Tabs>

      {/* ── Tab 0: Users ────────────────────────────────────── */}
      <TabPanel value={activeTab} index={0}>
        <Alert severity="info" sx={{ mb: 3, borderRadius: 3 }}>
          💡 <strong>Archival Rule:</strong> Users who are inactive (no login) for more than 15 days are automatically flagged as <strong>Inactive (Archived)</strong>. Only system administrators can permanently delete these archived accounts.
        </Alert>

        {usersError && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {usersError}
          </Alert>
        )}

        {usersLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
            <CircularProgress />
          </Box>
        ) : users.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', border: '1px solid rgba(40, 37, 29, 0.08)', borderRadius: 3 }}>
            <Typography color="text.secondary">No users found in this workspace.</Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} sx={{ border: '1px solid rgba(40, 37, 29, 0.08)', borderRadius: 3, boxShadow: 'none' }}>
            <Table>
              <TableHead sx={{ bgcolor: 'rgba(40, 37, 29, 0.02)' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Last Login</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Created At</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, width: 140 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((item) => {
                  const userRoleName = item.userRoles[0]?.role?.name || 'Viewer';
                  const isItemAdmin = userRoleName === 'Admin';
                  const isSelf = item.id === user.id;

                  return (
                    <TableRow key={item.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {item.name} {isSelf && '(You)'}
                        {item.isGuest && (
                          <Chip
                            label="Guest"
                            size="small"
                            sx={{ ml: 1, bgcolor: '#f59e0b', color: 'white', fontWeight: 600, fontSize: '0.65rem', height: 20 }}
                          />
                        )}
                      </TableCell>
                      <TableCell>{item.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={userRoleName}
                          size="small"
                          color={isItemAdmin ? 'primary' : 'default'}
                          variant={isItemAdmin ? 'filled' : 'outlined'}
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        {item.status === 'archived' ? (
                          <Chip label="Inactive (Archived)" size="small" color="warning" sx={{ fontWeight: 600 }} />
                        ) : (
                          <Chip label="Active" size="small" color="success" sx={{ fontWeight: 600 }} />
                        )}
                      </TableCell>
                      <TableCell>
                        {item.lastLoginAt ? new Date(item.lastLoginAt).toLocaleString() : 'Never logged in'}
                        {item.isGuest && item.guestExpiresAt && (
                          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                            Expires: {new Date(item.guestExpiresAt).toLocaleDateString()}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                          {!isSelf && (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<EditIcon />}
                              onClick={() => handleOpenEdit(item)}
                              sx={{ borderRadius: 2, height: 30, textTransform: 'none', fontWeight: 600 }}
                            >
                              Edit
                            </Button>
                          )}
                          {item.status === 'archived' && !isSelf && !isItemAdmin && (
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              startIcon={<DeleteIcon />}
                              disabled={deleteLoadingId === item.id}
                              onClick={() => handleDeleteUser(item.id)}
                              sx={{ borderRadius: 2, height: 30, textTransform: 'none', fontWeight: 600 }}
                            >
                              {deleteLoadingId === item.id ? 'Deleting...' : 'Delete'}
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      {/* ── Tab 1: Contact Inquiries ────────────────────────── */}
      <TabPanel value={activeTab} index={1}>
        {inquiriesLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
            <CircularProgress />
          </Box>
        ) : inquiries.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', border: '1px solid rgba(40, 37, 29, 0.08)', borderRadius: 3 }}>
            <Typography color="text.secondary">No contact inquiries yet.</Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} sx={{ border: '1px solid rgba(40, 37, 29, 0.08)', borderRadius: 3, boxShadow: 'none' }}>
            <Table>
              <TableHead sx={{ bgcolor: 'rgba(40, 37, 29, 0.02)' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Company</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Message</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inquiries.map((item) => (
                  <TableRow key={item.id} hover sx={{ bgcolor: !item.isRead ? 'rgba(13, 148, 136, 0.03)' : 'inherit' }}>
                    <TableCell sx={{ fontWeight: !item.isRead ? 600 : 400 }}>{item.name}</TableCell>
                    <TableCell>{item.email}</TableCell>
                    <TableCell>{item.company || '—'}</TableCell>
                    <TableCell>
                      <Chip label={item.type} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                    </TableCell>
                    <TableCell>
                      <Tooltip title={item.message} placement="top-start">
                        <span>{item.message.length > 50 ? item.message.substring(0, 50) + '…' : item.message}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.isRead ? 'Read' : 'Unread'}
                        size="small"
                        color={item.isRead ? 'default' : 'info'}
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {!item.isRead && (
                        <Tooltip title="Mark as Read">
                          <IconButton size="small" onClick={() => handleMarkRead(item.id)} color="primary">
                            <MarkReadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      {/* ── Tab 2: User Feedback ────────────────────────────── */}
      <TabPanel value={activeTab} index={2}>
        {feedbackLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
            <CircularProgress />
          </Box>
        ) : feedback.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', border: '1px solid rgba(40, 37, 29, 0.08)', borderRadius: 3 }}>
            <Typography color="text.secondary">No feedback submitted yet.</Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} sx={{ border: '1px solid rgba(40, 37, 29, 0.08)', borderRadius: 3, boxShadow: 'none' }}>
            <Table>
              <TableHead sx={{ bgcolor: 'rgba(40, 37, 29, 0.02)' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Page URL</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Message</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {feedback.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      {item.userEmail || 'Anonymous'}
                      {item.isGuest && (
                        <Chip label="Guest" size="small" sx={{ ml: 1, bgcolor: '#f59e0b', color: 'white', fontWeight: 600, fontSize: '0.6rem', height: 18 }} />
                      )}
                    </TableCell>
                    <TableCell>
                      {FEEDBACK_EMOJI[item.type] || '📝'} {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    </TableCell>
                    <TableCell>
                      <Tooltip title={item.pageUrl} placement="top-start">
                        <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.pageUrl.length > 40 ? '…' + item.pageUrl.slice(-40) : item.pageUrl}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={item.message} placement="top-start">
                        <span>{item.message.length > 50 ? item.message.substring(0, 50) + '…' : item.message}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.status === 'resolved' ? 'Resolved' : 'Open'}
                        size="small"
                        color={item.status === 'resolved' ? 'success' : 'warning'}
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {item.status !== 'resolved' && (
                        <Tooltip title="Mark as Resolved">
                          <IconButton size="small" onClick={() => handleResolveFeedback(item.id)} color="success">
                            <ResolveIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      {/* ── Edit User Dialog ────────────────────────────────── */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Edit User Properties</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {editingUser && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{editingUser.name}</Typography>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Email</Typography>
                <Typography variant="body2">{editingUser.email}</Typography>
              </Box>
            )}

            <FormControl fullWidth size="small">
              <InputLabel>User Role</InputLabel>
              <Select
                value={editRole}
                label="User Role"
                onChange={(e) => setEditRole(e.target.value)}
              >
                <MenuItem value="Admin">Admin</MenuItem>
                <MenuItem value="Design Engineer">Design Engineer</MenuItem>
                <MenuItem value="Process Engineer">Process Engineer</MenuItem>
                <MenuItem value="Quality Engineer">Quality Engineer</MenuItem>
                <MenuItem value="Production Engineer">Production Engineer</MenuItem>
                <MenuItem value="Maintenance">Maintenance</MenuItem>
                <MenuItem value="Program Management">Program Management</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Reset Password (Optional)"
              type="password"
              placeholder="Leave blank to keep current password"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              fullWidth
              size="small"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setEditDialogOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveUser}
            variant="contained"
            disabled={saveLoading}
            sx={{ textTransform: 'none', fontWeight: 600, minWidth: 100 }}
          >
            {saveLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
