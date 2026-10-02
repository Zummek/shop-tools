import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import { ListResponse } from '../../app/types';
import { RemanentBucket, RemanentLine } from '../types';

export const remanentLinesPageSize = 25;
export const remanentLinesQueryKey = 'remanentLines';

interface Payload {
  remanentId: number;
  page: number;
  bucket: RemanentBucket | '';
}

export const useGetRemanentLines = ({ remanentId, page, bucket }: Payload) => {
  const { data, isLoading, isFetching } = useQuery({
    queryKey: [remanentLinesQueryKey, remanentId, page, bucket],
    queryFn: async () => {
      const response = await axiosInstance.get<ListResponse<RemanentLine>>(
        `/api/v1/remanents/${remanentId}/lines/`,
        {
          params: {
            page: page + 1,
            pageSize: remanentLinesPageSize,
            bucket: bucket || undefined,
          },
        },
      );
      return response.data;
    },
    placeholderData: keepPreviousData,
    enabled: Number.isFinite(remanentId),
  });

  return {
    lines: data?.results || [],
    totalCount: data?.count || 0,
    isLoading: isLoading || isFetching,
  };
};
