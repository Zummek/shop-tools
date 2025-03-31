import { useState } from 'react';

import { useNotify } from '../../../../hooks';
import { axiosInstance } from '../../../../services';

interface Payload {
  ids: number[];
}

export const useExportTransfers = () => {
  const { notify } = useNotify();

  const [isPending, setIsPending] = useState(false);

  const exportTransfers = async ({ ids }: Payload) => {
    try {
      setIsPending(true);
      const res = await axiosInstance.get(
        `/api/v1/transfers/export-multiple/?ids=${ids.join(',')}`,
        {
          responseType: 'blob',
        }
      );

      const fileContent = res.data;
      const contentType = res.headers['contentType'];
      const fileName = res.headers['contentDisposition']
        .split('=')[1]
        .replace(/"/g, '');

      const element = document.createElement('a');
      const file = new Blob([fileContent], { type: contentType });
      element.href = URL.createObjectURL(file);
      element.download = fileName;
      document.body.appendChild(element);
      element.click();
    } catch (error) {
      notify('error', 'Nie udało się wyeksportować dokumentów');
      setIsPending(false);
    } finally {
      setIsPending(false);
    }
  };

  return {
    exportTransfers,
    isPending,
  };
};
