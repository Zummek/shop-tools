import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  Alert,
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
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import {
  DataGrid,
  GridColDef,
  GridRowParams,
  useGridApiRef,
} from '@mui/x-data-grid';
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
import { HowWeCalculateAccordion } from '../components/MarginCalculationBreakdown';
import { ProductMarginSourceModal } from '../components/ProductMarginSourceModal';
import {
  formatSharePercent,
  SHARE_PERCENT_DESCRIPTION,
  shareOfMarginBasePercent,
} from '../utils/marginSharePercent';
import {
  reportDataGridLayoutSx,
  usePinDataGridColumn,
} from '../utils/usePinDataGridColumn';

const channelLabel = (channel: string) => {
  if (channel === 'pcmarket') return 'PC-Market';
  if (channel === 'allegro') return 'Allegro';
  if (channel === 'erli') return 'Erli';
  if (channel === 'woocommerce') return 'WooCommerce';
  if (channel === 'ecommerce_total') return 'Razem e-commerce';
  return channel;
};

const AmountWithPercentCell = ({
  amountCents,
  percent,
}: {
  amountCents: number;
  percent: number | null;
}) => (
  <Stack
    spacing={0}
    alignItems="flex-end"
    justifyContent="center"
    sx={{ width: '100%', minWidth: 0, height: '100%', lineHeight: 1.2 }}
  >
    <Typography
      variant="body2"
      component="span"
      noWrap
      title={formatPrice(amountCents)}
    >
      {formatPrice(amountCents)}
    </Typography>
    <Typography
      variant="caption"
      color="text.secondary"
      component="span"
      noWrap
      title={formatSharePercent(percent)}
    >
      {formatSharePercent(percent)}
    </Typography>
  </Stack>
);

