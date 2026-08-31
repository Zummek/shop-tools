import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError, isAxiosError } from 'axios';

import { useNotify } from '../../../../hooks';
import { axiosInstance } from '../../../../services';
import { queryRetryDelay } from '../../../../services/queryRetry';

import { getV2OrderDetailsQueryKey } from './useGetOrderDetails';
import { getV2OrdersQueryKeyBase } from './useGetOrders';

interface Payload {
  orderId: number;
  branchId: number;
  productId: number;
  toOrderAmount: number;
}

interface UpdateOrderDetailsResponse {
  id: number;
  productId: number;
  branchId: number;
  toOrderAmount: number;
}

const getEndpoint = (orderId: number, branchId: number, productId: number) =>
  `/api/v1/suppliers-orders/orders/${orderId}/branches/${branchId}/products/${productId}/`;

const shouldRetryUpdate = (failureCount: number, error: unknown) => {
  if (failureCount >= 2) return false;
  return isAxiosError(error) && error.code === AxiosError.ERR_NETWORK;
};

export const useUpdateOrderDetails = () => {
  const queryClient = useQueryClient();
  const { notify } = useNotify();

  const updateOrderDetailsRequest = async ({
    orderId,
    branchId,
    productId,
    toOrderAmount,
  }: Payload) => {
    const response = await axiosInstance.patch<UpdateOrderDetailsResponse>(
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
    retry: shouldRetryUpdate,
    retryDelay: queryRetryDelay,
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
