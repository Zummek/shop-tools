import { useMutation, useQueryClient } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';

const applyEndpoint = '/api/v1/reports/allegro-price-sim/apply/';

export interface AllegroPriceSimApplyPayload {
  offerId: string;
  expectedOfferGrossCents: number;
  priceGrossCents: number;
}

export interface AllegroPriceSimApplyResult {
  status: 'applied' | 'stale' | 'error';
  offerId: string;
  name: string;
  expectedOfferGrossCents: number | null;
  liveOfferGrossCents: number | null;
  requestedGrossCents: number | null;
  externalUrl: string | null;
  marketplace: string | null;
  error?: string | null;
}

export const useApplyAllegroPriceSim = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (payload: AllegroPriceSimApplyPayload) => {
      const response = await axiosInstance.post<AllegroPriceSimApplyResult>(
        applyEndpoint,
        payload,
      );
      return response.data;
    },
    onSuccess: (result) => {
      if (result.status === 'applied')
        queryClient.invalidateQueries({ queryKey: ['allegroPriceSim'] });
    },
  });

  return {
    applyPrice: mutation.mutateAsync,
    isApplying: mutation.isPending,
  };
};
