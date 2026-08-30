export interface PriceScheduleWindow {
  id?: number;
  /** 0 = Monday … 6 = Sunday */
  startWeekday: number;
  /** "HH:MM" (Europe/Warsaw wall clock) */
  startTime: string;
  endWeekday: number;
  endTime: string;
}

export type PriceScheduleDisableMode = 'revert_now' | 'revert_at_window_end';

export type PriceScheduleApplyMode = 'next_window' | 'apply_now';

export type PriceScheduleOriginalApplyMode = 'next_revert' | 'apply_now';

export type PriceScheduleEventType =
  | 'applied'
  | 'reverted'
  | 'failed'
  | 'diverged'
  | 'disabled'
  | 'enabled';

export interface PriceScheduleEvent {
  id: number;
  event: PriceScheduleEventType;
  /** cents, or null when the event has no price change */
  priceBefore: number | string | null;
  priceAfter: number | string | null;
  message: string;
  createdAt: string;
}

export interface ChannelPriceSchedule {
  id: number;
  linkId: number;
  /** cents */
  temporaryPrice: number;
  /** cents; set on create (defaults to offer price), editable afterwards */
  originalPrice: number;
  currency: string;
  isEnabled: boolean;
  isApplied: boolean;
  disableAfterRevert: boolean;
  /** set while a mid-window base-price push keeps the temp price paused */
  snoozedUntil: string | null;
  consecutiveFailures: number;
  lastError: string | null;
  lastAppliedAt: string | null;
  lastRevertedAt: string | null;
  createdAt: string;
  windows: PriceScheduleWindow[];
  events: PriceScheduleEvent[];
  channel: string;
  offerName: string;
  externalOfferId: string;
  marketplace: string | null;
  productId: number | null;
  productName: string | null;
  /** last synced offer price, cents — may differ from originalPrice */
  linkPrice: number | null;
  isInsideWindowNow: boolean;
  currentWindowEndsAt: string | null;
  nextWindowStartsAt: string | null;
}

export interface PriceSchedulePayload {
  linkId: number;
  /** cents */
  temporaryPrice: number;
  /** cents; defaults to current offer price when omitted */
  originalPrice?: number;
  windows: PriceScheduleWindow[];
}

export interface UpdatePriceSchedulePayload {
  temporaryPrice?: number;
  originalPrice?: number;
  windows?: PriceScheduleWindow[];
  applyMode?: PriceScheduleApplyMode;
  originalApplyMode?: PriceScheduleOriginalApplyMode;
}

export interface DisablePriceSchedulePayload {
  mode: PriceScheduleDisableMode;
  /** skips the channel write — escape hatch for unpatchable offers */
  force?: boolean;
}

export interface PriceScheduleRefreshPricesError {
  id: number;
  error: string;
}

export interface PriceScheduleRefreshPricesResponse {
  results: ChannelPriceSchedule[];
  errors: PriceScheduleRefreshPricesError[];
}

export interface PriceScheduleBulkEnableResponse {
  results: Array<
    ChannelPriceSchedule & { applyPending?: boolean; applyError?: string }
  >;
  errors: PriceScheduleRefreshPricesError[];
}

export interface PriceScheduleBulkDisableResponse {
  results: Array<
    ChannelPriceSchedule & { revertPending?: boolean; revertError?: string }
  >;
  errors: PriceScheduleRefreshPricesError[];
}

/** Soft cap shared with the backend bulk/refresh endpoints. */
export const PRICE_SCHEDULE_BULK_MAX_IDS = 500;
