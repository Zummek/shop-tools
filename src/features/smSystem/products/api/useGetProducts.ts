import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { axiosInstance } from '../../../../services';
import { ListResponse } from '../../app/types';
import { Product } from '../types';
import {
  parseProductsListFilters,
  PRODUCT_LIST_CHANNELS,
  ProductListChannel,
} from '../utils';

const pageSize = 25;
const endpoint = '/api/v1/products/';
const searchDebounceMs = 300;
export const getProductsQueryKeyBase = 'products';

type Response = ListResponse<Product>;

const useDebouncedValue = <T>(value: T, delayMs: number): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    if (delayMs <= 0) return;
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return delayMs <= 0 ? value : debounced;
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

export const useGetProducts = ({
  syncSearchParams = false,
  canViewPurchases = false,
}: {
  /** Persist query, page, and purchase filters in the URL. */
  syncSearchParams?: boolean;
  canViewPurchases?: boolean;
} = {}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [localPage, setLocalPage] = useState(0);
  const [localQuery, setLocalQuery] = useState('');
  const [localChannels, setLocalChannels] = useState<ProductListChannel[]>([]);

  const urlFilters = parseProductsListFilters(searchParams);
  const query = syncSearchParams ? urlFilters.query : localQuery;
  const page = syncSearchParams ? urlFilters.page : localPage;
  const missingPurchaseCost =
    syncSearchParams && canViewPurchases && urlFilters.missingPurchaseCost;
  const manualUnset = missingPurchaseCost && urlFilters.manualUnset;
  const channels = syncSearchParams ? urlFilters.channels : localChannels;
  const requestQuery = useDebouncedValue(
    query,
    syncSearchParams ? searchDebounceMs : 0,
  );

  const setPage = useCallback(
    (nextPage: number) => {
      const normalized = Math.max(0, nextPage);
      if (!syncSearchParams) {
        setLocalPage(normalized);
        return;
      }
      replaceSearchParams(setSearchParams, (params) => {
        const current = parseProductsListFilters(params).page;
        if (current === normalized) return;
        if (normalized <= 0) params.delete('page');
        else params.set('page', String(normalized + 1));
      });
    },
    [setSearchParams, syncSearchParams],
  );

  const setQuery = useCallback(
    (value: string) => {
      if (!syncSearchParams) {
        setLocalQuery(value);
        return;
      }
      replaceSearchParams(setSearchParams, (params) => {
        const current = params.get('query') ?? '';
        if (current === value) return;
        if (value) params.set('query', value);
        else params.delete('query');
        params.delete('page');
      });
    },
    [setSearchParams, syncSearchParams],
  );

  const setMissingPurchaseCost = useCallback(
    (value: boolean) => {
      if (!syncSearchParams) return;
      replaceSearchParams(setSearchParams, (params) => {
        const current = params.get('missingPurchaseCost') === '1';
        if (current === value) return;
        if (value) params.set('missingPurchaseCost', '1');
        else params.delete('missingPurchaseCost');
        params.delete('manualUnset');
        params.delete('page');
      });
    },
    [setSearchParams, syncSearchParams],
  );

  const setChannels = useCallback(
    (value: ProductListChannel[]) => {
      const next = PRODUCT_LIST_CHANNELS.filter((channel) =>
        value.includes(channel),
      );
      if (!syncSearchParams) {
        setLocalChannels(next);
        setLocalPage(0);
        return;
      }
      replaceSearchParams(setSearchParams, (params) => {
        const current = parseProductsListFilters(params).channels.join(',');
        if (current === next.join(',')) return;
        params.delete('channel');
        for (const channel of next) params.append('channel', channel);
        params.delete('page');
      });
    },
    [setSearchParams, syncSearchParams],
  );

  const setManualUnset = useCallback(
    (value: boolean) => {
      if (!syncSearchParams) return;
      replaceSearchParams(setSearchParams, (params) => {
        const current = params.get('manualUnset') === '1';
        if (current === value) return;
        if (value) params.set('manualUnset', '1');
        else params.delete('manualUnset');
        params.delete('page');
      });
    },
    [setSearchParams, syncSearchParams],
  );

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      getProductsQueryKeyBase,
      requestQuery,
      page,
      missingPurchaseCost,
      manualUnset,
      channels.join(','),
    ],
    queryFn: async ({ signal }) => {
      const response = await axiosInstance.get<Response>(endpoint, {
        signal,
        params: {
          query: requestQuery,
          page: page + 1,
          pageSize,
          missingPurchaseCost: missingPurchaseCost ? 1 : undefined,
          manualUnset: missingPurchaseCost && manualUnset ? 1 : undefined,
          channel: channels.length ? channels : undefined,
        },
        paramsSerializer: { indexes: null },
      });
      return response.data;
    },
    placeholderData: keepPreviousData,
    refetchOnMount: syncSearchParams ? 'always' : undefined,
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
    missingPurchaseCost,
    setMissingPurchaseCost,
    manualUnset,
    setManualUnset,
    channels,
    setChannels,
  };
};
