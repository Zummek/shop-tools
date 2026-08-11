import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { useNotify } from '../../../../hooks';
import { axiosInstance } from '../../../../services';
import { EcommerceOrderDetails, OrderStatus } from '../types';

import { getEcommerceOrderDetailsQueryKey } from './useGetEcommerceOrderDetails';
import { getEcommerceOrdersQueryKeyBase } from './useGetEcommerceOrders';
import { getEcommerceOrdersStatsQueryKey } from './useGetEcommerceOrdersStats';

interface EcommerceOrderItemPayload {
  id?: number;
  internalProductId: number;
}

export type ChannelAction =
  | 'force_push'
  | 'accept_remote'
  | 'local_only'
  | 'set_external';

interface Payload {
  id: number;
  orderDate?: string;
  orderSource?: string;
  externalId?: string;
  paymentMethod?: string;
  deliveryMethod?: string;
  status?: OrderStatus;
  externalStatus?: string;
  messageFromBuyer?: string;
  buyerName?: string;
  buyerAddress?: string;
  buyerContact?: string;
  orderItems?: EcommerceOrderItemPayload[];
  channelAction?: ChannelAction;
}

export interface UpdateEcommerceOrderItemInternalProductPayload {
  id: number;
  orderItemId: number;
  internalProductId: number;
}

export interface WooStatusConflictError {
  errorCode: 'WOO_STATUS_CONFLICT';
  message: string;
  wooStatus: string;
  mappedStatus?: string;
  currentSmStatus?: string;
  requestedSmStatus?: string;
}

const getEndpoint = (id: number) => `/api/v1/ecommerce/orders/${id}/`;

export const isWooStatusConflict = (
  error: unknown,
): error is AxiosError<WooStatusConflictError> => {
  if (!(error instanceof AxiosError)) return false;
  return (
    error.response?.status === 409 &&
    (error.response.data as WooStatusConflictError | undefined)?.errorCode ===
      'WOO_STATUS_CONFLICT'
  );
};

export const useUpdateEcommerceOrder = () => {
  const queryClient = useQueryClient();
  const { notify } = useNotify();

  const request = async ({ id, channelAction, ...payload }: Payload) => {
    const body: Record<string, unknown> = { ...payload };
    if (channelAction) body.channelAction = channelAction;

    const response = await axiosInstance.patch<
      EcommerceOrderDetails | WooStatusConflictError
    >(getEndpoint(id), body);

    // validateStatus treats some 4xx as resolved — still throw real errors
    if (response.status === 409) {
      const err = new AxiosError(
        'WooCommerce status conflict',
        String(response.status),
        response.config,
        response.request,
        response,
      );
      throw err;
    }

    if (response.status < 200 || response.status >= 300) {
      const errorData = response.data as { message?: string; error?: string };
      throw new Error(
        errorData?.message ||
          errorData?.error ||
          `Update failed with status ${response.status}`,
      );
    }

    return response.data as EcommerceOrderDetails;
  };

  const {
    mutateAsync: updateEcommerceOrder,
    isPending,
    isError,
  } = useMutation({
    mutationFn: request,
    onSuccess: (response, variables) => {
      queryClient.setQueryData(
        getEcommerceOrderDetailsQueryKey(variables.id),
        response,
      );
      queryClient.invalidateQueries({
        queryKey: [getEcommerceOrdersQueryKeyBase],
      });
      queryClient.invalidateQueries({
        queryKey: getEcommerceOrdersStatsQueryKey,
      });
    },
    onError: (error: unknown) => {
      if (isWooStatusConflict(error)) {
        // Caller shows conflict dialog
        return;
      }
      notify('error', 'Błąd podczas aktualizacji zamówienia');
    },
  });

  const updateEcommerceOrderItemInternalProduct = async ({
    id,
    orderItemId,
    internalProductId,
  }: UpdateEcommerceOrderItemInternalProductPayload) => {
    return updateEcommerceOrder({
      id,
      orderItems: [{ id: orderItemId, internalProductId }],
    });
  };

  return {
    updateEcommerceOrder,
    updateEcommerceOrderItemInternalProduct,
    isPending,
    isError,
  };
};
