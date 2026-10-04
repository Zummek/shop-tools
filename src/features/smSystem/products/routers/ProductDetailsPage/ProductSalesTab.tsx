import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useMemo, useState, type MouseEvent } from 'react';

import { useGetProductChannelLinks } from '../../../ecommerce/api';
import { ChannelProductLink } from '../../../ecommerce/types/channelLinks';
import {
  isEndedChannelOffer,
  ORDER_CHANNELS,
  orderChannelLabel,
} from '../../../ecommerce/utils';
import { useGetProductChannelSales } from '../../api';
import {
  ProductChannelSales,
  ProductChannelSalesChannel,
  ProductSalesChannel,
} from '../../types';
import { formatPrice } from '../../utils';

const MAX_PERIOD_DAYS = 93;

type Preset = 7 | 30 | 90;
type ChartMetric = 'units' | 'revenue';
type ChannelFocus = 'all' | ProductSalesChannel;
type ChannelListing = 'active' | 'ended' | 'none';

const listingForChannel = (
  links: ChannelProductLink[],
  channel: string,
): ChannelListing => {
  const onChannel = links.filter((link) => link.channel === channel);
  if (onChannel.length === 0) return 'none';
  if (onChannel.some((link) => !isEndedChannelOffer(link))) return 'active';
  return 'ended';
};

const warsawToday = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Warsaw',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

const addIsoDays = (iso: string, days: number) => {
  const [year, month, day] = iso.split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  utc.setUTCDate(utc.getUTCDate() + days);
  return utc.toISOString().slice(0, 10);
};

const inclusiveDays = (start: string, end: string) => {
  const [startYear, startMonth, startDay] = start.split('-').map(Number);
  const [endYear, endMonth, endDay] = end.split('-').map(Number);
  const startUtc = Date.UTC(startYear, startMonth - 1, startDay);
  const endUtc = Date.UTC(endYear, endMonth - 1, endDay);
  return Math.round((endUtc - startUtc) / 86400000) + 1;
};

const rangeForPreset = (days: Preset) => {
  const end = warsawToday();
  return { start: addIsoDays(end, -(days - 1)), end };
};

const formatIso = (iso: string) => dayjs(iso).format('DD.MM.YYYY');

