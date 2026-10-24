const WARSAW = 'Europe/Warsaw';

export interface RefundTextInput {
  date: string;
  amount: number;
  currency: string;
  place: 'register' | 'outside' | 'rows' | 'review' | 'pending' | 'ignored';
  reason: string;
  documentNumber: string;
  issued: boolean;
  review: { title?: string; detail?: string }[];
}

/** Same wording as the „Na kasie” / „Poza dowodem” table. */
const SIDE_REASON_LABELS: Record<string, string> = {
  cod: 'pobranie – paragon na kasie',
  receipt: 'oznaczone „paragon wystawiony na kasie”',
  before_evidence: 'zwrot do sprzedaży sprzed pierwszego dowodu',
  invoice: 'faktura',
  oss: 'sprzedaż do UE w procedurze OSS',
  export: 'eksport poza UE',
  already_issued: 'ujęte w innym dowodzie',
};

const reasonLabel = (refund: RefundTextInput): string => {
  if (refund.reason === 'already_issued' && refund.documentNumber)
    return `ujęte w dowodzie ${refund.documentNumber}`;
  return SIDE_REASON_LABELS[refund.reason] ?? refund.reason;
};

/** Short state, the same words as in the evidence settlement. */
export const refundPlaceLabel = (refund: RefundTextInput): string => {
  if (refund.place === 'ignored') return 'pominięty w dowodach';
  if (refund.place === 'register')
    return `na kasie: ${reasonLabel(refund)} (zwrot)`;
  if (refund.place === 'outside')
    return `poza dowodem: ${reasonLabel(refund)} (zwrot)`;
  if (refund.place === 'rows') {
    return refund.issued
      ? 'ujęty w dowodzie jako kwota ujemna'
      : `wejdzie do dowodu za cały ${monthName(refund.date)} jako kwota ujemna`;
  }
  if (refund.place === 'review')
    return refund.review[0]?.title || 'wymaga wyjaśnienia';
  if (refund.reason === 'sale_review') return 'czeka na wyjaśnienie sprzedaży';
  return 'nie wchodzi do dowodu tego miesiąca';
};

export const refundText = (refund: RefundTextInput): string => {
  const money = formatMoney(refund.amount, refund.currency);
  return `Zwrot ${money} z ${formatDay(refund.date)} — ${refundPlaceLabel(refund)}.`;
};

export const refundNeedsAttention = (refund: RefundTextInput): boolean =>
  refund.place === 'review' || refund.reason === 'sale_review';

/** 1234567 -> "12 345,67 zł" (grosze in, Polish formatting out). */
export const formatPln = (cents: number, suffix = ' zł'): string => {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(Math.trunc(cents));
  const whole = Math.floor(abs / 100);
  const part = String(abs % 100).padStart(2, '0');
  const grouped = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  return `${sign}${grouped},${part}${suffix}`;
};

export const formatMoney = (minor: number, currency: string): string =>
  formatPln(minor, currency === 'PLN' ? ' zł' : ` ${currency}`);

/** "2026-09-14" -> "14.09.2026". */
export const formatDay = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const [year, month, day] = iso.slice(0, 10).split('-');
  return `${day}.${month}.${year}`;
};

export const formatPeriod = (from: string, to: string): string =>
  from === to ? formatDay(from) : `${formatDay(from)} – ${formatDay(to)}`;

/** ISO moment shown in Warsaw time: "05.10.2026 08:14". */
export const formatMoment = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const parts = new Intl.DateTimeFormat('pl-PL', {
    timeZone: WARSAW,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(new Date(iso));
  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return `${get('day')}.${get('month')}.${get('year')} ${get('hour')}:${get('minute')}`;
};

/** Today's calendar day in Warsaw as "YYYY-MM-DD". */
export const warsawToday = (now: Date = new Date()): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: WARSAW }).format(now);

/** "2026-09" -> "wrzesień 2026". */
export const monthName = (day: string): string => {
  const [year, month] = day.split('-').map(Number);
  return new Intl.DateTimeFormat('pl-PL', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 15)));
};

