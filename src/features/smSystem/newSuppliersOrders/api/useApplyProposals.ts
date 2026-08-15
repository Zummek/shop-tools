import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useNotify } from '../../../../hooks';
import { axiosInstance } from '../../../../services';
import { OrderDetails } from '../types';

import { getV2OrderDetailsQueryKey } from './useGetOrderDetails';

const getEndpoint = (orderId: number) =>
  `/api/v1/suppliers-orders/v2/orders/${orderId}/apply-proposals/`;

export const useApplyProposals = () => {
  const queryClient = useQueryClient();
  const { notify } = useNotify();

  const applyProposalsRequest = async (orderId: number) => {
    const response = await axiosInstance.post<OrderDetails>(
      getEndpoint(orderId),
    );
    return response.data;
  };

  const { mutateAsync: applyProposals, isPending } = useMutation({
    mutationFn: applyProposalsRequest,
    onSuccess: (response, orderId) => {
      queryClient.setQueryData(getV2OrderDetailsQueryKey(orderId), response);
      notify('success', 'Zastosowano proponowane ilości');
    },
    onError: () => {
      notify('error', 'Błąd podczas stosowania propozycji');
    },
  });

  return { applyProposals, isApplying: isPending };
};
