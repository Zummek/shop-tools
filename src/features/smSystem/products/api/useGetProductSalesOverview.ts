import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  axiosInstance,
  throwAxiosErrorFromResponse,
} from '../../../../services';
import { ListResponse } from '../../app/types';
import { ProductSalesListItem } from '../types';
import {
  CoverWithinDays,
  exclusiveSalesChannels,
  parseCoverWithin,
  parseProductsListFilters,
  parseSalesOrdering,
  ProductListChannel,
  SalesOrdering,
} from '../utils';
import {
  previousSalesWindow,
  rangeForPreset,
  resolveSalesRange,
  SalesPreset,
} from '../utils/salesPeriod';

const pageSize = 25;
const endpoint = '/api/v1/products/sales-overview/';
const searchDebounceMs = 300;

export interface ProductSalesOverviewResponse
  extends ListResponse<ProductSalesListItem> {
  startDate: string;
  endDate: string;
  previousStartDate: string;
  previousEndDate: string;
  currency: string;
}

const useDebouncedValue = <T>(value: T, delayMs: number): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
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

const coverOrdering = (ordering: SalesOrdering | null) =>
  ordering === 'cover' || ordering === '-cover';

export const useGetProductSalesOverview = ({
  canViewPurchases = false,
  branchId = null,
}: {
  canViewPurchases?: boolean;
  branchId?: number | null;
} = {}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlFilters = parseProductsListFilters(searchParams);
  const query = urlFilters.query;
  const page = urlFilters.page;
  const missingPurchaseCost =
    canViewPurchases && urlFilters.missingPurchaseCost;
  const manualUnset = missingPurchaseCost && urlFilters.manualUnset;
  const rawChannels = urlFilters.channels;
  const channels = exclusiveSalesChannels(rawChannels, rawChannels);
  const soldOnly = urlFilters.soldOnly;
  const ordering = urlFilters.ordering;
  const coverWithin = urlFilters.coverWithin;
  const needsBranch = coverWithin != null || coverOrdering(ordering);
  const range = resolveSalesRange(urlFilters.startDate, urlFilters.endDate);
  const requestQuery = useDebouncedValue(query, searchDebounceMs);
  const previous = range.rangeError
    ? null
    : previousSalesWindow(range.start, range.end);

  const setPage = useCallback(
    (nextPage: number) => {
      const normalized = Math.max(0, nextPage);
      replaceSearchParams(setSearchParams, (params) => {
        const current = parseProductsListFilters(params).page;
        if (current === normalized) return;
        if (normalized <= 0) params.delete('page');
        else params.set('page', String(normalized + 1));
      });
    },
    [setSearchParams],
  );

  const setQuery = useCallback(
    (value: string) => {
      replaceSearchParams(setSearchParams, (params) => {
        const current = params.get('query') ?? '';
        if (current === value) return;
        if (value) params.set('query', value);
        else params.delete('query');
        params.delete('page');
      });
    },
    [setSearchParams],
  );

  const setMissingPurchaseCost = useCallback(
    (value: boolean) => {
      replaceSearchParams(setSearchParams, (params) => {
        const current = params.get('missingPurchaseCost') === '1';
        if (current === value) return;
        if (value) params.set('missingPurchaseCost', '1');
        else params.delete('missingPurchaseCost');
        params.delete('manualUnset');
        params.delete('page');
      });
    },
    [setSearchParams],
  );

  const setManualUnset = useCallback(
    (value: boolean) => {
      replaceSearchParams(setSearchParams, (params) => {
        const current = params.get('manualUnset') === '1';
        if (current === value) return;
        if (value) params.set('manualUnset', '1');
        else params.delete('manualUnset');
        params.delete('page');
      });
    },
    [setSearchParams],
  );

  const setChannels = useCallback(
    (value: ProductListChannel[]) => {
      replaceSearchParams(setSearchParams, (params) => {
        const current = parseProductsListFilters(params).channels;
        const next = exclusiveSalesChannels(current, value);
        if (current.join(',') === next.join(',')) return;
        params.delete('channel');
        for (const channel of next) params.append('channel', channel);
        params.delete('page');
      });
    },
    [setSearchParams],
  );

  const rawChannelKey = rawChannels.join(',');
  const channelKey = channels.join(',');
  useEffect(() => {
    if (rawChannelKey === channelKey) return;
    setChannels(rawChannelKey.split(',') as ProductListChannel[]);
  }, [channelKey, rawChannelKey, setChannels]);

  const setSalesDates = useCallback(
    (start: string, end: string) => {
      replaceSearchParams(setSearchParams, (params) => {
        if (
          params.get('start_date') === start &&
          params.get('end_date') === end
        )
          return;
        params.set('start_date', start);
        params.set('end_date', end);
        params.delete('page');
      });
    },
    [setSearchParams],
  );

  const setSalesPreset = useCallback(
    (days: SalesPreset) => {
      replaceSearchParams(setSearchParams, (params) => {
        if (days === 30) {
          if (!params.get('start_date') && !params.get('end_date')) return;
          params.delete('start_date');
          params.delete('end_date');
          params.delete('page');
          return;
        }
        const next = rangeForPreset(days);
        if (
          params.get('start_date') === next.start &&
          params.get('end_date') === next.end
        )
          return;

        params.set('start_date', next.start);
        params.set('end_date', next.end);
        params.delete('page');
      });
    },
    [setSearchParams],
  );

  const setSoldOnly = useCallback(
    (value: boolean) => {
      replaceSearchParams(setSearchParams, (params) => {
        const current = params.get('sold') === '1';
        if (current === value) return;
        if (value) params.set('sold', '1');
        else params.delete('sold');
        params.delete('page');
      });
    },
    [setSearchParams],
  );

  const setCoverWithin = useCallback(
    (value: CoverWithinDays | null) => {
      replaceSearchParams(setSearchParams, (params) => {
        const current = parseCoverWithin(params.get('cover_within'));
        if (current === value) return;
        if (value) params.set('cover_within', String(value));
        else params.delete('cover_within');
        params.delete('page');
      });
    },
    [setSearchParams],
  );

  const setOrdering = useCallback(
    (value: SalesOrdering | null) => {
      replaceSearchParams(setSearchParams, (params) => {
        const current = parseSalesOrdering(params.get('ordering'));
        if (current === value) return;
        if (value) params.set('ordering', value);
        else params.delete('ordering');
        params.delete('page');
      });
    },
    [setSearchParams],
  );

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: [
      'product-sales-overview',
      requestQuery,
      page,
      missingPurchaseCost,
      manualUnset,
      channels.join(','),
      range.start,
      range.end,
      soldOnly,
      ordering,
      coverWithin,
      branchId,
    ],
    enabled: range.rangeError === null && (!needsBranch || branchId != null),
    queryFn: async ({ signal }) => {
      const response = await axiosInstance.get<ProductSalesOverviewResponse>(
        endpoint,
        {
          signal,
          params: {
            query: requestQuery,
            page: page + 1,
            pageSize,
            missingPurchaseCost: missingPurchaseCost ? 1 : undefined,
            manualUnset: missingPurchaseCost && manualUnset ? 1 : undefined,
            channel: channels.length ? channels : undefined,
            startDate: range.start,
            endDate: range.end,
            sold: soldOnly ? 1 : undefined,
            ordering: ordering ?? undefined,
            branchId: branchId ?? undefined,
            coverWithin:
              branchId != null && coverWithin != null ? coverWithin : undefined,
          },
          paramsSerializer: { indexes: null },
        },
      );
      if (response.status >= 400) throwAxiosErrorFromResponse(response);
      return response.data;
    },
    placeholderData: keepPreviousData,
    refetchOnMount: 'always',
  });

  return {
    products: range.rangeError ? [] : data?.results || [],
    totalCount: range.rangeError ? 0 : data?.count || null,
    isLoading: range.rangeError ? false : isLoading || isFetching,
    isError,
    query,
    setQuery,
    page,
    setPage,
    missingPurchaseCost,
    setMissingPurchaseCost,
    manualUnset,
    setManualUnset,
    channels,
    setChannels,
    startDate: range.start,
    endDate: range.end,
    preset: range.preset,
    rangeError: range.rangeError,
    setSalesDates,
    setSalesPreset,
    previousStart: previous?.previousStart ?? null,
    previousEnd: previous?.previousEnd ?? null,
    soldOnly,
    setSoldOnly,
    ordering,
    setOrdering,
    coverWithin,
    setCoverWithin,
    currency: data?.currency ?? 'PLN',
  };
};
