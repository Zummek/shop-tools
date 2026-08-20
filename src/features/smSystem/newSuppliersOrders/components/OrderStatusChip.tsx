import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Chip, CircularProgress, Menu, MenuItem, Stack } from '@mui/material';
import { MouseEvent, useState } from 'react';

import type { SupplierOrderStatus } from '../types';
import {
  getSelectableSupplierOrderStatuses,
  isSupplierOrderStatus,
  orderStatusConfig,
} from '../utils/orderStatusConfig';

interface Props {
  status?: string | null;
  size?: 'small' | 'medium';
  onStatusChange?: (status: SupplierOrderStatus) => void;
  isUpdating?: boolean;
}

export const OrderStatusChip = ({
  status,
  size = 'small',
  onStatusChange,
  isUpdating = false,
}: Props) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const knownStatus = isSupplierOrderStatus(status) ? status : undefined;
  const config = knownStatus
    ? orderStatusConfig[knownStatus]
    : { label: status || '—', color: 'default' as const };
  const selectableStatuses = getSelectableSupplierOrderStatuses(knownStatus);
  const isInteractive = Boolean(onStatusChange);

  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    if (!isInteractive || isUpdating) return;
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleSelect = (nextStatus: SupplierOrderStatus) => {
    handleClose();
    if (nextStatus !== status) onStatusChange?.(nextStatus);
  };

  return (
    <>
      <Chip
        label={config.label}
        color={config.color}
        size={size}
        icon={
          isInteractive ? (
            isUpdating ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              <EditOutlinedIcon fontSize="small" />
            )
          ) : undefined
        }
        onClick={isInteractive && !isUpdating ? handleOpen : undefined}
        sx={{
          width: 'fit-content',
          ...(isInteractive
            ? { cursor: isUpdating ? 'default' : 'pointer' }
            : {}),
        }}
      />
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        onClick={(event) => event.stopPropagation()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        {selectableStatuses.map((nextStatus) => {
          const nextConfig = orderStatusConfig[nextStatus];
          return (
            <MenuItem
              key={nextStatus}
              onClick={() => handleSelect(nextStatus)}
              dense
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  label={nextConfig.label}
                  color={nextConfig.color}
                  size="small"
                />
              </Stack>
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};
