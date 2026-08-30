import { useMutation, useQueryClient } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import {
  ChannelPriceSchedule,
  PriceScheduleDisableMode,
} from '../types/priceSchedules';

import { priceSchedulesQueryKeyBase } from './useGetPriceSchedules';

const endpoint = (id: number) =>
  `/api/v1/ecommerce/price-schedules/${id}/disable/`;

export interface BulkDisablePriceSchedulesResult {
  succeeded: number;
  revertPending: number;
  failed: number;
}

export const useBulkDisablePriceSchedules = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async ({
      ids,
      mode,
      force,
    }: {
      ids: number[];
      mode: PriceScheduleDisableMode;
      force?: boolean;
    }): Promise<BulkDisablePriceSchedulesResult> => {
      const uniqueIds = [...new Set(ids)];
      let succeeded = 0;
      let revertPending = 0;
      let failed = 0;

      for (const id of uniqueIds) {
        try {
          const response = await axiosInstance.post<
            ChannelPriceSchedule & {
              revertPending?: boolean;
              revertError?: string;
            }
          >(endpoint(id), { mode, force });
          if (response.data.revertPending) revertPending += 1;
          else succeeded += 1;
        } catch {
          failed += 1;
        }
      }

      return { succeeded, revertPending, failed };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [priceSchedulesQueryKeyBase] });
      queryClient.invalidateQueries({ queryKey: ['product-channel-links'] });
    },
  });

  return {
    bulkDisablePriceSchedules: mutateAsync,
    isPending,
  };
};
