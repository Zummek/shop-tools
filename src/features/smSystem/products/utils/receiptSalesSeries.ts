export const RECEIPT_SALES_DAYS = 90;

export interface ReceiptSalePoint {
  date: string;
  quantity: number;
}

const utcDayStart = (date: Date) =>
  Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

/** Inclusive UTC calendar days ending today. Matches the product history window. */
export const receiptSalesWindow = (
  days: number,
  now: Date = new Date(),
): string[] => {
  const end = utcDayStart(now);
  const dates: string[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1)
    dates.push(new Date(end - offset * 86400000).toISOString().slice(0, 10));
  return dates;
};

export const buildReceiptSalesSeries = (
  rows: ReceiptSalePoint[],
  days: number = RECEIPT_SALES_DAYS,
  now: Date = new Date(),
) => {
  const dates = receiptSalesWindow(days, now);
  const byDate = new Map<string, number>();
  for (const row of rows) {
    if (!row.date) continue;
    byDate.set(row.date, (byDate.get(row.date) ?? 0) + row.quantity);
  }
  const quantities = dates.map((date) => byDate.get(date) ?? 0);
  const total = quantities.reduce((sum, value) => sum + value, 0);
  return { dates, quantities, total };
};

export const formatSaleQuantity = (value: number) => {
  const rounded = Math.round(value * 1000) / 1000;
  return String(rounded).replace('.', ',');
};
