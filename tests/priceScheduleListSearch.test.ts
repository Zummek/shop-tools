import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyPriceScheduleListParams,
  parsePriceScheduleListParams,
  resolveScheduleDeepLink,
} from '../src/features/smSystem/ecommerce/utils/priceScheduleListSearch.ts';

test('parsePriceScheduleListParams reads tab, query, page, and schedule', () => {
  const params = parsePriceScheduleListParams(
    new URLSearchParams('tab=inactive&q=ALINESS&page=2&schedule=68'),
  );
  assert.deepEqual(params, {
    tab: 'inactive',
    query: 'ALINESS',
    page: 1,
    scheduleId: 68,
  });
});

test('parsePriceScheduleListParams defaults and ignores junk', () => {
  const params = parsePriceScheduleListParams(
    new URLSearchParams('tab=nope&page=0&schedule=0&q='),
  );
  assert.deepEqual(params, {
    tab: 'active',
    query: '',
    page: 0,
    scheduleId: null,
  });
});

test('applyPriceScheduleListParams omits defaults and keeps schedule', () => {
  const next = applyPriceScheduleListParams(new URLSearchParams('foo=1'), {
    tab: 'inactive',
    query: 'ALINESS',
    page: 1,
    scheduleId: 114,
  });
  assert.equal(next.get('foo'), '1');
  assert.equal(next.get('tab'), 'inactive');
  assert.equal(next.get('q'), 'ALINESS');
  assert.equal(next.get('page'), '2');
  assert.equal(next.get('schedule'), '114');

  const cleared = applyPriceScheduleListParams(next, {
    tab: 'active',
    query: '',
    page: 0,
    scheduleId: null,
  });
  assert.equal(cleared.get('tab'), null);
  assert.equal(cleared.get('q'), null);
  assert.equal(cleared.get('page'), null);
  assert.equal(cleared.get('schedule'), null);
  assert.equal(cleared.get('foo'), '1');
});

const ready = {
  scheduleId: 68,
  isLoading: false,
  isPlaceholderData: false,
  isFetching: false,
  isError: false,
  found: false,
  hasQuery: false,
  triedOtherTab: false,
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

test('resolveScheduleDeepLink opens, then searches the other tab once', () => {
  assert.equal(resolveScheduleDeepLink({ ...ready, found: true }), 'open');
  assert.equal(
    resolveScheduleDeepLink({ ...ready, hasQuery: true }),
    'clear-filter',
  );
  assert.equal(resolveScheduleDeepLink(ready), 'switch-tab');
  assert.equal(
    resolveScheduleDeepLink({ ...ready, triedOtherTab: true }),
    'missing',
  );
});
