import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { MouseEvent, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { useAppSelector } from '../../../../hooks';
import { Pages } from '../../../../utils';
import { formatPrice } from '../../products/utils';
import {
  ChannelMarginLens,
  ChannelMarginRow,
  useGetChannelMarginReport,
} from '../api/useGetChannelMarginReport';
import {
  HowWeCalculateAccordion,
  MarginCalculationBreakdown,
} from '../components/MarginCalculationBreakdown';

const channelLabel = (channel: string) => {
  if (channel === 'pcmarket') return 'PC-Market';
  if (channel === 'allegro') return 'Allegro';
  if (channel === 'erli') return 'Erli';
  if (channel === 'woocommerce') return 'WooCommerce';
  if (channel === 'ecommerce_total') return 'Razem e-commerce';
  return channel;
};

const KpiCard = ({
  title,
  value,
  previous,
  tooltip,
}: {
  title: string;
  value: string;
  previous?: string | null;
  tooltip: string;
}) => (
  <Paper variant="outlined" sx={{ p: 2, minWidth: 160, flex: 1 }}>
    <Stack spacing={0.5}>
      <Stack direction="row" spacing={0.5} alignItems="center">
        <Typography variant="caption" color="text.secondary">
          {title}
        </Typography>
        <Tooltip title={tooltip}>
          <InfoOutlinedIcon sx={{ fontSize: 14 }} color="action" />
        </Tooltip>
      </Stack>
      <Typography variant="h6">{value}</Typography>
      {previous != null ? (
        <Typography variant="caption" color="text.secondary">
          {`Poprzedni okres: ${previous}`}
        </Typography>
      ) : null}
    </Stack>
  </Paper>
);

export const ChannelMarginReportPage = () => {
  const permissions = useAppSelector(
    (state) => state.smSystemUser.user?.permissions,
  );
  const canView = permissions?.canViewPurchasePrices;

  const {
    data,
    isLoading,
    isError,
    errorMessage,
    lens,
    setLens,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
  } = useGetChannelMarginReport({
    // Avoid 403 toast while user/permissions still loading or when denied
    enabled: canView === true,
  });

  const [chartMetric, setChartMetric] = useState<'margin' | 'percent'>(
    'margin',
  );
  const [rowMode, setRowMode] = useState<'product' | 'offer'>('product');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const currency = data?.currency ?? 'PLN';

  const tableRows = useMemo(() => {
    if (!data) return [];
    if (lens === 'ecommerce' && rowMode === 'offer')
      return data.offerRows ?? [];
    return data.rows ?? [];
  }, [data, lens, rowMode]);

  const chartData = useMemo(() => {
    if (!data?.daily?.length) return null;
    const dates = Array.from(new Set(data.daily.map((p) => p.date))).sort();
    const channels = Array.from(new Set(data.daily.map((p) => p.channel)));
    const series = channels.map((channel) => ({
      label: channelLabel(channel),
      data: dates.map((date) => {
        const point = data.daily.find(
          (p) => p.date === date && p.channel === channel,
        );
        if (!point) return 0;
        if (chartMetric === 'percent') return point.marginPercent ?? 0;
        return point.marginCents / 100;
      }),
    }));
    return { dates, series };
  }, [data, chartMetric]);

  const columns: GridColDef<ChannelMarginRow>[] = useMemo(() => {
    const nameCol: GridColDef<ChannelMarginRow> =
      rowMode === 'offer' && lens === 'ecommerce'
        ? {
            field: 'productName',
            headerName: 'Oferta',
            flex: 1,
            minWidth: 180,
          }
        : {
            field: 'productName',
            headerName: 'Produkt',
            flex: 1,
            minWidth: 180,
          };

    const offerIdCol: GridColDef<ChannelMarginRow> = {
      field: 'offerId',
      headerName: 'ID oferty',
      width: 130,
      valueFormatter: (value) => (value == null ? '—' : String(value)),
    };

    return [
      nameCol,
      ...(rowMode === 'offer' && lens === 'ecommerce' ? [offerIdCol] : []),
      {
        field: 'channel',
        headerName: 'Kanał',
        width: 120,
        valueFormatter: (value) => channelLabel(String(value)),
      },
      {
        field: 'units',
        headerName: 'Ilość',
        type: 'number',
        width: 80,
      },
      {
        field: 'revenueCents',
        headerName: 'Przychód',
        type: 'number',
        width: 110,
        valueFormatter: (value) => formatPrice(Number(value), currency),
      },
      {
        field: 'cogsCents',
        headerName: 'COGS',
        type: 'number',
        width: 100,
        valueFormatter: (value) => formatPrice(Number(value), currency),
      },
      {
        field: 'commissionCents',
        headerName: 'Prowizja',
        type: 'number',
        width: 100,
        valueFormatter: (value) => formatPrice(Number(value), currency),
      },
      {
        field: 'buyerDeliveryCents',
        headerName: 'Dostawa od klienta',
        description:
          'Kwota, którą kupujący zapłacił za przesyłkę. To wpływ — dodawany do marży.',
        type: 'number',
        width: 160,
        valueFormatter: (value) => formatPrice(Number(value), currency),
      },
      {
        field: 'sellerDeliveryCents',
        headerName: 'Koszt dostawy',
        description:
          'Twój koszt wysyłki (kurier / Allegro Smart / grupa dostawy). To wydatek — odejmowany od marży.',
        type: 'number',
        width: 140,
        valueFormatter: (value) => formatPrice(Number(value), currency),
      },
      {
        field: 'otherFeesCents',
        headerName: 'Inne',
        type: 'number',
        width: 90,
        valueFormatter: (value) => formatPrice(Number(value), currency),
      },
      {
        field: 'marginCents',
        headerName: 'Marża',
        type: 'number',
        width: 110,
        valueFormatter: (value) => formatPrice(Number(value), currency),
      },
      {
        field: 'marginPercent',
        headerName: 'Marża %',
        type: 'number',
        width: 90,
        valueFormatter: (value) =>
          value == null ? '—' : `${Number(value).toFixed(1)}%`,
      },
    ];
  }, [currency, lens, rowMode]);

  if (canView === false) return <Navigate to={Pages.smSystemReports} replace />;

  const overview = data?.overview;
  const coverageNotes = data?.coverage?.notes ?? [];

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ md: 'center' }}
        justifyContent="space-between"
      >
        <Stack spacing={0.5}>
          <Typography variant="h5">{'Raport marży kanałów'}</Typography>
          <Button
            variant="text"
            href={`#${Pages.smSystemReports}`}
            sx={{ alignSelf: 'flex-start', px: 0 }}
          >
            {'← Wróć do raportów'}
          </Button>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="lens-label">{'Soczewka'}</InputLabel>
            <Select
              labelId="lens-label"
              label="Soczewka"
              value={lens}
              onChange={(e) => setLens(e.target.value as ChannelMarginLens)}
            >
              <MenuItem value="ecommerce">{'Kanały e-commerce'}</MenuItem>
              <MenuItem value="pcmarket">{'Paragony PC-Market'}</MenuItem>
            </Select>
          </FormControl>
          <DatePicker
            label="Od"
            value={startDate ? dayjs(startDate) : null}
            onChange={(v) => setStartDate(v ? v.toDate() : null)}
            slotProps={{ textField: { size: 'small' } }}
          />
          <DatePicker
            label="Do"
            value={endDate ? dayjs(endDate) : null}
            onChange={(v) => setEndDate(v ? v.toDate() : null)}
            slotProps={{ textField: { size: 'small' } }}
          />
        </Stack>
      </Stack>

      <HowWeCalculateAccordion
        calculation={data?.calculation}
        currency={currency}
      />

      {isError ? (
        <Alert severity="error">
          {errorMessage ?? 'Nie udało się pobrać raportu marży.'}
        </Alert>
      ) : null}

      {isLoading || !overview ? (
        <Skeleton variant="rounded" height={120} />
      ) : (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <KpiCard
            title="Przychód"
            value={formatPrice(overview.revenueCents, currency)}
            previous={formatPrice(overview.previous.revenueCents, currency)}
            tooltip="Suma cen sprzedaży pozycji (PLN)."
          />
          <KpiCard
            title="COGS"
            value={formatPrice(overview.cogsCents, currency)}
            previous={formatPrice(overview.previous.cogsCents, currency)}
            tooltip="Koszt zakupu brutto (FV na dzień sprzedaży lub ostatnia KSeF)."
          />
          <KpiCard
            title="Prowizja / opłaty"
            value={formatPrice(
              overview.commissionCents + overview.otherFeesCents,
              currency,
            )}
            previous={formatPrice(
              overview.previous.commissionCents +
                overview.previous.otherFeesCents,
              currency,
            )}
            tooltip={
              data?.coverage?.erliCommissionPercent != null ||
              data?.coverage?.wooCommissionPercent != null
                ? `Allegro: billing SUC; Erli: ${data.coverage.erliCommissionPercent ?? 0}%; Woo: ${data.coverage.wooCommissionPercent ?? 0}% (konfiguracja).`
                : 'Allegro: billing SUC; Erli/Woo: % z konfiguracji (brak — 0%).'
            }
          />
          <KpiCard
            title="Marża"
            value={formatPrice(overview.marginCents, currency)}
            previous={formatPrice(overview.previous.marginCents, currency)}
            tooltip="Przychód + dostawa kupującego − COGS − prowizja − koszt dostawy sprzedawcy − inne opłaty."
          />
          <KpiCard
            title="Marża %"
            value={
              overview.marginPercent == null
                ? '—'
                : `${overview.marginPercent.toFixed(1)}%`
            }
            previous={
              overview.previous.marginPercent == null
                ? '—'
                : `${overview.previous.marginPercent.toFixed(1)}%`
            }
            tooltip="Marża / (przychód + dostawa od kupującego)."
          />
        </Stack>
      )}

      {data?.coverage ? (
        <Stack spacing={1}>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              label={`Linie z ceną: ${data.coverage.linesWithSellingPricePercent ?? '—'}%`}
            />
            <Chip
              size="small"
              label={`Linie z COGS: ${data.coverage.linesWithCogsPercent ?? '—'}%`}
            />
            {data.coverage.allegroBillingMatchedPercent != null ? (
              <Chip
                size="small"
                label={`Allegro billing: ${data.coverage.allegroBillingMatchedPercent}%`}
              />
            ) : null}
            {data.coverage.fxLinesConverted ? (
              <Chip
                size="small"
                color="warning"
                label={`FX→PLN (NBP): ${data.coverage.fxLinesConverted} linii`}
              />
            ) : null}
            {data.coverage.fxLinesMissingRate ? (
              <Chip
                size="small"
                color="error"
                label={`Brak kursu NBP: ${data.coverage.fxLinesMissingRate} linii`}
              />
            ) : null}
            {data.coverage.fxFeePartsMissing ? (
              <Chip
                size="small"
                color="error"
                label={`Opłaty bez FX: ${data.coverage.fxFeePartsMissing} zam.`}
              />
            ) : null}
            {data.coverage.fxBuyerDeliveryMissing ? (
              <Chip
                size="small"
                color="error"
                label={`Dostawa bez FX: ${data.coverage.fxBuyerDeliveryMissing} zam.`}
              />
            ) : null}
            {data.coverage.erliCommissionPercent != null ? (
              <Chip
                size="small"
                label={`Erli prowizja: ${data.coverage.erliCommissionPercent}%`}
              />
            ) : null}
            {data.coverage.wooCommissionPercent != null ? (
              <Chip
                size="small"
                label={`Woo prowizja: ${data.coverage.wooCommissionPercent}%`}
              />
            ) : null}
            <Chip size="small" label={`Linii: ${data.coverage.linesTotal}`} />
          </Stack>
          {coverageNotes.length > 0 ? (
            <Stack spacing={0.5}>
              {coverageNotes.map((note) => (
                <Alert key={note} severity="info" variant="outlined">
                  {note}
                </Alert>
              ))}
            </Stack>
          ) : null}
        </Stack>
      ) : null}

      {data?.byChannel?.length ? (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={0.5} mb={1.5}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography variant="subtitle1">
                {'Marża według kanału'}
              </Typography>
              <Tooltip title="Marża / (przychód + dostawa od kupującego).">
                <InfoOutlinedIcon sx={{ fontSize: 16 }} color="action" />
              </Tooltip>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {
                'Marża zł oraz marża % = marża / (przychód + dostawa kupującego).'
              }
            </Typography>
          </Stack>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{'Kanał'}</TableCell>
                  <TableCell align="right">{'Marża'}</TableCell>
                  <TableCell align="right">{'Marża %'}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.byChannel.map((ch) => {
                  const isTotal = ch.channel === 'ecommerce_total';
                  return (
                    <TableRow
                      key={ch.channel}
                      sx={
                        isTotal
                          ? {
                              '& td': {
                                borderTop: 1,
                                borderColor: 'divider',
                                fontWeight: 600,
                              },
                            }
                          : undefined
                      }
                    >
                      <TableCell>{channelLabel(ch.channel)}</TableCell>
                      <TableCell align="right">
                        {formatPrice(ch.marginCents, currency)}
                      </TableCell>
                      <TableCell align="right">
                        {ch.marginPercent == null
                          ? '—'
                          : `${ch.marginPercent.toFixed(1)}%`}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : null}

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={1}
        >
          <Typography variant="subtitle1">{'Marża w czasie'}</Typography>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={chartMetric}
            onChange={(
              _e: MouseEvent<HTMLElement>,
              value: 'margin' | 'percent' | null,
            ) => {
              if (value) setChartMetric(value);
            }}
          >
            <ToggleButton value="margin">{'zł'}</ToggleButton>
            <ToggleButton value="percent">{'%'}</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
        {isLoading || !chartData ? (
          <Skeleton variant="rounded" height={260} />
        ) : chartData.dates.length === 0 ? (
          <Typography color="text.secondary">
            {'Brak danych w okresie.'}
          </Typography>
        ) : (
          <BarChart
            height={280}
            xAxis={[
              {
                scaleType: 'band',
                data: chartData.dates.map((d) => dayjs(d).format('DD.MM')),
              },
            ]}
            series={chartData.series.map((s) => ({
              ...s,
              stack: chartMetric === 'margin' ? 'total' : undefined,
            }))}
          />
        )}
      </Paper>

      <Paper variant="outlined" sx={{ height: 520 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ px: 2, pt: 1.5, pb: 1 }}
        >
          <Typography variant="subtitle1">
            {rowMode === 'offer' && lens === 'ecommerce'
              ? 'Marża według oferty'
              : 'Marża według produktu'}
          </Typography>
          {lens === 'ecommerce' ? (
            <ToggleButtonGroup
              size="small"
              exclusive
              value={rowMode}
              onChange={(
                _e: MouseEvent<HTMLElement>,
                value: 'product' | 'offer' | null,
              ) => {
                if (value) {
                  setRowMode(value);
                  setExpandedRowId(null);
                }
              }}
            >
              <ToggleButton value="product">{'Produkt'}</ToggleButton>
              <ToggleButton value="offer">{'Oferta'}</ToggleButton>
            </ToggleButtonGroup>
          ) : null}
        </Stack>
        <DataGrid
          rows={tableRows.map((row, index) => ({
            ...row,
            id:
              rowMode === 'offer'
                ? `offer-${row.channel}-${row.offerId ?? 'x'}-${index}`
                : `${row.channel}-${row.productId ?? 'x'}-${index}`,
          }))}
          columns={columns}
          loading={isLoading}
          disableRowSelectionOnClick
          pageSizeOptions={[25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
          }}
          onRowClick={(params: GridRowParams) => {
            const id = String(params.id);
            setExpandedRowId((prev) => (prev === id ? null : id));
          }}
          getRowClassName={(params) =>
            expandedRowId === String(params.id) ? 'Mui-selected' : ''
          }
          sx={{ border: 0, height: 'calc(100% - 52px)' }}
        />
      </Paper>

      {expandedRowId && tableRows.length ? (
        <Accordion expanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">
              {'Szczegóły wyliczenia zaznaczonego wiersza'}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {(() => {
              const row = tableRows.find((r, index) => {
                const id =
                  rowMode === 'offer'
                    ? `offer-${r.channel}-${r.offerId ?? 'x'}-${index}`
                    : `${r.channel}-${r.productId ?? 'x'}-${index}`;
                return id === expandedRowId;
              });
              if (!row) return null;
              return (
                <Box>
                  <Typography variant="body2" gutterBottom>
                    {rowMode === 'offer' && row.offerId
                      ? `${row.productName} · oferta ${row.offerId} · ${channelLabel(row.channel)}`
                      : `${row.productName} · ${channelLabel(row.channel)}`}
                  </Typography>
                  <MarginCalculationBreakdown
                    calculation={row.calculation}
                    currency={currency}
                  />
                </Box>
              );
            })()}
          </AccordionDetails>
        </Accordion>
      ) : null}
    </Stack>
  );
};
