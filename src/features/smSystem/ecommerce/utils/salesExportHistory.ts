import dayjs from 'dayjs';

export type SalesExportSource = 'allegro' | 'woocommerce' | 'erli';

export interface SalesExportRecord {
  id: number;
  startDate: string;
  endDate: string;
  sources: SalesExportSource[];
  exportedAt: string;
  hasFile: boolean;
  coveredFrom: string | null;
  coveredUntil: string | null;
}

const warsawDateTime = new Intl.DateTimeFormat('pl-PL', {
  timeZone: 'Europe/Warsaw',
  day: 'numeric',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export const formatExportMoment = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return warsawDateTime.format(date);
};

export const formatExportRange = (
  startDate: string,
  endDate: string,
): string => {
  const start = dayjs(startDate).format('D.MM.YYYY');
  const end = dayjs(endDate).format('D.MM.YYYY');
  return start === end ? start : `${start} – ${end}`;
};

export const formatHistoryLabel = (
  row: Pick<
    SalesExportRecord,
    'startDate' | 'endDate' | 'coveredFrom' | 'coveredUntil'
  >,
): string => {
  if (row.coveredFrom && row.coveredUntil)
    return `${formatExportMoment(row.coveredFrom)} – ${formatExportMoment(row.coveredUntil)}`;
  return formatExportRange(row.startDate, row.endDate);
};
