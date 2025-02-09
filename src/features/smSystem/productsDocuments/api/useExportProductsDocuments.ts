import { useState } from 'react';

import { useNotify } from '../../../../hooks';
import { axiosInstance } from '../../../../services';

interface Payload {
  ids: number[];
}

export const useExportProductsDocuments = () => {
  const { notify } = useNotify();

  const [isPending, setIsPending] = useState(false);

  const exportProductsDocuments = async ({ ids }: Payload) => {
    try {
      setIsPending(true);
      await Promise.all(
        ids.map(async (id) => {
          const res = await axiosInstance.post(
            '/api/v1/productsDocument/export',
            { id }
          );

          const fileContent = res.data;
          const fileName = res.headers['content-disposition']
            .split('=')[1]
            .replace(/"/g, '');

          const element = document.createElement('a');
          const file = new Blob([fileContent], { type: 'text/csv' });
          element.href = URL.createObjectURL(file);
          element.download = fileName;
          document.body.appendChild(element);
          element.click();
        })
      );
    } catch (error) {
      notify('error', 'Nie udało się wyeksportować dokumentów');
      setIsPending(false);
    } finally {
      setIsPending(false);
    }
  };

  return {
    exportProductsDocuments,
    isPending,
  };
};
