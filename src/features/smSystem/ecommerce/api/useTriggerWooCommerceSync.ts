import { useMutation, useQueryClient } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';

import { wooCommerceOffersQueryKeyBase } from './useGetWooCommerceOffers';
import { wooCommerceSyncStatusQueryKey } from './useGetWooCommerceSyncStatus';

const endpoint = '/api/v1/ecommerce/woocommerce/sync/';

export const useTriggerWooCommerceSync = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async () => {
      const response = await axiosInstance.post<{
        message: string;
        taskId: string;
        organizationId: number;
        syncRunId: number;
      }>(endpoint);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: wooCommerceSyncStatusQueryKey,
      });
      queryClient.invalidateQueries({
        queryKey: [wooCommerceOffersQueryKeyBase],
      });
      queryClient.invalidateQueries({ queryKey: ['product-channel-links'] });
    },
  });

  return {
    triggerSync: mutateAsync,
    isPending,
  };
};
