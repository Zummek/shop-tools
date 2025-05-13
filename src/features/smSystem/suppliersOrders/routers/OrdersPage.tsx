import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Stack, Button, Box } from '@mui/material';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Pages } from '../../../../utils';
import { Branch, Supplier } from '../../app/types';
import { useGetOrders } from '../api/useGetOrders';
import { AddOrderModal } from '../components/AddOrderModal/AddOrderModal';

const columns: GridColDef[] = [
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
    width: 350,
    valueGetter: (selectedBranches: Branch[]) =>
      selectedBranches.map((branch) => branch.name).join(', '),
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
    navigate(`${Pages.smSystemOrders}/${params.id}`);
  };

  return (
    <Stack spacing={2}>
      <Box>
        <Button variant="contained" onClick={handleOpenModal}>
          {'Nowe zamówienie'}
        </Button>
      </Box>
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
