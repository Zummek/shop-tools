import dayjs from 'dayjs';
import assert from 'node:assert/strict';
import test from 'node:test';

import type { PriceScheduleOneOff } from '../src/features/smSystem/ecommerce/types/priceSchedules.ts';
import {
  formatPriceScheduleOneOff,
  formatPriceScheduleWindowSummary,
} from '../src/features/smSystem/ecommerce/utils/priceScheduleFormat.ts';

const oneOff = (
  start: dayjs.Dayjs,
  end: dayjs.Dayjs,
  label = '',
): PriceScheduleOneOff => ({
  id: 1,
  startsAt: start.format('YYYY-MM-DDTHH:mm:ss'),
  endsAt: end.format('YYYY-MM-DDTHH:mm:ss'),
  label,
});

test('same-day one-off shows one date', () => {
  const text = formatPriceScheduleOneOff(
    oneOff(dayjs('2026-11-11T08:00:00'), dayjs('2026-11-11T22:00:00')),
  );
  assert.equal(text, '11.11 08:00–22:00');
});

test('overnight one-off shows the end date', () => {
  const text = formatPriceScheduleOneOff(
    oneOff(
      dayjs('2026-11-11T08:00:00'),
      dayjs('2026-11-12T00:00:00'),
      'Święto',
    ),
  );
  assert.equal(text, 'Święto 11.11 08:00–12.11 00:00');
});

test('summary appends one-offs after weekly windows', () => {
  const text = formatPriceScheduleWindowSummary({
    windows: [
      {
        startWeekday: 1,
        startTime: '10:00',
        endWeekday: 1,
        endTime: '16:00',
      },
    ],
    oneOffs: [oneOff(dayjs('2026-11-11T08:00:00'), dayjs('2026-11-12T00:00:00'))],
  });
  assert.equal(text, 'Wt 10:00 → Wt 16:00 · 11.11 08:00–12.11 00:00');
});
