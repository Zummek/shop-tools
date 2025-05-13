import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { axiosInstance } from '../../../../services';
import {
  emptyListResponse,
  ListResponse,
  Product,
} from '../../app/types/index';

export type GetProductsResponse = ListResponse<Product>;

const endpoint = '/api/v1/products/';

export const useGetProducts = () => {
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [name, setName] = useState('');

  const getProductsRequest = async () => {
    const response = await axiosInstance.get<GetProductsResponse>(endpoint, {
      params: {
        page,
        pageSize,
        query: name,
      },
    });

    return response.data || emptyListResponse;
  };

  const {
    data: products,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['products', { page, pageSize, name }],
    queryFn: getProductsRequest,
  });

  return {
    products,
    isLoading,
    refetch,
    pageSize,
    setPageSize,
    page,
    setPage,
    name,
    setName,
  };
};
