import { useMutation, useQueryClient } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import {
  PRICE_SCHEDULE_BULK_MAX_IDS,
  PriceScheduleBulkEnableResponse,
} from '../types/priceSchedules';

import { priceSchedulesQueryKeyBase } from './useGetPriceSchedules';

const endpoint = '/api/v1/ecommerce/price-schedules/bulk-enable/';
const BULK_REQUEST_TIMEOUT_MS = 300_000;

export interface BulkEnablePriceSchedulesResult {
  succeeded: number;
  applyPending: number;
  failed: number;
  /** Distinct per-row reasons, in first-seen order. */
  errors: string[];
}

const enableChunk = async (ids: number[]) => {
  const response = await axiosInstance.post<PriceScheduleBulkEnableResponse>(
    endpoint,
    { ids },
    { timeout: BULK_REQUEST_TIMEOUT_MS },
  );
  if (response.status >= 400) 
    throw new Error(`Bulk enable failed (${response.status})`);
  
  return response.data;
};

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
      const errors: string[] = [];

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
          const batch = await enableChunk(chunk);
          for (const row of batch.results) {
            if (row.applyPending) applyPending += 1;
            else succeeded += 1;
          }
          failed += batch.errors.length;
          for (const row of batch.errors) 
            if (row.error && !errors.includes(row.error)) errors.push(row.error);
        } catch {
          failed += chunk.length;
        }
      }

      return { succeeded, applyPending, failed, errors };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [priceSchedulesQueryKeyBase] });
      queryClient.invalidateQueries({ queryKey: ['product-channel-links'] });
    },
  });

  return {
    bulkEnablePriceSchedules: mutateAsync,
    isPending,
  };
};
