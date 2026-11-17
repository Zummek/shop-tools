import assert from 'node:assert/strict';
import test from 'node:test';

import type { PriceScheduleWindow } from '../src/features/smSystem/ecommerce/types/priceSchedules.ts';
import { summarizePriceScheduleWindows } from '../src/features/smSystem/ecommerce/utils/priceScheduleFormat.ts';

const window = (
  startWeekday: number,
  endWeekday: number,
  startTime = '17:00',
  endTime = '07:00',
): PriceScheduleWindow => ({
  startWeekday,
  startTime,
  endWeekday,
  endTime,
});

test('empty windows summarize to an empty string', () => {
  assert.equal(summarizePriceScheduleWindows([]), '');
});

test('a single window keeps its start day and clock times', () => {
  assert.equal(
    summarizePriceScheduleWindows([window(0, 1)]),
    'Pn 17:00 → 07:00',
  );
});

test('the work week with one clock pattern collapses to a day range', () => {
  const windows = [0, 1, 2, 3, 4].map((day) => window(day, (day + 1) % 7));
  assert.equal(summarizePriceScheduleWindows(windows), 'Pn-Pt 17:00 → 07:00');
});

test('a different clock pattern is counted instead of listed', () => {
  const windows = [
    window(0, 1, '17:00', '07:00'),
    window(1, 2, '17:00', '07:00'),
    window(5, 6, '10:00', '14:00'),
    window(6, 0, '12:00', '16:00'),
  ];
  assert.equal(
    summarizePriceScheduleWindows(windows),
    'Pn-Wt 17:00 → 07:00 +2',
  );
});

test('the same hours on non-consecutive days stay separate patterns', () => {
  assert.equal(
    summarizePriceScheduleWindows([window(0, 1), window(2, 3)]),
    'Pn 17:00 → 07:00 +1',
  );
});

test('a run that crosses Sunday into Monday stays one range', () => {
  const windows = [6, 0, 1].map((day) => window(day, (day + 1) % 7));
  assert.equal(summarizePriceScheduleWindows(windows), 'Nd-Wt 17:00 → 07:00');
});

test('seconds in the clock are dropped from the summary', () => {
  assert.equal(
    summarizePriceScheduleWindows([window(0, 0, '10:00:00', '16:00:00')]),
    'Pn 10:00 → 16:00',
  );
});
