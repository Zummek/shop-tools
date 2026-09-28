import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  axiosInstance,
  throwAxiosErrorFromResponse,
} from '../../../../services';

import type { MarginCalculation } from './useGetChannelMarginReport';

const endpoint = '/api/v1/reports/allegro-price-sim/';
const REPORT_TIMEOUT_MS = 120_000;

export interface AllegroPriceSimCategoryPath {
  id: string;
  name: string;
}

export interface AllegroPriceSimRow {
  productId: number | null;
  offerId: string;
  name: string;
  brand: string | null;
  vatRate: number | null;
  allegroCategoryId: string | null;
  categoryPath: AllegroPriceSimCategoryPath[];
  commissionCapNet: number | null;
  purchaseNetCents: number | null;
  offerGrossCents: number | null;
  simulatedGrossCents: number | null;
  simulatedAt: string | null;
  priceGrossCents: number | null;
  marketGrossCents: number | null;
  priceNetCents: number | null;
  costCommissionCents: number | null;
  commissionRateNet: number;
  commissionMinNet: number;
  commissionSource: string;
  costShippingCents: number | null;
  costShippingSource: string;
  shippingFixedCents: number | null;
  costPromoCents: number | null;
  promoRate: number;
  marginCents: number | null;
  marginPercent: number | null;
  markupOnCost: number | null;
  minPriceGrossCents: number | null;
  status: 'ok' | 'thin' | 'loss' | 'missing' | 'unreachable';
  offerStatus: string | null;
  flags: { promo: boolean };
  cogsSource: string;
  buyerDeliveryCents: number;
  buyerDeliverySource: string;
  stock: number | null;
  externalUrl: string | null;
  marketplace: string | null;
}

export interface AllegroPriceSimAssumptions {
  commissionRateNet: number | null;
  buyerDeliveryCents: number;
  shippingRate: number;
  promoRate: number | null;
  targetMargin: number;
  promoEnabled: boolean;
  branchId: number | null;
  branchName: string | null;
}

export interface AllegroPriceSimKpis {
  ok: number;
  thin: number;
  loss: number;
  missing: number;
  unreachable: number;
  avgMarginPercent: number | null;
}

export interface AllegroPriceSimReport {
  view: string;
  currency: string;
  assumptions?: AllegroPriceSimAssumptions;
  kpis?: AllegroPriceSimKpis;
  rows?: AllegroPriceSimRow[];
  calculation?: MarginCalculation;
}

export interface AllegroPriceSimQuery {
  targetMargin: number;
  buyerDeliveryGross: number | null;
  shippingRatePercent: number;
  branchId: number | null;
}

const formatApiError = (error: unknown): string => {
  if (!(error instanceof AxiosError) || error.response?.status !== 400)
    return 'Nie udało się pobrać symulacji cen Allegro.';

  const data = error.response.data;
  if (typeof data === 'string' && data.trim()) return data;
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (typeof record.error === 'string') return record.error;
    const nonField = record.nonFieldErrors ?? record.non_field_errors;
    if (Array.isArray(nonField) && typeof nonField[0] === 'string')
      return nonField[0];
  }
  return 'Nieprawidłowe parametry raportu.';
};

export const allegroPriceSimQueryKey = (params: AllegroPriceSimQuery) => [
  'allegroPriceSim',
  params,
];

export const useGetAllegroPriceSim = (options?: {
  enabled?: boolean;
  defaultBranchId?: number | null;
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryEnabled = options?.enabled !== false;

  const [targetMarginPercent, setTargetMarginPercent] = useState(() => {
    const raw = searchParams.get('targetMargin');
    const parsed = raw ? Number(raw) : 15;
    return Number.isFinite(parsed) ? parsed : 15;
  });
  const [buyerDeliveryGross, setBuyerDeliveryGrossState] = useState(() => {
    const raw = searchParams.get('buyerDeliveryGross');
    const parsed = raw ? Number(raw) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  });
  const [buyerTouched, setBuyerTouched] = useState(() => {
    const raw = searchParams.get('buyerDeliveryGross');
    if (raw == null || raw === '') return false;
    const parsed = Number(raw);
    // Older builds always wrote 0 into the URL; that is not a user override.
    return Number.isFinite(parsed) && parsed !== 0;
  });
  const [shippingRatePercent, setShippingRatePercent] = useState(() => {
    const raw = searchParams.get('shippingRate');
    const parsed = raw ? Number(raw) : 4.6;
    return Number.isFinite(parsed) ? parsed : 4.6;
  });
  const [branchId, setBranchId] = useState<number | null>(() => {
    const raw = searchParams.get('branchId');
    if (raw) {
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return options?.defaultBranchId ?? null;
  });

  useEffect(() => {
    const params: Record<string, string> = {};
    params.targetMargin = String(targetMarginPercent);
    if (buyerTouched) params.buyerDeliveryGross = String(buyerDeliveryGross);
    params.shippingRate = String(shippingRatePercent);
    if (branchId != null) params.branchId = String(branchId);
    setSearchParams(params, { replace: true });
  }, [
    targetMarginPercent,
    buyerDeliveryGross,
    buyerTouched,
    shippingRatePercent,
    branchId,
    setSearchParams,
  ]);

  const query: AllegroPriceSimQuery = {
    targetMargin: targetMarginPercent / 100,
    buyerDeliveryGross: buyerTouched ? buyerDeliveryGross : null,
    shippingRatePercent,
    branchId,
  };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: allegroPriceSimQueryKey(query),
    queryFn: async () => {
      const response = await axiosInstance.get<AllegroPriceSimReport>(
        endpoint,
        {
          params: {
            targetMargin: targetMarginPercent / 100,
            shippingRate: shippingRatePercent / 100,
            ...(buyerTouched ? { buyerDeliveryGross } : {}),
            ...(branchId != null ? { branchId } : {}),
          },
          timeout: REPORT_TIMEOUT_MS,
        },
      );
      if (response.status === 400) throwAxiosErrorFromResponse(response);
      return response.data;
    },
    enabled: queryEnabled,
  });

  useEffect(() => {
    if (buyerTouched) return;
    const autoCents = data?.assumptions?.buyerDeliveryCents;
    if (autoCents == null) return;
    setBuyerDeliveryGrossState(autoCents / 100);
  }, [buyerTouched, data?.assumptions?.buyerDeliveryCents]);

  const setBuyerDeliveryGross = (value: number) => {
    setBuyerTouched(true);
    setBuyerDeliveryGrossState(value);
  };

  return {
    data,
    isLoading,
    isError,
    errorMessage: isError ? formatApiError(error) : null,
    targetMarginPercent,
    setTargetMarginPercent,
    buyerDeliveryGross,
    setBuyerDeliveryGross,
    shippingRatePercent,
    setShippingRatePercent,
    branchId,
    setBranchId,
    refetch,
  };
};
