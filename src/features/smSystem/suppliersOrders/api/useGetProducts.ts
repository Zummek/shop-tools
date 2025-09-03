import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { axiosInstance } from '../../../../services';
import {
  emptyListResponse,
  ListResponse,
  PaginationState,
} from '../../app/types';
import { Product } from '../../products/types';

export type GetProductsResponse = ListResponse<Product>;

const endpoint = '/api/v1/products/';

export const useGetProducts = () => {
  const [pagination, setPagination] = useState<PaginationState>({
    page: 0,
    pageSize: 25,
  });
  const [name, setName] = useState('');

  const getProductsRequest = async () => {
    const response = await axiosInstance.get<GetProductsResponse>(endpoint, {
      params: {
        page: pagination.page + 1,
        pageSize: pagination.pageSize,
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
    queryKey: ['products', { pagination, name }],
    queryFn: getProductsRequest,
    placeholderData: (previousData) => previousData,
  });

  return {
    products,
    isLoading,
    refetch,
    pagination,
    setPagination,
    name,
    setName,
  };
};
