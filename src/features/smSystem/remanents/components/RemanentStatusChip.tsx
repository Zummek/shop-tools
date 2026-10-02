import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import {
  Chip,
  ChipProps,
  CircularProgress,
  Menu,
  MenuItem,
  Stack,
} from '@mui/material';
import { MouseEvent, useState } from 'react';

import { RemanentStatus } from '../types';

const statusConfig: Record<
  RemanentStatus,
  { label: string; color: ChipProps['color'] }
> = {
  OPEN: { label: 'Otwarty', color: 'warning' },
  CLOSED: { label: 'Zamknięty', color: 'success' },
};

const selectableStatuses = (status?: RemanentStatus): RemanentStatus[] =>
  status === 'OPEN' ? ['CLOSED'] : [];

interface Props {
  status?: string | null;
  size?: 'small' | 'medium';
  onStatusChange?: (status: RemanentStatus) => void;
  isUpdating?: boolean;
}

export const RemanentStatusChip = ({
  status,
  size = 'small',
  onStatusChange,
  isUpdating = false,
}: Props) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const knownStatus =
    status === 'OPEN' || status === 'CLOSED' ? status : undefined;
  const config = knownStatus
    ? statusConfig[knownStatus]
    : { label: status || '—', color: 'default' as const };
  const options = selectableStatuses(knownStatus);
  const isInteractive = Boolean(onStatusChange) && options.length > 0;

  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    if (!isInteractive || isUpdating) return;
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleSelect = (nextStatus: RemanentStatus) => {
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
        {options.map((nextStatus) => {
          const nextConfig = statusConfig[nextStatus];
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
