import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useNotify } from '../../../../hooks';
import { axiosInstance } from '../../../../services';
import { OrderDetails } from '../types';

import { getV2OrderDetailsQueryKey } from './useGetOrderDetails';
import { getV2OrdersQueryKeyBase } from './useGetOrders';

interface Payload {
  orderId: number;
  branchId: number;
  productId: number;
  toOrderAmount: number;
}

const getEndpoint = (orderId: number, branchId: number, productId: number) =>
  `/api/v1/suppliers-orders/orders/${orderId}/branches/${branchId}/products/${productId}/`;

export const useUpdateOrderDetails = () => {
  const queryClient = useQueryClient();
  const { notify } = useNotify();

  const updateOrderDetailsRequest = async ({
    orderId,
    branchId,
    productId,
    toOrderAmount,
  }: Payload) => {
    const response = await axiosInstance.patch<OrderDetails>(
      getEndpoint(orderId, branchId, productId),
      {
        toOrderAmount,
      },
    );
    return response.data;
  };

  const {
    mutateAsync: updateOrderDetails,
    isPending,
    isError,
  } = useMutation({
    mutationFn: updateOrderDetailsRequest,
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({
        queryKey: getV2OrderDetailsQueryKey(variables.orderId),
      });
      queryClient.removeQueries({ queryKey: [getV2OrdersQueryKeyBase] });
    },
    onError: () => {
      notify('error', 'Błąd podczas aktualizacji zamówienia');
    },
  });

  return {
    updateOrderDetails,
    isLoading: isPending,
    isError,
  };
};
