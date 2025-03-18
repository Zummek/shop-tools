import { LoadingButton } from '@mui/lab';
import { Stack, Typography } from '@mui/material';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { useState } from 'react';

import {
  pageSize,
  useGetTransfers,
  useUpdateTransfersStatus,
  useExportTransfers,
} from '../api';
import { TransferListItem } from '../types';
import { TransferStatusEnum } from '../utils/transfers';

const statusColor: Record<TransferStatusEnum, string> = {
  PREPARING: 'black',
  PREPARED: 'black',
  RECEIVED: 'blue',
  POSTED: 'green',
  CANCELED: 'red',
};

const statusMessage: Record<TransferStatusEnum, string> = {
  CANCELED: 'Anulowany',
  POSTED: 'Zaksięgowany',
  PREPARED: 'Przygotowany',
  PREPARING: 'W trakcie tworzenia',
  RECEIVED: 'Odebrany',
};

const columns: GridColDef<TransferListItem>[] = [
  { field: 'humanId', headerName: 'ID', width: 70 },
  {
    field: 'createdAt',
    headerName: 'Data utworzenia/\nmodyfikacji',
    width: 150,
    valueGetter: (value, row) => row.updatedAt || value,
    valueFormatter: (value) => dayjs(value).format('DD-MM-YYYY HH:mm'),
  },
  {
    field: 'sourceBranch',
    headerName: 'Sklep źródłowy /\nNadawca',
    width: 170,
    renderCell: (params) => (
      <Typography variant="body2">
        {params.row.sourceBranch?.name || 'Brak'}
        <br />
        <Typography variant="caption">
          {params.row.sender.name || 'Brak nadawcy'}
        </Typography>
      </Typography>
    ),
  },
  {
    field: 'destinationBranch',
    headerName: 'Sklep docelowy /\nOdbiorca',
    width: 170,
    renderCell: (params) => (
      <Typography
        variant="body2"
        color={params.row.destinationBranch ? 'black' : '#ff7000'}
      >
        {params.row.destinationBranch?.name || 'Brak'}
        <br />
        <Typography
          variant="caption"
          color={params.row.receiver ? 'black' : '#cc7000'}
          sx={{ opacity: params.row.receiver ? 1 : 0.5 }}
        >
          {params.row.receiver?.name || 'Brak odbiorcy'}
        </Typography>
      </Typography>
    ),
  },
  {
    field: 'itemsAmount',
    headerName: 'Ilość pozycji',
    width: 70,
    align: 'center',
    renderCell: (params) => params.row.transferProductsAmount,
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
  const [selectedTransferIds, setSelectedTransferIds] = useState<number[]>([]);

  const { transfers, totalCount, isLoading } = useGetTransfers({ page });
  const { exportTransfers, isPending: isExportingTransfers } =
    useExportTransfers();
  const { updateTransfersStatus, isPending: isUpdatingTransfersStatus } =
    useUpdateTransfersStatus();

  const handlePageChange = (_event: unknown, page: number): void =>
    setPage(page);

  const handleExportTransfers = () =>
    exportTransfers({
      exportMethod: 'PC-Market-shipped',
      ids: selectedTransferIds.map(Number),
    });

  const handlePostTransfers = () => {
    updateTransfersStatus({
      ids: selectedTransferIds,
      status: TransferStatusEnum.POSTED,
    });
  };

  const handleSelectionChange = (rowSelectionModel: GridRowSelectionModel) =>
    setSelectedTransferIds(rowSelectionModel as number[]);

  return (
    <Stack spacing={4}>
      <Stack direction="row" spacing={2}>
        <LoadingButton
          variant="contained"
          color="primary"
          onClick={handleExportTransfers}
          disabled={
            selectedTransferIds.length === 0 ||
            isLoading ||
            isUpdatingTransfersStatus
          }
          loading={isExportingTransfers}
        >
          {'Eksportuj do PC Market'}
        </LoadingButton>
        <LoadingButton
          variant="contained"
          color="primary"
          onClick={handlePostTransfers}
          disabled={
            selectedTransferIds.length === 0 ||
            isLoading ||
            isExportingTransfers
          }
          loading={isUpdatingTransfersStatus}
        >
          {'Oznacz jako zaksięgowane'}
        </LoadingButton>
      </Stack>
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
