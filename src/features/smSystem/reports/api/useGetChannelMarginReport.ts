import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  axiosInstance,
  throwAxiosErrorFromResponse,
} from '../../../../services';

const endpoint = '/api/v1/reports/channel-margin/';
export const CHANNEL_MARGIN_MAX_PERIOD_DAYS = 93;
const REPORT_TIMEOUT_MS = 120_000;

export type ChannelMarginLens = 'pcmarket' | 'ecommerce';

export interface MarginComponent {
  key: string;
  label: string;
  amountCents: number;
  source: string;
  asOf?: string | null;
  confidence?: string;
}

export interface MarginCalculation {
  formula: string;
  components: MarginComponent[];
  notes: string[];
}

export interface ChannelMarginTotals {
  revenueCents: number;
  cogsCents: number;
  commissionCents: number;
  buyerDeliveryCents: number;
  sellerDeliveryCents: number;
  otherFeesCents: number;
  marginCents: number;
  marginPercent: number | null;
}

export interface ChannelMarginOverview extends ChannelMarginTotals {
  previous: ChannelMarginTotals;
}

export interface ChannelMarginByChannel extends ChannelMarginTotals {
  channel: string;
}

export interface ChannelMarginDailyPoint extends ChannelMarginTotals {
  date: string;
  channel: string;
}

export interface ChannelMarginRow extends ChannelMarginTotals {
  productId: number | null;
  productName: string;
  offerId?: string | null;
  channel: string;
  units: number;
  calculation: MarginCalculation;
}

export interface ChannelMarginCoverage {
  linesTotal: number;
  linesWithSellingPricePercent: number | null;
  linesWithCogsPercent: number | null;
  linesPlnPercent: number | null;
  allegroBillingMatchedPercent?: number | null;
  fxLinesConverted?: number;
  fxLinesMissingRate?: number;
  fxRevenueCents?: number;
  fxFeePartsMissing?: number;
  fxBuyerDeliveryMissing?: number;
  erliCommissionPercent?: number | null;
  wooCommissionPercent?: number | null;
  notes: string[];
}

export interface ChannelMarginReport {
  lens: ChannelMarginLens;
  currency: string;
  startDate: string;
  endDate: string;
  periodDays: number;
  overview: ChannelMarginOverview;
  byChannel: ChannelMarginByChannel[];
  daily: ChannelMarginDailyPoint[];
  rows: ChannelMarginRow[];
  offerRows?: ChannelMarginRow[];
  coverage: ChannelMarginCoverage;
  calculation: MarginCalculation;
}

const getQueryKey = (lens: ChannelMarginLens, start: string, end: string) => [
  'channelMarginReport',
  lens,
  start,
  end,
];

const formatApiError = (error: unknown): string => {
  if (!(error instanceof AxiosError) || error.response?.status !== 400)
    return 'Nie udało się pobrać raportu marży.';

  const data = error.response.data;
  if (typeof data === 'string' && data.trim()) return data;
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (typeof record.error === 'string') return record.error;
    const nonField = record.non_field_errors ?? record.nonFieldErrors;
    if (Array.isArray(nonField) && typeof nonField[0] === 'string')
      return nonField[0];

    for (const value of Object.values(record)) {
      if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
      if (typeof value === 'string') return value;
    }
  }
  return 'Nieprawidłowy zakres dat lub parametry raportu.';
};

export const useGetChannelMarginReport = (options?: { enabled?: boolean }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryEnabled = options?.enabled !== false;

  const [lens, setLens] = useState<ChannelMarginLens>(
    (searchParams.get('lens') as ChannelMarginLens) || 'ecommerce',
  );
  const [startDate, setStartDate] = useState<Date | null>(() => {
    const value = searchParams.get('startDate');
    return value ? dayjs(value).toDate() : dayjs().subtract(29, 'day').toDate();
  });
  const [endDate, setEndDate] = useState<Date | null>(() => {
    const value = searchParams.get('endDate');
    return value ? dayjs(value).toDate() : new Date();
  });

  useEffect(() => {
    const params: Record<string, string> = { lens };
    if (startDate) params.startDate = dayjs(startDate).format('YYYY-MM-DD');
    if (endDate) params.endDate = dayjs(endDate).format('YYYY-MM-DD');
    setSearchParams(params, { replace: true });
  }, [lens, startDate, endDate, setSearchParams]);

  const start = startDate ? dayjs(startDate).format('YYYY-MM-DD') : '';
  const end = endDate ? dayjs(endDate).format('YYYY-MM-DD') : '';

  const dateRangeError = useMemo(() => {
    if (!startDate || !endDate) return null;
    const startDay = dayjs(startDate).startOf('day');
    const endDay = dayjs(endDate).startOf('day');
    if (endDay.isBefore(startDay))
      return 'Data końcowa musi być późniejsza lub równa dacie początkowej.';

    const periodDays = endDay.diff(startDay, 'day') + 1;
    if (periodDays > CHANNEL_MARGIN_MAX_PERIOD_DAYS)
      return `Zakres dat może mieć najwyżej ${CHANNEL_MARGIN_MAX_PERIOD_DAYS} dni (wybrano ${periodDays}).`;

    return null;
  }, [startDate, endDate]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: getQueryKey(lens, start, end),
    queryFn: async () => {
      const response = await axiosInstance.get<ChannelMarginReport>(endpoint, {
        params: { lens, start_date: start, end_date: end },
        timeout: REPORT_TIMEOUT_MS,
      });
      if (response.status === 400) throwAxiosErrorFromResponse(response);

      return response.data;
    },
    enabled:
      queryEnabled &&
      !!startDate &&
      !!endDate &&
      !!lens &&
      dateRangeError == null,
  });

  const errorMessage =
    dateRangeError ?? (isError ? formatApiError(error) : null);

  return {
    data,
    isLoading: dateRangeError ? false : isLoading,
    isError: Boolean(errorMessage),
    errorMessage,
    lens,
    setLens,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
  };
};
