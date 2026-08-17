import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import { ChannelPriceSchedule } from '../types/priceSchedules';

const endpoint = '/api/v1/ecommerce/price-schedules/';

export const priceSchedulesQueryKeyBase = 'price-schedules';

interface Filters {
  productId?: number;
  linkId?: number;
  isEnabled?: boolean;
  query?: string;
}

export const useGetPriceSchedules = (filters: Filters = {}) => {
  const { data, isLoading, isFetching, isPlaceholderData, refetch } = useQuery({
    queryKey: [priceSchedulesQueryKeyBase, filters],
    queryFn: async () => {
      const response = await axiosInstance.get<ChannelPriceSchedule[]>(
        endpoint,
        {
          params: {
            product: filters.productId,
            link: filters.linkId,
            is_enabled:
              filters.isEnabled === undefined
                ? undefined
                : String(filters.isEnabled),
            query: filters.query || undefined,
          },
        },
      );
      return response.data;
    },
    placeholderData: keepPreviousData,
    // The engine ticks every minute; keep open pages fresh around window
    // boundaries.
    refetchInterval: 60_000,
  });

  return {
    schedules: data ?? [],
    isLoading,
    isFetching,
    isPlaceholderData,
    refetch,
  };
};
