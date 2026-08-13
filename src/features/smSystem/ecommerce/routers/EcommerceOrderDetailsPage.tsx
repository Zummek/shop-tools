import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useNotify } from '../../../../hooks';
import { Pages } from '../../../../utils';
import {
  useGetEcommerceOrderDetails,
  useUpdateEcommerceOrder,
  useUpdateEcommerceOrderItem,
} from '../api';
import { createOrderItemsColumns, OrderDetailsSection } from '../components';
import { useOrderItemEditing } from '../hooks/useOrderItemEditing';
import { ImportEcommerceOrderModal } from '../modals/ImportEcommerceOrderModal/ImportEcommerceOrderModal';
import { OrderStatus } from '../types';
import { WooStatusValue } from '../utils';

export const EcommerceOrderDetailsPage = () => {
  const navigate = useNavigate();
  const { notify } = useNotify();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const { editingItemId, setEditingItemId } = useOrderItemEditing();
  const { orderId: rawOrderId } = useParams<{ orderId: string }>();
  const id = Number(rawOrderId);

  const { ecommerceOrder, isLoading } = useGetEcommerceOrderDetails({ id });
  const { updateEcommerceOrderItem } = useUpdateEcommerceOrderItem();
  const { updateEcommerceOrder, isPending: isUpdatingStatus } =
    useUpdateEcommerceOrder();

  const unmatchedCount = (ecommerceOrder?.orderItems ?? []).filter(
    (item) => item.productMatchType === 'NONE',
  ).length;
  const uncertainCount = (ecommerceOrder?.orderItems ?? []).filter(
    (item) => item.productMatchType === 'SIMILARITY',
  ).length;
  const weakMatchCount = unmatchedCount + uncertainCount;

  const handleUpdateEcommerceOrderItemInternalProduct = async (payload: {
    orderItemId: number;
    internalProductId: number;
  }) => {
    const response = await updateEcommerceOrderItem({
      orderId: id,
      orderItemId: payload.orderItemId,
      internalProductId: payload.internalProductId,
    });
    notify('success', 'Produkt został zaktualizowany');
    return response.orderItems.find((item) => item.id === payload.orderItemId);
  };

  const handleSmStatusChange = useCallback(
    async (nextStatus: OrderStatus) => {
      if (!ecommerceOrder) return;
      const isWoo = ecommerceOrder.orderSource === 'woocommerce';
      try {
        await updateEcommerceOrder({
          id: ecommerceOrder.id,
          status: nextStatus,
          ...(isWoo ? { channelAction: 'local_only' as const } : {}),
        });
        notify('success', 'Status SM został zaktualizowany');
      } catch {
        // toast in hook
      }
    },
    [ecommerceOrder, notify, updateEcommerceOrder],
  );

  const handleWooStatusChange = useCallback(
    async (wooStatus: WooStatusValue) => {
      if (!ecommerceOrder) return;
      try {
        await updateEcommerceOrder({
          id: ecommerceOrder.id,
          channelAction: 'set_external',
          externalStatus: wooStatus,
        });
        notify('success', 'Status WooCommerce został zaktualizowany');
      } catch {
        // toast in hook
      }
    },
    [ecommerceOrder, notify, updateEcommerceOrder],
  );

  const handleRefreshChannelStatus = useCallback(async () => {
    if (!ecommerceOrder) return;
    try {
      await updateEcommerceOrder({
        id: ecommerceOrder.id,
        channelAction: 'accept_remote',
      });
      notify('success', 'Status z kanału został odświeżony');
    } catch {
      // toast in hook
    }
  }, [ecommerceOrder, notify, updateEcommerceOrder]);

  return (
    <Stack spacing={2}>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap={2}
      >
        <Typography variant="subtitle1" component="h1" fontWeight={600} noWrap>
          {'Zamówienie ' +
            dayjs(ecommerceOrder?.orderDate).format('DD.MM.YYYY HH:mm')}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={() => navigate(Pages.smSystemEcommerceOrders)}
          sx={{ flexShrink: 0 }}
        >
          {'Powrót'}
        </Button>
      </Box>
      {ecommerceOrder && (
        <OrderDetailsSection
          ecommerceOrder={ecommerceOrder}
          isUpdatingStatus={isUpdatingStatus}
          onSmStatusChange={(status) => void handleSmStatusChange(status)}
          onWooStatusChange={(wooStatus) =>
            void handleWooStatusChange(wooStatus)
          }
          onRefreshChannelStatus={() => void handleRefreshChannelStatus()}
        />
      )}
      {weakMatchCount > 0 && (
        <Alert severity={unmatchedCount > 0 ? 'error' : 'warning'}>
          {[
            unmatchedCount > 0
              ? `${unmatchedCount} ${
                  unmatchedCount === 1
                    ? 'pozycja bez produktu'
                    : 'pozycji bez produktu'
                }`
              : null,
            uncertainCount > 0
              ? `${uncertainCount} ${
                  uncertainCount === 1
                    ? 'pozycja z niepewnym dopasowaniem (podobna nazwa)'
                    : 'pozycji z niepewnym dopasowaniem (podobna nazwa)'
                }`
              : null,
          ]
            .filter(Boolean)
            .join('. ') + '.'}
        </Alert>
      )}
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
              overflow: 'hidden',
            },
            '& .MuiDataGrid-cellContent': {
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            },
            '& .MuiDataGrid-cell--textLeft': {
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            },
          }}
          rows={ecommerceOrder?.orderItems}
          rowCount={ecommerceOrder?.orderItems.length || 0}
          columns={createOrderItemsColumns({
            editingItemId,
            setEditingItemId,
            updateEcommerceOrderItem:
              handleUpdateEcommerceOrderItemInternalProduct,
          })}
          pageSizeOptions={[ecommerceOrder?.orderItems.length || 0]}
          loading={isLoading}
          paginationModel={{
            page: 0,
            pageSize: ecommerceOrder?.orderItems.length || 0,
          }}
          paginationMode="server"
          disableColumnSorting
          disableRowSelectionOnClick
          hideFooter
          onRowClick={() => {}}
          disableColumnMenu
          onPaginationModelChange={() => {}}
          style={{
            width: '100%',
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
