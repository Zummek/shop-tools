import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { axiosInstance } from '../../../../services';
import { ListResponse } from '../../app/types';
import { OrderStatus } from '../types';

const pageSize = 25;
const endpoint = '/api/v1/ecommerce/orders/';
export const getEcommerceOrdersQueryKeyBase = 'ecommerceOrders';

export type OrderSourceFilter = 'allegro' | 'woocommerce' | 'erli' | '';

export interface EcommerceOrderListItem {
  id: number;
  orderDate: string;
  orderSource: string;
  status: OrderStatus;
  externalStatus: string | null;
  buyerName: string;
  buyerLogin: string;
  deliveryName: string | null;
  itemsAmount: number;
  productsAmount: number;
  hasUnmatchedItems: boolean;
  hasUncertainMatch: boolean;
  needsProductReview: boolean;
}
type Response = ListResponse<EcommerceOrderListItem>;

export const useGetEcommerceOrders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = searchParams.get('page');
  const sourceParam = searchParams.get('orderSource');
  const needsReviewParam = searchParams.get('needsProductReview');
  const initialPage = pageParam ? Number(pageParam) - 1 : 0;
  const initialSource: OrderSourceFilter =
    sourceParam === 'allegro' ||
    sourceParam === 'woocommerce' ||
    sourceParam === 'erli'
      ? sourceParam
      : '';
  const initialNeedsReview =
    needsReviewParam === '1' || needsReviewParam === 'true';

  const [page, setPage] = useState(initialPage);
  const [query, setQuery] = useState<string>('');
  const [orderSource, setOrderSourceState] =
    useState<OrderSourceFilter>(initialSource);
  const [needsProductReview, setNeedsProductReviewState] =
    useState(initialNeedsReview);

  useEffect(() => {
    const pageParam = searchParams.get('page');
    const newPage = pageParam ? Number(pageParam) - 1 : 0;
    if (newPage !== page && newPage >= 0) setPage(newPage);
  }, [searchParams, page]);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (page > 0) params.page = (page + 1).toString();
    if (orderSource) params.orderSource = orderSource;
    if (needsProductReview) params.needsProductReview = '1';
    setSearchParams(params, { replace: true });
  }, [page, orderSource, needsProductReview, setSearchParams]);

  const setOrderSource = (source: OrderSourceFilter) => {
    setOrderSourceState(source);
    setPage(0);
  };

  const setNeedsProductReview = (value: boolean) => {
    setNeedsProductReviewState(value);
    setPage(0);
  };

  const getEcommerceOrdersRequest = async () => {
    const response = await axiosInstance.get<Response>(endpoint, {
      params: {
        query,
        page: page + 1,
        pageSize,
        ...(orderSource ? { orderSource } : {}),
        ...(needsProductReview ? { needsProductReview: true } : {}),
      },
    });
    return response.data;
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      getEcommerceOrdersQueryKeyBase,
      query,
      page,
      orderSource,
      needsProductReview,
    ],
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
    orderSource,
    setOrderSource,
    needsProductReview,
    setNeedsProductReview,
  };
};
