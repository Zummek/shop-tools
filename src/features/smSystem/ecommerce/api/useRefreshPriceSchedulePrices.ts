import { useMutation, useQueryClient } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import { PriceScheduleRefreshPricesResponse } from '../types/priceSchedules';

import { priceSchedulesQueryKeyBase } from './useGetPriceSchedules';

const endpoint = '/api/v1/ecommerce/price-schedules/refresh-prices/';

export const REFRESH_PRICE_SCHEDULE_MAX_IDS = 50;

export const useRefreshPriceSchedulePrices = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (ids: number[]) => {
      const response =
        await axiosInstance.post<PriceScheduleRefreshPricesResponse>(endpoint, {
          ids,
        });
      return response.data;
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
