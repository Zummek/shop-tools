import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { axiosInstance } from '../../../../services';
import { ListResponse } from '../../app/types';

const pageSize = 25;
const endpoint = '/api/v1/ecommerce/orders/';
export const getEcommerceOrdersQueryKeyBase = 'ecommerceOrders';

export interface EcommerceOrderListItem {
  id: number;
  orderDate: string;
  orderSource: string;
  buyerName: string;
  itemsAmount: number;
  productsAmount: number;
}
type Response = ListResponse<EcommerceOrderListItem>;

export const useGetEcommerceOrders = () => {
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState<string>('');

  const getEcommerceOrdersRequest = async () => {
    const offset = page * pageSize;
    const response = await axiosInstance.get<Response>(endpoint, {
      params: {
        query,
        offset,
        limit: pageSize,
      },
    });
    return response.data;
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [getEcommerceOrdersQueryKeyBase, query, page],
    queryFn: getEcommerceOrdersRequest,
    placeholderData: keepPreviousData,
  });

  const hasNextPage = !!data?.next;
  const totalCount = data?.count || null;
  const ecommerceOrders = data?.results || [];

  return {
    ecommerceOrders,
    totalCount,
    isLoading: isLoading || isFetching,
    hasNextPage,
    setQuery,
    query,
    setPage,
    page,
    pageSize,
  };
};
