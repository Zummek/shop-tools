import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Alert,
  Box,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRowParams,
  GridSortModel,
  useGridApiRef,
} from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';

import { useAppSelector } from '../../../../../hooks';
import {
  axiosInstance,
  throwAxiosErrorFromResponse,
} from '../../../../../services';
import { Pages } from '../../../../../utils';
import { AlertType } from '../../../alerts/types';
import { alertTypeLabels } from '../../../alerts/utils';
import { ListResponse } from '../../../app/types';
import { ORDER_CHANNELS, orderChannelLabel } from '../../../ecommerce/utils';
import {
  reportDataGridLayoutSx,
  usePinDataGridColumn,
} from '../../../reports/utils/usePinDataGridColumn';
import { useGetProductSalesOverview } from '../../api';
import { SalesPeriodFigure } from '../../components/SalesDelta';
import {
  ChannelListing,
  ProductAlertSeverity,
  ProductBranch,
  ProductSalesChannel,
  ProductSalesListItem,
} from '../../types';
import {
  CoverWithinDays,
  formatPrice,
  ProductListChannel,
  productsListSearchString,
} from '../../utils';
import { formatSalesIso } from '../../utils/salesPeriod';

const SALES_CHANNEL_OPTIONS = [
  ...ORDER_CHANNELS,
  { source: 'receipt' as const, label: 'Paragony' },
];

const salesChannelLabel = (source: string) =>
  SALES_CHANNEL_OPTIONS.find((channel) => channel.source === source)?.label ??
  orderChannelLabel(source);

const STOCK_BRANCH_STORAGE_KEY = 'sm.products.stockBranchId';

interface StockBranch {
  id: number;
  name: string;
}

