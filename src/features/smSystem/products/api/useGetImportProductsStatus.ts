import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useEffect } from 'react';

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

const getQueryKey = (processId: number | null) => [
  'import-products-status',
  processId,
];

/**
 * Hook for tracking import product status
 * @returns Methods and state for tracking import status
 */
export const useGetImportProductsStatus = () => {
  const [processId, setProcessId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // The request function for fetching import status
  const fetchImportStatus =
    useCallback(async (): Promise<ImportStatusResponse | null> => {
      if (processId === null) return null;

      const res = await axiosInstance.get<ImportStatusResponse>(
        `/api/v1/products/import/${processId}/status/`
      );
      return res.data;
    }, [processId]);

  // The main query for tracking import status
  const {
    data: importProgress,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: getQueryKey(processId),
    queryFn: fetchImportStatus,
    enabled: processId !== null,
    // We'll handle refetch interval with an effect to avoid circular references
  });

  // Set up auto-polling when we're in progress
  useEffect(() => {
    // Auto-poll when the status is IN_PROGRESS
    if (importProgress?.status === 'IN_PROGRESS') {
      const intervalId = setInterval(() => {
        refetch();
      }, 2000);

      return () => clearInterval(intervalId);
    }

    // Clear polling when component unmounts or processId changes
    return () => {
      if (processId !== null)
        queryClient.cancelQueries({ queryKey: getQueryKey(processId) });
    };
  }, [processId, queryClient, importProgress?.status, refetch]);

  /**
   * Get import products status
   * @param payload Object containing processId to track
   * @returns Promise that resolves with the current status after fetching
   */
  const getImportProductsStatus = useCallback(
    async ({ processId }: Payload): Promise<ImportStatusResponse | null> => {
      setProcessId(processId);
      const result = await refetch();
      return result.data || null;
    },
    [refetch]
  );

  return {
    getImportProductsStatus,
    importProgress,
    isLoading,
  };
};
