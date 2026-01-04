import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { axiosInstance } from '../../../../services';
import { ListResponse } from '../../app/types';
import { Product } from '../types';

const pageSize = 25;
const endpoint = '/api/v1/products/';
const getProductsQueryKeyBase = 'products';

type Response = ListResponse<Product>;

export const useGetProducts = () => {
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState<string>('');

  const getProductsRequest = async () => {
    const response = await axiosInstance.get<Response>(endpoint, {
      params: {
        query,
        page: page + 1,
        pageSize,
      },
    });
    return response.data;
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [getProductsQueryKeyBase, query, page],
    queryFn: getProductsRequest,
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
