import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import { ListResponse } from '../../app/types';
import { TransferListItem } from '../types';

interface Payload {
  page: number;
}

type Response = ListResponse<TransferListItem>;

export const pageSize = 25;
export const getTransfersQueryKeyBase = 'transfers';
const getQueryKey = (page: number) => [getTransfersQueryKeyBase, page];
const endpoint = '/api/v1/transfers/';

export const useGetTransfers = ({ page }: Payload) => {
  const getTransfersRequest = async () => {
    const response = await axiosInstance.get<Response>(
      `${endpoint}?page=${page + 1}&pageSize=${pageSize}`
    );
    return response.data;
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: getQueryKey(page),
    queryFn: getTransfersRequest,
    placeholderData: keepPreviousData,
  });

  const transfers: TransferListItem[] = data?.results || [];
  const hasNextPage = !!data?.next;
  const totalCount = data?.count || null;

  return {
    transfers,
    totalCount,
    isLoading: isLoading || isFetching,
    hasNextPage,
  };
};
