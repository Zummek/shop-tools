import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { useNotify } from '../../../../hooks';
import { axiosInstance } from '../../../../services';

import { ecommerceSalesExportPreviewQueryKey } from './useGetEcommerceSalesExport';

const endpoint = '/api/v1/ecommerce/sales-export/start/';

export const useSetEcommerceSalesExportStart = () => {
  const { notify } = useNotify();
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);

  const setStart = async (startDate: string): Promise<boolean> => {
    try {
      setIsPending(true);
      const response = await axiosInstance.post(endpoint, { startDate });
      if (response.status >= 400) {
        notify('error', 'Nie udało się ustawić początku eksportu');
        return false;
      }
      await queryClient.invalidateQueries({
        queryKey: ecommerceSalesExportPreviewQueryKey,
      });
      return true;
    } catch {
      notify('error', 'Nie udało się ustawić początku eksportu');
      return false;
    } finally {
      setIsPending(false);
    }
  };

  return { setStart, isPending };
};
