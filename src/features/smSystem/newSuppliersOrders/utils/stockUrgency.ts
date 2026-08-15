export interface StockUrgencyThresholds {
  leadTimeDays: number;
  safetyDays: number;
  reviewPeriodDays: number;
}

export const DEFAULT_STOCK_URGENCY_THRESHOLDS: StockUrgencyThresholds = {
  leadTimeDays: 3,
  safetyDays: 2,
  reviewPeriodDays: 7,
};

export const resolveStockUrgencyThresholds = (
  supplier?: {
    leadTimeDays?: number;
    safetyDays?: number;
    reviewPeriodDays?: number;
  } | null,
): StockUrgencyThresholds => ({
  leadTimeDays:
    supplier?.leadTimeDays ?? DEFAULT_STOCK_URGENCY_THRESHOLDS.leadTimeDays,
  safetyDays:
    supplier?.safetyDays ?? DEFAULT_STOCK_URGENCY_THRESHOLDS.safetyDays,
  reviewPeriodDays:
    supplier?.reviewPeriodDays ??
    DEFAULT_STOCK_URGENCY_THRESHOLDS.reviewPeriodDays,
});

/** Days of stock below this → critical (red). */
export const criticalStockDays = (t: StockUrgencyThresholds) =>
  t.leadTimeDays + t.safetyDays;

/** Days of stock below this (but ≥ critical) → warning (orange). */
export const warningStockDays = (t: StockUrgencyThresholds) =>
  criticalStockDays(t) + t.reviewPeriodDays;

export const getStockUrgencyClassName = (
  daysOfStock: number | null | undefined,
  thresholds: StockUrgencyThresholds,
): string => {
  if (daysOfStock == null || !Number.isFinite(daysOfStock)) return '';
  if (daysOfStock < criticalStockDays(thresholds)) return 'urgency-critical';
  if (daysOfStock < warningStockDays(thresholds)) return 'urgency-warning';
  return '';
};

export const stockUrgencyRowSx = {
  '& .urgency-critical': {
    backgroundColor: 'rgba(211, 47, 47, 0.12)',
  },
  '& .urgency-warning': {
    backgroundColor: 'rgba(237, 108, 2, 0.12)',
  },
} as const;
