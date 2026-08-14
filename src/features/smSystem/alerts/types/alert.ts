export type AlertSeverity = 'info' | 'warning' | 'critical';

export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export type AlertResolution = 'auto' | 'manual';

export type AlertChannel = 'allegro' | 'woocommerce' | 'erli' | 'invoice';

export type AlertChannelFilter = 'allegro' | 'woocommerce' | 'erli';

export type AlertType =
  | 'price_mismatch'
  | 'low_stock'
  | 'oversell_risk'
  | 'negative_stock'
  | 'sync_failed'
  | 'sync_stale'
  | 'unmatched_offers'
  | 'mapping_review_queue'
  | 'offer_inactive_with_stock'
  | 'stock_drift'
  | 'velocity_anomaly'
  | 'below_purchase_price'
  | 'price_schedule_failed'
  | 'price_schedule_diverged';

export interface AlertAcknowledgedBy {
  id: number;
  username: string;
  fullName: string;
}

export interface AlertListItem {
  id: number;
  type: AlertType;
  channel: AlertChannel | null;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string;
  payload: Record<string, unknown>;
  product: number | null;
  productName: string | null;
  productInternalId: string | null;
  channelProductLink: number | null;
  externalUrl: string | null;
  branch: number | null;
  branchName: string | null;
  occurrences: number;
  firstSeenAt: string;
  lastSeenAt: string;
  acknowledgedBy: AlertAcknowledgedBy | null;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  resolution: AlertResolution | null;
  createdAt: string;
  updatedAt: string;
}

export interface AlertUnreadCount {
  total: number;
  critical: number;
  warning: number;
  info: number;
}

export interface AlertSettings {
  priceWarningPercent: number;
  priceCriticalPercent: number;
  lowStockThreshold: number;
  syncStaleHours: number;
  stockDriftHours: number;
  velocityWindowDays: number;
  velocityMultiplier: number;
  ackReactivationHours: number;
  disabledTypes: AlertType[];
}
