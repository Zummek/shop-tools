import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useNotify } from '../../../../hooks';
import { axiosInstance } from '../../../../services';
import { EcommerceOrderDetails } from '../types';

import { getEcommerceOrderDetailsQueryKey } from './useGetEcommerceOrderDetails';

interface EcommerceOrderItemPayload {
  id?: number;
  internalProductId: number;
}

interface Payload {
  id: number;
  orderDate?: string;
  orderSource?: string;
  externalId?: string;
  paymentMethod?: string;
  deliveryMethod?: string;
  status?: string;
  messageFromBuyer?: string;
  buyerName?: string;
  buyerAddress?: string;
  buyerContact?: string;
  orderItems?: EcommerceOrderItemPayload[];
}

export interface UpdateEcommerceOrderItemInternalProductPayload {
  id: number;
  orderItemId: number;
  internalProductId: number;
}

const getEndpoint = (id: number) => `/api/v1/ecommerce/orders/${id}/`;

export const useUpdateEcommerceOrder = () => {
  const queryClient = useQueryClient();
  const { notify } = useNotify();

  const request = async ({ id, ...payload }: Payload) => {
    const response = await axiosInstance.patch<EcommerceOrderDetails>(
      getEndpoint(id),
      payload
    );
    return response.data;
  };

  const {
    mutateAsync: updateEcommerceOrder,
    isPending,
    isError,
  } = useMutation({
    mutationFn: request,
    onSuccess: (response, variables) => {
      queryClient.setQueryData(
        getEcommerceOrderDetailsQueryKey(variables.id),
        response
      );
    },
    onError: () => {
      notify('error', 'Błąd podczas aktualizacji zamówienia');
    },
  });

  const updateEcommerceOrderItemInternalProduct = async ({
    id,
    orderItemId,
    internalProductId,
  }: UpdateEcommerceOrderItemInternalProductPayload) => {
    return updateEcommerceOrder({
      id,
      orderItems: [{ id: orderItemId, internalProductId }],
    });
  };

  return {
    updateEcommerceOrder,
    updateEcommerceOrderItemInternalProduct,
    isPending,
    isError,
  };
};
