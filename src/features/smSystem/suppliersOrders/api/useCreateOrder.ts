import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useNotify } from '../../../../hooks';
import { axiosInstance } from '../../../../services';
import { CreateOrderInput } from '../../app/types';

import { getOrdersQueryKeyBase } from './useGetOrders';

const endpoint = '/api/v1/suppliers-orders/orders/';

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const { notify } = useNotify();

  const createOrderRequest = async (orderData: CreateOrderInput) => {
    const response = await axiosInstance.post(endpoint, orderData);

    return response.data.id;
  };

  const {
    mutateAsync: createOrder,
    isPending: isCreating,
    isError,
  } = useMutation({
    mutationFn: createOrderRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [getOrdersQueryKeyBase] });
    },
    onError: (error) => {
      console.error('Błąd tworzenia zamówienia', error);
      notify('error', 'Błąd podczas tworzenia zamówienia');
    },
  });

  return { createOrder, isCreating, isError };
};
