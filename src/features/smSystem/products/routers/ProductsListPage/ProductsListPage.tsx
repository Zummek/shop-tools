import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, CircularProgress, Stack, TextField } from '@mui/material';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { useAppSelector } from '../../../../../hooks';
import { Pages } from '../../../../../utils';
import { useGetProducts } from '../../api';
import { Product } from '../../types';

const columns: GridColDef<Product>[] = [
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
  {
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
  },
];

export const ProductsListPage = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.smSystemUser);
  const { products, totalCount, isLoading, page, setPage, query, setQuery } =
    useGetProducts();

  const [searchInput, setSearchInput] = useState(query);

  useEffect(() => {
    const timeout = setTimeout(() => setQuery(searchInput), 300);
    return () => clearTimeout(timeout);
  }, [searchInput, setQuery]);

  if (!user?.permissions?.canAccessEcommerce)
    return <Navigate to={Pages.smSystem} replace />;

  const handleRowClick = (params: GridRowParams<Product>) => {
    navigate(
      Pages.smSystemProductDetails.replace(':productId', String(params.row.id)),
    );
  };

  return (
    <Stack spacing={2}>
      <TextField
        size="small"
        label="Szukaj po nazwie lub EAN"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        sx={{ maxWidth: 400 }}
      />

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
