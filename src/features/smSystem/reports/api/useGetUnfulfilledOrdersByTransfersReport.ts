import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useState } from 'react';

import { axiosInstance } from '../../../../services';
import { ListResponse } from '../../app/types';

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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortBy, setSortBy] =
    useState<UnfulfilledOrdersByTransfersReportSortBy>('product_name');
  const [sortOrder, setSortOrder] =
    useState<UnfulfilledOrdersByTransfersReportSortOrder>('asc');
  const [branchSourceId, setBranchSourceId] = useState<number | null>(null);
  const [branchDestinationId, setBranchDestinationId] = useState<number | null>(
    null
  );
  const [startDate, setStartDate] = useState<Date | null>(
    dayjs().subtract(1, 'week').toDate()
  );
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [filterPhrase, setFilterPhrase] = useState<string | null>(null);

  const getUnfulfilledOrdersByTransfersReportRequest = async (
    params: Params
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
        onlyPosted: false,
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
  };
};
