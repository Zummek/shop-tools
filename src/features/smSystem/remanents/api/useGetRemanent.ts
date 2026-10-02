import { useQuery } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import { RemanentDetails } from '../types';

export const remanentQueryKey = 'remanent';

export const useGetRemanent = (remanentId: number) => {
  const { data, isLoading, isFetching } = useQuery({
    queryKey: [remanentQueryKey, remanentId],
    queryFn: async () => {
      const response = await axiosInstance.get<RemanentDetails>(
        `/api/v1/remanents/${remanentId}/`,
      );
      return response.data;
    },
    enabled: Number.isFinite(remanentId),
  });

  return {
    remanent: data,
    isLoading: isLoading || isFetching,
  };
};
