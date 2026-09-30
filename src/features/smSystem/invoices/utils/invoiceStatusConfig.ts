import { InvoiceStatus } from '../types';

export const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  IMPORTED: 'Zaimportowana',
  PENDING_RECEIPT: 'Oczekuje na przyjęcie',
  PARTIALLY_RECEIVED: 'Częściowo przyjęta',
  RECEIVED: 'Przyjęta',
  REJECTED: 'Odrzucona',
  DAMAGED: 'Uszkodzona',
};

export const invoiceStatusColors: Record<
  InvoiceStatus,
  'default' | 'warning' | 'success' | 'error'
> = {
  IMPORTED: 'default',
  PENDING_RECEIPT: 'warning',
  PARTIALLY_RECEIVED: 'warning',
  RECEIVED: 'success',
  REJECTED: 'error',
  DAMAGED: 'error',
};
