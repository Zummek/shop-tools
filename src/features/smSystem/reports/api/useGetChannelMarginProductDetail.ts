import { useQuery } from '@tanstack/react-query';

import {
  axiosInstance,
  throwAxiosErrorFromResponse,
} from '../../../../services';

import type { ChannelMarginLens } from './useGetChannelMarginReport';

const endpoint = '/api/v1/reports/channel-margin/detail/';

export interface ChannelMarginDetailInvoice {
  invoiceId: number | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  sellerName: string | null;
  source: string;
  unitGrossCents: number | null;
  soldUnits: number;
  cogsCents: number;
  lineCount: number;
}

export interface ChannelMarginDetailLine {
  kind: 'sale' | 'order';
  occurredAt: string;
  documentLabel: string;
  orderId: number | null;
  branchName: string | null;
  quantity: number;
  revenueCents: number;
  cogsCents: number;
  commissionCents: number;
  buyerDeliveryCents: number;
  sellerDeliveryCents: number;
  otherFeesCents: number;
  marginCents: number;
  cogsSource: string;
  unitCogsCents: number | null;
  invoiceId: number | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  sellerName: string | null;
  exclusionReason: string | null;
}

export interface ChannelMarginProductDetail {
  productId: number | null;
  productName: string;
  channel: string;
  offerId: string | null;
  invoices: ChannelMarginDetailInvoice[];
  lines: ChannelMarginDetailLine[];
  linesTotal: number;
  truncated: boolean;
}

interface Options {
  enabled: boolean;
  lens: ChannelMarginLens;
  startDate: string;
  endDate: string;
  channel: string;
  rowKind: 'product' | 'offer';
  productId: number | null;
  offerId: string | null;
  productName: string;
}

export const useGetChannelMarginProductDetail = ({
  enabled,
  lens,
  startDate,
  endDate,
  channel,
  rowKind,
  productId,
  offerId,
  productName,
}: Options) => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: [
      'channelMarginProductDetail',
      lens,
      startDate,
      endDate,
      channel,
      rowKind,
      productId,
      offerId,
      productName,
    ],
    queryFn: async () => {
      const response = await axiosInstance.get<ChannelMarginProductDetail>(
        endpoint,
        {
          params: {
            lens,
            start_date: startDate,
            end_date: endDate,
            channel,
            row_kind: rowKind,
            ...(productId != null ? { product_id: productId } : {}),
            ...(rowKind === 'offer' ? { offer_id: offerId ?? '' } : {}),
            ...(productName ? { product_name: productName } : {}),
          },
          timeout: 60_000,
        },
      );
      if (response.status === 400) throwAxiosErrorFromResponse(response);
      return response.data;
    },
    enabled: enabled && !!lens && !!startDate && !!endDate && !!channel,
  });

  return { data, isLoading, isError, error };
};
