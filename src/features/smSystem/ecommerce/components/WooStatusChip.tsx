import SyncProblemOutlinedIcon from '@mui/icons-material/SyncProblemOutlined';
import { Chip, Tooltip } from '@mui/material';

import type { OrderStatus } from '../types';
import { isWooStatusInSync, SM_TO_WOO_STATUS, wooStatusLabel } from '../utils';

interface WooStatusChipProps {
  status: OrderStatus;
  externalStatus: string | null | undefined;
}

export const WooStatusChip = ({
  status,
  externalStatus,
}: WooStatusChipProps) => {
  if (isWooStatusInSync(status, externalStatus)) {
    return (
      <Chip
        label={wooStatusLabel(externalStatus)}
        variant="outlined"
        size="small"
        sx={{ width: 'fit-content' }}
      />
    );
  }

  const expected = wooStatusLabel(SM_TO_WOO_STATUS[status]);
  return (
    <Tooltip
      title={`Status WooCommerce różni się od oczekiwanego dla statusu SM („${expected}”).`}
    >
      <Chip
        icon={<SyncProblemOutlinedIcon />}
        label={wooStatusLabel(externalStatus)}
        color="warning"
        size="small"
        sx={{ width: 'fit-content' }}
      />
    </Tooltip>
  );
};
