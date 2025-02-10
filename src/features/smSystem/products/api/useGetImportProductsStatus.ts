import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { axiosInstance } from '../../../../services';

interface Payload {
  processId: string;
}

interface Response {
  message: string;
  data: {
    status: 'completed' | 'failed' | 'inProgress';
    progress: number;
  };
}

export const useGetImportProductsStatus = () => {
  const [processId, setProcessId] = useState<string | null>(null);

  const getImportProductsStatusRequest = async () => {
    const res = await axiosInstance.get<Response>(
      `/api/v1/products/import/${processId}`
    );
    return res.data.data;
  };

  const { data: importProgress, isLoading } = useQuery({
    queryKey: ['import-products-status', processId],
    queryFn: getImportProductsStatusRequest,
    enabled: processId !== null,
  });

  const getImportProductsStatus = ({ processId }: Payload) => {
    setProcessId(processId);
  };

  return {
    getImportProductsStatus,
    importProgress,
    isLoading,
  };
};
