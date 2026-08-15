import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Stack, Button, Box, Chip } from '@mui/material';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Pages } from '../../../../utils';
import { useGetOrders } from '../api';
import { AddOrderModal } from '../components/AddOrderModal/AddOrderModal';
import { SuppliersOrdersToolbar } from '../components/SuppliersOrdersToolbar';
import { Branch, Order, Supplier } from '../types';

const columns: GridColDef<Order>[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 70,
  },
  {
    field: 'supplier',
    headerName: 'Dostawca',
    width: 200,
    valueGetter: (value: Supplier) => value.name,
  },
  {
    field: 'selectedBranches',
    headerName: 'Wybrane sklepy',
    width: 300,
    valueGetter: (selectedBranches: Branch[]) =>
      selectedBranches.map((branch) => branch.name).join(', '),
  },
  {
    field: 'isAutoDraft',
    headerName: 'Typ',
    width: 130,
    renderCell: ({ value }) =>
      value ? <Chip size="small" color="info" label="Auto-szkic" /> : null,
  },
  {
    field: 'createdAt',
    headerName: 'Data utworzenia',
    width: 180,
    valueGetter: (createdAt: string) =>
      dayjs(createdAt).format('DD.MM.YYYY HH:mm'),
  },
  {
    field: 'action',
    headerName: '',
    headerAlign: 'right',
    align: 'right',
    flex: 1,
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

export const OrdersPage = () => {
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const { orders, isLoading, pagination, setPagination } = useGetOrders();

  const handleRowClick = (params: GridRowParams) => {
    navigate(`${Pages.smSystemOrdersV2}/${params.id}`);
  };

  return (
    <Stack spacing={2}>
      <SuppliersOrdersToolbar
        actions={
          <Button variant="contained" size="small" onClick={handleOpenModal}>
            {'Nowe zamówienie'}
          </Button>
        }
      />
      <Box height={500}>
        <DataGrid
          rows={orders?.results ?? []}
          loading={isLoading}
          columns={columns}
          disableColumnSorting
          disableColumnMenu
          disableRowSelectionOnClick
          onRowClick={handleRowClick}
          pageSizeOptions={[25, 50]}
          paginationModel={pagination}
          onPaginationModelChange={setPagination}
          paginationMode="server"
          rowCount={orders?.count ?? 0}
          localeText={{
            noRowsLabel: 'Brak zamówień',
          }}
        />
      </Box>

      <AddOrderModal open={isModalOpen} handleClose={handleCloseModal} />
    </Stack>
  );
};
