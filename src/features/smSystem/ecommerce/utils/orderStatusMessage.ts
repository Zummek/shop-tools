import { OrderStatus } from '../types';

export const orderStatusMessage: Record<OrderStatus, string> = {
  new: 'Nowe',
  receipt_prepared: 'Paragon przygotowany',
  packed: 'Spakowane',
  shipped: 'Wysłane',
  canceled: 'Anulowane',
};
