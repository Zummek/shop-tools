import type { ChipProps } from '@mui/material';

import type { OrderStatus } from '../types';

interface OrderStatusConfigEntry {
  label: string;
  color: ChipProps['color'];
}

// Single source of truth for how an order status looks everywhere (list + details).
export const orderStatusConfig: Record<OrderStatus, OrderStatusConfigEntry> = {
  new: { label: 'Nowe', color: 'default' },
  receipt_prepared: { label: 'Paragon przygotowany', color: 'warning' },
  packed: { label: 'Spakowane', color: 'info' },
  shipped: { label: 'Wysłane', color: 'success' },
  canceled: { label: 'Anulowane', color: 'error' },
};

export const NEXT_ORDER_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  new: 'receipt_prepared',
  receipt_prepared: 'packed',
  packed: 'shipped',
};

export const WOO_STATUS_OPTIONS = [
  { value: 'pending', label: 'Oczekujące' },
  { value: 'processing', label: 'W realizacji' },
  { value: 'on-hold', label: 'Wstrzymane' },
  { value: 'completed', label: 'Zakończone' },
  { value: 'cancelled', label: 'Anulowane' },
  { value: 'refunded', label: 'Zwrócone' },
  { value: 'failed', label: 'Nieudane' },
] as const;

export type WooStatusValue = (typeof WOO_STATUS_OPTIONS)[number]['value'];

export const wooStatusLabel = (status: string | null | undefined): string => {
  if (!status) return '—';
  const found = WOO_STATUS_OPTIONS.find((o) => o.value === status);
  return found?.label || status;
};

// Mirrors SM_TO_WOO_STATUS in sm-backend/backend/woocommerce/orders.py
export const SM_TO_WOO_STATUS: Record<OrderStatus, WooStatusValue> = {
  new: 'processing',
  receipt_prepared: 'processing',
  packed: 'processing',
  shipped: 'completed',
  canceled: 'cancelled',
};

// Mirrors WOO_TO_SM_STATUS in the backend, except 'cancelled' is mapped
// explicitly (backend falls back to 'new' for unknown statuses).
export const WOO_TO_SM_STATUS: Record<string, OrderStatus> = {
  pending: 'new',
  'on-hold': 'new',
  processing: 'new',
  completed: 'shipped',
  cancelled: 'canceled',
  refunded: 'canceled',
  failed: 'canceled',
};

export const isWooStatusInSync = (
  status: OrderStatus,
  externalStatus: string | null | undefined,
): boolean => {
  if (!externalStatus) return true;
  const normalized = externalStatus.toLowerCase().trim();
  return (
    WOO_TO_SM_STATUS[normalized] === status ||
    SM_TO_WOO_STATUS[status] === normalized
  );
};
