import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { GridColDef, GridRowParams } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { PersistedDataGrid } from '../../../../components/dataGrid/PersistedDataGrid';
import { gridStorageIds } from '../../../../components/dataGrid/persistedGridState';
import { useNotify } from '../../../../hooks';
import { Pages } from '../../../../utils';
import {
  EcommerceOrderListItem,
  OrderSourceFilter,
  useGetAllegroConnection,
  useGetDeliveryMethods,
  useGetEcommerceOrders,
  useGetEcommerceOrderSync,
  useGetWooCommerceConnection,
} from '../api';
import {
  OrderStatusChip,
  OrdersDailyChart,
  OrdersStatsCards,
  WooStatusChip,
} from '../components';
import { ImportEcommerceOrderModal } from '../modals/ImportEcommerceOrderModal/ImportEcommerceOrderModal';
import type { OrderStatus } from '../types';
import {
  externalStatusLabel,
  ORDER_STATUSES,
  orderStatusConfig,
} from '../utils';

const SYNC_STALE_MINUTES = 30;

const syncLabel = (value: string | null) =>
  value ? dayjs(value).format('DD.MM HH:mm') : 'jeszcze nie';

const syncIsStale = (value: string | null) =>
  !value || dayjs().diff(dayjs(value), 'minute') >= SYNC_STALE_MINUTES;

const OrderSyncCaption = () => {
  const { channels } = useGetEcommerceOrderSync();
  if (channels.length === 0) return null;
  const labels = channels.map((row) => syncLabel(row.lastSuccessAt));
  const shared = labels.every((label) => label === labels[0]);
  return (
    <Typography variant="caption" color="text.secondary">
      {'Ostatnia synchronizacja: '}
      {shared ? (
        <Box
          component="span"
          sx={{
            color: syncIsStale(channels[0].lastSuccessAt)
              ? 'warning.main'
              : 'inherit',
          }}
        >
          {labels[0]}
        </Box>
      ) : (
        channels.map((row, index) => (
          <Box
            component="span"
            key={row.channel}
            sx={{
              color: syncIsStale(row.lastSuccessAt)
                ? 'warning.main'
                : 'inherit',
            }}
          >
            {index > 0 ? ' · ' : ''}
            {orderSourceLabel(row.channel)} {syncLabel(row.lastSuccessAt)}
          </Box>
        ))
      )}
    </Typography>
  );
};

const orderSourceLabel = (source: string) => {
  if (source === 'allegro') return 'Allegro';
  if (source === 'woocommerce') return 'WooCommerce';
  if (source === 'erli') return 'Erli';
  return source || '—';
};

