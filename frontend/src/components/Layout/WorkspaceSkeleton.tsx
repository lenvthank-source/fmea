import React from 'react';
import { Box, Grid, Skeleton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

export const WorkspaceSkeleton: React.FC = () => {
  return (
    <Box sx={{ width: '100%', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header / Breadcrumb & Action bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ width: '50%' }}>
          <Skeleton variant="text" height={32} width="40%" sx={{ borderRadius: 1 }} />
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" width={100} height={24} sx={{ borderRadius: 1 }} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Skeleton variant="rectangular" width={110} height={36} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rectangular" width={90} height={36} sx={{ borderRadius: 2 }} />
        </Box>
      </Box>

      {/* Main Workspace split panel */}
      <Grid container spacing={3} sx={{ flexGrow: 1, minHeight: 0 }}>
        {/* Left Side Navigation Tree Skeleton */}
        <Grid size={{ xs: 12, md: 3 }} sx={{ height: '100%', display: 'flex' }}>
          <Paper
            sx={{
              p: 2.5,
              width: '100%',
              height: '100%',
              border: '1px solid rgba(40, 37, 29, 0.08)',
              borderRadius: 3,
              boxShadow: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Skeleton variant="text" height={24} width="80%" sx={{ mb: 1 }} />
            {[1, 2, 3].map((node) => (
              <Box key={node} sx={{ pl: (node - 1) * 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Skeleton variant="circular" width={12} height={12} />
                  <Skeleton variant="text" height={20} width={`${90 - node * 10}%`} />
                </Box>
                {node < 3 && (
                  <Box sx={{ pl: 2.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Skeleton variant="text" height={16} width="70%" />
                    <Skeleton variant="text" height={16} width="60%" />
                  </Box>
                )}
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* Right Side Main Sheet Grid Skeleton */}
        <Grid size={{ xs: 12, md: 9 }} sx={{ height: '100%', display: 'flex' }}>
          <TableContainer
            component={Paper}
            sx={{
              width: '100%',
              height: '100%',
              border: '1px solid rgba(40, 37, 29, 0.08)',
              borderRadius: 3,
              boxShadow: 'none',
            }}
          >
            <Table stickyHeader>
              <TableHead sx={{ '& th': { bgcolor: 'rgba(40, 37, 29, 0.02)' } }}>
                <TableRow>
                  <TableCell sx={{ width: 60 }}><Skeleton variant="rectangular" height={20} /></TableCell>
                  <TableCell><Skeleton variant="rectangular" height={20} /></TableCell>
                  <TableCell><Skeleton variant="rectangular" height={20} /></TableCell>
                  <TableCell sx={{ width: 80 }}><Skeleton variant="rectangular" height={20} /></TableCell>
                  <TableCell sx={{ width: 80 }}><Skeleton variant="rectangular" height={20} /></TableCell>
                  <TableCell sx={{ width: 80 }}><Skeleton variant="rectangular" height={20} /></TableCell>
                  <TableCell sx={{ width: 90 }}><Skeleton variant="rectangular" height={20} /></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[1, 2, 3, 4, 5, 6].map((row) => (
                  <TableRow key={row}>
                    <TableCell><Skeleton height={20} /></TableCell>
                    <TableCell><Skeleton height={20} width="85%" /></TableCell>
                    <TableCell><Skeleton height={20} width="95%" /></TableCell>
                    <TableCell><Skeleton height={20} /></TableCell>
                    <TableCell><Skeleton height={20} /></TableCell>
                    <TableCell><Skeleton height={20} /></TableCell>
                    <TableCell><Skeleton height={24} sx={{ borderRadius: 1 }} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
};
