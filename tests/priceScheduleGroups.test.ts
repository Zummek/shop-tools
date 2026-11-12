import assert from 'node:assert/strict';
import test from 'node:test';

import type { ChannelPriceSchedule } from '../src/features/smSystem/ecommerce/types/priceSchedules.ts';
import {
  groupSchedulesByProduct,
  pageOfGroups,
  priceScheduleGridRows,
} from '../src/features/smSystem/ecommerce/utils/priceScheduleGroups.ts';

const schedule = (
  id: number,
  productId: number | null,
  productName: string | null,
  overrides: Partial<ChannelPriceSchedule> = {},
) =>
  ({
    id,
    productId,
    productName,
    offerName: `Oferta ${id}`,
    isApplied: false,
    isEnabled: true,
    consecutiveFailures: 0,
    nextWindowStartsAt: null,
    ...overrides,
  }) as ChannelPriceSchedule;

test('groups schedules by product and sorts groups by name', () => {
  const groups = groupSchedulesByProduct([
    schedule(1, 20, 'Żel'),
    schedule(2, 10, 'Ananas'),
    schedule(3, 20, 'Żel'),
  ]);
  assert.deepEqual(
    groups.map((group) => [group.productName, group.schedules.length]),
    [
      ['Ananas', 1],
      ['Żel', 2],
    ],
  );
});

test('offers without a product form one group at the end', () => {
  const groups = groupSchedulesByProduct([
    schedule(1, null, null),
    schedule(2, 5, 'Mydło'),
    schedule(3, null, null),
  ]);
  assert.deepEqual(
    groups.map((group) => [group.key, group.schedules.length]),
    [
      ['5', 1],
      ['none', 2],
    ],
  );
});

test('group summary counts applied, failing and earliest next change', () => {
  const [group] = groupSchedulesByProduct([
    schedule(1, 1, 'A', {
      isApplied: true,
      nextWindowStartsAt: '2026-11-12T18:00:00+01:00',
    }),
    schedule(2, 1, 'A', {
      consecutiveFailures: 2,
      nextWindowStartsAt: '2026-11-12T10:00:00+01:00',
    }),
  ]);
  assert.equal(group.appliedCount, 1);
  assert.equal(group.failingCount, 1);
  assert.equal(group.nextChangeAt, '2026-11-12T10:00:00+01:00');
});

test('an applied window end is the next change when it comes first', () => {
  const [group] = groupSchedulesByProduct([
    schedule(1, 1, 'A', {
      isApplied: true,
      currentWindowEndsAt: '2026-11-12T16:00:00+01:00',
      nextWindowStartsAt: '2026-11-13T10:00:00+01:00',
    }),
    schedule(2, 1, 'A', {
      nextWindowStartsAt: '2026-11-12T18:00:00+01:00',
    }),
  ]);
  assert.equal(group.nextChangeAt, '2026-11-12T16:00:00+01:00');
});

test('next change compares instants across timezone offsets', () => {
  const [group] = groupSchedulesByProduct([
    schedule(1, 1, 'A', {
      nextWindowStartsAt: '2026-10-25T02:30:00+02:00',
    }),
    schedule(2, 1, 'A', {
      nextWindowStartsAt: '2026-10-25T02:00:00+01:00',
    }),
  ]);
  assert.equal(group.nextChangeAt, '2026-10-25T02:30:00+02:00');
});

test('enabled schedules come before disabled ones, then by offer name', () => {
  const [group] = groupSchedulesByProduct([
    schedule(3, 1, 'A', { offerName: 'A oferta', isEnabled: false }),
    schedule(2, 1, 'A', { offerName: 'B oferta', isEnabled: true }),
    schedule(1, 1, 'A', { offerName: 'A oferta', isEnabled: true }),
  ]);
  assert.deepEqual(
    group.schedules.map((row) => row.id),
    [1, 2, 3],
  );
});

test('a collapsed product keeps only its header row', () => {
  const groups = groupSchedulesByProduct([
    schedule(1, 5, 'Mydło'),
    schedule(2, 5, 'Mydło'),
  ]);
  const open = priceScheduleGridRows(groups, new Set());
  assert.deepEqual(
    open.map((row) => row.kind),
    ['product', 'schedule', 'schedule'],
  );
  const closed = priceScheduleGridRows(groups, new Set(['5']));
  assert.deepEqual(
    closed.map((row) => row.kind),
    ['product'],
  );
});

test('rows inside a group are ordered by offer name then id', () => {
  const [group] = groupSchedulesByProduct([
    schedule(3, 1, 'A', { offerName: 'B oferta' }),
    schedule(2, 1, 'A', { offerName: 'A oferta' }),
    schedule(1, 1, 'A', { offerName: 'A oferta' }),
  ]);
  assert.deepEqual(
    group.schedules.map((row) => row.id),
    [1, 2, 3],
  );
});

test('pageOfGroups clamps an out-of-range page', () => {
  const result = pageOfGroups([1, 2, 3, 4, 5], 9, 2);
  assert.equal(result.page, 2);
  assert.equal(result.pageCount, 3);
  assert.deepEqual(result.rows, [5]);
  assert.equal(pageOfGroups([], 0, 25).pageCount, 1);
});
