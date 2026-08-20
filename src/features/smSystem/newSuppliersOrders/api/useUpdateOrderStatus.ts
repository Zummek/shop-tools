import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useNotify } from '../../../../hooks';
import { axiosInstance } from '../../../../services';
import { OrderDetails, SupplierOrderStatus } from '../types';

import { getV2OrderDetailsQueryKey } from './useGetOrderDetails';
import { patchV2OrdersListCache } from './useGetOrders';

interface Payload {
  orderId: number;
  status: SupplierOrderStatus;
}

const getEndpoint = (orderId: number) =>
  `/api/v1/suppliers-orders/v2/orders/${orderId}/`;

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  const { notify } = useNotify();

  const updateOrderStatusRequest = async ({ orderId, status }: Payload) => {
    const response = await axiosInstance.patch<OrderDetails>(
      getEndpoint(orderId),
      { status },
    );
    return response.data;
  };

  const {
    mutateAsync: updateOrderStatus,
    isPending,
    isError,
  } = useMutation({
    mutationFn: updateOrderStatusRequest,
    onSuccess: (response, variables) => {
      queryClient.setQueryData(
        getV2OrderDetailsQueryKey(variables.orderId),
        response,
      );
      patchV2OrdersListCache(queryClient, variables.orderId, {
        status: variables.status,
      });
    },
    onError: () => {
      notify('error', 'Błąd podczas zmiany statusu zamówienia');
    },
  });

  return {
    updateOrderStatus,
    isLoading: isPending,
    isError,
  };
};
