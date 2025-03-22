import { useMutation, useQueryClient } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';

interface UpdateOrderDetailsInput {
  orderId: number;
  branchId: number;
  productId: number;
  toOrderAmount: number;
}

interface UpdateOrderResponse {
  success: boolean;
  message?: string;
}

const getOrderDetailsQueryKey = (orderId: number) => ['orderDetails', orderId];

const getEndpoint = (orderId: number, branchId: number, productId: number) => 
  `/api/v1/suppliers-orders/orders/${orderId}/branches/${branchId}/products/${productId}/`;

export const useUpdateOrderDetails = () => {
  const queryClient = useQueryClient();

  const updateOrderDetailsRequest = async ({ orderId, branchId, productId, toOrderAmount }: UpdateOrderDetailsInput) => {
    const endpoint = getEndpoint(orderId, branchId, productId);
    const response = await axiosInstance.patch<UpdateOrderResponse>(endpoint, {
      to_order_amount: toOrderAmount,
    });
    return response.data;
  };

  const { mutateAsync: updateOrderDetails, isPending, isError } = useMutation({
    mutationFn: updateOrderDetailsRequest,
    onSuccess: (response, variables) => {
      queryClient.setQueryData(getOrderDetailsQueryKey(variables.orderId), response);
    },
    onError: (error: Error) => {
      console.error('Błąd podczas aktualizacji zamówienia:', error);
    },
  });

  return {
    updateOrderDetails,
    isLoading: isPending,
    isError,
  };
};
