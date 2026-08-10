import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { axiosInstance } from '../../../../services';
import { ListResponse } from '../../app/types';
import {
  InvoiceListItem,
  InvoiceListSortBy,
  InvoiceListSortOrder,
  InvoiceStatus,
} from '../types';

const pageSize = 25;
const endpoint = '/api/v1/invoices/';
export const getInvoicesQueryKeyBase = 'invoices';

const sortByApi: Record<InvoiceListSortBy, string> = {
  invoiceDate: 'invoice_date',
  createdAt: 'created_at',
  status: 'status',
};

type Response = ListResponse<InvoiceListItem>;

const parsePageFromSearchParams = (searchParams: URLSearchParams): number => {
  const pageParam = searchParams.get('page');
  if (!pageParam) return 0;
  const parsed = Number(pageParam) - 1;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

export const useGetInvoices = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePageFromSearchParams(searchParams);

  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [sellerName, setSellerName] = useState<string>('');
  const [invoiceDateFrom, setInvoiceDateFrom] = useState<string>('');
  const [invoiceDateTo, setInvoiceDateTo] = useState<string>('');
  const [status, setStatus] = useState<InvoiceStatus | ''>('');
  const [sortBy, setSortBy] = useState<InvoiceListSortBy>('invoiceDate');
  const [sortOrder, setSortOrder] = useState<InvoiceListSortOrder>('desc');

  const setPage = (nextPage: number) => {
    const normalized = Math.max(0, nextPage);
    setSearchParams(
      (prev) => {
        const currentPage = parsePageFromSearchParams(prev);
        if (currentPage === normalized) return prev;

        const params = new URLSearchParams(prev);
        if (normalized <= 0) params.delete('page');
        else params.set('page', String(normalized + 1));
        return params;
      },
      { replace: true },
    );
  };

  const skipPageResetRef = useRef(true);
  useEffect(() => {
    if (skipPageResetRef.current) {
      skipPageResetRef.current = false;
      return;
    }
    setSearchParams(
      (prev) => {
        if (!prev.get('page')) return prev;
        const params = new URLSearchParams(prev);
        params.delete('page');
        return params;
      },
      { replace: true },
    );
  }, [status, sortBy, sortOrder, setSearchParams]);

  const getInvoicesRequest = async () => {
    const response = await axiosInstance.get<Response>(endpoint, {
      params: {
        invoiceNumber: invoiceNumber || undefined,
        sellerName: sellerName || undefined,
        invoiceDateFrom: invoiceDateFrom || undefined,
        invoiceDateTo: invoiceDateTo || undefined,
        status: status || undefined,
        sortBy: sortByApi[sortBy],
        sortOrder,
        page: page + 1,
        pageSize,
      },
    });
    return response.data;
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      getInvoicesQueryKeyBase,
      invoiceNumber,
      sellerName,
      invoiceDateFrom,
      invoiceDateTo,
      status,
      sortBy,
      sortOrder,
      page,
    ],
    queryFn: getInvoicesRequest,
    placeholderData: keepPreviousData,
  });

  const hasNextPage = !!data?.next;
  const totalCount = data?.count || null;
  const invoices = data?.results || [];

  return {
    invoices,
    totalCount,
    isLoading: isLoading || (isFetching && !data),
    hasNextPage,
    setPage,
    page,
    pageSize,
    invoiceNumber,
    setInvoiceNumber,
    sellerName,
    setSellerName,
    invoiceDateFrom,
    setInvoiceDateFrom,
    invoiceDateTo,
    setInvoiceDateTo,
    status,
    setStatus,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
  };
};
