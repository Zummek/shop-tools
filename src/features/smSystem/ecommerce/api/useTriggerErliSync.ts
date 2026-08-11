import { useMutation, useQueryClient } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';

import { erliOffersQueryKeyBase } from './useGetErliOffers';
import { erliSyncStatusQueryKey } from './useGetErliSyncStatus';

const endpoint = '/api/v1/ecommerce/erli/sync/';

export const useTriggerErliSync = () => {
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
        queryKey: erliSyncStatusQueryKey,
      });
      queryClient.invalidateQueries({
        queryKey: [erliOffersQueryKeyBase],
      });
      queryClient.invalidateQueries({ queryKey: ['product-channel-links'] });
    },
  });

  return {
    triggerSync: mutateAsync,
    isPending,
  };
};
