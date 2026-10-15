import dayjs from 'dayjs';

export const MAX_EXPORT_PERIOD_DAYS = 93;

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export type SalesExportSource = 'allegro' | 'woocommerce' | 'erli';

export interface SalesExportRecord {
  id: number;
  startDate: string;
  endDate: string;
  sources: SalesExportSource[];
  exportedAt: string;
}

export interface SuggestedExportRange {
  startDate: string;
  endDate: string;
  truncated: boolean;
}

export const latestCoveredExport = (
  history: SalesExportRecord[],
): SalesExportRecord | null =>
  history.reduce<SalesExportRecord | null>((best, row) => {
    if (!best || row.endDate > best.endDate) return row;
    return best;
  }, null);

export const lastCompleteExportDay = (today: string): string =>
  dayjs(today).subtract(1, 'day').format('YYYY-MM-DD');

export const suggestExportRange = (
  history: SalesExportRecord[],
  today: string,
): SuggestedExportRange | null => {
  const last = latestCoveredExport(history);
  if (!last || !DATE.test(today)) return null;
  const start = dayjs(last.endDate).add(1, 'day');
  const end = dayjs(today);
  if (!start.isValid() || !end.isValid() || start.isAfter(end, 'day'))
    return null;
  const days = end.startOf('day').diff(start.startOf('day'), 'day') + 1;
  if (days <= MAX_EXPORT_PERIOD_DAYS) {
    return {
      startDate: start.format('YYYY-MM-DD'),
      endDate: end.format('YYYY-MM-DD'),
      truncated: false,
    };
  }
  return {
    startDate: start.format('YYYY-MM-DD'),
    endDate: start.add(MAX_EXPORT_PERIOD_DAYS - 1, 'day').format('YYYY-MM-DD'),
    truncated: true,
  };
};

export const formatExportRange = (
  startDate: string,
  endDate: string,
): string => {
  const start = dayjs(startDate).format('D.MM.YYYY');
  const end = dayjs(endDate).format('D.MM.YYYY');
  return start === end ? start : `${start} – ${end}`;
};
