import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyPriceScheduleListParams,
  parsePriceScheduleListParams,
  resolveScheduleDeepLink,
} from '../src/features/smSystem/ecommerce/utils/priceScheduleListSearch.ts';

test('parsePriceScheduleListParams reads query, page, and schedule', () => {
  const params = parsePriceScheduleListParams(
    new URLSearchParams('tab=inactive&q=ALINESS&page=2&schedule=68'),
  );
  assert.deepEqual(params, {
    query: 'ALINESS',
    page: 1,
    scheduleId: 68,
    status: 'disabled',
    offerHasActive: false,
  });
});

test('parsePriceScheduleListParams reads the enabled filter', () => {
  assert.equal(
    parsePriceScheduleListParams(new URLSearchParams('status=enabled')).status,
    'enabled',
  );
  assert.equal(
    parsePriceScheduleListParams(new URLSearchParams('status=disabled'))
      .status,
    'disabled',
  );
  assert.equal(
    parsePriceScheduleListParams(new URLSearchParams('status=nope')).status,
    'all',
  );
});

test('parsePriceScheduleListParams maps legacy tabs and lets status win', () => {
  assert.equal(
    parsePriceScheduleListParams(new URLSearchParams('tab=active')).status,
    'enabled',
  );
  assert.equal(
    parsePriceScheduleListParams(new URLSearchParams('tab=inactive')).status,
    'disabled',
  );
  assert.equal(
    parsePriceScheduleListParams(
      new URLSearchParams('tab=inactive&status=enabled'),
    ).status,
    'enabled',
  );
  assert.equal(
    parsePriceScheduleListParams(new URLSearchParams('with_active=1'))
      .offerHasActive,
    true,
  );
});

test('parsePriceScheduleListParams defaults and ignores junk', () => {
  const params = parsePriceScheduleListParams(
    new URLSearchParams('tab=nope&page=0&schedule=0&q='),
  );
  assert.deepEqual(params, {
    query: '',
    page: 0,
    scheduleId: null,
    status: 'all',
    offerHasActive: false,
  });
});

test('applyPriceScheduleListParams migrates legacy tab links', () => {
  const inactive = applyPriceScheduleListParams(
    new URLSearchParams('tab=inactive&with_active=1'),
    {},
  );
  assert.equal(inactive.get('tab'), null);
  assert.equal(inactive.get('status'), 'disabled');
  assert.equal(inactive.get('with_active'), '1');

  const active = applyPriceScheduleListParams(
    new URLSearchParams('tab=active'),
    {},
  );
  assert.equal(active.get('tab'), null);
  assert.equal(active.get('status'), 'enabled');
});

test('applyPriceScheduleListParams omits defaults and drops old tab filters', () => {
  const next = applyPriceScheduleListParams(
    new URLSearchParams('foo=1&tab=inactive&with_active=1'),
    {
      query: 'ALINESS',
      page: 1,
      scheduleId: 114,
      status: 'disabled',
      offerHasActive: false,
    },
  );
  assert.equal(next.get('foo'), '1');
  assert.equal(next.get('tab'), null);
  assert.equal(next.get('with_active'), null);
  assert.equal(next.get('q'), 'ALINESS');
  assert.equal(next.get('page'), '2');
  assert.equal(next.get('schedule'), '114');
  assert.equal(next.get('status'), 'disabled');

  const cleared = applyPriceScheduleListParams(next, {
    query: '',
    page: 0,
    scheduleId: null,
    status: 'all',
    offerHasActive: false,
  });
  assert.equal(cleared.get('q'), null);
  assert.equal(cleared.get('page'), null);
  assert.equal(cleared.get('schedule'), null);
  assert.equal(cleared.get('status'), null);
  assert.equal(cleared.get('with_active'), null);
  assert.equal(cleared.get('foo'), '1');
});

const ready = {
  scheduleId: 68,
  isLoading: false,
  isPlaceholderData: false,
  isFetching: false,
  isError: false,
  found: false,
  hasFilter: false,
};

test('resolveScheduleDeepLink waits while the list is not settled', () => {
  assert.equal(resolveScheduleDeepLink({ ...ready, scheduleId: null }), 'idle');
  assert.equal(resolveScheduleDeepLink({ ...ready, isLoading: true }), 'wait');
  assert.equal(
    resolveScheduleDeepLink({ ...ready, isPlaceholderData: true }),
    'wait',
  );
  assert.equal(resolveScheduleDeepLink({ ...ready, isFetching: true }), 'wait');
  assert.equal(resolveScheduleDeepLink({ ...ready, isError: true }), 'wait');
});

test('resolveScheduleDeepLink opens, or reports a filtered and a missing row', () => {
  assert.equal(resolveScheduleDeepLink({ ...ready, found: true }), 'open');
  assert.equal(
    resolveScheduleDeepLink({ ...ready, hasFilter: true }),
    'clear-filter',
  );
  assert.equal(resolveScheduleDeepLink(ready), 'missing');
});
