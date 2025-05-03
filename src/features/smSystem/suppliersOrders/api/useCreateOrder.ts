import { axiosInstance } from '../../../../services';
import { CreateOrderInput } from '../../app/types';

const endpoint = '/api/v1/suppliers-orders/orders/';

export const useCreateOrder = () => {
  const createOrder = async (orderData: CreateOrderInput) => {
    try {
      const response = await axiosInstance.post(endpoint, orderData);

      if (response.data && response.data.id)
        return response.data.id;
      else
        throw new Error('Brak ID w odpowiedzi z serwera.');

    } catch (err) {
      console.error('Błąd tworzenia zamówienia', err);
    }
  };
  return { createOrder };
};