const salesDeltaLabel = (current: number, previous: number): string | null => {
  if (previous === 0) return current > 0 ? 'nowa sprzedaż' : null;
  const delta = ((current - previous) / previous) * 100;
  const rounded = Math.round(delta * 10) / 10;
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded.toString().replace('.', ',')}%`;
};

const SalesDelta = ({
  current,
  previous,
}: {
  current: number;
  previous: number;
}) => {
  const theme = useTheme();
  const label = salesDeltaLabel(current, previous);
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

const sumChannels = (channels: ProductChannelSalesChannel[]) =>
  channels.reduce(
    (total, channel) => ({
      units: total.units + channel.units,
      revenueCents: total.revenueCents + channel.revenueCents,
      ordersCount: total.ordersCount + channel.ordersCount,
      previousUnits: total.previousUnits + channel.previousUnits,
      previousRevenueCents:
        total.previousRevenueCents + channel.previousRevenueCents,
      previousOrdersCount:
        total.previousOrdersCount + channel.previousOrdersCount,
    }),
    {
      units: 0,
      revenueCents: 0,
      ordersCount: 0,
      previousUnits: 0,
      previousRevenueCents: 0,
      previousOrdersCount: 0,
    },
  );

const MetricLine = ({
  label,
  current,
  previous,
  format,
}: {
  label: string;
  current: number;
  previous: number;
  format: (value: number) => string;
}) => (
  <Stack
    direction="row"
    justifyContent="space-between"
    alignItems="center"
    spacing={1}
  >
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={600}>
        {format(current)}
      </Typography>
    </Box>
    <SalesDelta current={current} previous={previous} />
  </Stack>
);

const ChannelCard = ({
  title,
  color,
  units,
  previousUnits,
  revenueCents,
  previousRevenueCents,
  ordersCount,
  currency,
  listing,
}: {
  title: string;
  color?: string;
  units: number;
  previousUnits: number;
  revenueCents: number;
  previousRevenueCents: number;
  ordersCount: number;
  currency: string;
  listing?: ChannelListing;
}) => (
  <Paper
    variant="outlined"
    sx={{
      p: 2,
      minWidth: 200,
      flex: '1 1 200px',
      borderTop: color ? `3px solid ${color}` : undefined,
      bgcolor: listing && listing !== 'active' ? 'action.hover' : undefined,
    }}
  >
    <Stack spacing={0.75} sx={{ mb: 1 }}>
      <Typography variant="subtitle2">{title}</Typography>
      {listing === 'none' ? (
        <Chip
          size="small"
          label="Brak oferty"
          sx={{ alignSelf: 'flex-start' }}
        />
      ) : null}
      {listing === 'ended' ? (
        <Chip
          size="small"
          color="warning"
          label="Oferta zakończona"
          sx={{ alignSelf: 'flex-start' }}
        />
      ) : null}
    </Stack>
    <Stack spacing={1}>
      <MetricLine
        label="Sztuki"
        current={units}
        previous={previousUnits}
        format={(value) => String(value)}
      />
      <MetricLine
        label="Wartość brutto"
        current={revenueCents}
        previous={previousRevenueCents}
        format={(value) => formatPrice(value, currency)}
      />
      <Typography variant="caption" color="text.secondary">
        {`${ordersCount} zamówień`}
      </Typography>
    </Stack>
  </Paper>
);

const visibleChannels = (sales: ProductChannelSales, focus: ChannelFocus) =>
  focus === 'all'
    ? sales.channels
    : sales.channels.filter((channel) => channel.channel === focus);

export const ProductSalesTab = ({ productId }: { productId: number }) => {
  const initial = rangeForPreset(30);
  const [preset, setPreset] = useState<Preset | null>(30);
  const [startDate, setStartDate] = useState(initial.start);
  const [endDate, setEndDate] = useState(initial.end);
  const [focus, setFocus] = useState<ChannelFocus>('all');
  const [metric, setMetric] = useState<ChartMetric>('revenue');

  const periodDays = inclusiveDays(startDate, endDate);
  const rangeError =
    endDate < startDate
      ? 'Data końcowa nie może być wcześniejsza niż początkowa.'
      : periodDays > MAX_PERIOD_DAYS
        ? `Zakres może mieć co najwyżej ${MAX_PERIOD_DAYS} dni.`
        : null;

  const {
    channelLinks,
    isLoading: isLoadingLinks,
    isError: isLinksError,
  } = useGetProductChannelLinks(productId);
  const { sales, isLoading, isFetching, isError } = useGetProductChannelSales(
    productId,
    startDate,
    endDate,
    rangeError === null,
  );

  const chart = useMemo(() => {
    if (!sales) return null;
    const rows = visibleChannels(sales, focus);
    const labels = (rows[0]?.daily ?? []).map((point) =>
      dayjs(point.date).format('DD.MM'),
    );
    const hasData = rows.some((channel) =>
      channel.daily.some((point) =>
        metric === 'revenue' ? point.revenueCents > 0 : point.units > 0,
      ),
    );
    return { rows, labels, hasData };
  }, [sales, focus, metric]);

  const applyPreset = (days: Preset) => {
    const next = rangeForPreset(days);
    setPreset(days);
    setStartDate(next.start);
    setEndDate(next.end);
  };

  const handleFocus = (
    _event: MouseEvent<HTMLElement>,
    value: ChannelFocus | null,
  ) => {
    if (value) setFocus(value);
  };

  const tableRows = useMemo(() => {
    if (!sales) return [];
    const rows = visibleChannels(sales, focus);
    const days = rows[0]?.daily ?? [];
    return days
      .map((point, index) => {
        const units = rows.reduce(
          (total, channel) => total + (channel.daily[index]?.units ?? 0),
          0,
        );
        const revenueCents = rows.reduce(
          (total, channel) => total + (channel.daily[index]?.revenueCents ?? 0),
          0,
        );
        const ordersCount = rows.reduce(
          (total, channel) => total + (channel.daily[index]?.ordersCount ?? 0),
          0,
        );
        return { date: point.date, units, revenueCents, ordersCount };
      })
      .filter((row) => row.units > 0 || row.revenueCents > 0);
  }, [sales, focus]);

  const totals = sales ? sumChannels(sales.channels) : null;

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
        <ToggleButtonGroup
          size="small"
          exclusive
          value={preset}
          onChange={(_event, value: Preset | null) => {
            if (value) applyPreset(value);
          }}
        >
          <ToggleButton value={7}>{'7 dni'}</ToggleButton>
          <ToggleButton value={30}>{'30 dni'}</ToggleButton>
          <ToggleButton value={90}>{'90 dni'}</ToggleButton>
        </ToggleButtonGroup>
        <DatePicker
          label="Od"
          format="DD.MM.YYYY"
          value={dayjs(startDate)}
          onChange={(value) => {
            if (!value?.isValid()) return;
            setPreset(null);
            setStartDate(value.format('YYYY-MM-DD'));
          }}
          slotProps={{ textField: { size: 'small' } }}
        />
        <DatePicker
          label="Do"
          format="DD.MM.YYYY"
          value={dayjs(endDate)}
          onChange={(value) => {
            if (!value?.isValid()) return;
            setPreset(null);
            setEndDate(value.format('YYYY-MM-DD'));
          }}
          slotProps={{ textField: { size: 'small' } }}
        />
      </Stack>

      {rangeError ? <Alert severity="warning">{rangeError}</Alert> : null}

      {sales ? (
        <Typography variant="body2" color="text.secondary">
          {`Porównanie z ${formatIso(sales.previousStartDate)} – ${formatIso(sales.previousEndDate)}`}
        </Typography>
      ) : null}

      {sales && sales.fxMissingLines > 0 ? (
        <Alert severity="warning">
          {`Część pozycji (${sales.fxMissingLines}) ma walutę bez kursu NBP. Wartość w PLN jest niepełna, sztuki są policzone.`}
        </Alert>
      ) : null}
      {sales && sales.bundlePieceLines > 0 ? (
        <Alert severity="info">
          {`Część sztuk (${sales.bundlePieceLines} poz.) pochodzi z zestawów i nie ma własnej wartości.`}
        </Alert>
      ) : null}

      {isLinksError ? (
        <Alert severity="warning">
          {
            'Nie udało się sprawdzić, na których kanałach produkt jest wystawiony. Liczby sprzedaży są niezależne od tego statusu.'
          }
        </Alert>
      ) : null}

      {isError ? (
        <Alert severity="error">
          {'Nie udało się pobrać sprzedaży kanałów.'}
        </Alert>
      ) : null}

      {isLoading || !sales || !totals || !chart ? (
        rangeError ? null : (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )
      ) : (
        <Stack spacing={2} sx={{ opacity: isFetching ? 0.6 : 1 }}>
          <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
            {sales.channels.map((channel) => {
              const meta = ORDER_CHANNELS.find(
                (item) => item.source === channel.channel,
              );
              return (
                <ChannelCard
                  key={channel.channel}
                  title={orderChannelLabel(channel.channel)}
                  color={meta?.color}
                  units={channel.units}
                  previousUnits={channel.previousUnits}
                  revenueCents={channel.revenueCents}
                  previousRevenueCents={channel.previousRevenueCents}
                  ordersCount={channel.ordersCount}
                  currency={sales.currency}
                  listing={
                    isLoadingLinks || isLinksError
                      ? undefined
                      : listingForChannel(channelLinks, channel.channel)
                  }
                />
              );
            })}
            <ChannelCard
              title="Suma"
              units={totals.units}
              previousUnits={totals.previousUnits}
              revenueCents={totals.revenueCents}
              previousRevenueCents={totals.previousRevenueCents}
              ordersCount={totals.ordersCount}
              currency={sales.currency}
            />
          </Stack>

          <Stack direction="row" spacing={2} flexWrap="wrap">
            <ToggleButtonGroup
              size="small"
              exclusive
              value={focus}
              onChange={handleFocus}
            >
              <ToggleButton value="all">{'Wszystkie'}</ToggleButton>
              {ORDER_CHANNELS.map((channel) => (
                <ToggleButton key={channel.source} value={channel.source}>
                  {channel.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={metric}
              onChange={(_event, value: ChartMetric | null) => {
                if (value) setMetric(value);
              }}
            >
              <ToggleButton value="revenue">{'Wartość'}</ToggleButton>
              <ToggleButton value="units">{'Sztuki'}</ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
              {metric === 'revenue' ? 'Wartość dzienna' : 'Sztuki dzienne'}
            </Typography>
            {!chart.hasData ? (
              <Box
                sx={{
                  height: 220,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {'Brak sprzedaży w tym okresie'}
                </Typography>
              </Box>
            ) : (
              <BarChart
                height={260}
                borderRadius={4}
                xAxis={[
                  {
                    data: chart.labels,
                    scaleType: 'band',
                    tickLabelStyle: { fontSize: 11 },
                    tickLabelInterval: (_value, index) =>
                      chart.labels.length <= 14 ||
                      index % Math.ceil(chart.labels.length / 10) === 0,
                  },
                ]}
                yAxis={[
                  {
                    valueFormatter: (value: number | null) =>
                      metric === 'revenue'
                        ? formatPrice(value ?? 0, sales.currency)
                        : String(value ?? 0),
                    tickLabelStyle: { fontSize: 11 },
                  },
                ]}
                series={chart.rows.map((channel) => {
                  const meta = ORDER_CHANNELS.find(
                    (item) => item.source === channel.channel,
                  );
                  return {
                    data: channel.daily.map((point) =>
                      metric === 'revenue' ? point.revenueCents : point.units,
                    ),
                    label: orderChannelLabel(channel.channel),
                    stack: 'daily',
                    color: meta?.color,
                    valueFormatter: (value: number | null) =>
                      metric === 'revenue'
                        ? formatPrice(value ?? 0, sales.currency)
                        : String(value ?? 0),
                  };
                })}
                margin={{
                  top: 24,
                  right: 10,
                  bottom: 30,
                  left: metric === 'revenue' ? 72 : 40,
                }}
              />
            )}
          </Paper>

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{'Data'}</TableCell>
                <TableCell align="right">{'Sztuki'}</TableCell>
                <TableCell align="right">{'Wartość'}</TableCell>
                <TableCell align="right">{'Zamówienia'}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tableRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography variant="body2" color="text.secondary">
                      {'Brak sprzedaży w tym okresie'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                tableRows.map((row) => (
                  <TableRow key={row.date}>
                    <TableCell>{formatIso(row.date)}</TableCell>
                    <TableCell align="right">{row.units}</TableCell>
                    <TableCell align="right">
                      {formatPrice(row.revenueCents, sales.currency)}
                    </TableCell>
                    <TableCell align="right">{row.ordersCount}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Stack>
      )}
    </Stack>
  );
};
