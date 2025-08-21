import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { axiosInstance } from '../../../../services';
import { ListResponse } from '../../app/types';
import { PriceTagGroupListItem } from '../types';

type Response = ListResponse<PriceTagGroupListItem>;

export const pageSize = 25;
export const priceTagGroupsListQueryKeyBase = 'priceTagGroupsList';
const endpoint = '/api/v1/products/price-tag-groups/';
const getQueryKey = (page: number, phrase: string) => [
  priceTagGroupsListQueryKeyBase,
  page,
  phrase,
];

export const useGetPriceTagGroups = () => {
  const [page, setPage] = useState(0);
  const [phrase, setPhrase] = useState('');

  const getPriceTagGroupsRequest = async () => {
    const response = await axiosInstance.get<Response>(endpoint, {
      params: {
        phrase,
        page: page + 1,
        pageSize,
      },
    });
    return response.data;
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: getQueryKey(page, phrase),
    queryFn: getPriceTagGroupsRequest,
    placeholderData: keepPreviousData,
  });

  const priceTagGroups: PriceTagGroupListItem[] = data?.results || [];
  const hasNextPage = !!data?.next;
  const totalCount = data?.count || null;

  return {
    priceTagGroups,
    totalCount,
    isLoading: isLoading || isFetching,
    hasNextPage,
    page,
    setPage,
    phrase,
    setPhrase,
  };
};
