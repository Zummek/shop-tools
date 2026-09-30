import { useQuery } from '@tanstack/react-query';

import {
  axiosInstance,
  throwAxiosErrorFromResponse,
} from '../../../../services';

const endpoint = '/api/v1/invoices/ksef/candidates/';

export interface KsefCandidate {
  ksefNumber: string;
  invoiceNumber: string;
  issueDate: string;
  sellerName: string;
  sellerNip: string;
  grossAmount: number;
  currency: string;
  invoiceType: string;
}

export interface KsefCandidatePage {
  invoices: KsefCandidate[];
  nextCursor: string | null;
  windowFrom: string;
  windowTo: string;
}

export const ksefCandidatesQueryKey = 'ksef-candidates';

export const useGetKsefCandidates = (
  cursor: string | null,
  enabled: boolean,
) => {
  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: [ksefCandidatesQueryKey, cursor],
    enabled,
    queryFn: async () => {
      const response = await axiosInstance.get<
        KsefCandidatePage | { error: string }
      >(endpoint, {
        params: cursor ? { cursor } : undefined,
        timeout: 60000,
      });
      if (response.status < 200 || response.status >= 300)
        throwAxiosErrorFromResponse(response);
      return response.data as KsefCandidatePage;
    },
  });

  return {
    page: data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  };
};
