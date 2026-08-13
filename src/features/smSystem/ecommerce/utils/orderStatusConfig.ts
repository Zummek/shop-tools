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

const WOO_TERMINAL = new Set([
  'completed',
  'cancelled',
  'refunded',
  'failed',
]);
const ALLEGRO_TERMINAL = new Set(['sent', 'picked_up', 'cancelled']);
const ERLI_TERMINAL = new Set([
  'sent',
  'delivered',
  'cancelled',
  'canceled',
  'returned',
]);

const CHANNEL_LABELS: Record<string, string> = {
  allegro: 'Allegro',
  woocommerce: 'WooCommerce',
  erli: 'Erli',
};

export const channelLabel = (source: string): string =>
  CHANNEL_LABELS[source] || source;

const ALLEGRO_STATUS_LABELS: Record<string, string> = {
  new: 'Nowe',
  processing: 'W realizacji',
  ready_for_shipment: 'Gotowe do wysyłki',
  ready_for_pickup: 'Gotowe do odbioru',
  suspended: 'Wstrzymane',
  sent: 'Wysłane',
  picked_up: 'Odebrane',
  cancelled: 'Anulowane',
};

const ERLI_STATUS_LABELS: Record<string, string> = {
  pending: 'Oczekujące',
  purchased: 'Opłacone',
  readytosend: 'Gotowe do wysyłki',
  ready_to_send: 'Gotowe do wysyłki',
  sent: 'Wysłane',
  delivered: 'Dostarczone',
  cancelled: 'Anulowane',
  canceled: 'Anulowane',
  returned: 'Zwrócone',
};

export const externalStatusLabel = (
  source: string,
  status: string | null | undefined,
): string => {
  if (!status) return '—';
  const normalized = status.toLowerCase().trim();
  if (source === 'woocommerce') return wooStatusLabel(normalized);
  if (source === 'allegro')
    return ALLEGRO_STATUS_LABELS[normalized] || status;
  if (source === 'erli') return ERLI_STATUS_LABELS[normalized] || status;
  return status;
};

const isRemoteTerminal = (
  source: string,
  remoteStatus: string | null | undefined,
): boolean => {
  if (!remoteStatus) return false;
  const normalized = remoteStatus.toLowerCase().trim();
  if (source === 'woocommerce') return WOO_TERMINAL.has(normalized);
  if (source === 'allegro') return ALLEGRO_TERMINAL.has(normalized);
  if (source === 'erli') return ERLI_TERMINAL.has(normalized);
  return false;
};

/**
 * Whether a details-page "refresh from channel" button should be shown.
 * Hide when SM is already shipped/canceled AND remote is already terminal.
 */
export const canRefreshOrderStatus = (
  source: string,
  smStatus: OrderStatus,
  remoteStatus: string | null | undefined,
): boolean => {
  if (!['woocommerce', 'allegro', 'erli'].includes(source)) return false;
  const smTerminal = smStatus === 'shipped' || smStatus === 'canceled';
  if (smTerminal && isRemoteTerminal(source, remoteStatus)) return false;
  return true;
};
