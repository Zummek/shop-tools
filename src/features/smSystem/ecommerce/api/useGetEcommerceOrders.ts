import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

import { axiosInstance } from '../../../../services';
import { ListResponse } from '../../app/types';
import { OrderStatus } from '../types';
import { ORDER_STATUSES } from '../utils/orderStatusConfig';

const pageSize = 25;
const endpoint = '/api/v1/ecommerce/orders/';
export const getEcommerceOrdersQueryKeyBase = 'ecommerceOrders';

export type OrderSourceFilter = 'allegro' | 'woocommerce' | 'erli' | '';
export type OrderStatusFilter = OrderStatus | '';

export interface EcommerceOrderListItem {
  id: number;
  orderDate: string;
  orderSource: string;
  status: OrderStatus;
  externalStatus: string | null;
  buyerName: string;
  buyerLogin: string;
  deliveryName: string | null;
  deliveryGroupId: number | null;
  deliveryGroupName: string | null;
  itemsAmount: number;
  productsAmount: number;
  hasUnmatchedItems: boolean;
  hasUncertainMatch: boolean;
  needsProductReview: boolean;
}
type Response = ListResponse<EcommerceOrderListItem>;

const parseCsv = (value: string | null): string[] =>
  (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const parseCsvInts = (value: string | null): number[] =>
  parseCsv(value)
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item > 0);

const parseOrderSource = (value: string | null): OrderSourceFilter =>
  value === 'allegro' || value === 'woocommerce' || value === 'erli'
    ? value
    : '';

const parseStatus = (value: string | null): OrderStatusFilter =>
  value && ORDER_STATUSES.includes(value as OrderStatus)
    ? (value as OrderStatus)
    : '';

const parsePage = (value: string | null): number => {
  const parsed = value ? Number(value) : 1;
  if (!Number.isInteger(parsed) || parsed < 1) return 0;
  return parsed - 1;
};

const replaceSearchParams = (
  setSearchParams: ReturnType<typeof useSearchParams>[1],
  update: (params: URLSearchParams) => void,
) => {
  setSearchParams(
    (prev) => {
      const params = new URLSearchParams(prev);
      update(params);
      if (params.toString() === prev.toString()) return prev;
      return params;
    },
    { replace: true },
  );
};

const parseProductId = (value: string | null): number | null => {
  if (!value || !/^[1-9]\d*$/.test(value)) return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) return null;
  return parsed;
};

const readListParams = (params: URLSearchParams) => ({
  page: parsePage(params.get('page')),
  query: (params.get('query') || '').trim(),
  productId: parseProductId(params.get('product')),
  orderSource: parseOrderSource(params.get('orderSource')),
  status: parseStatus(params.get('status')),
  needsProductReview:
    params.get('needsProductReview') === '1' ||
    params.get('needsProductReview') === 'true',
  deliveryGroupIds: parseCsvInts(params.get('deliveryGroupIds')),
  deliveryIds: parseCsv(params.get('deliveryIds')),
});

export const useGetEcommerceOrders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    page,
    query,
    productId,
    orderSource,
    status,
    needsProductReview,
    deliveryGroupIds,
    deliveryIds,
  } = readListParams(searchParams);

  const setPage = useCallback(
    (nextPage: number) => {
      const normalized = Number.isFinite(nextPage)
        ? Math.max(0, Math.floor(nextPage))
        : 0;
      replaceSearchParams(setSearchParams, (params) => {
        if (readListParams(params).page === normalized) return;
        if (normalized <= 0) params.delete('page');
        else params.set('page', String(normalized + 1));
      });
    },
    [setSearchParams],
  );

  const setQuery = useCallback(
    (value: string) => {
      const next = value.trim();
      replaceSearchParams(setSearchParams, (params) => {
        if (readListParams(params).query === next) return;
        if (next) params.set('query', next);
        else params.delete('query');
        params.delete('page');
      });
    },
    [setSearchParams],
  );

  const setStatus = useCallback(
    (nextStatus: OrderStatusFilter) => {
      replaceSearchParams(setSearchParams, (params) => {
        if (readListParams(params).status === nextStatus) return;
        if (nextStatus) params.set('status', nextStatus);
        else params.delete('status');
        params.delete('page');
      });
    },
    [setSearchParams],
  );

  const setProductId = useCallback(
    (nextId: number | null) => {
      replaceSearchParams(setSearchParams, (params) => {
        if (readListParams(params).productId === nextId) return;
        if (nextId) params.set('product', String(nextId));
        else params.delete('product');
        params.delete('page');
      });
    },
    [setSearchParams],
  );

  const setOrderSource = useCallback(
    (source: OrderSourceFilter) => {
      replaceSearchParams(setSearchParams, (params) => {
        if (readListParams(params).orderSource === source) return;
        if (source) params.set('orderSource', source);
        else params.delete('orderSource');
        params.delete('page');
      });
    },
    [setSearchParams],
  );

  const setNeedsProductReview = useCallback(
    (value: boolean) => {
      replaceSearchParams(setSearchParams, (params) => {
        if (readListParams(params).needsProductReview === value) return;
        if (value) params.set('needsProductReview', '1');
        else params.delete('needsProductReview');
        params.delete('page');
      });
    },
    [setSearchParams],
  );

  const setDeliveryFilters = useCallback(
    (groupIds: number[], methodIds: string[]) => {
      const nextGroups = groupIds.filter(
        (id) => Number.isInteger(id) && id > 0,
      );
      const nextMethods = methodIds.map((id) => id.trim()).filter(Boolean);
      replaceSearchParams(setSearchParams, (params) => {
        const current = readListParams(params);
        if (
          current.deliveryGroupIds.join(',') === nextGroups.join(',') &&
          current.deliveryIds.join(',') === nextMethods.join(',')
        )
          return;
        if (nextGroups.length)
          params.set('deliveryGroupIds', nextGroups.join(','));
        else params.delete('deliveryGroupIds');
        if (nextMethods.length)
          params.set('deliveryIds', nextMethods.join(','));
        else params.delete('deliveryIds');
        params.delete('page');
      });
    },
    [setSearchParams],
  );

  const getEcommerceOrdersRequest = async () => {
    const response = await axiosInstance.get<Response>(endpoint, {
      params: {
        page: page + 1,
        pageSize,
        ...(query ? { query } : {}),
        ...(productId ? { product: productId } : {}),
        ...(orderSource ? { orderSource } : {}),
        ...(status ? { status } : {}),
        ...(needsProductReview ? { needsProductReview: true } : {}),
        ...(deliveryGroupIds.length ? { deliveryGroupIds } : {}),
        ...(deliveryIds.length ? { deliveryIds } : {}),
      },
    });
    return response.data;
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      getEcommerceOrdersQueryKeyBase,
      query,
      productId,
      page,
      orderSource,
      status,
      needsProductReview,
      deliveryGroupIds,
      deliveryIds,
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
    productId,
    setProductId,
    setPage,
    page,
    pageSize,
    orderSource,
    setOrderSource,
    status,
    setStatus,
    needsProductReview,
    setNeedsProductReview,
    deliveryGroupIds,
    deliveryIds,
    setDeliveryFilters,
  };
};
