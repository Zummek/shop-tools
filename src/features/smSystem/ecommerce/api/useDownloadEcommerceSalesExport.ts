import { useState } from 'react';

import { useNotify } from '../../../../hooks';
import { axiosInstance } from '../../../../services';

import { SalesExportQuery } from './useGetEcommerceSalesExport';

const endpoint = '/api/v1/ecommerce/sales-export/file/';

const downloadErrorMessage = async (data: unknown): Promise<string> => {
  const fallback = 'Nie udało się pobrać pliku';
  if (!(data instanceof Blob)) return fallback;
  try {
    const parsed = JSON.parse(await data.text()) as {
      detail?: string;
      sync_gaps?: string[];
    };
    if (parsed.sync_gaps?.length)
      return 'Nie można pobrać pliku. Zamówienia z wybranych kanałów nie są zsynchronizowane dla całego zakresu.';
    return parsed.detail || fallback;
  } catch {
    return fallback;
  }
};

export const useDownloadEcommerceSalesExport = () => {
  const { notify } = useNotify();
  const [isPending, setIsPending] = useState(false);

  const download = async (query: SalesExportQuery): Promise<boolean> => {
    const fallbackName = `SM-ecommerce-${query.startDate.replace(/-/g, '')}-${query.endDate.replace(/-/g, '')}.txt`;
    try {
      setIsPending(true);
      const res = await axiosInstance.get(endpoint, {
        params: {
          startDate: query.startDate,
          endDate: query.endDate,
          sources: query.sources.join(','),
        },
        responseType: 'blob',
      });
      if (res.status >= 400) {
        notify('error', await downloadErrorMessage(res.data));
        return false;
      }

      const disposition = res.headers['contentDisposition'] as
        | string
        | undefined;
      const fromHeader = disposition
        ?.split('filename=')[1]
        ?.split(';')[0]
        ?.replace(/"/g, '')
        .trim();
      const fileName = fromHeader || fallbackName;
      const file = new Blob([res.data], { type: 'text/plain' });
      const element = document.createElement('a');
      element.href = URL.createObjectURL(file);
      element.download = fileName;
      document.body.appendChild(element);
      element.click();
      element.remove();
      URL.revokeObjectURL(element.href);
      return true;
    } catch {
      notify('error', 'Nie udało się pobrać pliku');
      return false;
    } finally {
      setIsPending(false);
    }
  };

  return { download, isPending };
};
