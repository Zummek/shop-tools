import {
  ChannelPriceSchedule,
  PriceScheduleEvent,
  PriceScheduleEventType,
  PriceScheduleWindow,
} from '../types/priceSchedules';

export const WEEKDAY_LABELS = ['Pn', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];

export const PRICE_SCHEDULE_EVENT_LABELS: Record<
  PriceScheduleEventType,
  string
> = {
  applied: 'Zastosowano cenę tymczasową',
  reverted: 'Przywrócono cenę bazową',
  failed: 'Błąd zmiany ceny',
  diverged: 'Cena zmieniona poza systemem',
  disabled: 'Harmonogram wyłączony',
  enabled: 'Harmonogram włączony',
};

export const formatPriceScheduleWindow = (window: PriceScheduleWindow) =>
  `${WEEKDAY_LABELS[window.startWeekday]} ${window.startTime} → ${
    WEEKDAY_LABELS[window.endWeekday]
  } ${window.endTime}`;

export const formatPriceScheduleWindows = (windows: PriceScheduleWindow[]) =>
  windows.map(formatPriceScheduleWindow).join(' · ');

export const formatPriceScheduleEventLabel = (event: PriceScheduleEvent) =>
  PRICE_SCHEDULE_EVENT_LABELS[event.event] ?? event.event;

/**
 * Primary + secondary labels for the "next change" column.
 * While the temporary price is live, the datetime is the window end
 * (revert to base) — not the start of another temporary window.
 */
export const formatPriceScheduleNextChange = (
  schedule: Pick<
    ChannelPriceSchedule,
    'isApplied' | 'currentWindowEndsAt' | 'nextWindowStartsAt'
  >,
  formatAt: (iso: string) => string,
): { primary: string; secondary: string | null } => {
  if (schedule.isApplied) {
    if (!schedule.currentWindowEndsAt) return { primary: '—', secondary: null };
    return {
      primary: `do ${formatAt(schedule.currentWindowEndsAt)}`,
      secondary: 'potem cena bazowa',
    };
  }
  if (!schedule.nextWindowStartsAt) return { primary: '—', secondary: null };
  return {
    primary: formatAt(schedule.nextWindowStartsAt),
    secondary: 'cena tymczasowa',
  };
};

/**
 * True while a mid-window base-price push keeps the temporary price paused
 * until the current window ends.
 */
export const isPriceScheduleSnoozed = (
  schedule: Pick<
    ChannelPriceSchedule,
    'isEnabled' | 'isApplied' | 'snoozedUntil'
  >,
) =>
  schedule.isEnabled &&
  !schedule.isApplied &&
  !!schedule.snoozedUntil &&
  new Date(schedule.snoozedUntil).getTime() > Date.now();

/** Live/cached channel price differs from what the schedule currently expects. */
export const isPriceScheduleChannelMismatch = (
  schedule: Pick<
    ChannelPriceSchedule,
    'linkPrice' | 'isApplied' | 'temporaryPrice' | 'originalPrice'
  >,
) => {
  if (schedule.linkPrice == null) return false;
  const expected = schedule.isApplied
    ? schedule.temporaryPrice
    : schedule.originalPrice;
  return Number(schedule.linkPrice) !== Number(expected);
};
