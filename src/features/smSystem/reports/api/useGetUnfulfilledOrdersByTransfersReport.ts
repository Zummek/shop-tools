import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  browserStorage,
  gridStorageIds,
  patchPersistedGridState,
  readPersistedGridState,
} from '../../../../components/dataGrid/persistedGridState';
import { axiosInstance } from '../../../../services';
import { ListResponse } from '../../app/types';
import { resolveUnfulfilledSort } from '../utils/unfulfilledOrdersSort';

const endpoint = '/api/v1/reports/unfulfilled-orders-by-transfers/';
const getQueryKey = (params: Params) => [
  'unfulfilledOrdersByTransfersReport',
  params,
];

export type UnfulfilledOrdersByTransfersReportSortBy =
  | 'product_name'
  | 'order_count'
  | 'transfer_count'
  | 'ordered_products_count'
  | 'received_products_count'
  | 'undelivered_products_count'
  | 'undelivered_products_percent';

export type UnfulfilledOrdersByTransfersReportSortOrder = 'asc' | 'desc';

const sortFields: UnfulfilledOrdersByTransfersReportSortBy[] = [
  'product_name',
  'order_count',
  'transfer_count',
  'ordered_products_count',
  'received_products_count',
  'undelivered_products_count',
  'undelivered_products_percent',
];

interface Params {
  page: number;
  pageSize: number;
  branchSourceId: number;
  branchDestinationId: number;
  startDate: string;
  endDate: string;
  onlyPosted: boolean;
  sortBy: UnfulfilledOrdersByTransfersReportSortBy;
  sortOrder: UnfulfilledOrdersByTransfersReportSortOrder;
  filterPhrase?: string;
}

export interface UnfulfilledOrdersByTransfersReportItem {
  product: {
    id: number;
    name: string;
  };
  orderCount: number;
  transferCount: number;
  orderedProductsCount: number;
  receivedProductsCount: number;
  undeliveredProductsCount: number;
  undeliveredProductsPercent: number;
}

type Response = ListResponse<UnfulfilledOrdersByTransfersReportItem>;

