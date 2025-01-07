import { useMutation } from '@tanstack/react-query';

import { axiosInstance } from '../../../services';

interface Payload {
  ids: number[];
  exportMethod: 'PC-Market-shipped' | 'PC-Market-received';
}

export const useExportTransfers = () => {
  const exportTransfersRequest = async (payload: Payload) =>
    axiosInstance.post('/api/v1/transfer/export-multiple', payload);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: exportTransfersRequest,
  });

  return {
    exportTransfers: mutateAsync,
    isPending,
  };
};
