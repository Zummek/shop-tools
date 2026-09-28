import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { axiosInstance } from '../../../../services';
import { ListResponse } from '../../app/types';
import { Product } from '../types';

const pageSize = 25;
const endpoint = '/api/v1/products/';
const getProductsQueryKeyBase = 'products';

type Response = ListResponse<Product>;

export const useGetProducts = ({
  missingPurchaseCost = false,
  manualUnset = false,
}: {
  missingPurchaseCost?: boolean;
  manualUnset?: boolean;
} = {}) => {
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState<string>('');

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      getProductsQueryKeyBase,
      query,
      page,
      missingPurchaseCost,
      manualUnset,
    ],
    queryFn: async ({ signal }) => {
      const response = await axiosInstance.get<Response>(endpoint, {
        signal,
        params: {
          query,
          page: page + 1,
          pageSize,
          missingPurchaseCost: missingPurchaseCost ? 1 : undefined,
          manualUnset: missingPurchaseCost && manualUnset ? 1 : undefined,
        },
      });
      return response.data;
    },
    placeholderData: keepPreviousData,
  });

  const hasNextPage = !!data?.next;
  const totalCount = data?.count || null;
  const products = data?.results || [];

  return {
    products,
    totalCount,
    isLoading: isLoading || isFetching,
    hasNextPage,
    setQuery,
    query,
    setPage,
    page,
  };
};
