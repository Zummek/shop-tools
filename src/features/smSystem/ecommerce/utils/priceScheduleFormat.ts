import dayjs from 'dayjs';

import type {
  ChannelPriceSchedule,
  PriceScheduleEvent,
  PriceScheduleEventType,
  PriceScheduleOneOff,
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
  moved: 'Przeniesiono na inną ofertę',
};

export const formatPriceScheduleWindow = (window: PriceScheduleWindow) =>
  `${WEEKDAY_LABELS[window.startWeekday]} ${window.startTime} → ${
    WEEKDAY_LABELS[window.endWeekday]
  } ${window.endTime}`;

export const formatPriceScheduleWindows = (windows: PriceScheduleWindow[]) =>
  windows.map(formatPriceScheduleWindow).join(' · ');

const windowClock = (time: string) => time.slice(0, 5);

const windowPatternKey = (window: PriceScheduleWindow) => {
  const daySpan = (window.endWeekday - window.startWeekday + 7) % 7;
  return `${windowClock(window.startTime)}|${windowClock(window.endTime)}|${daySpan}`;
};

const formatWindowGroup = (group: PriceScheduleWindow[]) => {
  const first = group[0];
  const last = group[group.length - 1];
  const days =
    group.length === 1
      ? WEEKDAY_LABELS[first.startWeekday]
      : `${WEEKDAY_LABELS[first.startWeekday]}-${WEEKDAY_LABELS[last.startWeekday]}`;
  return `${days} ${windowClock(first.startTime)} → ${windowClock(first.endTime)}`;
};

export const summarizePriceScheduleWindows = (
  windows: PriceScheduleWindow[],
) => {
  if (windows.length === 0) return '';
  const sorted = [...windows].sort(
    (a, b) =>
      a.startWeekday - b.startWeekday ||
      windowClock(a.startTime).localeCompare(windowClock(b.startTime)) ||
      a.endWeekday - b.endWeekday ||
      windowClock(a.endTime).localeCompare(windowClock(b.endTime)),
  );
  const groups: PriceScheduleWindow[][] = [];
  for (const window of sorted) {
    const current = groups[groups.length - 1];
    const previous = current?.[current.length - 1];
    const continues =
      previous != null &&
      windowPatternKey(previous) === windowPatternKey(window) &&
      (previous.startWeekday + 1) % 7 === window.startWeekday;
    if (continues && current) current.push(window);
    else groups.push([window]);
  }
  const first = groups[0];
  const last = groups[groups.length - 1];
  const wrapsWeek =
    groups.length > 1 &&
    windowPatternKey(last[last.length - 1]) === windowPatternKey(first[0]) &&
    (last[last.length - 1].startWeekday + 1) % 7 === first[0].startWeekday;
  if (wrapsWeek) {
    groups[0] = [...last, ...first];
    groups.pop();
  }
  const head = formatWindowGroup(groups[0]);
  if (groups.length === 1) return head;
  return `${head} +${groups.length - 1}`;
};

/** "11.11 08:00–22:00", or with the end date when the interval crosses midnight. */
export const formatPriceScheduleOneOff = (oneOff: PriceScheduleOneOff) => {
  const start = dayjs(oneOff.startsAt);
  const end = dayjs(oneOff.endsAt);
  const range = start.isSame(end, 'day')
    ? `${start.format('D.MM HH:mm')}–${end.format('HH:mm')}`
    : `${start.format('D.MM HH:mm')}–${end.format('D.MM HH:mm')}`;
  const label = oneOff.label.trim();
  return label ? `${label} ${range}` : range;
};

export const formatPriceScheduleWindowSummary = (
  schedule: Pick<ChannelPriceSchedule, 'windows' | 'oneOffs'>,
) =>
  [
    formatPriceScheduleWindows(schedule.windows),
    ...(schedule.oneOffs ?? []).map(formatPriceScheduleOneOff),
  ]
    .filter(Boolean)
    .join(' · ');

export const isPriceScheduleWindowValid = (window: PriceScheduleWindow) =>
  !!window.startTime &&
  !!window.endTime &&
  !(
    window.startWeekday === window.endWeekday &&
    window.startTime === window.endTime
  );

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

/**
 * Whether the channel should currently show the temporary price — applied, or
 * inside an active window that the engine should apply (enabled, not snoozed).
 */
export const isPriceScheduleExpectingTemporary = (
  schedule: Pick<
    ChannelPriceSchedule,
    'isApplied' | 'isEnabled' | 'isInsideWindowNow' | 'snoozedUntil'
  >,
) => {
  if (schedule.isApplied) return true;
  if (!schedule.isEnabled || isPriceScheduleSnoozed(schedule)) return false;
  return schedule.isInsideWindowNow;
};

/** Live/cached channel price differs from what the schedule currently expects. */
export const isPriceScheduleChannelMismatch = (
  schedule: Pick<
    ChannelPriceSchedule,
    | 'linkPrice'
    | 'isApplied'
    | 'isEnabled'
    | 'isInsideWindowNow'
    | 'snoozedUntil'
    | 'temporaryPrice'
    | 'originalPrice'
  >,
) => {
  if (schedule.linkPrice == null) return false;
  const expected = isPriceScheduleExpectingTemporary(schedule)
    ? schedule.temporaryPrice
    : schedule.originalPrice;
  if (expected == null) return false;
  return Number(schedule.linkPrice) !== Number(expected);
};
