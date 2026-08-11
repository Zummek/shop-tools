import { useQuery } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';

const endpoint = '/api/v1/ecommerce/orders/stats/';
export const getEcommerceOrdersStatsQueryKey = ['ecommerceOrdersStats'];

export interface EcommerceOrdersStatsPeriod {
  revenue: number;
  ordersCount: number;
  avgOrderValue: number | null;
}

export interface EcommerceOrdersStatsDailyPoint {
  date: string;
  source: string;
  revenue: number;
  ordersCount: number;
}

export interface EcommerceOrdersStatsByChannel {
  source: string;
  ordersCount: number;
}

export interface EcommerceOrdersStats {
  currency: string;
  periodDays: number;
  current: EcommerceOrdersStatsPeriod;
  previous: EcommerceOrdersStatsPeriod;
  byChannel: EcommerceOrdersStatsByChannel[];
  daily: EcommerceOrdersStatsDailyPoint[];
}

export const useGetEcommerceOrdersStats = () => {
  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: getEcommerceOrdersStatsQueryKey,
    queryFn: async () => {
      const response = await axiosInstance.get<EcommerceOrdersStats>(endpoint);
      return response.data;
    },
  });

  return {
    stats: data,
    isLoading: isLoading || isFetching,
    isError,
  };
};