const CoverageChip = ({
  label,
  tooltip,
  color,
}: {
  label: string;
  tooltip: string;
  color?: 'warning' | 'error';
}) => (
  <Tooltip title={tooltip}>
    <Chip size="small" label={label} color={color} />
  </Tooltip>
);

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
  <Paper variant="outlined" sx={{ p: 2, minWidth: 200, flex: '1 0 200px' }}>
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
  const apiRef = useGridApiRef();

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

  const [chartMetric, setChartMetric] = useState<
    'gross' | 'net' | 'grossPercent' | 'netPercent'
  >('gross');
  const [rowMode, setRowMode] = useState<'product' | 'offer'>('product');
  const [selectedRow, setSelectedRow] = useState<ChannelMarginRow | null>(null);
  const [search, setSearch] = useState('');

  const currency = data?.currency ?? 'PLN';

  const tableRows = useMemo(() => {
    if (!data) return [];
    if (lens === 'ecommerce' && rowMode === 'offer')
      return data.offerRows ?? [];
    return data.rows ?? [];
  }, [data, lens, rowMode]);

  const filteredTableRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tableRows;
    return tableRows.filter((row) => {
      if (row.productName.toLowerCase().includes(query)) return true;
      if (
        row.offerId != null &&
        String(row.offerId).toLowerCase().includes(query)
      )
        return true;
      return false;
    });
  }, [tableRows, search]);

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
        if (chartMetric === 'grossPercent') return point.marginPercent ?? 0;
        if (chartMetric === 'netPercent') return point.marginNetPercent ?? 0;
        if (chartMetric === 'net') return point.marginNetCents / 100;
        return point.marginCents / 100;
      }),
    }));
    return { dates, series };
  }, [data, chartMetric]);

  usePinDataGridColumn(apiRef, 'productName', canView === true);

  const columns: GridColDef<ChannelMarginRow>[] = useMemo(() => {
    const nameCol: GridColDef<ChannelMarginRow> =
      rowMode === 'offer' && lens === 'ecommerce'
        ? {
            field: 'productName',
            headerName: 'Oferta',
            width: 220,
          }
        : {
            field: 'productName',
            headerName: 'Produkt',
            width: 220,
          };

    const offerIdCol: GridColDef<ChannelMarginRow> = {
      field: 'offerId',
      headerName: 'ID\noferty',
      width: 112,
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
        headerName: 'Sprzedane\nszt.',
        description:
          'Suma sprzedanych sztuk produktu (lub oferty) w wybranym okresie i kanale.',
        type: 'number',
        width: 92,
      },
      {
        field: 'revenueCents',
        headerName: 'Przychód\nbrutto (PLN)',
        description: 'Suma cen sprzedaży brutto (z VAT) w okresie.',
        type: 'number',
        width: 128,
        valueFormatter: (value) => formatPrice(Number(value)),
      },
      {
        field: 'cogsCents',
        headerName: 'COGS\nbrutto (PLN)',
        description: `Suma kosztu zakupu brutto (netto z FV × VAT). ${SHARE_PERCENT_DESCRIPTION}`,
        type: 'number',
        width: 128,
        valueFormatter: (value) => formatPrice(Number(value)),
        renderCell: (params) => (
          <AmountWithPercentCell
            amountCents={params.row.cogsCents}
            percent={shareOfMarginBasePercent(
              params.row.cogsCents,
              params.row.revenueCents,
              params.row.buyerDeliveryCents,
            )}
          />
        ),
      },
      {
        field: 'commissionCents',
        headerName: 'Prowizja\nłączna (PLN)',
        description: `Suma prowizji / opłat kanału w okresie. ${SHARE_PERCENT_DESCRIPTION}`,
        type: 'number',
        width: 128,
        valueFormatter: (value) => formatPrice(Number(value)),
        renderCell: (params) => (
          <AmountWithPercentCell
            amountCents={params.row.commissionCents}
            percent={shareOfMarginBasePercent(
              params.row.commissionCents,
              params.row.revenueCents,
              params.row.buyerDeliveryCents,
            )}
          />
        ),
      },
      {
        field: 'buyerDeliveryCents',
        headerName: 'Dostawa od\nklienta (PLN)',
        description: `Kwota brutto, którą kupujący zapłacił za przesyłkę. To wpływ — dodawany do marży. W marży netto VAT 23% jest zdjęty. ${SHARE_PERCENT_DESCRIPTION}`,
        type: 'number',
        width: 128,
        valueFormatter: (value) => formatPrice(Number(value)),
        renderCell: (params) => (
          <AmountWithPercentCell
            amountCents={params.row.buyerDeliveryCents}
            percent={shareOfMarginBasePercent(
              params.row.buyerDeliveryCents,
              params.row.revenueCents,
              params.row.buyerDeliveryCents,
            )}
          />
        ),
      },
      {
        field: 'sellerDeliveryCents',
        headerName: 'Koszt dostawy\nłączny (PLN)',
        description: `Twój koszt wysyłki (kurier / Allegro Smart / grupa dostawy). To wydatek — odejmowany od marży. ${SHARE_PERCENT_DESCRIPTION}`,
        type: 'number',
        width: 132,
        valueFormatter: (value) => formatPrice(Number(value)),
        renderCell: (params) => (
          <AmountWithPercentCell
            amountCents={params.row.sellerDeliveryCents}
            percent={shareOfMarginBasePercent(
              params.row.sellerDeliveryCents,
              params.row.revenueCents,
              params.row.buyerDeliveryCents,
            )}
          />
        ),
      },
      {
        field: 'otherFeesCents',
        headerName: 'Inne\nłączne (PLN)',
        description: `Suma pozostałych opłat w okresie. ${SHARE_PERCENT_DESCRIPTION}`,
        type: 'number',
        width: 128,
        valueFormatter: (value) => formatPrice(Number(value)),
        renderCell: (params) => (
          <AmountWithPercentCell
            amountCents={params.row.otherFeesCents}
            percent={shareOfMarginBasePercent(
              params.row.otherFeesCents,
              params.row.revenueCents,
              params.row.buyerDeliveryCents,
            )}
          />
        ),
      },
      {
        field: 'marginCents',
        headerName: 'Marża\nbrutto (PLN)',
        description: `Suma marży brutto (sprzedaż i zakup z VAT). ${SHARE_PERCENT_DESCRIPTION}`,
        type: 'number',
        width: 128,
        valueFormatter: (value) => formatPrice(Number(value)),
        renderCell: (params) => (
          <AmountWithPercentCell
            amountCents={params.row.marginCents}
            percent={
              params.row.marginPercent ??
              shareOfMarginBasePercent(
                params.row.marginCents,
                params.row.revenueCents,
                params.row.buyerDeliveryCents,
              )
            }
          />
        ),
      },
      {
        field: 'marginNetCents',
        headerName: 'Marża\nnetto (PLN)',
        description:
          'Marża po zdjęciu VAT ze sprzedaży (stawka produktu), z zakupu (netto z FV) i z dostawy kupującego (23%). Procent = marża netto / (przychód netto + dostawa netto).',
        type: 'number',
        width: 128,
        valueFormatter: (value) => formatPrice(Number(value)),
        renderCell: (params) => (
          <AmountWithPercentCell
            amountCents={params.row.marginNetCents}
            percent={params.row.marginNetPercent}
          />
        ),
      },
    ];
  }, [lens, rowMode]);

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
              onChange={(e) => {
                setLens(e.target.value as ChannelMarginLens);
                setSelectedRow(null);
              }}
            >
              <MenuItem value="ecommerce">{'Kanały e-commerce'}</MenuItem>
              <MenuItem value="pcmarket">{'Paragony PC-Market'}</MenuItem>
            </Select>
          </FormControl>
          <DatePicker
            label="Od"
            value={startDate ? dayjs(startDate) : null}
            onChange={(v) => {
              setStartDate(v ? v.toDate() : null);
              setSelectedRow(null);
            }}
            slotProps={{ textField: { size: 'small' } }}
          />
          <DatePicker
            label="Do"
            value={endDate ? dayjs(endDate) : null}
            onChange={(v) => {
              setEndDate(v ? v.toDate() : null);
              setSelectedRow(null);
            }}
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
        <Stack
          direction="row"
          spacing={2}
          sx={{
            overflowX: 'auto',
            width: '100%',
            minWidth: 0,
            pb: 0.5,
          }}
        >
          <KpiCard
            title="Przychód brutto"
            value={formatPrice(overview.revenueCents, currency)}
            previous={formatPrice(overview.previous.revenueCents, currency)}
            tooltip="Suma cen sprzedaży brutto (z VAT)."
          />
          <KpiCard
            title="COGS brutto"
            value={formatPrice(overview.cogsCents, currency)}
            previous={formatPrice(overview.previous.cogsCents, currency)}
            tooltip="Koszt zakupu brutto: netto z FV × VAT. Ostatnia FV na dzień sprzedaży (linie tego samego produktu na FV uśrednione ilością) lub ostatnia KSeF."
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
            title="Marża brutto"
            value={formatPrice(overview.marginCents, currency)}
            previous={formatPrice(overview.previous.marginCents, currency)}
            tooltip="Przychód brutto + dostawa brutto − COGS brutto − prowizja − koszt dostawy sprzedawcy − inne opłaty."
          />
          <KpiCard
            title="Marża brutto %"
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
            tooltip="Marża brutto / (przychód brutto + dostawa brutto)."
          />
          <KpiCard
            title="Marża netto"
            value={formatPrice(overview.marginNetCents, currency)}
            previous={formatPrice(overview.previous.marginNetCents, currency)}
            tooltip="Przychód netto (brutto / (1 + VAT produktu)) + dostawa kupującego netto (VAT 23%) − zakup netto − prowizja − koszt dostawy sprzedawcy − inne. Prowizja Allegro (SUC) jest już netto."
          />
          <KpiCard
            title="Marża netto %"
            value={
              overview.marginNetPercent == null
                ? '—'
                : `${overview.marginNetPercent.toFixed(1)}%`
            }
            previous={
              overview.previous.marginNetPercent == null
                ? '—'
                : `${overview.previous.marginNetPercent.toFixed(1)}%`
            }
            tooltip="Marża netto / (przychód netto + dostawa kupującego netto)."
          />
        </Stack>
      )}

      {data?.coverage ? (
        <Stack spacing={1}>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <CoverageChip
              label={`Cena sprzedaży: ${data.coverage.linesWithSellingPricePercent ?? '—'}%`}
              tooltip="Udział linii sprzedaży z ceną z paragonu lub zamówienia (przychód). To nie jest cena zakupu z karty produktu."
            />
            <CoverageChip
              label={`Cena zakupu (COGS): ${data.coverage.linesWithCogsPercent ?? '—'}%`}
              tooltip="Udział linii z kosztem zakupu: faktura KSeF, last purchase albo ręczna cena zakupu netto. Bez tego COGS = 0 i marża jest zawyżona."
            />
            {data.coverage.allegroBillingMatchedPercent != null ? (
              <CoverageChip
                label={`Allegro billing: ${data.coverage.allegroBillingMatchedPercent}%`}
                tooltip="Udział opłat Allegro dopasowanych do billing SUC / HB*."
              />
            ) : null}
            {data.coverage.fxLinesConverted ? (
              <CoverageChip
                color="warning"
                label={`FX→PLN (NBP): ${data.coverage.fxLinesConverted} linii`}
                tooltip="Linie w walucie obcej przeliczone kursem średnim NBP (tabela A) z dnia zamówienia."
              />
            ) : null}
            {data.coverage.fxLinesMissingRate ? (
              <CoverageChip
                color="error"
                label={`Brak kursu NBP: ${data.coverage.fxLinesMissingRate} linii`}
                tooltip="Linie w walucie obcej bez kursu NBP — nie weszły do przychodu w PLN."
              />
            ) : null}
            {data.coverage.fxFeePartsMissing ? (
              <CoverageChip
                color="error"
                label={`Opłaty bez FX: ${data.coverage.fxFeePartsMissing} zam.`}
                tooltip="Zamówienia, w których części opłat nie dało się przeliczyć na PLN."
              />
            ) : null}
            {data.coverage.fxBuyerDeliveryMissing ? (
              <CoverageChip
                color="error"
                label={`Dostawa bez FX: ${data.coverage.fxBuyerDeliveryMissing} zam.`}
                tooltip="Zamówienia bez kursu dla dostawy od kupującego."
              />
            ) : null}
            {data.coverage.erliCommissionPercent != null ? (
              <CoverageChip
                label={`Erli prowizja: ${data.coverage.erliCommissionPercent}%`}
                tooltip="Prowizja Erli z konfiguracji organizacji — nie z billingu."
              />
            ) : null}
            {data.coverage.wooCommissionPercent != null ? (
              <CoverageChip
                label={`Woo prowizja: ${data.coverage.wooCommissionPercent}%`}
                tooltip="Prowizja WooCommerce z konfiguracji organizacji."
              />
            ) : null}
            <CoverageChip
              label={`Linii: ${data.coverage.linesTotal}`}
              tooltip="Liczba linii sprzedaży w wybranym okresie i soczewce."
            />
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
              <Tooltip title="Brutto: marża / (przychód brutto + dostawa brutto). Netto: marża / (przychód netto + dostawa netto).">
                <InfoOutlinedIcon sx={{ fontSize: 16 }} color="action" />
              </Tooltip>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {
                'Marża brutto obejmuje VAT sprzedaży i zakupu. Marża netto jest bez tego VAT. Procent to marża / (przychód + dostawa kupującego) w tej samej podstawie.'
              }
            </Typography>
          </Stack>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{'Kanał'}</TableCell>
                  <TableCell align="right">{'Marża brutto (PLN)'}</TableCell>
                  <TableCell align="right">{'Marża netto (PLN)'}</TableCell>
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
                        <Stack spacing={0} alignItems="flex-end">
                          <Typography
                            variant="body2"
                            component="span"
                            fontWeight={isTotal ? 600 : undefined}
                          >
                            {formatPrice(ch.marginCents)}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            component="span"
                          >
                            {formatSharePercent(ch.marginPercent)}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Stack spacing={0} alignItems="flex-end">
                          <Typography
                            variant="body2"
                            component="span"
                            fontWeight={isTotal ? 600 : undefined}
                          >
                            {formatPrice(ch.marginNetCents)}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            component="span"
                          >
                            {formatSharePercent(ch.marginNetPercent)}
                          </Typography>
                        </Stack>
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
              value: 'gross' | 'net' | 'grossPercent' | 'netPercent' | null,
            ) => {
              if (value) setChartMetric(value);
            }}
          >
            <ToggleButton value="gross">{'brutto zł'}</ToggleButton>
            <ToggleButton value="net">{'netto zł'}</ToggleButton>
            <ToggleButton value="grossPercent">{'brutto %'}</ToggleButton>
            <ToggleButton value="netPercent">{'netto %'}</ToggleButton>
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
              stack:
                chartMetric === 'gross' || chartMetric === 'net'
                  ? 'total'
                  : undefined,
            }))}
          />
        )}
      </Paper>

      <Paper variant="outlined" sx={{ height: 520 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
          spacing={1.5}
          sx={{ px: 2, pt: 1.5, pb: 1 }}
        >
          <Stack spacing={0.25}>
            <Typography variant="subtitle1">
              {rowMode === 'offer' && lens === 'ecommerce'
                ? 'Marża według oferty'
                : 'Marża według produktu'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {'Kliknij wiersz, aby zobaczyć faktury i paragony/zamówienia.'}
            </Typography>
          </Stack>
          <Stack
            direction="row"
            spacing={1.5}
            flexWrap="wrap"
            useFlexGap
            alignItems="center"
          >
            <TextField
              size="small"
              label={
                rowMode === 'offer' && lens === 'ecommerce'
                  ? 'Szukaj oferty'
                  : 'Szukaj produktu'
              }
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              sx={{ minWidth: 180, flex: '1 1 180px' }}
            />
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
                    setSelectedRow(null);
                  }
                }}
              >
                <ToggleButton value="product">{'Produkt'}</ToggleButton>
                <ToggleButton value="offer">{'Oferta'}</ToggleButton>
              </ToggleButtonGroup>
            ) : null}
          </Stack>
        </Stack>
        <DataGrid
          apiRef={apiRef}
          rows={filteredTableRows.map((row, index) => ({
            ...row,
            id:
              rowMode === 'offer'
                ? `offer-${row.channel}-${row.offerId ?? 'x'}-${index}`
                : `${row.channel}-${row.productId ?? 'x'}-${index}`,
          }))}
          columns={columns}
          loading={isLoading}
          disableColumnMenu
          disableRowSelectionOnClick
          columnHeaderHeight={64}
          rowHeight={56}
          pageSizeOptions={[25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
          }}
          onRowClick={(params: GridRowParams<ChannelMarginRow>) => {
            setSelectedRow(params.row);
          }}
          sx={{
            border: 0,
            height: 'calc(100% - 72px)',
            '& .MuiDataGrid-row': { cursor: 'pointer' },
            '& .MuiDataGrid-cell': {
              display: 'flex',
              alignItems: 'center',
            },
            ...reportDataGridLayoutSx,
          }}
        />
      </Paper>

      <ProductMarginSourceModal
        open={selectedRow != null}
        onClose={() => setSelectedRow(null)}
        row={selectedRow}
        rowKind={rowMode}
        lens={lens}
        startDate={startDate ? dayjs(startDate).format('YYYY-MM-DD') : ''}
        endDate={endDate ? dayjs(endDate).format('YYYY-MM-DD') : ''}
        currency={currency}
      />
    </Stack>
  );
};
