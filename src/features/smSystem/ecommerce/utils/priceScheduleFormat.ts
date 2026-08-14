import {
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
};

export const formatPriceScheduleWindow = (window: PriceScheduleWindow) =>
  `${WEEKDAY_LABELS[window.startWeekday]} ${window.startTime} → ${
    WEEKDAY_LABELS[window.endWeekday]
  } ${window.endTime}`;

export const formatPriceScheduleWindows = (windows: PriceScheduleWindow[]) =>
  windows.map(formatPriceScheduleWindow).join(' · ');

export const formatPriceScheduleEventLabel = (event: PriceScheduleEvent) =>
  PRICE_SCHEDULE_EVENT_LABELS[event.event] ?? event.event;