/** "DW/ALL/2026/09/1" -> "DW_ALL_2026_09_1.pdf". */
export const documentFileName = (number: string, extension: string): string =>
  `${number.replace(/\//g, '_')}.${extension}`;

const pad = (value: number) => String(value).padStart(2, '0');

const isoDay = (year: number, month: number, day: number) =>
  `${year}-${pad(month)}-${pad(day)}`;

export const daysInMonth = (year: number, month: number): number =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();

/** First and last day of the month before `today` ("YYYY-MM-DD"). */
export const previousMonthRange = (today: string): [string, string] => {
  const [year, month] = today.split('-').map(Number);
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;
  return [
    isoDay(prevYear, prevMonth, 1),
    isoDay(prevYear, prevMonth, daysInMonth(prevYear, prevMonth)),
  ];
};

export const monthRangeOf = (day: string): [string, string] => {
  const [year, month] = day.split('-').map(Number);
  return [
    isoDay(year, month, 1),
    isoDay(year, month, daysInMonth(year, month)),
  ];
};

export const sameMonth = (from: string, to: string): boolean =>
  from.slice(0, 7) === to.slice(0, 7);

/** Polish plural: 1 wpłata, 2 wpłaty, 5 wpłat, 12 wpłat, 22 wpłaty. */
export const plural = (
  count: number,
  one: string,
  few: string,
  many: string,
): string => {
  if (count === 1) return one;
  const lastDigit = count % 10;
  const lastTwo = count % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14))
    return few;
  return many;
};

export const countLabel = (
  count: number,
  one: string,
  few: string,
  many: string,
): string => `${count} ${plural(count, one, few, many)}`;

/** Days of a month split into covered by documents, sales without document and the rest. */
export type DayState = 'covered' | 'missing' | 'empty';

export const monthDayStates = (
  year: number,
  month: number,
  documents: { periodFrom: string; periodTo: string }[],
  daysWithSales: string[],
): { day: string; state: DayState }[] => {
  const withSales = new Set(daysWithSales);
  const total = daysInMonth(year, month);
  const out: { day: string; state: DayState }[] = [];
  for (let day = 1; day <= total; day += 1) {
    const iso = isoDay(year, month, day);
    const covered = documents.some(
      (doc) => doc.periodFrom <= iso && iso <= doc.periodTo,
    );
    out.push({
      day: iso,
      state: covered ? 'covered' : withSales.has(iso) ? 'missing' : 'empty',
    });
  }
  return out;
};

/** "60" + "40" -> true. A blank field is not zero – the user still has to fill it in. */
export const sharesSumTo100 = (shares: Record<string, string>): boolean => {
  const raw = Object.values(shares);
  if (raw.some((value) => String(value).trim() === '')) return false;
  const values = raw.map((value) =>
    Math.round(Number(String(value).replace(',', '.')) * 100),
  );
  if (values.some((value) => Number.isNaN(value) || value < 0)) return false;
  return values.reduce((sum, value) => sum + value, 0) === 10000;
};

const EVIDENCE_CHANNELS = ['allegro', 'erli', 'woocommerce'] as const;

/** Channel and period from the sales-evidence page query, ignoring junk. */
export const parseEvidenceSearch = (
  params: URLSearchParams,
): {
  channel?: (typeof EVIDENCE_CHANNELS)[number];
  from?: string;
  to?: string;
} => {
  const channel = params.get('channel');
  const from = params.get('from');
  const to = params.get('to');
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  const parsed: {
    channel?: (typeof EVIDENCE_CHANNELS)[number];
    from?: string;
    to?: string;
  } = {};
  if (EVIDENCE_CHANNELS.includes(channel as (typeof EVIDENCE_CHANNELS)[number]))
    parsed.channel = channel as (typeof EVIDENCE_CHANNELS)[number];
  if (from && iso.test(from)) parsed.from = from;
  if (to && iso.test(to)) parsed.to = to;
  return parsed;
};
