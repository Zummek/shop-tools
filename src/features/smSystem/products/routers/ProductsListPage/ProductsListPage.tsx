import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {
  Box,
  CircularProgress,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
} from '@mui/material';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { useMemo } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';

import { useAppSelector } from '../../../../../hooks';
import { Pages } from '../../../../../utils';
import { ORDER_CHANNELS, orderChannelLabel } from '../../../ecommerce/utils';
import { useGetProducts } from '../../api';
import { Product } from '../../types';
import { ProductListChannel, productsListSearchString } from '../../utils';

const baseColumns: GridColDef<Product>[] = [
  {
    field: 'internalId',
    headerName: 'SKU',
    width: 160,
  },
  {
    field: 'name',
    headerName: 'Nazwa',
    flex: 1,
    minWidth: 220,
  },
  {
    field: 'barcodes',
    headerName: 'Kody EAN',
    flex: 1,
    minWidth: 180,
    valueGetter: (_value, row) => (row.barcodes || []).join(', '),
  },
  {
    field: 'channels',
    headerName: 'Kanały',
    width: 180,
    sortable: false,
    valueGetter: (_value, row) =>
      (row.channels || [])
        .map((channel) => orderChannelLabel(channel))
        .join(', '),
  },
  {
    field: 'vat',
    headerName: 'VAT',
    width: 80,
    valueFormatter: (value: number) => (value != null ? `${value}%` : '—'),
  },
];

const actionColumn: GridColDef<Product> = {
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

export const ProductsListPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAppSelector((state) => state.smSystemUser);
  const canViewPurchases = !!user?.permissions?.canViewPurchasePrices;
  const {
    products,
    totalCount,
    isLoading,
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
  } = useGetProducts({
    syncSearchParams: true,
    canViewPurchases,
  });

  const columns = useMemo(() => {
    if (!canViewPurchases || !missingPurchaseCost)
      return [...baseColumns, actionColumn];
    const manualColumn: GridColDef<Product> = {
      field: 'manualPurchaseNetPrice',
      headerName: 'Ręczna cena',
      width: 140,
      valueGetter: (_value, row) =>
        row.manualPurchaseNetPrice != null ? 'Tak' : 'Nie',
    };
    return [...baseColumns, manualColumn, actionColumn];
  }, [canViewPurchases, missingPurchaseCost]);

  if (!user?.permissions?.canAccessEcommerce)
    return <Navigate to={Pages.smSystem} replace />;

  const handleRowClick = (params: GridRowParams<Product>) => {
    navigate({
      pathname: Pages.smSystemProductDetails.replace(
        ':productId',
        String(params.row.id),
      ),
      search: productsListSearchString(searchParams),
    });
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        <TextField
          size="small"
          label="Szukaj po nazwie, EAN lub SKU"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ minWidth: 360, maxWidth: 480 }}
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
        {canViewPurchases ? (
          <>
            <FormControlLabel
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

      {isLoading && products.length === 0 ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <DataGrid
          rows={products}
          columns={columns}
          loading={isLoading}
          autoHeight
          disableColumnFilter
          disableColumnMenu
          disableRowSelectionOnClick
          onRowClick={handleRowClick}
          pageSizeOptions={[25]}
          paginationMode="server"
          rowCount={totalCount ?? 0}
          paginationModel={{ page, pageSize: 25 }}
          onPaginationModelChange={(model) => setPage(model.page)}
          sx={{
            '& .MuiDataGrid-row': { cursor: 'pointer' },
            border: 'none',
          }}
        />
      )}
    </Stack>
  );
};
