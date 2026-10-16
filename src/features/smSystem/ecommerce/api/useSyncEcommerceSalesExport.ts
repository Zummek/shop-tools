import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { useNotify } from '../../../../hooks';
import { axiosInstance } from '../../../../services';

import { ecommerceSalesExportPreviewQueryKey } from './useGetEcommerceSalesExport';

const endpoint = '/api/v1/ecommerce/sales-export/sync/';

export interface SalesExportSyncChannel {
  channel: string;
  ok: boolean;
  error: string;
}

export interface SalesExportSyncResult {
  channels: SalesExportSyncChannel[];
  statusRefreshFailed: number;
  statusRefreshDeferred: number;
}

export const useSyncEcommerceSalesExport = () => {
  const { notify } = useNotify();
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);

  const sync = async (): Promise<SalesExportSyncResult | null> => {
    try {
      setIsPending(true);
      const response = await axiosInstance.post<SalesExportSyncResult>(
        endpoint,
        {},
        { timeout: 300000 },
      );
      if (response.status >= 400) {
        notify('error', 'Nie udało się zsynchronizować zamówień');
        return null;
      }
      await queryClient.invalidateQueries({
        queryKey: ecommerceSalesExportPreviewQueryKey,
      });
      return response.data;
    } catch {
      notify('error', 'Nie udało się zsynchronizować zamówień');
      return null;
    } finally {
      setIsPending(false);
    }
  };

  return { sync, isPending };
};
