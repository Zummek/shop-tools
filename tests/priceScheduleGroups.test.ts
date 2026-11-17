import assert from 'node:assert/strict';
import test from 'node:test';

import type { ChannelPriceSchedule } from '../src/features/smSystem/ecommerce/types/priceSchedules.ts';
import {
  foldedUnscheduledOfferLabel,
  groupSchedulesByProduct,
  movableEndedSchedules,
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

test('active offers without a schedule become rows after the schedules', () => {
  const active = {
    linkId: 9,
    externalOfferId: '19127942726',
    offerStatus: 'ACTIVE',
    isActive: true,
    marketplace: 'allegro-pl',
    price: 4350,
    currency: 'PLN',
  };
  const ended = {
    ...active,
    linkId: 4,
    externalOfferId: '19099974301',
    offerStatus: 'ENDED',
  };
  const groups = groupSchedulesByProduct([
    schedule(2, 8, 'Magnez', {
      windows: [
        {
          startWeekday: 0,
          startTime: '17:00',
          endWeekday: 1,
          endTime: '07:00',
        },
      ],
      productOffersWithoutSchedule: [ended, active],
    }),
  ]);
  const rows = priceScheduleGridRows(groups, new Set());
  assert.deepEqual(
    rows.map((row) => row.kind),
    ['product', 'schedule', 'offer', 'endedToggle'],
  );
  const offerRow = rows[2];
  assert.equal(offerRow.kind, 'offer');
  if (offerRow.kind !== 'offer') return;
  assert.equal(offerRow.id, 'offer:9');
  assert.equal(typeof offerRow.id, 'string');
  assert.equal(offerRow.neighbor?.id, 2);
  assert.equal(offerRow.offer.linkId, 9);
  const collapsed = priceScheduleGridRows(groups, new Set(['8']));
  assert.deepEqual(
    collapsed.map((row) => row.kind),
    ['product'],
  );
  const filtered = priceScheduleGridRows(groups, new Set(), {
    includeUnscheduledOffers: false,
  });
  assert.deepEqual(
    filtered.map((row) => row.kind),
    ['product', 'schedule'],
  );
  const expanded = priceScheduleGridRows(groups, new Set(), {
    expandedEndedKeys: new Set(['8']),
  });
  assert.deepEqual(
    expanded.map((row) => row.kind),
    ['product', 'schedule', 'offer', 'endedToggle', 'endedOffer'],
  );
  const expandedOffer = expanded.find((row) => row.kind === 'offer');
  assert.equal(expandedOffer?.kind, 'offer');
  if (expandedOffer?.kind === 'offer')
    assert.deepEqual(expandedOffer.moveSources, []);
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

test('collects offers without a schedule once per product', () => {
  const active = {
    linkId: 9,
    externalOfferId: '19127942726',
    offerStatus: 'ACTIVE',
    isActive: true,
    price: 4350,
    currency: 'PLN',
  };
  const ended = {
    ...active,
    linkId: 4,
    externalOfferId: '19099974301',
    offerStatus: 'ENDED',
  };
  const [group] = groupSchedulesByProduct([
    schedule(1, 8, 'Magnez', { productOffersWithoutSchedule: [active] }),
    schedule(2, 8, 'Magnez', {
      productOffersWithoutSchedule: [active, ended],
    }),
  ]);
  assert.deepEqual(
    group.offersWithoutSchedule.map((offer) => offer.externalOfferId),
    ['19099974301', '19127942726'],
  );
});

test('pageOfGroups clamps an out-of-range page', () => {
  const result = pageOfGroups([1, 2, 3, 4, 5], 9, 2);
  assert.equal(result.page, 2);
  assert.equal(result.pageCount, 3);
  assert.deepEqual(result.rows, [5]);
  assert.equal(pageOfGroups([], 0, 25).pageCount, 1);
});

const foldedOffer = (offerStatus: string, isActive = false) => ({
  linkId: 1,
  externalOfferId: '1',
  offerStatus,
  isActive,
  marketplace: 'allegro-pl',
  price: 1000,
  currency: 'PLN',
});

test('folded label uses Polish plural forms', () => {
  const labelFor = (count: number) =>
    foldedUnscheduledOfferLabel(
      Array.from({ length: count }, () => foldedOffer('ENDED')),
    );
  assert.equal(labelFor(1), '+ 1 zakończona oferta');
  assert.equal(labelFor(2), '+ 2 zakończone oferty');
  assert.equal(labelFor(4), '+ 4 zakończone oferty');
  assert.equal(labelFor(5), '+ 5 zakończonych ofert');
  assert.equal(labelFor(12), '+ 12 zakończonych ofert');
  assert.equal(labelFor(22), '+ 22 zakończone oferty');
});

test('folded label falls back when some offers are not ended', () => {
  assert.equal(
    foldedUnscheduledOfferLabel([
      foldedOffer('ENDED'),
      foldedOffer('INACTIVE'),
    ]),
    '+ 2 oferty bez harmonogramu',
  );
});

test('only disabled, not applied schedules on ended offers can be moved', () => {
  const movable = schedule(1, 1, 'A', {
    isEnabled: false,
    isApplied: false,
    offerStatus: 'ENDED',
  });
  const result = movableEndedSchedules([
    movable,
    schedule(2, 1, 'A', { isEnabled: true, offerStatus: 'ENDED' }),
    schedule(3, 1, 'A', { isEnabled: false, offerStatus: 'ACTIVE' }),
    schedule(4, 1, 'A', {
      isEnabled: false,
      isApplied: true,
      offerStatus: 'ENDED',
    }),
  ]);
  assert.deepEqual(
    result.map((row) => row.id),
    [1],
  );
});
