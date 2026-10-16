import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { useNotify } from '../../../../hooks';
import { axiosInstance } from '../../../../services';

import { ecommerceSalesExportPreviewQueryKey } from './useGetEcommerceSalesExport';

const endpoint = '/api/v1/ecommerce/sales-export/corrections/ack/';

export const useAckEcommerceSalesExportCorrection = () => {
  const { notify } = useNotify();
  const queryClient = useQueryClient();
  const [ackingId, setAckingId] = useState<string | null>(null);

  const acknowledge = async (
    orderItemId: number,
    productId: number,
  ): Promise<boolean> => {
    const key = `${orderItemId}-${productId}`;
    try {
      setAckingId(key);
      const response = await axiosInstance.post(endpoint, {
        orderItemId,
        productId,
      });
      if (response.status >= 400) {
        notify('error', 'Nie udało się odhaczyć korekty');
        return false;
      }
      await queryClient.invalidateQueries({
        queryKey: ecommerceSalesExportPreviewQueryKey,
      });
      return true;
    } catch {
      notify('error', 'Nie udało się odhaczyć korekty');
      return false;
    } finally {
      setAckingId(null);
    }
  };

  return { acknowledge, ackingId };
};
