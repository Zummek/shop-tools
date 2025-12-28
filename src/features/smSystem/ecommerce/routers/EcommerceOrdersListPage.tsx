import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, Button, Stack, Typography } from '@mui/material';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useNotify } from '../../../../hooks';
import { Pages } from '../../../../utils';
import {
  EcommerceOrderListItem,
  useGetAllegroConnection,
  useGetEcommerceOrders,
} from '../api';
import { ImportEcommerceOrderModal } from '../modals/ImportEcommerceOrderModal/ImportEcommerceOrderModal';
import { orderStatusColors, orderStatusMessage } from '../utils';

const columns: GridColDef<EcommerceOrderListItem>[] = [
  {
    field: 'orderDate',
    headerName: 'Data zamówienia',
    width: 150,
    valueFormatter: (value: string) => dayjs(value).format('DD.MM.YYYY HH:mm'),
  },
  {
    field: 'orderSource',
    headerName: 'Miejsce zamówienia',
    width: 120,
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 120,
    renderCell: ({ row }) => (
      <Typography variant="body2" color={orderStatusColors[row.status]}>
        {orderStatusMessage[row.status]}
      </Typography>
    ),
  },
  {
    field: 'buyerName',
    headerName: 'Kupujący',
    width: 200,
    minWidth: 200,
    flex: 1,
  },
  {
    field: 'buyerLogin',
    headerName: 'Login kupującego',
    width: 200,
    minWidth: 200,
    flex: 1,
  },
  {
    field: 'itemsAmount',
    headerName: 'Ilość pozycji',
    width: 120,
    align: 'center',
  },
  {
    field: 'productsAmount',
    headerName: 'Ilość produktów',
    width: 120,
    align: 'center',
  },
  {
    field: 'action',
    headerName: '',
    headerAlign: 'right',
    align: 'right',
    width: 50,
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
export const EcommerceOrdersListPage = () => {
  const { notify } = useNotify();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const { ecommerceOrders, totalCount, isLoading, page, pageSize, setPage } =
    useGetEcommerceOrders();
  const { allegroConnection } = useGetAllegroConnection();

  const handlePageChange = (_event: unknown, page: number): void =>
    setPage(page);

  const handleRowClick = (params: GridRowParams) => {
    navigate(
      Pages.smSystemEcommerceOrderDetails.replace(
        ':orderId',
        params.id.toString()
      )
    );
  };

  const handleImportOrders = () => {
    if (!allegroConnection?.isActive) {
      notify('error', 'Twoja organizacja nie jest połączona z Allegro');
      return;
    }

    setIsModalOpen(true);
  };

  return (
    <Stack spacing={4}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="h4" component="h1">
          {'Zamówienia e-commerce'}
        </Typography>
        <Box>
          <Button variant="contained" onClick={handleImportOrders}>
            {'Zaimportuj z Allegro'}
          </Button>
        </Box>
      </Box>
      <Box height={500} width="100%">
        <DataGrid
          sx={{
            '& .MuiDataGrid-columnHeaderTitle': {
              whiteSpace: 'normal',
              lineHeight: 'normal',
            },
            '& .MuiDataGrid-cell': {
              display: 'flex',
              alignItems: 'center',
              whiteSpace: 'nowrap',
              overflow: 'visible',
            },
            '& .MuiDataGrid-cellContent': {
              overflow: 'visible',
              whiteSpace: 'nowrap',
            },
          }}
          rows={ecommerceOrders}
          rowCount={totalCount || 0}
          columns={columns}
          pageSizeOptions={[pageSize]}
          loading={isLoading}
          paginationModel={{
            page,
            pageSize,
          }}
          paginationMode="server"
          disableColumnSorting
          disableRowSelectionOnClick
          onRowClick={handleRowClick}
          disableColumnMenu
          style={{
            width: '100%',
          }}
          slotProps={{
            pagination: {
              showFirstButton: true,
              onPageChange: handlePageChange,
            },
          }}
        />
        <ImportEcommerceOrderModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </Box>
    </Stack>
  );
};
