import { useMutation, useQueryClient } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';

const overridesEndpoint = '/api/v1/reports/allegro-price-sim/overrides/';
const overrideDetailEndpoint = (offerId: string) =>
  `/api/v1/reports/allegro-price-sim/overrides/${encodeURIComponent(offerId)}/`;

export interface AllegroPriceSimOverridePayload {
  offerId: string;
  priceGrossCents: number;
}

export interface AllegroPriceSimOverrideResponse {
  offerId: string;
  priceGrossCents: number;
  simulatedAt: string;
}

export const useSaveAllegroPriceSimOverride = () => {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['allegroPriceSim'] });
  };

  const saveMutation = useMutation({
    mutationFn: async ({
      offerId,
      priceGrossCents,
    }: AllegroPriceSimOverridePayload) => {
      const response =
        await axiosInstance.put<AllegroPriceSimOverrideResponse>(
          overridesEndpoint,
          { offerId, priceGrossCents },
        );
      return response.data;
    },
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: async (offerId: string) => {
      await axiosInstance.delete(overrideDetailEndpoint(offerId));
    },
    onSuccess: invalidate,
  });

  return {
    saveOverride: saveMutation.mutateAsync,
    deleteOverride: deleteMutation.mutateAsync,
  };
};