const readStoredBranchId = () => {
  if (typeof localStorage === 'undefined') return null;
  const parsed = Number(localStorage.getItem(STOCK_BRANCH_STORAGE_KEY));
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const formatStock = (value: number | string) => {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return '—';
  return numeric.toLocaleString('pl-PL', { maximumFractionDigits: 3 });
};

const ALERT_SEVERITY_COLOR: Record<
  ProductAlertSeverity,
  'error' | 'warning' | 'info'
> = {
  critical: 'error',
  warning: 'warning',
  info: 'info',
};

const alertTooltip = (types: string[]) =>
  types
    .map((type) =>
      type in alertTypeLabels ? alertTypeLabels[type as AlertType] : type,
    )
    .join(', ');

const LISTING_LABEL: Record<ChannelListing, string> = {
  active: '',
  ended: 'zakończona',
  none: 'brak oferty',
};

const nameColumn: GridColDef<ProductSalesListItem> = {
  field: 'name',
  headerName: 'Nazwa',
  width: 280,
  minWidth: 180,
  renderCell: (params) => (
    <Stack
      direction="row"
      alignItems="center"
      spacing={0.75}
      sx={{ minWidth: 0, width: '100%' }}
    >
      {params.row.alertSeverity ? (
        <Tooltip title={alertTooltip(params.row.alertTypes)}>
          <WarningAmberIcon
            fontSize="small"
            color={ALERT_SEVERITY_COLOR[params.row.alertSeverity]}
            aria-label={alertTooltip(params.row.alertTypes)}
          />
        </Tooltip>
      ) : null}
      <Typography variant="body2" noWrap sx={{ minWidth: 0 }}>
        {params.row.name}
      </Typography>
    </Stack>
  ),
};

const skuColumn: GridColDef<ProductSalesListItem> = {
  field: 'internalId',
  headerName: 'SKU',
  width: 72,
  minWidth: 56,
  sortable: false,
};

const vatColumn: GridColDef<ProductSalesListItem> = {
  field: 'vat',
  headerName: 'VAT',
  width: 64,
  minWidth: 52,
  align: 'right',
  headerAlign: 'right',
  sortable: false,
  valueFormatter: (value: number) => (value != null ? `${value}%` : '—'),
};

const trailingColumns: GridColDef<ProductSalesListItem>[] = [
  {
    field: 'barcodes',
    headerName: 'Kody EAN',
    flex: 1,
    minWidth: 140,
    sortable: false,
    valueGetter: (_value, row) => (row.barcodes || []).join(', '),
  },
  {
    field: 'channels',
    headerName: 'Kanały',
    width: 240,
    minWidth: 160,
    sortable: false,
    renderCell: (params) => (
      <ChannelListingsCell listings={params.row.channelListings} />
    ),
  },
];

const ChannelListingsCell = ({
  listings,
}: {
  listings: Partial<Record<ProductSalesChannel, ChannelListing>> | undefined;
}) => {
  const entries = (['allegro', 'woocommerce', 'erli'] as const).flatMap(
    (channel) => {
      const listing = listings?.[channel];
      if (!listing || listing === 'none') return [];
      return [[channel, listing] as const];
    },
  );
  if (entries.length === 0) return '—';
  const text = entries
    .map(([channel, listing]) => {
      const name = orderChannelLabel(channel);
      const suffix = LISTING_LABEL[listing];
      return suffix ? `${name} (${suffix})` : name;
    })
    .join(', ');
  return (
    <Tooltip title={text}>
      <Typography variant="body2" noWrap sx={{ width: '100%' }}>
        {entries.map(([channel, listing], index) => {
          const suffix = LISTING_LABEL[listing];
          return (
            <Box
              component="span"
              key={channel}
              sx={{
                color: listing === 'ended' ? 'warning.main' : 'text.primary',
              }}
            >
              {index > 0 ? ', ' : ''}
              {orderChannelLabel(channel)}
              {suffix ? ` (${suffix})` : ''}
            </Box>
          );
        })}
      </Typography>
    </Tooltip>
  );
};

const SortArrow = ({ direction }: { direction: 'asc' | 'desc' }) =>
  direction === 'asc' ? (
    <ArrowUpwardIcon sx={{ fontSize: 14 }} />
  ) : (
    <ArrowDownwardIcon sx={{ fontSize: 14 }} />
  );

const SalesColumnHeader = ({
  ordering,
  onUnits,
  onDelta,
}: {
  ordering: 'units' | '-units' | 'delta' | '-delta' | null;
  onUnits: () => void;
  onDelta: () => void;
}) => {
  const unitsActive = ordering === 'units' || ordering === '-units';
  const deltaActive = ordering === 'delta' || ordering === '-delta';
  return (
    <Box
      role="button"
      tabIndex={0}
      aria-pressed={unitsActive}
      onClick={onUnits}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        onUnits();
      }}
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        justifyContent: 'center',
        px: 1,
        cursor: 'pointer',
        color: unitsActive ? 'primary.main' : 'inherit',
        fontWeight: unitsActive ? 700 : 500,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.25}>
        <span>{'Sprzedaż szt.'}</span>
        {unitsActive ? (
          <SortArrow direction={ordering === 'units' ? 'asc' : 'desc'} />
        ) : null}
      </Stack>
      <Stack direction="row" alignItems="center" spacing={0.75}>
        <Box
          component="span"
          role="button"
          tabIndex={0}
          aria-pressed={deltaActive}
          onClick={(event) => {
            event.stopPropagation();
            onDelta();
          }}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            event.stopPropagation();
            onDelta();
          }}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.25,
            fontSize: '0.75rem',
            lineHeight: 1.2,
            fontWeight: deltaActive ? 700 : 500,
            color: deltaActive ? 'primary.main' : 'text.secondary',
          }}
        >
          {'zmiana'}
          {deltaActive ? (
            <SortArrow direction={ordering === 'delta' ? 'asc' : 'desc'} />
          ) : null}
        </Box>
      </Stack>
    </Box>
  );
};

const actionColumn: GridColDef<ProductSalesListItem> = {
  field: 'action',
  headerName: '',
  width: 50,
  sortable: false,
  renderCell: () => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        height: '100%',
      }}
    >
      <ChevronRightIcon style={{ fontSize: 30 }} />
    </Box>
  ),
};

const stockOnBranch = (
  branches: ProductBranch[] | undefined,
  branchId: number,
) => (branches || []).find((item) => item.branch.id === branchId);

