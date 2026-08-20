import type { ChipProps } from '@mui/material';

import type { SupplierOrderStatus } from '../types';

interface OrderStatusConfigEntry {
  label: string;
  color: ChipProps['color'];
}

export const SUPPLIER_ORDER_STATUSES: SupplierOrderStatus[] = [
  'DRAFT',
  'PREPARED',
  'ORDERED',
  'CANCELLED',
];

export const orderStatusConfig: Record<
  SupplierOrderStatus,
  OrderStatusConfigEntry
> = {
  DRAFT: { label: 'Szkic', color: 'default' },
  PREPARED: { label: 'Przygotowane', color: 'warning' },
  ORDERED: { label: 'Zamówione', color: 'success' },
  CANCELLED: { label: 'Anulowane', color: 'error' },
};

export const getSelectableSupplierOrderStatuses = (
  currentStatus?: SupplierOrderStatus,
): SupplierOrderStatus[] =>
  SUPPLIER_ORDER_STATUSES.filter((status) => status !== currentStatus);

export const isSupplierOrderStatus = (
  status: string | null | undefined,
): status is SupplierOrderStatus =>
  SUPPLIER_ORDER_STATUSES.includes(status as SupplierOrderStatus);

export const isSupplierOrderEditable = (status: SupplierOrderStatus): boolean =>
  status !== 'ORDERED' && status !== 'CANCELLED';
