import type { ChipProps } from '@mui/material';

import type {
  AlertChannel,
  AlertSeverity,
  AlertStatus,
  AlertType,
} from '../types';

interface AlertConfigEntry {
  label: string;
  color: ChipProps['color'];
}

export const ALERT_TYPE_OPTIONS: { value: AlertType; label: string }[] = [
  { value: 'price_mismatch', label: 'Różnica cenowa' },
  { value: 'low_stock', label: 'Niski stan' },
  { value: 'oversell_risk', label: 'Ryzyko sprzedaży bez pokrycia' },
  { value: 'negative_stock', label: 'Ujemny stan magazynowy' },
  { value: 'sync_failed', label: 'Błąd synchronizacji' },
  { value: 'sync_stale', label: 'Synchronizacja nieaktywna' },
  { value: 'unmatched_offers', label: 'Niedopasowane oferty' },
  { value: 'mapping_review_queue', label: 'Kolejka dopasowania produktów' },
  { value: 'offer_inactive_with_stock', label: 'Nieaktywna oferta ze stanem' },
  { value: 'stock_drift', label: 'Rozbieżność stanów' },
  { value: 'velocity_anomaly', label: 'Anomalia sprzedaży' },
  { value: 'below_purchase_price', label: 'Cena poniżej zakupu' },
  { value: 'price_schedule_failed', label: 'Błąd zaplanowanej zmiany ceny' },
  {
    value: 'price_schedule_diverged',
    label: 'Cena oferty zmieniona poza harmonogramem',
  },
];

export const alertTypeLabels: Record<AlertType, string> =
  ALERT_TYPE_OPTIONS.reduce(
    (acc, { value, label }) => ({ ...acc, [value]: label }),
    {} as Record<AlertType, string>,
  );

// Single source of truth for how an alert severity looks everywhere (badge, filters, chips).
export const alertSeverityConfig: Record<AlertSeverity, AlertConfigEntry> = {
  critical: { label: 'Krytyczny', color: 'error' },
  warning: { label: 'Ostrzeżenie', color: 'warning' },
  info: { label: 'Informacja', color: 'info' },
};

export const alertStatusConfig: Record<AlertStatus, AlertConfigEntry> = {
  active: { label: 'Aktywny', color: 'warning' },
  acknowledged: { label: 'Sprawdzony', color: 'info' },
  resolved: { label: 'Rozwiązany', color: 'success' },
};

export const alertChannelLabels: Record<AlertChannel, string> = {
  allegro: 'Allegro',
  woocommerce: 'WooCommerce',
  erli: 'Erli',
  invoice: 'Faktura',
};

export const alertChannelLabel = (
  channel: string | null | undefined,
): string => {
  if (!channel) return '—';
  return alertChannelLabels[channel as AlertChannel] ?? channel;
};
