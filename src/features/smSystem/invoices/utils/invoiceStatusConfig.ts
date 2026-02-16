import { InvoiceStatus } from '../types';

export const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  IMPORTED: 'Zaimportowana',
  PENDING_RECEIPT: 'Oczekuje na przyjęcie',
  PARTIALLY_RECEIVED: 'Częściowo przyjęta',
  RECEIVED: 'Przyjęta',
};

export const invoiceStatusColors: Record<
  InvoiceStatus,
  'default' | 'warning' | 'success'
> = {
  IMPORTED: 'default',
  PENDING_RECEIPT: 'warning',
  PARTIALLY_RECEIVED: 'warning',
  RECEIVED: 'success',
};