const productReviewTooltip = (row: EcommerceOrderListItem) => {
  const parts: string[] = [];
  if (row.hasUnmatchedItems) parts.push('Zamówienie ma pozycje bez produktu');
  if (row.hasUncertainMatch) {
    parts.push(
      'Zamówienie ma pozycje z niepewnym dopasowaniem (podobna nazwa)',
    );
  }
  return parts.join('. ');
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
    field: 'needsProductReview',
    headerName: '',
    width: 48,
    sortable: false,
    disableColumnMenu: true,
    align: 'center',
    headerAlign: 'center',
    renderCell: ({ row }) => {
      if (!row.needsProductReview) return null;
      const isUnmatched = row.hasUnmatchedItems;
      return (
        <Tooltip title={productReviewTooltip(row)}>
          <WarningAmberIcon
            fontSize="small"
            color={isUnmatched ? 'error' : 'warning'}
            aria-label={productReviewTooltip(row)}
          />
        </Tooltip>
      );
    },
  },
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
    headerName: 'Zew. Status',
    minWidth: 160,
    renderCell: ({ row }) => {
      if (row.orderSource === 'woocommerce') {
        return (
          <WooStatusChip
            status={row.status}
            externalStatus={row.externalStatus}
          />
        );
      }
      if (!row.externalStatus) {
        return (
          <Typography variant="body2" color="text.secondary">
            {'—'}
          </Typography>
        );
      }
      return (
        <Typography variant="body2">
          {externalStatusLabel(row.orderSource, row.externalStatus)}
        </Typography>
      );
    },
    valueGetter: (_value, row) =>
      externalStatusLabel(row.orderSource, row.externalStatus),
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
    width: 220,
    minWidth: 140,
    flex: 1,
    renderCell: ({ row }) => (
      <EllipsisCell value={row.deliveryGroupName || row.deliveryName} />
    ),
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
    description: 'Sztuki produktu. Wielosztuka Allegro liczy sztuki w ofercie.',
    width: 130,
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
    query,
    setQuery,
    orderSource,
    setOrderSource,
    status,
    setStatus,
    needsProductReview,
    setNeedsProductReview,
    deliveryGroupIds,
    deliveryIds,
    setDeliveryFilters,
  } = useGetEcommerceOrders();
  const [searchInput, setSearchInput] = useState(query);

  useEffect(() => {
    const timeout = setTimeout(() => setQuery(searchInput), 300);
    return () => clearTimeout(timeout);
  }, [searchInput, setQuery]);

  useEffect(() => {
    setSearchInput((current) => (current.trim() === query ? current : query));
  }, [query]);

  const { deliveryMethods } = useGetDeliveryMethods();
  const { allegroConnection } = useGetAllegroConnection();
  const { wooCommerceConnection } = useGetWooCommerceConnection();

  const anyChannelConnected =
    !!allegroConnection?.isConnected || !!wooCommerceConnection?.isConnected;

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

  const selectedDeliveryOptionIds = [
    ...deliveryGroupIds.map((id) => `group:${id}`),
    ...deliveryIds.map((id) => `method:${id}`),
  ];

  const handleDeliveryFilterChange = (event: SelectChangeEvent<string[]>) => {
    const values =
      typeof event.target.value === 'string'
        ? event.target.value.split(',')
        : event.target.value;
    const nextGroupIds: number[] = [];
    const nextDeliveryIds: string[] = [];
    values.forEach((value) => {
      if (value.startsWith('group:')) {
        const groupId = Number(value.slice('group:'.length));
        if (Number.isInteger(groupId) && groupId > 0)
          nextGroupIds.push(groupId);
      } else if (value.startsWith('method:')) {
        const deliveryId = value.slice('method:'.length);
        if (deliveryId) nextDeliveryIds.push(deliveryId);
      }
    });
    setDeliveryFilters(nextGroupIds, nextDeliveryIds);
  };

  const paginationModel = useMemo(() => ({ page, pageSize }), [page, pageSize]);

  const deliveryFilterLabel = () => {
    if (selectedDeliveryOptionIds.length === 0) return 'Wszystkie';
    if (selectedDeliveryOptionIds.length === 1) {
      const option = deliveryMethods.find(
        (item) => item.id === selectedDeliveryOptionIds[0],
      );
      return option?.name ?? '1 wybrana';
    }
    return `${selectedDeliveryOptionIds.length} wybrane`;
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
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <TextField
            size="small"
            label="Kupujący, login lub ID zamówienia"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            sx={{ minWidth: 280 }}
          />
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
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="order-status-filter-label">{'Status SM'}</InputLabel>
            <Select
              labelId="order-status-filter-label"
              label="Status SM"
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus | '')}
            >
              <MenuItem value="">{'Wszystkie'}</MenuItem>
              {ORDER_STATUSES.map((item) => (
                <MenuItem key={item} value={item}>
                  {orderStatusConfig[item].label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 240 }}>
            <InputLabel id="delivery-filter-label">{'Dostawa'}</InputLabel>
            <Select
              labelId="delivery-filter-label"
              label="Dostawa"
              multiple
              value={selectedDeliveryOptionIds}
              onChange={handleDeliveryFilterChange}
              renderValue={() => deliveryFilterLabel()}
            >
              {deliveryMethods.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  <Checkbox
                    checked={selectedDeliveryOptionIds.includes(option.id)}
                    size="small"
                  />
                  <ListItemText primary={option.name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={needsProductReview}
                onChange={(e) => setNeedsProductReview(e.target.checked)}
                size="small"
              />
            }
            label="Wymagają uwagi"
          />
        </Stack>
        <Stack alignItems="flex-end" spacing={0.5}>
          <Button variant="contained" onClick={handleImportOrders}>
            {'Importuj zamówienia'}
          </Button>
          <OrderSyncCaption />
        </Stack>
      </Box>
      <Box height={500} width="100%">
        <PersistedDataGrid
          storageKey={gridStorageIds.ecommerceOrders}
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
          getRowId={(row) => row.id}
          rowCount={totalCount || 0}
          columns={columns}
          pageSizeOptions={[pageSize]}
          loading={isLoading}
          paginationModel={paginationModel}
          onPaginationModelChange={(model) => {
            if (model.page !== page) setPage(model.page);
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
