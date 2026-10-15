import { useQuery } from '@tanstack/react-query';

import {
  axiosInstance,
  throwAxiosErrorFromResponse,
} from '../../../../services';
import { SalesExportRecord } from '../utils';

const endpoint = '/api/v1/ecommerce/sales-export/history/';

export const ecommerceSalesExportHistoryQueryKey = [
  'ecommerce-sales-export-history',
];

export const useGetEcommerceSalesExportHistory = () => {
  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ecommerceSalesExportHistoryQueryKey,
    queryFn: async () => {
      const response = await axiosInstance.get<SalesExportRecord[]>(endpoint);
      if (response.status >= 400) throwAxiosErrorFromResponse(response);
      return response.data;
    },
  });

  return {
    history: data ?? [],
    isLoading: isLoading || isFetching,
    isError,
  };
};
