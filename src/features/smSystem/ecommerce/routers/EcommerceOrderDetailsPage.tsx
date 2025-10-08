import { Box, Button, Stack, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useNotify } from '../../../../hooks';
import { Pages } from '../../../../utils';
import {
  useGetEcommerceOrderDetails,
  useUpdateEcommerceOrderItem,
} from '../api';
import { createOrderItemsColumns, OrderDetailsSection } from '../components';
import { useOrderItemEditing } from '../hooks/useOrderItemEditing';
import { ImportEcommerceOrderModal } from '../modals/ImportEcommerceOrderModal';

export const EcommerceOrderDetailsPage = () => {
  const navigate = useNavigate();
  const { notify } = useNotify();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const { editingItemId, setEditingItemId } = useOrderItemEditing();
  const { orderId: rawOrderId } = useParams<{ orderId: string }>();
  const id = Number(rawOrderId);

  const { ecommerceOrder, isLoading } = useGetEcommerceOrderDetails({ id });
  const { updateEcommerceOrderItem } = useUpdateEcommerceOrderItem();

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

  return (
    <Stack spacing={4}>
      <Box>
        <Button
          variant="outlined"
          onClick={() => navigate(Pages.smSystemEcommerceOrders)}
        >
          {'Powrót'}
        </Button>
      </Box>
      <Typography variant="h4" component="h1">
        {'Zamówienie ' +
          dayjs(ecommerceOrder?.orderDate).format('DD.MM.YYYY HH:mm')}
      </Typography>
      {ecommerceOrder && (
        <OrderDetailsSection ecommerceOrder={ecommerceOrder} />
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
              overflow: 'visible',
            },
            '& .MuiDataGrid-cellContent': {
              overflow: 'visible',
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
