import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { axiosInstance } from '../../../services';
import { TransferListItem } from '../types';

import { getTransfersGraphqlQuery } from './transfersGraphql';

interface Payload {
  page: number;
}

interface Response {
  data: {
    transfers: {
      node: TransferListItem[];
      pageInfo: {
        totalCount: number;
        hasNextPage: number;
      };
    };
  };
}

export const pageSize = 25;
const getQueryKey = (page: number) => ['transfers', page];

export const useGetTransfers = ({ page }: Payload) => {
  const offset = page * pageSize;

  const getTransfersRequest = async () => {
    const response = await axiosInstance.post<Response>(
      '/graphql',
      getTransfersGraphqlQuery(offset, pageSize)
    );
    return response.data;
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: getQueryKey(page),
    queryFn: getTransfersRequest,
    placeholderData: keepPreviousData,
  });

  const transfers: TransferListItem[] = data?.data.transfers.node || [];
  const hasNextPage = !!data?.data.transfers.pageInfo.hasNextPage;
  const totalCount = data?.data.transfers.pageInfo.totalCount || null;

  return {
    transfers,
    totalCount,
    isLoading: isLoading || isFetching,
    hasNextPage,
  };
};
