import { useQuery } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';

export interface KsefInvoicePreview {
  ksefNumber: string;
  invoiceNumber: string;
  issueDate: string;
  sellerName: string;
  sellerNip: string;
  grossAmount: number | null;
  currency: string;
}

export interface KsefConnectionPreview {
  count: number;
  hasMore: boolean;
  invoices: KsefInvoicePreview[];
}

export interface KsefConnection {
  isConnected: boolean;
  nip: string | null;
  environment: string;
  lastAuthAt: string | null;
  lastError: string;
  preview: KsefConnectionPreview | null;
}

const endpoint = '/api/v1/invoices/ksef/connection/';
export const ksefConnectionQueryKey = ['ksef-connection'];

export const useGetKsefConnection = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ksefConnectionQueryKey,
    queryFn: async () => {
      const response = await axiosInstance.get<KsefConnection>(endpoint);
      return response.data;
    },
  });

  return {
    connection: data,
    isLoading,
    isError,
  };
};
