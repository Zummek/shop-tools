import { useMutation, useQueryClient } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import { Transfer } from '../types';
import { TransferStatusEnum } from '../utils/transfers';

import { getTransfersQueryKeyBase } from './useGetTransfers';

interface Payload {
  ids: number[];
  status: TransferStatusEnum;
}

const endpoint = '/api/v1/transfers/status/';

export const useUpdateTransfersStatus = () => {
  const queryClient = useQueryClient();

  const updateTransfersStatusRequest = async ({ ids, status }: Payload) =>
    axiosInstance.patch<Transfer>(endpoint, { transferIds: ids, status });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: updateTransfersStatusRequest,
    onSettled: () => {
      queryClient.refetchQueries({ queryKey: [getTransfersQueryKeyBase] });
    },
  });

  return {
    updateTransfersStatus: mutateAsync,
    isPending,
  };
};
