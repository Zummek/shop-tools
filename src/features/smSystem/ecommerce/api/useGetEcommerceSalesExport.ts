import { useQuery } from '@tanstack/react-query';

import {
  axiosInstance,
  throwAxiosErrorFromResponse,
} from '../../../../services';

const endpoint = '/api/v1/ecommerce/sales-export/preview/';

export const ecommerceSalesExportPreviewQueryKey = [
  'ecommerce-sales-export-preview',
];

export interface SalesExportQuantities {
  allegro: number;
  woocommerce: number;
  erli: number;
}

export interface SalesExportLine {
  productId: number;
  internalId: string;
  name: string;
  ean: string;
  vat: number | null;
  quantities: SalesExportQuantities;
  quantity: number;
}

export interface SalesExportSkipped {
  reason: 'unmatched' | 'uncertain_match' | 'missing_ean' | 'missing_product';
  channel: string;
  orderExternalId: string;
  offerName: string;
  productId: number | null;
  internalId: string;
  name: string;
  quantity: number;
  quantities: SalesExportQuantities;
}

export interface SalesExportChannel {
  channel: string;
  coveredUntil: string | null;
  gap: boolean;
}

export interface SalesExportOutside {
  orderId: number;
  orderItemId: number;
  channel: string;
  orderExternalId: string;
  orderDate: string;
  productId: number;
  internalId: string;
  name: string;
  ean: string;
  quantity: number;
}

export interface SalesExportCorrection {
  orderId: number;
  orderItemId: number;
  productId: number;
  channel: string;
  orderExternalId: string;
  name: string;
  internalId: string;
  exportedPieces: number;
  currentPieces: number;
  reason: 'canceled' | 'quantity' | 'product';
}

export interface SalesExportPending {
  orderId: number;
  orderItemId: number;
  channel: string;
  orderExternalId: string;
  status: string;
  orderDate: string;
  offerName: string;
  quantity: number;
  reason: string;
  paymentMethod: string;
  externalStatus: string;
}

export interface SalesExportPreview {
  needsStart: boolean;
  suggestedStart: string | null;
  exportedUntil: string | null;
  coverageFloor: string | null;
  watermark: string | null;
  windowUntil: string | null;
  startDate: string | null;
  endDate: string | null;
  truncated: boolean;
  blockedReason: 'needs_start' | 'no_channels' | 'sync_gap' | 'empty' | null;
  channels: SalesExportChannel[];
  syncGaps: string[];
  canDownload: boolean;
  revision: string | null;
  sources: string[];
  summary: {
    ordersCount: number;
    linesCount: number;
    piecesCount: number;
    skippedCount: number;
    outsideCount: number;
    correctionsCount: number;
    pendingCount: number;
  };
  lines: SalesExportLine[];
  outsideRange: SalesExportOutside[];
  skipped: SalesExportSkipped[];
  corrections: SalesExportCorrection[];
  pending: SalesExportPending[];
  pendingTruncated: boolean;
}

export const useGetEcommerceSalesExport = () => {
  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ecommerceSalesExportPreviewQueryKey,
    queryFn: async () => {
      const response = await axiosInstance.get<SalesExportPreview>(endpoint);
      if (response.status >= 400) throwAxiosErrorFromResponse(response);
      return response.data;
    },
  });

  return {
    preview: data,
    isLoading: isLoading || isFetching,
    isError,
  };
};
