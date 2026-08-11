import { Chip } from '@mui/material';

import type { AlertStatus } from '../types';
import { alertStatusConfig } from '../utils';

interface AlertStatusChipProps {
  status: AlertStatus;
  size?: 'small' | 'medium';
}

export const AlertStatusChip = ({
  status,
  size = 'small',
}: AlertStatusChipProps) => {
  const config = alertStatusConfig[status];
  return (
    <Chip
      label={config.label}
      color={config.color}
      size={size}
      sx={{ width: 'fit-content' }}
    />
  );
};
