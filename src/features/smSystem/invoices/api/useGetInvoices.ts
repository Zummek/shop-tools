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

export const useGetInvoices = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = searchParams.get('page');
  const initialPage = pageParam ? Number(pageParam) - 1 : 0;

  const [page, setPage] = useState(initialPage);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [sellerName, setSellerName] = useState<string>('');
  const [invoiceDateFrom, setInvoiceDateFrom] = useState<string>('');
  const [invoiceDateTo, setInvoiceDateTo] = useState<string>('');
  const [status, setStatus] = useState<InvoiceStatus | ''>('');
  const [sortBy, setSortBy] = useState<InvoiceListSortBy>('invoiceDate');
  const [sortOrder, setSortOrder] = useState<InvoiceListSortOrder>('desc');

  const skipPageResetRef = useRef(true);
  useEffect(() => {
    if (skipPageResetRef.current) {
      skipPageResetRef.current = false;
      return;
    }
    setPage(0);
  }, [status, sortBy, sortOrder]);

  useEffect(() => {
    const pageParam = searchParams.get('page');
    const newPage = pageParam ? Number(pageParam) - 1 : 0;
    if (newPage !== page && newPage >= 0) setPage(newPage);
  }, [searchParams, page]);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (page > 0) params.page = (page + 1).toString();
    setSearchParams(params, { replace: true });
  }, [page, setSearchParams]);

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
    isLoading: isLoading || isFetching,
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
