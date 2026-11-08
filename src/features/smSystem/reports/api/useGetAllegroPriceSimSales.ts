import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useEffect, useMemo, useState } from 'react';

import {
  axiosInstance,
  throwAxiosErrorFromResponse,
} from '../../../../services';
import {
  parseIsoDateParam,
  rangeForPreset,
  salesRangeError,
} from '../../products/utils/salesPeriod';

const endpoint = '/api/v1/reports/allegro-price-sim/sales/';
const STORAGE_KEY = 'sm.allegroPriceSim.sales';

export const ALLEGRO_SALES_MARKETPLACES = [
  { id: 'allegro-pl', label: 'Allegro.pl' },
  { id: 'allegro-cz', label: 'Allegro.cz' },
  { id: 'allegro-hu', label: 'Allegro.hu' },
  { id: 'allegro-sk', label: 'Allegro.sk' },
] as const;

export type AllegroSalesMarketplace =
  (typeof ALLEGRO_SALES_MARKETPLACES)[number]['id'];

const marketplaceIds = new Set<string>(
  ALLEGRO_SALES_MARKETPLACES.map((market) => market.id),
);

const isMarketplace = (value: string): value is AllegroSalesMarketplace =>
  marketplaceIds.has(value);

export interface AllegroPriceSimSalesCount {
  offerId: string;
  units: number;
}

export interface AllegroPriceSimSales {
  startDate: string;
  endDate: string;
  counts: AllegroPriceSimSalesCount[];
}

const defaultRange = () => rangeForPreset(30);

const readStoredSales = (): {
  marketplaces: AllegroSalesMarketplace[];
  startDate: string;
  endDate: string;
} => {
  const fallback = defaultRange();
  const base = {
    marketplaces: [] as AllegroSalesMarketplace[],
    startDate: fallback.start,
    endDate: fallback.end,
  };
  if (typeof localStorage === 'undefined') return base;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as {
      marketplaces?: unknown;
      startDate?: unknown;
      endDate?: unknown;
    };
    const marketplaces = Array.isArray(parsed.marketplaces)
      ? parsed.marketplaces.filter(
          (value): value is AllegroSalesMarketplace =>
            typeof value === 'string' && isMarketplace(value),
        )
      : [];
    const start = parseIsoDateParam(
      typeof parsed.startDate === 'string' ? parsed.startDate : null,
    );
    const end = parseIsoDateParam(
      typeof parsed.endDate === 'string' ? parsed.endDate : null,
    );
    if (!start || !end) return { ...base, marketplaces };
    return { marketplaces, startDate: start, endDate: end };
  } catch {
    return base;
  }
};

const formatApiError = (error: unknown): string => {
  if (!(error instanceof AxiosError) || error.response?.status !== 400)
    return 'Nie udało się policzyć sprzedaży.';
  const data = error.response.data;
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (typeof record.error === 'string' && record.error.trim())
      return record.error;
  }
  return 'Nieprawidłowy zakres dat albo marketplace.';
};

export const useGetAllegroPriceSimSales = (enabled: boolean) => {
  const stored = useMemo(() => readStoredSales(), []);
  const [marketplaces, setMarketplaces] = useState<AllegroSalesMarketplace[]>(
    stored.marketplaces,
  );
  const [startDate, setStartDate] = useState(stored.startDate);
  const [endDate, setEndDate] = useState(stored.endDate);
  const rangeError = salesRangeError(startDate, endDate);

  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ marketplaces, startDate, endDate }),
    );
  }, [marketplaces, startDate, endDate]);

  const queryEnabled = enabled && rangeError == null;
  const { data, isLoading, isFetching, isError, error, isSuccess } = useQuery({
    queryKey: ['allegroPriceSimSales', startDate, endDate, marketplaces],
    enabled: queryEnabled,
    queryFn: async () => {
      const response = await axiosInstance.get<AllegroPriceSimSales>(
        endpoint,
        {
          params: {
            startDate,
            endDate,
            marketplace: marketplaces.length ? marketplaces : undefined,
          },
          paramsSerializer: { indexes: null },
        },
      );
      if (response.status === 400) throwAxiosErrorFromResponse(response);
      return response.data;
    },
  });

  const soldByOffer = useMemo(() => {
    const map = new Map<string, number>();
    data?.counts.forEach((row) => {
      map.set(row.offerId, row.units);
    });
    return map;
  }, [data]);

  return {
    marketplaces,
    setMarketplaces,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    rangeError,
    soldByOffer,
    salesReady: queryEnabled && isSuccess,
    salesLoading: queryEnabled && (isLoading || isFetching),
    salesError: queryEnabled && isError ? formatApiError(error) : null,
  };
};
