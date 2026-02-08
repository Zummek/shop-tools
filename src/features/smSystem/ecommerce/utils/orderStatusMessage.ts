import { OrderStatus } from '../types';

export const orderStatusMessage: Record<OrderStatus, string> = {
  new: 'Nowe',
  receipt_prepared: 'Paragon przygotowany',
  packed: 'Spakowane',
  shipped: 'Wysłane',
  canceled: 'Anulowane',
};

export const orderStatusColors: Record<OrderStatus, string> = {
  new: 'black',
  receipt_prepared: 'orange',
  packed: 'blue',
  shipped: 'green',
  canceled: 'red',
};
