import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useState } from 'react';

import { useNotify } from '../../../../hooks';
import { axiosInstance } from '../../../../services';

import { ecommerceSalesExportPreviewQueryKey } from './useGetEcommerceSalesExport';
import { ecommerceSalesExportHistoryQueryKey } from './useGetEcommerceSalesExportHistory';

const endpoint = '/api/v1/ecommerce/sales-export/file/';

const saveBlob = (data: Blob, fileName: string) => {
  const file = new Blob([data], { type: 'text/plain' });
  const element = document.createElement('a');
  element.href = URL.createObjectURL(file);
  element.download = fileName;
  document.body.appendChild(element);
  element.click();
  element.remove();
  URL.revokeObjectURL(element.href);
};

const fileNameFromHeader = (
  disposition: string | undefined,
  fallbackName: string,
) => {
  const fromHeader = disposition
    ?.split('filename=')[1]
    ?.split(';')[0]
    ?.replace(/"/g, '')
    .trim();
  return fromHeader || fallbackName;
};

const downloadErrorMessage = async (data: unknown): Promise<string> => {
  const fallback = 'Nie udało się pobrać pliku';
  if (!(data instanceof Blob)) return fallback;
  try {
    const parsed = JSON.parse(await data.text()) as {
      detail?: string;
      sync_gaps?: string[];
    };
    if (parsed.sync_gaps?.length)
      return 'Nie można pobrać pliku. Synchronizacja nie pokrywa zakresu od bieżącej granicy.';
    return parsed.detail || fallback;
  } catch {
    return fallback;
  }
};

export const useDownloadEcommerceSalesExport = () => {
  const { notify } = useNotify();
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);

  const refreshLists = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ecommerceSalesExportPreviewQueryKey,
      }),
      queryClient.invalidateQueries({
        queryKey: ecommerceSalesExportHistoryQueryKey,
      }),
    ]);
  };

  const download = async (
    revision: string,
    fallbackName: string,
  ): Promise<boolean> => {
    try {
      setIsPending(true);
      const res = await axiosInstance.post(
        endpoint,
        { revision },
        { responseType: 'blob' },
      );
      if (res.status >= 400) {
        notify('error', await downloadErrorMessage(res.data));
        return false;
      }
      const disposition = res.headers['contentDisposition'] as
        | string
        | undefined;
      saveBlob(res.data, fileNameFromHeader(disposition, fallbackName));
      await refreshLists();
      return true;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 409) {
        notify(
          'error',
          'Podgląd się zmienił. Odśwież podgląd i pobierz plik jeszcze raz.',
        );
        await refreshLists();
        return false;
      }
      notify('error', 'Nie udało się pobrać pliku');
      return false;
    } finally {
      setIsPending(false);
    }
  };

  const downloadHistory = async (
    id: number,
    fallbackName: string,
  ): Promise<boolean> => {
    try {
      setIsPending(true);
      const res = await axiosInstance.get(
        `/api/v1/ecommerce/sales-export/history/${id}/file/`,
        { responseType: 'blob' },
      );
      if (res.status >= 400) {
        notify('error', 'Nie udało się pobrać zapisanego pliku');
        return false;
      }
      const disposition = res.headers['contentDisposition'] as
        | string
        | undefined;
      saveBlob(res.data, fileNameFromHeader(disposition, fallbackName));
      return true;
    } catch {
      notify('error', 'Nie udało się pobrać zapisanego pliku');
      return false;
    } finally {
      setIsPending(false);
    }
  };

  return { download, downloadHistory, isPending };
};
