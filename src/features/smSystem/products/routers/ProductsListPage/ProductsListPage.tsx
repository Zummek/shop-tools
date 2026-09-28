import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {
  Box,
  CircularProgress,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
} from '@mui/material';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { useAppSelector } from '../../../../../hooks';
import { Pages } from '../../../../../utils';
import { useGetProducts } from '../../api';
import { Product } from '../../types';

const baseColumns: GridColDef<Product>[] = [
  {
    field: 'internalId',
    headerName: 'SKU / ID wewnętrzne',
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
  const { user } = useAppSelector((state) => state.smSystemUser);
  const canViewPurchases = !!user?.permissions?.canViewPurchasePrices;
  const [missingPurchaseCost, setMissingPurchaseCost] = useState(false);
  const [manualUnset, setManualUnset] = useState(false);
  const { products, totalCount, isLoading, page, setPage, query, setQuery } =
    useGetProducts({
      missingPurchaseCost: canViewPurchases && missingPurchaseCost,
      manualUnset: canViewPurchases && missingPurchaseCost && manualUnset,
    });

  const [searchInput, setSearchInput] = useState(query);

  useEffect(() => {
    const timeout = setTimeout(() => setQuery(searchInput), 300);
    return () => clearTimeout(timeout);
  }, [searchInput, setQuery]);

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
    navigate(
      Pages.smSystemProductDetails.replace(':productId', String(params.row.id)),
    );
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        <TextField
          size="small"
          label="Szukaj po nazwie lub EAN"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{ maxWidth: 400 }}
        />
        {canViewPurchases ? (
          <>
            <FormControlLabel
              control={
                <Switch
                  checked={missingPurchaseCost}
                  onChange={(event) => {
                    setMissingPurchaseCost(event.target.checked);
                    if (!event.target.checked) setManualUnset(false);
                    setPage(0);
                  }}
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
                    onChange={(event) => {
                      setManualUnset(event.target.checked);
                      setPage(0);
                    }}
                    size="small"
                  />
                }
                label="Jeszcze bez ręcznej ceny"
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
