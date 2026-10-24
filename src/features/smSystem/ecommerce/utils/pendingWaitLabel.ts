export type PendingWaitReason =
  | 'no_payment'
  | 'payment_started'
  | 'deferred_payment'
  | 'unrecognized_payment'
  | 'erli_unpaid'
  | 'woo_pending'
  | 'woo_on_hold'
  | 'woo_unpaid';

export interface PendingWaitRow {
  reason: string;
  paymentMethod?: string;
  externalStatus?: string;
}

const WOO_STATUS_LABELS: Record<string, string> = {
  pending: 'Oczekujące',
  processing: 'W realizacji',
  'on-hold': 'Wstrzymane',
  completed: 'Zakończone',
  cancelled: 'Anulowane',
  refunded: 'Zwrócone',
  failed: 'Nieudane',
};

const wooStatusLabel = (status: string | undefined): string => {
  if (!status) return '—';
  return WOO_STATUS_LABELS[status.toLowerCase()] || status;
};

const ERLI_PAYMENT_STATUS: Record<string, string> = {
  pending: 'oczekuje na wpłatę',
  new: 'oczekuje na wpłatę',
  canceled: 'anulowana',
  cancelled: 'anulowana',
  failed: 'nieudana',
};

export const pendingWaitLabel = (row: PendingWaitRow): string => {
  const method = (row.paymentMethod || '').trim();
  switch (row.reason) {
    case 'no_payment':
      return 'Brak wpłaty';
    case 'payment_started':
      return 'Płatność rozpoczęta, pieniądze jeszcze nie doszły';
    case 'deferred_payment':
      return 'Płatność odroczona (Allegro Pay) — do pliku po wysłaniu';
    case 'unrecognized_payment':
      return method
        ? `Płatność „${method}” nie jest opłacona online ani pobraniem`
        : 'Płatność nie jest opłacona online ani pobraniem';
    case 'erli_unpaid': {
      const known = ERLI_PAYMENT_STATUS[method.toLowerCase()];
      if (known) return `Erli: płatność ${known}`;
      return method
        ? `Erli nie potwierdziło wpłaty (${method})`
        : 'Erli nie potwierdziło wpłaty';
    }
    case 'woo_pending':
      return method
        ? `WooCommerce czeka na płatność (${method})`
        : 'WooCommerce czeka na płatność';
    case 'woo_on_hold':
      return method
        ? `Płatność wstrzymana (${method})`
        : 'Płatność wstrzymana w WooCommerce';
    case 'woo_unpaid':
      return `Status WooCommerce: ${wooStatusLabel(row.externalStatus)} — jeszcze nieopłacone`;
    default:
      return 'Jeszcze nieopłacone i niewysłane';
  }
};
