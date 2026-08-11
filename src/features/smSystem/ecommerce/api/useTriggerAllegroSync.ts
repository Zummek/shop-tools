import { useMutation, useQueryClient } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';

import { allegroOffersQueryKeyBase } from './useGetAllegroOffers';
import { allegroSyncStatusQueryKey } from './useGetAllegroSyncStatus';

const endpoint = '/api/v1/ecommerce/allegro/sync/';

export const useTriggerAllegroSync = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async () => {
      const response = await axiosInstance.post<{
        message: string;
        taskId: string;
        organizationId: number;
      }>(endpoint);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: allegroSyncStatusQueryKey });
      queryClient.invalidateQueries({ queryKey: [allegroOffersQueryKeyBase] });
      queryClient.invalidateQueries({ queryKey: ['product-channel-links'] });
    },
  });

  return {
    triggerSync: mutateAsync,
    isPending,
  };
};
