import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, Typography, Box } from '@mui/material';

const severityCriteria: Record<number, string> = {
  10: 'Safety/regulatory — without warning',
  9: 'Safety/regulatory — with warning',
  8: 'Loss of primary function / major disruption',
  7: 'Reduced primary function / minor disruption',
  6: 'Loss of secondary function',
  5: 'Reduced secondary function',
  4: 'Minor defect noticed by user',
  3: 'Defect noticed by expert / inspector',
  2: 'Very minor defect noticed',
  1: 'No effect',
};

const occurrenceCriteria: Record<number, string> = {
  10: 'Extremely high — no controls',
  9: 'Very high — basic controls only',
  8: 'High — prevention control is low effectiveness',
  7: 'Moderately high — moderate effectiveness',
  6: 'Moderate — moderately effective control',
  5: 'Moderately low — effective control',
  4: 'Low — highly effective control',
  3: 'Very low — extremely effective control',
  2: 'Extremely low — outstanding control',
  1: 'Failure eliminated through design/process',
};

const detectionCriteria: Record<number, string> = {
  10: 'Cannot detect — no method available',
  9: 'Very low — purely visual inspection',
  8: 'Low — visual or double inspection',
  7: 'Moderately low — attribute gauge',
  6: 'Moderate — variable gauge or test',
  5: 'Moderately high — double variable inspection',
  4: 'High — automated attribute inspection',
  3: 'Very high — automated variable inspection',
  2: 'Extremely high — automated + prevention loop',
  1: 'Failure is prevented from occurrence',
};

interface RatingDropdownProps {
  ratingType: 'severity' | 'occurrence' | 'detection';
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  label?: string;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  required?: boolean;
  hideLabel?: boolean;
}

export const RatingDropdown: React.FC<RatingDropdownProps> = ({
  ratingType,
  value,
  onChange,
  label,
  size = 'small',
  fullWidth = true,
  required = false,
  hideLabel = false,
}) => {
  const criteriaMap = {
    severity: severityCriteria,
    occurrence: occurrenceCriteria,
    detection: detectionCriteria,
  };
  const criteria = criteriaMap[ratingType];
  const defaultLabel =
    ratingType.charAt(0).toUpperCase() + ratingType.slice(1) + ' Rating (1\u201310)';

  return (
    <FormControl size={size} fullWidth={fullWidth} required={required}>
      {!hideLabel && <InputLabel>{label || defaultLabel}</InputLabel>}
      <Select
        value={value ?? ''}
        label={hideLabel ? undefined : (label || defaultLabel)}
        onChange={(e) => {
          const val = e.target.value as any;
          onChange(val === '' ? null : Number(val));
        }}
        renderValue={(selected) => {
          const selVal = selected as any;
          if (selVal === '') return <em>—</em>;
          return (
            <Typography variant="body2" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
              {selected}
            </Typography>
          );
        }}
      >
        <MenuItem value="">
          <em>—</em>
        </MenuItem>
        {Array.from({ length: 10 }, (_, i) => 10 - i).map((rating) => (
          <MenuItem key={rating} value={rating}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                {rating}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                {criteria[rating]}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
