import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  axiosInstance,
  throwAxiosErrorFromResponse,
} from '../../../../services';
import { ChannelPriceSchedule } from '../types/priceSchedules';

import { priceSchedulesQueryKeyBase } from './useGetPriceSchedules';

const endpoint = (id: number) =>
  `/api/v1/ecommerce/price-schedules/${id}/enable/`;

export interface BulkEnablePriceSchedulesResult {
  succeeded: number;
  applyPending: number;
  failed: number;
}

export const useBulkEnablePriceSchedules = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (
      ids: number[],
    ): Promise<BulkEnablePriceSchedulesResult> => {
      const uniqueIds = [...new Set(ids)];
      let succeeded = 0;
      let applyPending = 0;
      let failed = 0;

      for (const id of uniqueIds) {
        try {
          const response = await axiosInstance.post<
            ChannelPriceSchedule & {
              applyPending?: boolean;
              applyError?: string;
            }
          >(endpoint(id));
          if (response.status === 400) throwAxiosErrorFromResponse(response);
          if (response.data.applyPending) applyPending += 1;
          else succeeded += 1;
        } catch {
          failed += 1;
        }
      }

      return { succeeded, applyPending, failed };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [priceSchedulesQueryKeyBase] });
      queryClient.invalidateQueries({ queryKey: ['product-channel-links'] });
    },
  });

  return {
    bulkEnablePriceSchedules: mutateAsync,
    isPending,
  };
};
