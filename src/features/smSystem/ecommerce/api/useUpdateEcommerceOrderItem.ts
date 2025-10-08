import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useNotify } from '../../../../hooks';
import { axiosInstance } from '../../../../services';
import { EcommerceOrderDetails } from '../types';

import { getEcommerceOrderDetailsQueryKey } from './useGetEcommerceOrderDetails';

export interface Payload {
  orderId: number;
  orderItemId: number;
  internalProductId: number;
}

const getEndpoint = (orderId: number, itemId: number) =>
  `/api/v1/ecommerce/orders/${orderId}/products/${itemId}/`;

export const useUpdateEcommerceOrderItem = () => {
  const queryClient = useQueryClient();
  const { notify } = useNotify();

  const request = async ({
    orderId,
    orderItemId,
    internalProductId,
  }: Payload) => {
    const response = await axiosInstance.patch<EcommerceOrderDetails>(
      getEndpoint(orderId, orderItemId),
      { internalProductId }
    );
    return response.data;
  };

  const {
    mutateAsync: updateEcommerceOrderItem,
    isPending,
    isError,
  } = useMutation({
    mutationFn: request,
    onSuccess: (response, variables) => {
      queryClient.setQueryData(
        getEcommerceOrderDetailsQueryKey(variables.orderId),
        response
      );
    },
    onError: () => {
      notify('error', 'Błąd podczas aktualizacji zamówienia');
    },
  });
  return {
    updateEcommerceOrderItem,
    isPending,
    isError,
  };
};
