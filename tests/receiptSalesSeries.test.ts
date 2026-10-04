import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildReceiptSalesSeries,
  formatSaleQuantity,
} from '../src/features/smSystem/products/utils/receiptSalesSeries.ts';

const now = new Date('2026-10-04T21:00:00Z');

test('sums receipt quantities per day and fills the 90-day window', () => {
  const series = buildReceiptSalesSeries(
    [
      { date: '2026-10-04', quantity: 2 },
      { date: '2026-10-04', quantity: 1.5 },
      { date: '2026-09-01', quantity: 4 },
      { date: '2026-01-01', quantity: 99 },
    ],
    90,
    now,
  );

  assert.equal(series.dates.length, 90);
  assert.equal(series.dates[0], '2026-07-07');
  assert.equal(series.dates.at(-1), '2026-10-04');
  assert.equal(series.quantities.at(-1), 3.5);
  assert.equal(series.quantities[series.dates.indexOf('2026-09-01')], 4);
  assert.equal(series.quantities[series.dates.indexOf('2026-08-15')], 0);
  assert.equal(series.total, 7.5);
});

test('formatSaleQuantity uses a comma and drops a trailing fraction', () => {
  assert.equal(formatSaleQuantity(2), '2');
  assert.equal(formatSaleQuantity(1.5), '1,5');
  assert.equal(formatSaleQuantity(1.2346), '1,235');
});
