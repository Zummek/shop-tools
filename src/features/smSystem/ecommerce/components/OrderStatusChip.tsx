import { Chip } from '@mui/material';

import type { OrderStatus } from '../types';
import { orderStatusConfig } from '../utils';

interface OrderStatusChipProps {
  status: OrderStatus;
  size?: 'small' | 'medium';
}

export const OrderStatusChip = ({
  status,
  size = 'small',
}: OrderStatusChipProps) => {
  const config = orderStatusConfig[status];
  return (
    <Chip
      label={config.label}
      color={config.color}
      size={size}
      sx={{ width: 'fit-content' }}
    />
  );
};
