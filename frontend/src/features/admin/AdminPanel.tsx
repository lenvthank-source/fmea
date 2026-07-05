import React, { useEffect, useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Button, Alert, CircularProgress } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { useAuth } from '../auth/AuthContext';
import { API_BASE_URL } from '../../config';

interface UserItem {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
  userRoles: Array<{
    role: {
      name: string;
    };
  }>;
}

export const AdminPanel: React.FC = () => {
  const { token, user } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to load users list');
      }
      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token]);

  const handleDeleteUser = async (targetUserId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this user? This action cannot be undone.")) {
      return;
    }
    setDeleteLoadingId(targetUserId);
    try {
      const res = await fetch(`${API_BASE_URL}/users/${targetUserId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
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

  if (!user?.roles.includes('Admin')) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Access Denied. Only administrators are allowed to access this panel.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '1440px', mx: 'auto', p: 1 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
          Administration Control Panel
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage system users, view inactive accounts, and perform system operations.
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 4, borderRadius: 3 }}>
        💡 <strong>Archival Rule:</strong> Users who are inactive (no login) for more than 15 days are automatically flagged as <strong>Inactive (Archived)</strong>. Only system administrators can permanently delete these archived accounts.
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
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
                    <TableCell sx={{ fontWeight: 600 }}>{item.name} {isSelf && "(You)"}</TableCell>
                    <TableCell>{item.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={userRoleName} 
                        size="small" 
                        color={isItemAdmin ? "primary" : "default"}
                        variant={isItemAdmin ? "filled" : "outlined"}
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
                    </TableCell>
                    <TableCell>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="center">
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
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};
