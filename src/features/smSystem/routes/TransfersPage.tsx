import { Box, Button, Stack, Typography } from '@mui/material';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { useState } from 'react';

import { pageSize, useGetTransfers } from '../api';
import { useExportTransfers } from '../api/useExportTransfers';
import { TransferListItem, TransferStatus } from '../types';

const statusColor: Record<TransferStatus, string> = {
  PREPARING: 'black',
  PREPARED: 'black',
  RECEIVED: 'blue',
  POSTED: 'green',
  CANCELED: 'red',
};

const statusMessage: Record<TransferStatus, string> = {
  CANCELED: 'Anulowany',
  POSTED: 'Zaksięgowany',
  PREPARED: 'Przygotowany',
  PREPARING: 'W trakcie tworzenia',
  RECEIVED: 'Odebrany',
};

const columns: GridColDef<TransferListItem>[] = [
  { field: 'id', headerName: 'ID', width: 60 },
  {
    field: 'createdAt',
    headerName: 'Data utworzenia/\nmodifuikacji',
    width: 150,
    valueGetter: (value, row) => row.updatedAt || value,
    valueFormatter: (value) => dayjs(+value).format('YYYY-MM-DD HH:mm'),
  },
  {
    field: 'sourceBranch',
    headerName: 'Sklep źródłowy /\nNadawca',
    width: 150,
    renderCell: (params) => (
      <Typography variant="body2">
        {params.row.sourceBranch?.name}
        <br />
        <Typography variant="caption">
          {params.row.sender
            ? `${params.row.sender.firstName} ${params.row.sender.lastName}`
            : 'Brak nadawcy'}
        </Typography>
      </Typography>
    ),
  },
  {
    field: 'destinationBranch',
    headerName: 'Sklep docelowy /\nOdbiorca',
    width: 150,
    renderCell: (params) => (
      <Typography variant="body2">
        {params.row.destinationBranch?.name}
        <br />
        <Typography
          variant="caption"
          color={params.row.recipient ? 'black' : '#cc7000'}
        >
          {params.row.recipient
            ? `${params.row.recipient?.firstName} ${params.row.recipient?.lastName}`
            : 'Brak odbiorcy'}
        </Typography>
      </Typography>
    ),
  },
  {
    field: 'itemsAmount',
    headerName: 'Ilość pozycji',
    width: 70,
    renderCell: (params) => params.row.transferProducts.length,
  },
  {
    field: 'productsAmount',
    headerName: 'Ilość produktów',
    width: 90,
    renderCell: (params) =>
      params.row.transferProducts.reduce(
        (accumulator, tp) => accumulator + tp.amount,
        0
      ),
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 120,
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
];

export const TransfersPage = () => {
  const [page, setPage] = useState(0);
  const [selectedTransferIds, setSelectedTransferIds] = useState<string[]>([]);

  const { transfers, totalCount, isLoading } = useGetTransfers({ page });
  const { exportTransfers } = useExportTransfers();

  const handlePageChange = (_event: unknown, page: number): void =>
    setPage(page);

  const handleExportTransfers = async () => {
    const res = await exportTransfers({
      exportMethod: 'PC-Market-shipped',
      ids: selectedTransferIds.map(Number),
    });
    const fileContent = res.data;
    const fileName = res.headers['content-disposition']
      .split('=')[1]
      .replace(/"/g, '');

    const element = document.createElement('a');
    const file = new Blob([fileContent], { type: 'text/csv' });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
  };

  const handleSelectionChange = (rowSelectionModel: GridRowSelectionModel) =>
    setSelectedTransferIds(rowSelectionModel as string[]);

  return (
    <Stack spacing={4}>
      <Box>
        <Button
          variant="contained"
          color="primary"
          onClick={handleExportTransfers}
          disabled={selectedTransferIds.length === 0}
        >
          {'Eksportuj do PC Market'}
        </Button>
      </Box>
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
        rows={transfers}
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
    </Stack>
  );
};
