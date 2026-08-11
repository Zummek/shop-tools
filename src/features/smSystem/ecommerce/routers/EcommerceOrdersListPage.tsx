import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useNotify } from '../../../../hooks';
import { Pages } from '../../../../utils';
import {
  EcommerceOrderListItem,
  OrderSourceFilter,
  useGetAllegroConnection,
  useGetEcommerceOrders,
  useGetWooCommerceConnection,
} from '../api';
import {
  OrderStatusChip,
  OrdersDailyChart,
  OrdersStatsCards,
  WooStatusChip,
} from '../components';
import { ImportEcommerceOrderModal } from '../modals/ImportEcommerceOrderModal/ImportEcommerceOrderModal';
import { wooStatusLabel } from '../utils';

const orderSourceLabel = (source: string) => {
  if (source === 'allegro') return 'Allegro';
  if (source === 'woocommerce') return 'WooCommerce';
  if (source === 'erli') return 'Erli';
  return source || '—';
};

const EllipsisCell = ({ value }: { value: string | null | undefined }) => {
  const text = value || '—';
  return (
    <Tooltip title={text} enterDelay={500}>
      <Typography
        variant="body2"
        noWrap
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          width: '100%',
        }}
      >
        {text}
      </Typography>
    </Tooltip>
  );
};

const columns: GridColDef<EcommerceOrderListItem>[] = [
  {
    field: 'orderDate',
    headerName: 'Data zamówienia',
    width: 150,
    valueFormatter: (value: string) => dayjs(value).format('DD.MM.YYYY HH:mm'),
  },
  {
    field: 'orderSource',
    headerName: 'Źródło',
    width: 130,
    valueFormatter: (value: string) => orderSourceLabel(value),
  },
  {
    field: 'status',
    headerName: 'Status SM',
    minWidth: 160,
    renderCell: ({ row }) => <OrderStatusChip status={row.status} />,
  },
  {
    field: 'externalStatus',
    headerName: 'Status Woo',
    minWidth: 160,
    renderCell: ({ row }) => {
      if (row.orderSource !== 'woocommerce') {
        return (
          <Typography variant="body2" color="text.secondary">
            {'—'}
          </Typography>
        );
      }
      return (
        <WooStatusChip
          status={row.status}
          externalStatus={row.externalStatus}
        />
      );
    },
    valueGetter: (_value, row) =>
      row.orderSource === 'woocommerce'
        ? wooStatusLabel(row.externalStatus)
        : '',
  },
  {
    field: 'buyerName',
    headerName: 'Kupujący',
    width: 180,
    minWidth: 140,
    flex: 1,
    renderCell: ({ row }) => <EllipsisCell value={row.buyerName} />,
  },
  {
    field: 'deliveryName',
    headerName: 'Metoda dostawy',
    width: 280,
    minWidth: 180,
    flex: 1.2,
    renderCell: ({ row }) => <EllipsisCell value={row.deliveryName} />,
  },
  {
    field: 'buyerLogin',
    headerName: 'Login kupującego',
    width: 160,
    minWidth: 120,
    flex: 0.8,
    renderCell: ({ row }) => <EllipsisCell value={row.buyerLogin} />,
  },
  {
    field: 'itemsAmount',
    headerName: 'Ilość pozycji',
    width: 110,
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

  const {
    ecommerceOrders,
    totalCount,
    isLoading,
    page,
    pageSize,
    setPage,
    orderSource,
    setOrderSource,
  } = useGetEcommerceOrders();
  const { allegroConnection } = useGetAllegroConnection();
  const { wooCommerceConnection } = useGetWooCommerceConnection();

  const anyChannelConnected =
    !!allegroConnection?.isConnected || !!wooCommerceConnection?.isConnected;

  const handlePageChange = (_event: unknown, page: number): void =>
    setPage(page);

  const handleRowClick = (params: GridRowParams) => {
    navigate(
      Pages.smSystemEcommerceOrderDetails.replace(
        ':orderId',
        params.id.toString(),
      ),
    );
  };

  const handleImportOrders = () => {
    if (!anyChannelConnected) {
      notify(
        'error',
        'Połącz Allegro lub WooCommerce w zakładce Integracje, aby importować zamówienia',
      );
      return;
    }

    setIsModalOpen(true);
  };

  return (
    <Stack spacing={2}>
      <OrdersStatsCards />
      <OrdersDailyChart />
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        gap={2}
        flexWrap="wrap"
      >
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="order-source-filter-label">{'Źródło'}</InputLabel>
          <Select
            labelId="order-source-filter-label"
            label="Źródło"
            value={orderSource}
            onChange={(e) =>
              setOrderSource(e.target.value as OrderSourceFilter)
            }
          >
            <MenuItem value="">{'Wszystkie'}</MenuItem>
            <MenuItem value="allegro">{'Allegro'}</MenuItem>
            <MenuItem value="woocommerce">{'WooCommerce'}</MenuItem>
            <MenuItem value="erli">{'Erli'}</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" onClick={handleImportOrders}>
          {'Importuj zamówienia'}
        </Button>
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
              overflow: 'hidden',
            },
            '& .MuiDataGrid-cellContent': {
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
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
