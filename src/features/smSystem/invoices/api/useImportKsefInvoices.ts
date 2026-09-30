import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  axiosInstance,
  throwAxiosErrorFromResponse,
} from '../../../../services';

import { getInvoicesQueryKeyBase } from './useGetInvoices';
import { ksefCandidatesQueryKey } from './useGetKsefCandidates';

const endpoint = '/api/v1/invoices/ksef/import/';

export interface KsefImportFailure {
  ksefNumber: string;
  invoiceNumber: string;
  error: string;
}

export interface KsefImportResult {
  imported: number;
  failed: KsefImportFailure[];
  pending: string[];
}

export const useImportKsefInvoices = () => {
  const queryClient = useQueryClient();

  const importKsefInvoicesRequest = async (ksefNumbers: string[]) => {
    const response = await axiosInstance.post<
      KsefImportResult | { error: string }
    >(endpoint, { ksefNumbers }, { timeout: 150000 });
    if (response.status < 200 || response.status >= 300)
      throwAxiosErrorFromResponse(response);
    return response.data as KsefImportResult;
  };

  const { mutateAsync, isPending } = useMutation({
    mutationFn: importKsefInvoicesRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [getInvoicesQueryKeyBase] });
      queryClient.invalidateQueries({ queryKey: [ksefCandidatesQueryKey] });
    },
  });

  return {
    importKsefInvoices: mutateAsync,
    isPending,
  };
};
