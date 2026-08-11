import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useNotify } from '../../../../hooks';
import { axiosInstance } from '../../../../services';

import { getAlertUnreadCountQueryKey } from './useGetAlertUnreadCount';
import { getAlertsQueryKeyBase } from './useGetAlerts';

const endpoint = '/api/v1/alerts/acknowledge-all/';

interface AcknowledgeAllAlertsResponse {
  acknowledged: number;
}

export const useAcknowledgeAllAlerts = () => {
  const queryClient = useQueryClient();
  const { notify } = useNotify();

  const acknowledgeAllAlertsRequest = async () => {
    const { data } = await axiosInstance.post<AcknowledgeAllAlertsResponse>(
      endpoint,
    );
    return data;
  };

  const { mutateAsync: acknowledgeAllAlerts, isPending } = useMutation({
    mutationFn: acknowledgeAllAlertsRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [getAlertsQueryKeyBase] });
      queryClient.invalidateQueries({ queryKey: getAlertUnreadCountQueryKey });
    },
    onError: () => {
      notify('error', 'Błąd podczas oznaczania alertów jako sprawdzone');
    },
  });

  return {
    acknowledgeAllAlerts,
    isPending,
  };
};
