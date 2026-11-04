import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError, isAxiosError } from 'axios';

import {
  axiosInstance,
  captureError,
  throwAxiosErrorFromResponse,
} from '../../../../services';
import { getProductDetailsQueryKey } from '../../products/api/useGetProductDetails';
import { ChannelProductLink } from '../types/channelLinks';

import { ecommerceOffersQueryKeyBase } from './useGetEcommerceOffers';
import { getProductChannelLinksQueryKey } from './useGetProductChannelLinks';

const MAX_REASON_LENGTH = 240;

const pushText = (messages: string[], value: unknown) => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed.startsWith('<') || trimmed.includes('Traceback'))
      return;
    messages.push(trimmed);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => pushText(messages, item));
    return;
  }
  if (value && typeof value === 'object') {
    Object.values(value as Record<string, unknown>).forEach((item) =>
      pushText(messages, item),
    );
  }
};

/** Readable API reason, or null when the failure has nothing safe to show. */
export const offerStockPublishErrorMessage = (
  error: unknown,
): string | null => {
  if (!isAxiosError(error)) return null;
  if (
    error.code === AxiosError.ECONNABORTED ||
    error.code === AxiosError.ETIMEDOUT
  )
    return 'Przekroczono czas oczekiwania. Spróbuj ponownie.';
  if (error.code === AxiosError.ERR_NETWORK)
    return 'Błąd połączenia. Spróbuj ponownie.';

  const messages: string[] = [];
  pushText(messages, error.response?.data);
  const text = [...new Set(messages)].join(' ');
  if (!text) return null;
  return text.length > MAX_REASON_LENGTH
    ? `${text.slice(0, MAX_REASON_LENGTH)}…`
    : text;
};

export const notifyOfferStockPublishError = (
  notify: (variant: 'error', message: string) => void,
  error: unknown,
) => {
  const reason = offerStockPublishErrorMessage(error);
  notify(
    'error',
    reason
      ? `Nie udało się zmienić aktualizacji stanu: ${reason}`
      : 'Nie udało się zmienić aktualizacji stanu',
  );
  const status = isAxiosError(error) ? error.response?.status : undefined;
  if (reason == null && status !== 401) captureError(error);
};

export const useSetOfferStockPublish = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) => {
      const response = await axiosInstance.patch<ChannelProductLink>(
        `/api/v1/ecommerce/offers/${id}/`,
        { stockPublishEnabled: enabled },
      );
      if (response.status >= 400) throwAxiosErrorFromResponse(response);
      return response.data;
    },
    onSuccess: (link) => {
      queryClient.invalidateQueries({
        queryKey: [ecommerceOffersQueryKeyBase],
      });
      queryClient.invalidateQueries({ queryKey: ['product-sales-overview'] });
      if (link.productId) {
        queryClient.invalidateQueries({
          queryKey: getProductChannelLinksQueryKey(link.productId),
        });
        queryClient.invalidateQueries({
          queryKey: getProductDetailsQueryKey(link.productId),
        });
      }
    },
  });

  return { setOfferStockPublish: mutateAsync, isPending };
};
