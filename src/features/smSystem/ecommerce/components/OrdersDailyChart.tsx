import {
  Box,
  Paper,
  Skeleton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import dayjs from 'dayjs';
import { useMemo, useState, type MouseEvent } from 'react';

import { formatPrice } from '../../products/utils';
import { useGetEcommerceOrdersStats } from '../api';
import { ORDER_CHANNELS } from '../utils';

type ChartMetric = 'revenue' | 'orders';

type ChannelSource = (typeof ORDER_CHANNELS)[number]['source'];

const CHART_METRIC_STORAGE_KEY = 'ecommerceOrdersDailyChartMetric';

const readStoredMetric = (): ChartMetric => {
  try {
    const stored = localStorage.getItem(CHART_METRIC_STORAGE_KEY);
    if (stored === 'revenue' || stored === 'orders') return stored;
  } catch {
    // ignore storage access errors
  }
  return 'revenue';
};

const emptyChannelSeries = (length: number) =>
  Object.fromEntries(
    ORDER_CHANNELS.map(({ source }) => [source, Array(length).fill(0)]),
  ) as Record<ChannelSource, number[]>;

export const OrdersDailyChart = () => {
  const { stats, isLoading, isError } = useGetEcommerceOrdersStats();
  const [metric, setMetric] = useState<ChartMetric>(readStoredMetric);

  const handleMetricChange = (
    _event: MouseEvent<HTMLElement>,
    value: ChartMetric | null,
  ) => {
    if (!value) return;
    setMetric(value);
    try {
      localStorage.setItem(CHART_METRIC_STORAGE_KEY, value);
    } catch {
      // ignore storage access errors
    }
  };

  const chartData = useMemo(() => {
    if (!stats) return null;

    const periodDays = stats.periodDays;
    const end = dayjs();
    const dates: string[] = [];
    for (let i = periodDays - 1; i >= 0; i -= 1)
      dates.push(end.subtract(i, 'day').format('YYYY-MM-DD'));

    const revenueBySource = emptyChannelSeries(dates.length);
    const ordersBySource = emptyChannelSeries(dates.length);

    for (const point of stats.daily) {
      const dayIndex = dates.indexOf(dayjs(point.date).format('YYYY-MM-DD'));
      if (dayIndex < 0) continue;
      if (!(point.source in revenueBySource)) continue;
      const source = point.source as ChannelSource;
      revenueBySource[source][dayIndex] += point.revenue;
      ordersBySource[source][dayIndex] += point.ordersCount;
    }

    const hasRevenue = stats.daily.some((point) => point.revenue > 0);
    const hasOrders = stats.daily.some((point) => point.ordersCount > 0);

    return {
      labels: dates.map((date) => dayjs(date).format('DD.MM')),
      revenueBySource,
      ordersBySource,
      hasRevenue,
      hasOrders,
      currency: stats.currency,
      periodDays: stats.periodDays,
    };
  }, [stats]);

  if (isError) return null;

  if (isLoading || !chartData) {
    return (
      <Paper variant="outlined" sx={{ p: 2, height: 300 }}>
        <Skeleton variant="text" width={220} />
        <Skeleton variant="rectangular" height={240} sx={{ mt: 1 }} />
      </Paper>
    );
  }

  const isRevenue = metric === 'revenue';
  const hasData = isRevenue ? chartData.hasRevenue : chartData.hasOrders;
  const seriesBySource = isRevenue
    ? chartData.revenueBySource
    : chartData.ordersBySource;
  const title = isRevenue
    ? `Przychód dzienny (${chartData.periodDays} dni)`
    : `Zamówienia dzienne (${chartData.periodDays} dni)`;
  const emptyMessage = isRevenue
    ? 'Brak danych o przychodzie w ostatnich 30 dniach'
    : 'Brak zamówień w ostatnich 30 dniach';

  const formatValue = (value: number | null) =>
    isRevenue
      ? formatPrice(value ?? 0, chartData.currency)
      : String(value ?? 0);

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={1}
        sx={{ mb: 1 }}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          {title}
        </Typography>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={metric}
          onChange={handleMetricChange}
        >
          <ToggleButton value="revenue">{'Przychód'}</ToggleButton>
          <ToggleButton value="orders">{'Zamówienia'}</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {!hasData ? (
        <Box
          sx={{
            height: 260,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {emptyMessage}
          </Typography>
        </Box>
      ) : (
        <BarChart
          height={260}
          borderRadius={4}
          xAxis={[
            {
              data: chartData.labels,
              scaleType: 'band',
              tickLabelStyle: { fontSize: 11 },
            },
          ]}
          yAxis={[
            {
              valueFormatter: formatValue,
              tickLabelStyle: { fontSize: 11 },
              tickMinStep: isRevenue ? undefined : 1,
            },
          ]}
          series={ORDER_CHANNELS.map(({ source, label, color }) => ({
            data: seriesBySource[source],
            label,
            stack: 'daily',
            color,
            valueFormatter: formatValue,
          }))}
          margin={{
            top: 10,
            right: 10,
            bottom: 30,
            left: isRevenue ? 80 : 40,
          }}
          slotProps={{
            legend: {
              direction: 'row',
              position: { vertical: 'top', horizontal: 'middle' },
              padding: 0,
            },
          }}
        />
      )}
    </Paper>
  );
};
