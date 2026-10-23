import ChevronRightIcon from '@mui/icons-material/ChevronRight';
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
import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';

import { useAppSelector } from '../../../../../hooks';
import {
  axiosInstance,
  throwAxiosErrorFromResponse,
} from '../../../../../services';
import { Pages } from '../../../../../utils';
import { ListResponse } from '../../../app/types';
import { ORDER_CHANNELS, orderChannelLabel } from '../../../ecommerce/utils';
import {
  reportDataGridLayoutSx,
  usePinDataGridColumn,
} from '../../../reports/utils/usePinDataGridColumn';
import { useGetProductSalesOverview } from '../../api';
import { SalesPeriodFigure } from '../../components/SalesDelta';
import { ProductBranch, ProductSalesListItem } from '../../types';
import { ProductListChannel, productsListSearchString } from '../../utils';
import { formatSalesIso } from '../../utils/salesPeriod';

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

const nameColumn: GridColDef<ProductSalesListItem> = {
  field: 'name',
  headerName: 'Nazwa',
  width: 280,
  minWidth: 180,
  sortable: false,
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
    width: 160,
    sortable: false,
    valueGetter: (_value, row) =>
      (row.channels || [])
        .map((channel) => orderChannelLabel(channel))
        .join(', '),
  },
];

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
  } = useGetProductSalesOverview({ canViewPurchases });

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

  const [branchId, setBranchId] = useState<number | null>(readStoredBranchId);

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
        columns: ['internalId', 'vat', 'units', 'stock'],
        includeHeaders: true,
        includeOutliers: true,
        expand: false,
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [apiRef, products, selectedBranch?.name]);

  const sortModel = useMemo<GridSortModel>(() => {
    if (ordering === 'units' || ordering === '-units') {
      return [
        { field: 'units', sort: ordering.startsWith('-') ? 'desc' : 'asc' },
      ];
    }
    return [];
  }, [ordering]);

  const columns = useMemo(() => {
    const salesColumns: GridColDef<ProductSalesListItem>[] = [
      {
        field: 'units',
        headerName: 'Sprzedaż',
        description:
          'Sztuki sprzedane w wybranym okresie. Pod liczbą: zmiana i wynik poprzedniego okresu w nawiasie.',
        width: 108,
        minWidth: 88,
        align: 'right',
        headerAlign: 'right',
        renderCell: (params) => (
          <SalesPeriodFigure
            units={params.row.units}
            previous={params.row.previousUnits}
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
  }, [branchId, canViewPurchases, missingPurchaseCost, selectedBranch]);

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
              selected.map((channel) => orderChannelLabel(channel)).join(', ')
            }
          >
            {ORDER_CHANNELS.map((channel) => (
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
          if (!next?.sort || next.field !== 'units') {
            setOrdering(null);
            return;
          }
          setOrdering(next.sort === 'desc' ? '-units' : 'units');
        }}
        onRowClick={handleRowClick}
        pageSizeOptions={[25]}
        paginationMode="server"
        rowCount={totalCount ?? 0}
        paginationModel={{ page, pageSize: 25 }}
        onPaginationModelChange={(model) => setPage(model.page)}
        rowHeight={64}
        apiRef={apiRef}
        sx={{
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
