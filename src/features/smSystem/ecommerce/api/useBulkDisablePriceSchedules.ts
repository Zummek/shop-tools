import { useMutation, useQueryClient } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import {
  PRICE_SCHEDULE_BULK_MAX_IDS,
  PriceScheduleBulkDisableResponse,
  PriceScheduleDisableMode,
} from '../types/priceSchedules';

import { priceSchedulesQueryKeyBase } from './useGetPriceSchedules';

const endpoint = '/api/v1/ecommerce/price-schedules/bulk-disable/';
const BULK_REQUEST_TIMEOUT_MS = 300_000;

export interface BulkDisablePriceSchedulesResult {
  succeeded: number;
  revertPending: number;
  failed: number;
}

const disableChunk = async ({
  ids,
  mode,
  force,
}: {
  ids: number[];
  mode: PriceScheduleDisableMode;
  force?: boolean;
}) => {
  const response = await axiosInstance.post<PriceScheduleBulkDisableResponse>(
    endpoint,
    { ids, mode, force },
    { timeout: BULK_REQUEST_TIMEOUT_MS },
  );
  if (response.status >= 400) 
    throw new Error(`Bulk disable failed (${response.status})`);
  
  return response.data;
};

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

      for (
        let i = 0;
        i < uniqueIds.length;
        i += PRICE_SCHEDULE_BULK_MAX_IDS
      ) {
        const chunk = uniqueIds.slice(
          i,
          i + PRICE_SCHEDULE_BULK_MAX_IDS,
        );
        try {
          const batch = await disableChunk({ ids: chunk, mode, force });
          for (const row of batch.results) {
            if (row.revertPending) revertPending += 1;
            else succeeded += 1;
          }
          failed += batch.errors.length;
        } catch {
          failed += chunk.length;
        }
      }

      return { succeeded, revertPending, failed };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [priceSchedulesQueryKeyBase] });
      queryClient.invalidateQueries({ queryKey: ['product-channel-links'] });
    },
  });

  return {
    bulkDisablePriceSchedules: mutateAsync,
    isPending,
  };
};
