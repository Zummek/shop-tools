import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  Box,
  Paper,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { ReactNode } from 'react';

import { formatPrice } from '../../products/utils';
import {
  EcommerceOrdersStatsByChannel,
  EcommerceOrdersStatsPeriod,
  useGetEcommerceOrdersStats,
} from '../api';
import { ORDER_CHANNELS, orderChannelLabel } from '../utils';

const formatDeltaPercent = (
  current: number,
  previous: number,
): string | null => {
  if (previous === 0) return null;
  const delta = ((current - previous) / previous) * 100;
  const rounded = Math.round(delta * 10) / 10;
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded.toString().replace('.', ',')}%`;
};

const DeltaIndicator = ({
  current,
  previous,
}: {
  current: number;
  previous: number;
}) => {
  const theme = useTheme();
  const label = formatDeltaPercent(current, previous);

  if (label === null) {
    return (
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <TrendingFlatIcon fontSize="small" color="disabled" />
        <Typography variant="body2" color="text.secondary">
          {'—'}
        </Typography>
      </Stack>
    );
  }

  const isUp = current > previous;
  const isDown = current < previous;
  const color = isUp
    ? theme.palette.success.main
    : isDown
      ? theme.palette.error.main
      : theme.palette.text.secondary;

  return (
    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color }}>
      {isUp ? (
        <TrendingUpIcon fontSize="small" />
      ) : isDown ? (
        <TrendingDownIcon fontSize="small" />
      ) : (
        <TrendingFlatIcon fontSize="small" />
      )}
      <Typography variant="body2" fontWeight={600}>
        {label}
      </Typography>
    </Stack>
  );
};

const ChannelOrdersBreakdown = ({
  byChannel,
}: {
  byChannel: EcommerceOrdersStatsByChannel[];
}) => {
  const counts = Object.fromEntries(
    byChannel.map((row) => [row.source, row.ordersCount]),
  );

  return (
    <Stack
      direction="row"
      flexWrap="wrap"
      useFlexGap
      spacing={1}
      sx={{ mt: 1 }}
    >
      {ORDER_CHANNELS.map(({ source, color }) => (
        <Stack key={source} direction="row" alignItems="center" spacing={0.5}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: color,
              flexShrink: 0,
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {`${orderChannelLabel(source)} ${counts[source] ?? 0}`}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
};

interface StatCardProps {
  label: string;
  value: string;
  current: number;
  previous: number;
  footer?: ReactNode;
}

const StatCard = ({
  label,
  value,
  current,
  previous,
  footer,
}: StatCardProps) => (
  <Paper variant="outlined" sx={{ p: 2, flex: 1, minWidth: 180 }}>
    <Typography variant="body2" color="text.secondary" gutterBottom>
      {label}
    </Typography>
    <Typography variant="h5" fontWeight={600} gutterBottom>
      {value}
    </Typography>
    <DeltaIndicator current={current} previous={previous} />
    {footer}
  </Paper>
);

const periodValue = (
  period: EcommerceOrdersStatsPeriod | undefined,
  key: keyof EcommerceOrdersStatsPeriod,
): number => {
  const value = period?.[key];
  return typeof value === 'number' ? value : 0;
};

export const OrdersStatsCards = () => {
  const { stats, isLoading, isError } = useGetEcommerceOrdersStats();

  if (isError) return null;

  if (isLoading || !stats) {
    return (
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        {[0, 1, 2].map((key) => (
          <Paper
            key={key}
            variant="outlined"
            sx={{ p: 2, flex: 1, minWidth: 180 }}
          >
            <Skeleton width="50%" />
            <Skeleton width="70%" height={36} />
            <Skeleton width="30%" />
          </Paper>
        ))}
      </Stack>
    );
  }

  const { current, previous, currency, periodDays, byChannel } = stats;
  const periodLabel = `(${periodDays} dni)`;

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <StatCard
          label={`Przychód ${periodLabel}`}
          value={formatPrice(current.revenue, currency)}
          current={current.revenue}
          previous={previous.revenue}
        />
        <StatCard
          label={`Zamówienia ${periodLabel}`}
          value={String(current.ordersCount)}
          current={current.ordersCount}
          previous={previous.ordersCount}
          footer={<ChannelOrdersBreakdown byChannel={byChannel} />}
        />
        <StatCard
          label={`Śr. wartość zamówienia ${periodLabel}`}
          value={
            current.avgOrderValue == null
              ? '—'
              : formatPrice(current.avgOrderValue, currency)
          }
          current={periodValue(current, 'avgOrderValue')}
          previous={periodValue(previous, 'avgOrderValue')}
        />
      </Stack>
    </Box>
  );
};
