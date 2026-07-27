import React from 'react';
import { Box, Typography, Chip, Accordion, AccordionSummary, AccordionDetails, Stack } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface PackagePreviewCardProps {
  packageData: any; // { functions: [{ name, description, failures: [...] }] }
  packageName: string;
}

export const PackagePreviewCard: React.FC<PackagePreviewCardProps> = ({ packageData, packageName }) => {
  const functions = packageData?.functions || [];

  return (
    <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2, bgcolor: '#f8fafc' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#1e293b' }}>
        Package Structure Preview: {packageName}
      </Typography>

      {functions.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No functions found in this package.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {functions.map((fn: any, index: number) => (
            <Accordion key={index} defaultExpanded variant="outlined" sx={{ bgcolor: '#ffffff' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccountTreeIcon fontSize="small" color="primary" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {fn.name || `Function ${index + 1}`}
                  </Typography>
                  <Chip
                    label={`${(fn.failures || []).length} failures`}
                    size="small"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                {fn.description && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    {fn.description}
                  </Typography>
                )}
                {(!fn.failures || fn.failures.length === 0) ? (
                  <Typography variant="caption" color="text.secondary">
                    No failure causes defined.
                  </Typography>
                ) : (
                  <Stack spacing={0.5}>
                    {fn.failures.map((fail: any, fIdx: number) => (
                      <Box
                        key={fIdx}
                        sx={{
                          p: 1,
                          bgcolor: '#f1f5f9',
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 1,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <WarningAmberIcon fontSize="small" sx={{ color: '#d97706' }} />
                          <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                            {fail.name}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {fail.severity !== undefined && fail.severity !== null && (
                            <Chip label={`S: ${fail.severity}`} size="small" color="error" sx={{ height: 18, fontSize: '0.65rem' }} />
                          )}
                          {fail.occurrence !== undefined && fail.occurrence !== null && (
                            <Chip label={`O: ${fail.occurrence}`} size="small" color="warning" sx={{ height: 18, fontSize: '0.65rem' }} />
                          )}
                          {fail.detection !== undefined && fail.detection !== null && (
                            <Chip label={`D: ${fail.detection}`} size="small" color="info" sx={{ height: 18, fontSize: '0.65rem' }} />
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      )}
    </Box>
  );
};
