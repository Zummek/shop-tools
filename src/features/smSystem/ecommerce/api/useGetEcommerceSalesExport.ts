import { keepPreviousData, useQuery } from '@tanstack/react-query';

import {
  axiosInstance,
  throwAxiosErrorFromResponse,
} from '../../../../services';

const endpoint = '/api/v1/ecommerce/sales-export/preview/';

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

export interface SalesExportPreview {
  startDate: string;
  endDate: string;
  sources: string[];
  summary: {
    ordersCount: number;
    linesCount: number;
    piecesCount: number;
    skippedCount: number;
  };
  lines: SalesExportLine[];
  skipped: SalesExportSkipped[];
  syncGaps: string[];
}

export interface SalesExportQuery {
  startDate: string;
  endDate: string;
  sources: string[];
}

export const useGetEcommerceSalesExport = (query: SalesExportQuery | null) => {
  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ['ecommerce-sales-export', query],
    enabled: query !== null,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const response = await axiosInstance.get<SalesExportPreview>(endpoint, {
        params: {
          startDate: query!.startDate,
          endDate: query!.endDate,
          sources: query!.sources.join(','),
        },
      });
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
