import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { axiosInstance } from '../../../../services';
import { ListResponse } from '../../app/types';
import { ChannelProductLink } from '../types/channelLinks';

const endpoint = '/api/v1/ecommerce/allegro/offers/';
export const allegroOffersQueryKeyBase = 'allegro-offers';

type Response = ListResponse<ChannelProductLink>;

interface Options {
  unmatchedOnly?: boolean;
  activeOnly?: boolean;
  enabled?: boolean;
}

export const useGetAllegroOffers = (options: Options = {}) => {
  const { unmatchedOnly = false, activeOnly = true, enabled = true } = options;
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');
  const pageSize = 25;

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: [
      allegroOffersQueryKeyBase,
      query,
      page,
      unmatchedOnly,
      activeOnly,
    ],
    queryFn: async () => {
      const response = await axiosInstance.get<Response>(endpoint, {
        params: {
          query: query || undefined,
          page: page + 1,
          pageSize,
          unmatchedOnly: unmatchedOnly || undefined,
          activeOnly,
        },
      });
      return response.data;
    },
    placeholderData: keepPreviousData,
    enabled,
  });

  return {
    offers: data?.results ?? [],
    totalCount: data?.count ?? null,
    isLoading: isLoading || isFetching,
    hasNextPage: !!data?.next,
    page,
    setPage,
    query,
    setQuery,
    refetch,
  };
};
