import { LoadingButton } from '@mui/lab';
import { Box, Stack, Typography } from '@mui/material';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { useState } from 'react';

import {
  pageSize,
  useExportProductsDocuments,
  useGetProductsDocuments,
  useUpdateProductsDocumentsStatus,
} from '../api';
import { ProductsDocumentListItem, ProductsDocumentStatus } from '../types';

const statusColor: Record<ProductsDocumentStatus, string> = {
  PREPARING: 'black',
  PREPARED: 'black',
  POSTED: 'green',
  CANCELED: 'red',
};

const statusMessage: Record<ProductsDocumentStatus, string> = {
  CANCELED: 'Anulowany',
  POSTED: 'Zaksięgowany',
  PREPARED: 'Przygotowany',
  PREPARING: 'W trakcie tworzenia',
};

const columns: GridColDef<ProductsDocumentListItem>[] = [
  { field: 'id', headerName: 'ID', width: 70 },
  { field: 'name', headerName: 'Nazwa', width: 150 },
  {
    field: 'createdAt',
    headerName: 'Data utworzenia/\nmodyfikacji',
    width: 150,
    valueGetter: (value, row) => row.updatedAt || value,
    valueFormatter: (value) => dayjs(value).format('DD-MM-YYYY HH:mm'),
  },
  {
    field: 'itemsAmount',
    headerName: 'Ilość pozycji',
    width: 70,
    renderCell: (params) => params.row.documentProductsAmount,
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 140,
    renderCell: (params) => (
      <Typography color={statusColor[params.row.status]}>
        {statusMessage[params.row.status]}
      </Typography>
    ),
  },
  {
    field: 'comment',
    headerName: 'Komentarz',
    width: 100,
  },
  {
    field: 'branch',
    headerName: 'Sklep',
    width: 170,
    renderCell: (params) => (
      <Typography variant="body2">
        {params.row.branch?.name || 'Brak'}
      </Typography>
    ),
  },
];

export const ProductsDocumentsPage = () => {
  const [page, setPage] = useState(0);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);

  const { productsDocuments, totalCount, isLoading } = useGetProductsDocuments({
    page,
  });
  const { exportProductsDocuments, isPending: isExportingProductsDocuments } =
    useExportProductsDocuments();
  const {
    updateProductsDocumentsStatus,
    isPending: isUpdatingProductsDocumentsStatus,
  } = useUpdateProductsDocumentsStatus();

  const handlePageChange = (_event: unknown, page: number): void =>
    setPage(page);

  const handleExportProductsDocuments = () =>
    exportProductsDocuments({ ids: selectedDocIds.map(Number) });

  const handlePostProductsDocuments = () =>
    updateProductsDocumentsStatus({
      ids: selectedDocIds,
      status: 'POSTED',
    });

  const handleSelectionChange = (rowSelectionModel: GridRowSelectionModel) =>
    setSelectedDocIds(rowSelectionModel as string[]);

  return (
    <Stack spacing={4}>
      <Stack direction="row" spacing={2}>
        <LoadingButton
          variant="contained"
          color="primary"
          onClick={handleExportProductsDocuments}
          disabled={
            selectedDocIds.length === 0 ||
            isLoading ||
            isUpdatingProductsDocumentsStatus
          }
          loading={isExportingProductsDocuments}
        >
          {'Eksportuj do PC Market'}
        </LoadingButton>
        <LoadingButton
          variant="contained"
          color="primary"
          onClick={handlePostProductsDocuments}
          disabled={
            selectedDocIds.length === 0 ||
            isLoading ||
            isExportingProductsDocuments
          }
          loading={isUpdatingProductsDocumentsStatus}
        >
          {'Oznacz jako zaksięgowane'}
        </LoadingButton>
        <LoadingButton variant="contained" color="primary" disabled={true}>
          {'Utwórz grupę etykiet'}
        </LoadingButton>
      </Stack>
      <Box height={500}>
        <DataGrid
          sx={{
            '& .MuiDataGrid-columnHeaderTitle': {
              whiteSpace: 'normal',
              lineHeight: 'normal',
            },
            '& .MuiDataGrid-cell': {
              display: 'flex',
              alignItems: 'center',
            },
          }}
          rows={productsDocuments}
          rowCount={totalCount || 0}
          columns={columns}
          pageSizeOptions={[pageSize]}
          loading={isLoading}
          paginationModel={{
            page,
            pageSize,
          }}
          paginationMode="server"
          checkboxSelection
          disableColumnSorting
          disableColumnMenu
          onRowSelectionModelChange={handleSelectionChange}
          slotProps={{
            pagination: {
              showFirstButton: true,
              onPageChange: handlePageChange,
            },
          }}
        />
      </Box>
    </Stack>
  );
};
