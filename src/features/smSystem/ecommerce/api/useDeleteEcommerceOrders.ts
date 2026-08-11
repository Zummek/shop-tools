import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useNotify } from '../../../../hooks';
import { axiosInstance } from '../../../../services';

import { getEcommerceOrdersQueryKeyBase } from './useGetEcommerceOrders';
import { getEcommerceOrdersStatsQueryKey } from './useGetEcommerceOrdersStats';

interface Payload {
  id: number;
}

const getEndpoint = (id: number) => `/api/v1/ecommerce/orders/${id}/`;

export const useDeleteEcommerceOrders = () => {
  const queryClient = useQueryClient();
  const { notify } = useNotify();

  const request = async ({ id }: Payload) => {
    const response = await axiosInstance.delete(getEndpoint(id));
    return response.data;
  };

  const {
    mutateAsync: deleteEcommerceOrder,
    isPending,
    isError,
  } = useMutation({
    mutationFn: request,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [getEcommerceOrdersQueryKeyBase],
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: getEcommerceOrdersStatsQueryKey,
      });
    },
    onError: () => {
      notify('error', 'Błąd podczas usuwania zamówienia');
    },
  });

  return {
    deleteEcommerceOrder,
    isPending,
    isError,
  };
};
