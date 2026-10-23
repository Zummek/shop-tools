import dayjs from 'dayjs';

export const MAX_SALES_PERIOD_DAYS = 93;

export type SalesPreset = 7 | 30 | 90;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const warsawToday = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Warsaw',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

export const addIsoDays = (iso: string, days: number) => {
  const [year, month, day] = iso.split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  utc.setUTCDate(utc.getUTCDate() + days);
  return utc.toISOString().slice(0, 10);
};

export const inclusiveDays = (start: string, end: string) => {
  const [startYear, startMonth, startDay] = start.split('-').map(Number);
  const [endYear, endMonth, endDay] = end.split('-').map(Number);
  const startUtc = Date.UTC(startYear, startMonth - 1, startDay);
  const endUtc = Date.UTC(endYear, endMonth - 1, endDay);
  return Math.round((endUtc - startUtc) / 86400000) + 1;
};

export const rangeForPreset = (days: SalesPreset) => {
  const end = warsawToday();
  return { start: addIsoDays(end, -(days - 1)), end };
};

export const formatSalesIso = (iso: string) => dayjs(iso).format('DD.MM.YYYY');

export const parseIsoDateParam = (value: string | null): string | null => {
  if (!value || !ISO_DATE.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day
  )
    return null;

  return value;
};

export const salesRangeError = (start: string, end: string): string | null => {
  if (end < start)
    return 'Data końcowa nie może być wcześniejsza niż początkowa.';
  const days = inclusiveDays(start, end);
  if (days > MAX_SALES_PERIOD_DAYS)
    return `Zakres może mieć co najwyżej ${MAX_SALES_PERIOD_DAYS} dni.`;

  return null;
};

export const matchingSalesPreset = (
  start: string,
  end: string,
): SalesPreset | null => {
  const presets: SalesPreset[] = [7, 30, 90];
  return (
    presets.find((days) => {
      const range = rangeForPreset(days);
      return range.start === start && range.end === end;
    }) ?? null
  );
};

export const previousSalesWindow = (start: string, end: string) => {
  const days = inclusiveDays(start, end);
  const previousEnd = addIsoDays(start, -1);
  const previousStart = addIsoDays(previousEnd, -(days - 1));
  return { previousStart, previousEnd };
};

export interface ResolvedSalesRange {
  start: string;
  end: string;
  preset: SalesPreset | null;
  rangeError: string | null;
  explicit: boolean;
}

export const resolveSalesRange = (
  startParam: string | null,
  endParam: string | null,
): ResolvedSalesRange => {
  const start = parseIsoDateParam(startParam);
  const end = parseIsoDateParam(endParam);
  if (!start || !end) {
    const range = rangeForPreset(30);
    return {
      start: range.start,
      end: range.end,
      preset: 30,
      rangeError: null,
      explicit: false,
    };
  }
  const rangeError = salesRangeError(start, end);
  return {
    start,
    end,
    preset: rangeError ? null : matchingSalesPreset(start, end),
    rangeError,
    explicit: true,
  };
};
