import axios from 'axios';

import { CreateOrderInput } from '../../app/types';

const endpoint = '/api/v1/suppliers-orders/orders/';

export const useCreateOrder = () => {
  const createOrder = async (orderData: CreateOrderInput) => {
    try {
      const response = await axios.post(endpoint, orderData);
      return response.data;
    } catch (err) {
      console.error('Błąd tworzenia zamówienia');
    }
  };

  return { createOrder };
};
