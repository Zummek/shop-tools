import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import { ListResponse } from '../../app/types';
import { RemanentListItem, RemanentStatus } from '../types';

export const remanentsPageSize = 25;
export const remanentsQueryKey = 'remanents';

interface Payload {
  page: number;
  status?: RemanentStatus;
}

export const useGetRemanents = ({ page, status }: Payload) => {
  const { data, isLoading, isFetching } = useQuery({
    queryKey: [remanentsQueryKey, page, status],
    queryFn: async () => {
      const response = await axiosInstance.get<ListResponse<RemanentListItem>>(
        '/api/v1/remanents/',
        {
          params: {
            page: page + 1,
            pageSize: remanentsPageSize,
            status,
          },
        },
      );
      return response.data;
    },
    placeholderData: keepPreviousData,
  });

  return {
    remanents: data?.results || [],
    totalCount: data?.count || 0,
    isLoading: isLoading || isFetching,
  };
};
