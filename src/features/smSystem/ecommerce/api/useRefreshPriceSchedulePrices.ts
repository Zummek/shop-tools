import { useMutation, useQueryClient } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import {
  PRICE_SCHEDULE_BULK_MAX_IDS,
  PriceScheduleRefreshPricesResponse,
} from '../types/priceSchedules';

import { priceSchedulesQueryKeyBase } from './useGetPriceSchedules';

const endpoint = '/api/v1/ecommerce/price-schedules/refresh-prices/';

/** Allegro GETs are sequential; allow long selections without axios 30s cut-off. */
const BULK_REQUEST_TIMEOUT_MS = 300_000;

const refreshChunk = async (ids: number[]) => {
  const response =
    await axiosInstance.post<PriceScheduleRefreshPricesResponse>(
      endpoint,
      { ids },
      { timeout: BULK_REQUEST_TIMEOUT_MS },
    );
  if (response.status >= 400) {
    throw new Error(
      typeof response.data === 'object' &&
      response.data &&
      'detail' in response.data
        ? String((response.data as { detail?: unknown }).detail)
        : `Refresh failed (${response.status})`,
    );
  }
  return response.data;
};

export const useRefreshPriceSchedulePrices = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (ids: number[]) => {
      const uniqueIds = [...new Set(ids)];
      const results: PriceScheduleRefreshPricesResponse['results'] = [];
      const errors: PriceScheduleRefreshPricesResponse['errors'] = [];

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
          const batch = await refreshChunk(chunk);
          results.push(...batch.results);
          errors.push(...batch.errors);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Nie udało się pobrać cen';
          for (const id of chunk) 
            errors.push({ id, error: message });
          
        }
      }

      return { results, errors };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [priceSchedulesQueryKeyBase] });
      queryClient.invalidateQueries({ queryKey: ['product-channel-links'] });
    },
  });

  return {
    refreshPriceSchedulePrices: mutateAsync,
    isPending,
  };
};