export const useGetUnfulfilledOrdersByTransfersReport = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const getInitialNumber = (
    param: string,
    defaultValue: number | null = null,
  ): number | null => {
    const value = searchParams.get(param);
    return value ? Number(value) : defaultValue;
  };

  const getInitialDate = (
    param: string,
    defaultValue: Date | null = null,
  ): Date | null => {
    const value = searchParams.get(param);
    return value ? dayjs(value).toDate() : defaultValue;
  };

  const getInitialBoolean = (param: string, defaultValue: boolean): boolean => {
    const value = searchParams.get(param);
    return value !== null ? value === 'true' : defaultValue;
  };

  const [page, setPage] = useState(getInitialNumber('page', 1) || 1);
  const [pageSize, setPageSize] = useState(
    getInitialNumber('pageSize', 50) || 50,
  );
  const [initialSort] = useState(() => {
    const stored = readPersistedGridState(
      browserStorage(),
      gridStorageIds.unfulfilledOrders,
    ).sort?.[0];
    return resolveUnfulfilledSort({
      urlSortBy: searchParams.get('sortBy'),
      urlSortOrder: searchParams.get('sortOrder'),
      urlHasSortBy: searchParams.has('sortBy'),
      urlHasSortOrder: searchParams.has('sortOrder'),
      storedField: stored?.field,
      storedOrder: stored?.sort,
      fields: sortFields,
      defaultField: 'product_name',
    });
  });
  const [sortBy, setSortByState] =
    useState<UnfulfilledOrdersByTransfersReportSortBy>(initialSort.sortBy);
  const [sortOrder, setSortOrderState] =
    useState<UnfulfilledOrdersByTransfersReportSortOrder>(
      initialSort.sortOrder,
    );
  const sortRef = useRef(initialSort);
  sortRef.current = { sortBy, sortOrder };

  const rememberSort = (
    nextBy: UnfulfilledOrdersByTransfersReportSortBy,
    nextOrder: UnfulfilledOrdersByTransfersReportSortOrder,
  ) => {
    sortRef.current = { sortBy: nextBy, sortOrder: nextOrder };
    patchPersistedGridState(
      browserStorage(),
      gridStorageIds.unfulfilledOrders,
      {
        sort: [{ field: nextBy, sort: nextOrder }],
      },
    );
  };

  const setSortBy = (value: UnfulfilledOrdersByTransfersReportSortBy) => {
    rememberSort(value, sortRef.current.sortOrder);
    setSortByState(value);
  };

  const setSortOrder = (value: UnfulfilledOrdersByTransfersReportSortOrder) => {
    rememberSort(sortRef.current.sortBy, value);
    setSortOrderState(value);
  };
  const [branchSourceId, setBranchSourceId] = useState<number | null>(
    getInitialNumber('branchSourceId'),
  );
  const [branchDestinationId, setBranchDestinationId] = useState<number | null>(
    getInitialNumber('branchDestinationId'),
  );
  const [startDate, setStartDate] = useState<Date | null>(
    getInitialDate('startDate', dayjs().subtract(1, 'week').toDate()),
  );
  const [endDate, setEndDate] = useState<Date | null>(
    getInitialDate('endDate', new Date()),
  );
  const [filterPhrase, setFilterPhrase] = useState<string | null>(
    searchParams.get('filterPhrase'),
  );
  const [showOnlyPosted, setShowOnlyPosted] = useState(
    getInitialBoolean('showOnlyPosted', false),
  );

  useEffect(() => {
    const params: Record<string, string> = {};

    if (page !== 1) params.page = page.toString();
    if (pageSize !== 50) params.pageSize = pageSize.toString();
    if (sortBy !== 'product_name') params.sortBy = sortBy;
    if (sortOrder !== 'asc') params.sortOrder = sortOrder;
    if (branchSourceId) params.branchSourceId = branchSourceId.toString();
    if (branchDestinationId)
      params.branchDestinationId = branchDestinationId.toString();
    if (startDate) params.startDate = dayjs(startDate).format('YYYY-MM-DD');
    if (endDate) params.endDate = dayjs(endDate).format('YYYY-MM-DD');
    if (filterPhrase) params.filterPhrase = filterPhrase;
    if (showOnlyPosted) params.showOnlyPosted = showOnlyPosted.toString();

    setSearchParams(params, { replace: true });
  }, [
    page,
    pageSize,
    sortBy,
    sortOrder,
    branchSourceId,
    branchDestinationId,
    startDate,
    endDate,
    filterPhrase,
    showOnlyPosted,
    setSearchParams,
  ]);

  const getUnfulfilledOrdersByTransfersReportRequest = async (
    params: Params,
  ) => {
    const response = await axiosInstance.get<Response>(endpoint, { params });
    return response.data;
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: getQueryKey({
      page,
      pageSize,
      branchSourceId: branchSourceId ?? 0,
      branchDestinationId: branchDestinationId ?? 0,
      startDate: startDate ? dayjs(startDate).format('YYYY-MM-DD') : '',
      endDate: endDate ? dayjs(endDate).format('YYYY-MM-DD') : '',
      filterPhrase: filterPhrase ?? '',
      onlyPosted: false,
      sortBy,
      sortOrder,
    }),
    queryFn: () =>
      getUnfulfilledOrdersByTransfersReportRequest({
        page,
        pageSize,
        branchSourceId: branchSourceId ?? 0,
        branchDestinationId: branchDestinationId ?? 0,
        startDate: startDate ? dayjs(startDate).format('YYYY-MM-DD') : '',
        endDate: endDate ? dayjs(endDate).format('YYYY-MM-DD') : '',
        filterPhrase: filterPhrase ?? '',
        onlyPosted: showOnlyPosted,
        sortBy,
        sortOrder,
      }),
    enabled:
      !!branchSourceId && !!branchDestinationId && !!startDate && !!endDate,
  });

  return {
    data,
    isLoading,
    isError,
    page,
    setPage,
    branchSourceId,
    setBranchSourceId,
    branchDestinationId,
    setBranchDestinationId,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    filterPhrase,
    setFilterPhrase,
    pageSize,
    setPageSize,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    showOnlyPosted,
    setShowOnlyPosted,
  };
};
