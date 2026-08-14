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

export type PriceScheduleEventType =
  | 'applied'
  | 'reverted'
  | 'failed'
  | 'diverged'
  | 'disabled';

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
  /** cents, captured at creation */
  originalPrice: number;
  currency: string;
  isEnabled: boolean;
  isApplied: boolean;
  disableAfterRevert: boolean;
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
  isInsideWindowNow: boolean;
  currentWindowEndsAt: string | null;
  nextWindowStartsAt: string | null;
}

export interface PriceSchedulePayload {
  linkId: number;
  /** cents */
  temporaryPrice: number;
  windows: PriceScheduleWindow[];
}

export interface UpdatePriceSchedulePayload {
  temporaryPrice?: number;
  windows?: PriceScheduleWindow[];
}

export interface DisablePriceSchedulePayload {
  mode: PriceScheduleDisableMode;
}
