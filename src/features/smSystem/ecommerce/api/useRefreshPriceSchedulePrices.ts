import { useMutation, useQueryClient } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import { PriceScheduleRefreshPricesResponse } from '../types/priceSchedules';

import { priceSchedulesQueryKeyBase } from './useGetPriceSchedules';

const endpoint = '/api/v1/ecommerce/price-schedules/refresh-prices/';

/** Backend accepts at most this many ids per request (request-timeout safety). */
export const REFRESH_PRICE_SCHEDULE_BATCH_SIZE = 50;

const refreshChunk = async (ids: number[]) => {
  const response = await axiosInstance.post<PriceScheduleRefreshPricesResponse>(
    endpoint,
    {
      ids,
    },
  );
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
        i += REFRESH_PRICE_SCHEDULE_BATCH_SIZE
      ) {
        const chunk = uniqueIds.slice(i, i + REFRESH_PRICE_SCHEDULE_BATCH_SIZE);
        const batch = await refreshChunk(chunk);
        results.push(...batch.results);
        errors.push(...batch.errors);
      }

      return { results, errors };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [priceSchedulesQueryKeyBase] });
      queryClient.invalidateQueries({ queryKey: ['product-channel-links'] });
    },
  });

  return {
    refreshPriceSchedulePrices: mutateAsync,
    isPending,
  };
};
