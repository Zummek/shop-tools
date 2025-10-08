import { OrderStatus } from '../types';

export const orderStatusMessage: Record<OrderStatus, string> = {
  new: 'Nowe',
  receiptPrepared: 'Paragon przygotowany',
  packed: 'Spakowane',
  shipped: 'Wysłane',
  canceled: 'Anulowane',
};
