import { Chip } from '@mui/material';

import type { AlertSeverity } from '../types';
import { alertSeverityConfig } from '../utils';

interface AlertSeverityChipProps {
  severity: AlertSeverity;
  size?: 'small' | 'medium';
}

export const AlertSeverityChip = ({
  severity,
  size = 'small',
}: AlertSeverityChipProps) => {
  const config = alertSeverityConfig[severity];
  return (
    <Chip
      label={config.label}
      color={config.color}
      size={size}
      sx={{ width: 'fit-content' }}
    />
  );
};
