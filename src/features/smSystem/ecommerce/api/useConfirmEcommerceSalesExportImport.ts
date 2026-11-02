import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { useNotify } from '../../../../hooks';
import { axiosInstance } from '../../../../services';

import { ecommerceSalesExportHistoryQueryKey } from './useGetEcommerceSalesExportHistory';

export const useConfirmEcommerceSalesExportImport = () => {
  const { notify } = useNotify();
  const queryClient = useQueryClient();
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  const confirm = async (exportId: number): Promise<boolean> => {
    try {
      setConfirmingId(exportId);
      const response = await axiosInstance.post(
        `/api/v1/ecommerce/sales-export/history/${exportId}/confirm/`,
      );
      if (response.status >= 400) {
        notify('error', 'Nie udało się potwierdzić wgrania pliku');
        return false;
      }
      await queryClient.invalidateQueries({
        queryKey: ecommerceSalesExportHistoryQueryKey,
      });
      notify(
        'success',
        'Plik jest w PC Market. Licznik zejdzie przy następnym pobraniu stanów.',
      );
      return true;
    } catch {
      notify('error', 'Nie udało się potwierdzić wgrania pliku');
      return false;
    } finally {
      setConfirmingId(null);
    }
  };

  return { confirm, confirmingId };
};