export const ProductsListPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAppSelector((state) => state.smSystemUser);
  const canViewPurchases = !!user?.permissions?.canViewPurchasePrices;
  const [branchId, setBranchId] = useState<number | null>(readStoredBranchId);
  const { data: branches } = useQuery({
    queryKey: ['organization-branches', 'product-stock'],
    queryFn: async ({ signal }) => {
      const response = await axiosInstance.get<ListResponse<StockBranch>>(
        '/api/v1/organizations/branches/',
        { params: { pageSize: 1000 }, signal },
      );
      if (response.status >= 400) throwAxiosErrorFromResponse(response);
      return response.data.results;
    },
  });
  const {
    products,
    totalCount,
    isLoading,
    isError,
    page,
    setPage,
    query,
    setQuery,
    missingPurchaseCost,
    setMissingPurchaseCost,
    manualUnset,
    setManualUnset,
    channels,
    setChannels,
    startDate,
    endDate,
    preset,
    rangeError,
    setSalesDates,
    setSalesPreset,
    previousStart,
    previousEnd,
    soldOnly,
    setSoldOnly,
    ordering,
    setOrdering,
    coverWithin,
    setCoverWithin,
    currency,
  } = useGetProductSalesOverview({ canViewPurchases, branchId });

  useEffect(() => {
    if (!branches?.length) return;
    if (branchId != null && branches.some((branch) => branch.id === branchId))
      return;
    const fallback = branches[0].id;
    setBranchId(fallback);
    localStorage.setItem(STOCK_BRANCH_STORAGE_KEY, String(fallback));
  }, [branches, branchId]);

  const selectedBranch =
    branches?.find((branch) => branch.id === branchId) ?? null;
  const apiRef = useGridApiRef();
  usePinDataGridColumn(apiRef, 'name', true);

  useEffect(() => {
    const api = apiRef.current;
    if (!products.length || !api?.autosizeColumns) return undefined;
    const frame = requestAnimationFrame(() => {
      void api.autosizeColumns({
        columns: [
          'internalId',
          'vat',
          'units',
          'revenueCents',
          'ordersCount',
          'stock',
          'daysOfCover',
        ],
        includeHeaders: true,
        includeOutliers: true,
        expand: false,
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [apiRef, products, selectedBranch?.name]);

  const sortModel = useMemo<GridSortModel>(() => {
    if (ordering === 'name' || ordering === '-name')
      return [{ field: 'name', sort: ordering === '-name' ? 'desc' : 'asc' }];
    if (ordering === 'revenue' || ordering === '-revenue') {
      return [
        {
          field: 'revenueCents',
          sort: ordering.startsWith('-') ? 'desc' : 'asc',
        },
      ];
    }
    if (branchId != null && (ordering === 'cover' || ordering === '-cover')) {
      return [
        {
          field: 'daysOfCover',
          sort: ordering.startsWith('-') ? 'desc' : 'asc',
        },
      ];
    }
    return [];
  }, [branchId, ordering]);

  const cycleSalesOrdering = useCallback(
    (kind: 'units' | 'delta') => {
      const descending = kind === 'units' ? '-units' : '-delta';
      const ascending = kind === 'units' ? 'units' : 'delta';
      if (ordering === descending) setOrdering(ascending);
      else if (ordering === ascending) setOrdering(null);
      else setOrdering(descending);
    },
    [ordering, setOrdering],
  );

  const periodDays = dayjs(endDate).diff(dayjs(startDate), 'day') + 1;
  const salesChannelKey = channels.join(',');

  const columns = useMemo(() => {
    const selectedChannels = salesChannelKey ? salesChannelKey.split(',') : [];
    const receiptSelected = selectedChannels.includes('receipt');
    const ecommerceSelected =
      selectedChannels.length === 0 ||
      selectedChannels.some((channel) => channel !== 'receipt');
    const documentCount =
      receiptSelected && ecommerceSelected
        ? {
            headerName: 'Liczba zamówień i paragonów',
            caption: 'zamówień i paragonów',
            unitLabel: 'zamówień i paragonów',
            description:
              'Ile zamówień z kanałów i paragonów wybranego sklepu zawierało ten produkt.',
            width: 176,
          }
        : receiptSelected
          ? {
              headerName: 'Liczba paragonów',
              caption: 'paragonów',
              unitLabel: 'paragonów',
              description:
                'Ile paragonów wybranego sklepu zawierało ten produkt.',
              width: 132,
            }
          : {
              headerName: 'Liczba zamówień',
              caption: 'zamówień',
              unitLabel: 'zamówień',
              description:
                'Ile zamówień z wybranych kanałów zawierało ten produkt.',
              width: 124,
            };
    const salesColumns: GridColDef<ProductSalesListItem>[] = [
      {
        field: 'units',
        headerName: 'Sprzedaż szt.',
        description:
          'Sztuki sprzedane w wybranym okresie. Kliknięcie nagłówka sortuje po sztukach. Napis „zmiana” sortuje po zmianie wobec poprzedniego okresu.',
        width: 156,
        minWidth: 120,
        align: 'right',
        headerAlign: 'right',
        sortable: false,
        renderHeader: () => (
          <SalesColumnHeader
            ordering={
              ordering === 'units' ||
              ordering === '-units' ||
              ordering === 'delta' ||
              ordering === '-delta'
                ? ordering
                : null
            }
            onUnits={() => cycleSalesOrdering('units')}
            onDelta={() => cycleSalesOrdering('delta')}
          />
        ),
        renderCell: (params) => (
          <SalesPeriodFigure
            units={params.row.units}
            previous={params.row.previousUnits}
          />
        ),
      },
      {
        field: 'revenueCents',
        headerName: 'Wartość sprzedaży',
        description:
          'Wartość brutto sprzedaży z wybranych kanałów. Paczka Allegro liczy sztuki, a przychód zostaje przy ofercie.',
        width: 148,
        minWidth: 120,
        align: 'right',
        headerAlign: 'right',
        renderHeader: () => (
          <Stack alignItems="flex-end" spacing={0} sx={{ lineHeight: 1.15 }}>
            <span>{'Wartość'}</span>
            <Box
              component="span"
              sx={{
                fontSize: '0.75rem',
                fontWeight: 500,
                color: 'text.secondary',
              }}
            >
              {'sprzedaży'}
            </Box>
          </Stack>
        ),
        renderCell: (params) => (
          <SalesPeriodFigure
            units={params.row.revenueCents}
            previous={params.row.previousRevenueCents}
            formatValue={(value) => formatPrice(value, currency)}
            unitLabel=""
            extraTip={
              params.row.fxMissingLines > 0
                ? 'Część pozycji nie weszła do kwoty.'
                : undefined
            }
          />
        ),
      },
      {
        field: 'ordersCount',
        headerName: documentCount.headerName,
        description: documentCount.description,
        width: documentCount.width,
        minWidth: 108,
        align: 'right',
        headerAlign: 'right',
        sortable: false,
        renderHeader: () => (
          <Stack alignItems="flex-end" spacing={0} sx={{ lineHeight: 1.15 }}>
            <span>{'Liczba'}</span>
            <Box
              component="span"
              sx={{
                fontSize: '0.75rem',
                fontWeight: 500,
                color: 'text.secondary',
              }}
            >
              {documentCount.caption}
            </Box>
          </Stack>
        ),
        renderCell: (params) => (
          <SalesPeriodFigure
            units={params.row.ordersCount}
            previous={params.row.previousOrdersCount}
            unitLabel={documentCount.unitLabel}
          />
        ),
      },
      {
        field: 'stock',
        headerName: 'Stan',
        description: selectedBranch
          ? `Stan magazynowy w sklepie ${selectedBranch.name}`
          : 'Stan magazynowy wybranego sklepu',
        width: 72,
        minWidth: 56,
        align: 'right',
        headerAlign: 'right',
        sortable: false,
        renderCell: (params) => {
          if (branchId == null) return '—';
          const entry = stockOnBranch(params.row.branches, branchId);
          if (!entry) return '—';
          const updated = entry.stockUpdatedAt
            ? dayjs(entry.stockUpdatedAt).format('DD.MM.YYYY HH:mm')
            : null;
          return (
            <Tooltip
              title={
                updated
                  ? `Aktualizacja ${updated}`
                  : 'Brak daty aktualizacji stanu'
              }
            >
              <Box
                component="span"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  height: '100%',
                }}
              >
                {formatStock(entry.stock)}
              </Box>
            </Tooltip>
          );
        },
      },
      {
        field: 'daysOfCover',
        headerName: 'Dni zapasu',
        description: selectedBranch
          ? `Na ile dni starczy stan w sklepie ${selectedBranch.name} przy sprzedaży paragonowej z wybranego okresu`
          : 'Wybierz sklep, żeby policzyć zapas w dniach',
        width: 118,
        minWidth: 100,
        align: 'right',
        headerAlign: 'right',
        sortable: branchId != null,
        renderCell: (params) => {
          if (branchId == null || !selectedBranch) return '—';
          const days = params.row.daysOfCover;
          const entry = stockOnBranch(params.row.branches, branchId);
          const stockText = entry ? formatStock(entry.stock) : '—';
          const soldText = formatStock(params.row.storeUnitsSold);
          const title =
            days == null
              ? `Brak sprzedaży paragonowej w ${selectedBranch.name} przez ${periodDays} dni. Stan: ${stockText}.`
              : `Stan ${stockText} w ${selectedBranch.name} starczy na ${days.toLocaleString('pl-PL', { maximumFractionDigits: 1 })} dni przy ${soldText} szt. na paragonach (${periodDays} dni).`;
          const label =
            days == null
              ? '—'
              : days.toLocaleString('pl-PL', { maximumFractionDigits: 1 });
          return (
            <Tooltip title={title}>
              <Box
                component="span"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  height: '100%',
                  width: '100%',
                }}
              >
                {label}
              </Box>
            </Tooltip>
          );
        },
      },
    ];
    const manualColumn: GridColDef<ProductSalesListItem> = {
      field: 'manualPurchaseNetPrice',
      headerName: 'Ręczna cena',
      width: 140,
      sortable: false,
      valueGetter: (_value, row) =>
        row.manualPurchaseNetPrice != null ? 'Tak' : 'Nie',
    };
    return [
      nameColumn,
      skuColumn,
      vatColumn,
      ...salesColumns,
      ...trailingColumns,
      ...(canViewPurchases && missingPurchaseCost ? [manualColumn] : []),
      actionColumn,
    ];
  }, [
    branchId,
    canViewPurchases,
    currency,
    cycleSalesOrdering,
    missingPurchaseCost,
    ordering,
    periodDays,
    salesChannelKey,
    selectedBranch,
  ]);

  if (!user?.permissions?.canAccessEcommerce)
    return <Navigate to={Pages.smSystem} replace />;

  const handleRowClick = (params: GridRowParams<ProductSalesListItem>) => {
    const next = new URLSearchParams(
      productsListSearchString(searchParams).replace(/^\?/, ''),
    );
    next.set('tab', 'sales');
    if (!rangeError) {
      next.set('start_date', startDate);
      next.set('end_date', endDate);
    }
    navigate({
      pathname: Pages.smSystemProductDetails.replace(
        ':productId',
        String(params.row.id),
      ),
      search: `?${next.toString()}`,
    });
  };

  const selectBranch = (id: number) => {
    setBranchId(id);
    localStorage.setItem(STOCK_BRANCH_STORAGE_KEY, String(id));
  };

  return (
    <Stack spacing={2}>
      <Stack
        direction="row"
        spacing={1.5}
        useFlexGap
        flexWrap="wrap"
        alignItems="center"
      >
        <TextField
          size="small"
          label="Szukaj po nazwie, EAN lub SKU"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ minWidth: 280, maxWidth: 480 }}
        />
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="product-sales-channel-label">
            {'Kanał sprzedaży'}
          </InputLabel>
          <Select
            labelId="product-sales-channel-label"
            label="Kanał sprzedaży"
            multiple
            value={channels}
            onChange={(event) => {
              const value = event.target.value;
              const next = (
                typeof value === 'string' ? value.split(',') : value
              ) as ProductListChannel[];
              setChannels(next);
            }}
            renderValue={(selected) =>
              selected.map((channel) => salesChannelLabel(channel)).join(', ')
            }
          >
            {SALES_CHANNEL_OPTIONS.map((channel) => (
              <MenuItem key={channel.source} value={channel.source}>
                {channel.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={preset}
          onChange={(_event, value: 7 | 30 | 90 | null) => {
            if (value) setSalesPreset(value);
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
            setSalesDates(value.format('YYYY-MM-DD'), endDate);
          }}
          slotProps={{ textField: { size: 'small' } }}
        />
        <DatePicker
          label="Do"
          format="DD.MM.YYYY"
          value={dayjs(endDate)}
          onChange={(value) => {
            if (!value?.isValid()) return;
            setSalesDates(startDate, value.format('YYYY-MM-DD'));
          }}
          slotProps={{ textField: { size: 'small' } }}
        />
        <FormControl
          size="small"
          sx={{ minWidth: 220 }}
          disabled={!branches?.length}
        >
          <InputLabel id="product-stock-branch-label">
            {'Sklep (stan)'}
          </InputLabel>
          <Select
            labelId="product-stock-branch-label"
            label="Sklep (stan)"
            value={selectedBranch ? String(selectedBranch.id) : ''}
            onChange={(event) => selectBranch(Number(event.target.value))}
          >
            {(branches || []).map((branch) => (
              <MenuItem key={branch.id} value={String(branch.id)}>
                {branch.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl
          size="small"
          sx={{ minWidth: 140 }}
          disabled={branchId == null}
        >
          <InputLabel id="product-cover-within-label">{'Zapas do'}</InputLabel>
          <Select
            labelId="product-cover-within-label"
            label="Zapas do"
            value={coverWithin == null ? '' : String(coverWithin)}
            onChange={(event) => {
              const raw = event.target.value;
              setCoverWithin(
                raw === '' ? null : (Number(raw) as CoverWithinDays),
              );
            }}
          >
            <MenuItem value="">{'Dowolny'}</MenuItem>
            <MenuItem value="7">{'7 dni'}</MenuItem>
            <MenuItem value="14">{'14 dni'}</MenuItem>
            <MenuItem value="30">{'30 dni'}</MenuItem>
          </Select>
        </FormControl>
        <FormControlLabel
          sx={{ mx: 0 }}
          control={
            <Switch
              checked={soldOnly}
              onChange={(event) => setSoldOnly(event.target.checked)}
              size="small"
            />
          }
          label="Tylko ze sprzedażą"
        />
        {canViewPurchases ? (
          <>
            <FormControlLabel
              sx={{ mx: 0 }}
              control={
                <Switch
                  checked={missingPurchaseCost}
                  onChange={(event) =>
                    setMissingPurchaseCost(event.target.checked)
                  }
                  size="small"
                />
              }
              label="Brak historii zakupu"
            />
            {missingPurchaseCost ? (
              <FormControlLabel
                sx={{ mx: 0 }}
                control={
                  <Switch
                    checked={manualUnset}
                    onChange={(event) => setManualUnset(event.target.checked)}
                    size="small"
                  />
                }
                label="Bez ręcznej ceny zakupu"
              />
            ) : null}
          </>
        ) : null}
      </Stack>

      {previousStart && previousEnd ? (
        <Typography variant="body2" color="text.secondary">
          {`Porównanie z ${formatSalesIso(previousStart)} – ${formatSalesIso(previousEnd)}`}
        </Typography>
      ) : null}
      {rangeError ? <Alert severity="warning">{rangeError}</Alert> : null}
      {isError ? (
        <Alert severity="error">
          {'Nie udało się pobrać sprzedaży produktów.'}
        </Alert>
      ) : null}

      <DataGrid
        rows={products}
        columns={columns}
        loading={isLoading}
        autoHeight
        disableColumnFilter
        disableColumnMenu
        disableRowSelectionOnClick
        sortingMode="server"
        sortModel={sortModel}
        onSortModelChange={(model) => {
          const next = model[0];
          if (!next?.sort) {
            const unitsOrDelta =
              ordering === 'units' ||
              ordering === '-units' ||
              ordering === 'delta' ||
              ordering === '-delta';
            const coverWaitingForBranch =
              branchId == null &&
              (ordering === 'cover' || ordering === '-cover');
            if (unitsOrDelta || coverWaitingForBranch) return;
            setOrdering(null);
            return;
          }
          if (next.field === 'name') {
            setOrdering(next.sort === 'desc' ? '-name' : 'name');
            return;
          }
          if (next.field === 'revenueCents') {
            setOrdering(next.sort === 'desc' ? '-revenue' : 'revenue');
            return;
          }
          if (next.field === 'daysOfCover') {
            setOrdering(next.sort === 'desc' ? '-cover' : 'cover');
            return;
          }
          setOrdering(null);
        }}
        onRowClick={handleRowClick}
        pageSizeOptions={[25]}
        paginationMode="server"
        rowCount={totalCount ?? 0}
        paginationModel={{ page, pageSize: 25 }}
        onPaginationModelChange={(model) => setPage(model.page)}
        rowHeight={64}
        columnHeaderHeight={64}
        apiRef={apiRef}
        sx={{
          '& .MuiDataGrid-columnHeader[data-field="units"]': {
            padding: 0,
          },
          '& .MuiDataGrid-columnHeader[data-field="units"] .MuiDataGrid-columnHeaderTitleContainer, & .MuiDataGrid-columnHeader[data-field="units"] .MuiDataGrid-columnHeaderTitleContainerContent':
            {
              width: '100%',
              height: '100%',
            },
          '& .MuiDataGrid-row': { cursor: 'pointer' },
          '& .MuiDataGrid-cell': {
            display: 'flex',
            alignItems: 'center',
          },
          border: 'none',
          ...reportDataGridLayoutSx,
        }}
      />
    </Stack>
  );
};
