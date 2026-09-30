import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  axiosInstance,
  throwAxiosErrorFromResponse,
} from '../../../../services';

import { getInvoicesQueryKeyBase } from './useGetInvoices';
import { ksefConnectionQueryKey } from './useGetKsefConnection';

const endpoint = '/api/v1/invoices/ksef/sync/';

export interface KsefSyncResult {
  imported: number;
  skipped: number;
  hasMore: boolean;
  failed: { invoiceNumber: string; error: string }[];
}

export const useSyncKsef = () => {
  const queryClient = useQueryClient();

  const syncKsefRequest = async () => {
    const response = await axiosInstance.post<
      KsefSyncResult | { error: string }
    >(endpoint, undefined, { timeout: 150000 });
    if (response.status < 200 || response.status >= 300)
      throwAxiosErrorFromResponse(response);
    return response.data as KsefSyncResult;
  };

  const { mutateAsync, isPending } = useMutation({
    mutationFn: syncKsefRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [getInvoicesQueryKeyBase] });
      queryClient.invalidateQueries({ queryKey: ksefConnectionQueryKey });
    },
  });

  return {
    syncKsef: mutateAsync,
    isPending,
  };
};
