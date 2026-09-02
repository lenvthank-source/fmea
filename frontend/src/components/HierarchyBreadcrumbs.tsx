import React from 'react';
import { Box, Typography, Chip, Tooltip } from '@mui/material';
import {
  ChevronRight as ChevronRightIcon,
  AccountTree as AccountTreeIcon,
  FolderSpecial as ProjectIcon,
  FormatListNumbered as StepIcon,
  BuildCircle as ElementIcon,
  Functions as FunctionIcon,
  ReportProblem as FailureIcon,
} from '@mui/icons-material';

export interface BreadcrumbItem {
  level: 'Project' | 'Step' | '4M Element' | 'Function' | 'Failure' | string;
  name: string;
}

interface HierarchyBreadcrumbsProps {
  items?: BreadcrumbItem[];
}

const LEVEL_CONFIG: Record<string, { bg: string; color: string; border: string; icon: React.ReactElement }> = {
  Project: {
    bg: '#eff6ff',
    color: '#1e40af',
    border: '#bfdbfe',
    icon: <ProjectIcon sx={{ fontSize: '0.8rem' }} />,
  },
  Step: {
    bg: '#fef3c7',
    color: '#92400e',
    border: '#fde68a',
    icon: <StepIcon sx={{ fontSize: '0.8rem' }} />,
  },
  '4M Element': {
    bg: '#f3e8ff',
    color: '#6b21a8',
    border: '#e9d5ff',
    icon: <ElementIcon sx={{ fontSize: '0.8rem' }} />,
  },
  Function: {
    bg: '#ecfdf5',
    color: '#065f46',
    border: '#a7f3d0',
    icon: <FunctionIcon sx={{ fontSize: '0.8rem' }} />,
  },
  Failure: {
    bg: '#fee2e2',
    color: '#991b1b',
    border: '#fecaca',
    icon: <FailureIcon sx={{ fontSize: '0.8rem' }} />,
  },
};

export const HierarchyBreadcrumbs: React.FC<HierarchyBreadcrumbsProps> = ({ items }) => {
  if (!items || items.length === 0) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 0.65,
        px: 1.5,
        py: 0.85,
        bgcolor: '#f8fafc',
        border: '1px solid #e4e4e7',
        borderRadius: '8px',
        mb: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 0.5 }}>
        <AccountTreeIcon sx={{ fontSize: '0.875rem', color: '#71717a' }} />
        <Typography
          sx={{
            fontSize: '0.675rem',
            fontWeight: 700,
            color: '#71717a',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap',
          }}
        >
          Hierarchy:
        </Typography>
      </Box>

      {items.map((item, idx) => {
        const config = LEVEL_CONFIG[item.level] || {
          bg: '#f4f4f5',
          color: '#27272a',
          border: '#e4e4e7',
          icon: <AccountTreeIcon sx={{ fontSize: '0.8rem' }} />,
        };

        return (
          <React.Fragment key={idx}>
            {idx > 0 && (
              <ChevronRightIcon sx={{ fontSize: '0.8rem', color: '#a1a1aa' }} />
            )}
            <Tooltip title={`${item.level}: ${item.name}`} arrow placement="top">
              <Chip
                size="small"
                icon={config.icon}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography
                      component="span"
                      sx={{
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        opacity: 0.75,
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                      }}
                    >
                      {item.level}:
                    </Typography>
                    <Typography
                      component="span"
                      sx={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        maxWidth: { xs: 120, sm: 200, md: 280 },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.name}
                    </Typography>
                  </Box>
                }
                sx={{
                  height: 24,
                  bgcolor: config.bg,
                  color: config.color,
                  border: `1px solid ${config.border}`,
                  fontWeight: 600,
                  '& .MuiChip-icon': {
                    color: config.color,
                    ml: 0.5,
                  },
                  '& .MuiChip-label': {
                    px: 0.75,
                  },
                }}
              />
            </Tooltip>
          </React.Fragment>
        );
      })}
    </Box>
  );
};
