import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import { ListResponse } from '../../app/types';
import { RemanentDocumentLink } from '../types';

export const remanentDocumentsPageSize = 8;

export const useGetRemanentDocuments = (
  remanentId: number,
  page: number,
  enabled: boolean,
) => {
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['remanentDocuments', remanentId, page],
    queryFn: async () => {
      const response = await axiosInstance.get<
        ListResponse<RemanentDocumentLink>
      >(`/api/v1/remanents/${remanentId}/documents/`, {
        params: {
          page: page + 1,
          pageSize: remanentDocumentsPageSize,
        },
      });
      return response.data;
    },
    placeholderData: keepPreviousData,
    enabled: enabled && Number.isFinite(remanentId),
  });

  return {
    documents: data?.results || [],
    totalCount: data?.count || 0,
    isLoading: isLoading || isFetching,
  };
};
