import { useCallback, useState } from 'react';

import { axiosInstance } from '../../../../services';

interface Payload {
  processId: number;
}

export type ImportStatus = 'FAILED' | 'IN_PROGRESS' | 'COMPLETED';

interface ImportStatusResponse {
  id: number;
  status: ImportStatus;
  errorMessage: string | null;
  summary: null | {
    productsCreatedAmount: number;
    productsDeletedAmount: number;
    productsUpdatedAmount: number;
    productsReactivatedAmount: number;
  };
}

export const useGetImportProductsStatus = () => {
  const [importProgress, setImportProgress] =
    useState<ImportStatusResponse | null>(null);

  const fetchImportStatus = useCallback(
    async (processId: number): Promise<ImportStatusResponse | null> => {
      const res = await axiosInstance.get<ImportStatusResponse>(
        `/api/v1/products/import/${processId}/status/`
      );
      return res.data;
    },
    []
  );

  const getImportProductsStatus = useCallback(
    async ({ processId }: Payload): Promise<ImportStatusResponse | null> => {
      const result = await fetchImportStatus(processId);
      setImportProgress(result);
      return result || null;
    },
    [fetchImportStatus]
  );

  return {
    getImportProductsStatus,
    importProgress,
  };
};
