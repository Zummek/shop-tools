import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { axiosInstance } from '../../../../services';
import { ListResponse, emptyListResponse } from '../../app/types';
import { ProductConditions } from '../types';

const endpoint = '/api/v1/suppliers-orders/branches/products/conditions/';
export const getConditionsListQueryKeyBase = 'v2-product-conditions';

export const useGetProductConditionsList = () => {
  const [page, setPage] = useState(0);
  const [pageSize] = useState(25);
  const [query, setQuery] = useState('');

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: [getConditionsListQueryKeyBase, query, page, pageSize],
    queryFn: async () => {
      const response = await axiosInstance.get<ListResponse<ProductConditions>>(
        endpoint,
        {
          params: {
            query,
            page: page + 1,
            pageSize,
          },
        },
      );
      return response.data || emptyListResponse;
    },
    placeholderData: keepPreviousData,
  });

  return {
    products: data?.results ?? [],
    totalCount: data?.count ?? 0,
    isLoading: isLoading || isFetching,
    query,
    setQuery,
    page,
    setPage,
    pageSize,
    refetch,
  };
};
