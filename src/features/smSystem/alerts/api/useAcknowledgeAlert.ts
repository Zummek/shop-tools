import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useNotify } from '../../../../hooks';
import { axiosInstance } from '../../../../services';
import { AlertListItem } from '../types';

import { getAlertUnreadCountQueryKey } from './useGetAlertUnreadCount';
import { getAlertsQueryKeyBase } from './useGetAlerts';

const getEndpoint = (id: number) => `/api/v1/alerts/${id}/acknowledge/`;

export const useAcknowledgeAlert = () => {
  const queryClient = useQueryClient();
  const { notify } = useNotify();

  const acknowledgeAlertRequest = async (id: number) => {
    const { data } = await axiosInstance.post<AlertListItem>(getEndpoint(id));
    return data;
  };

  const {
    mutateAsync: acknowledgeAlert,
    isPending,
    variables: pendingAlertId,
  } = useMutation({
    mutationFn: acknowledgeAlertRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [getAlertsQueryKeyBase] });
      queryClient.invalidateQueries({ queryKey: getAlertUnreadCountQueryKey });
    },
    onError: () => {
      notify('error', 'Błąd podczas oznaczania alertu jako sprawdzony');
    },
  });

  return {
    acknowledgeAlert,
    isPending,
    pendingAlertId,
  };
};
