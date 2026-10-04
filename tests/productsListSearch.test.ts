import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseProductsListFilters,
  productsListSearchString,
} from '../src/features/smSystem/products/utils/productsListSearch.ts';

test('parseProductsListFilters reads query, page, and purchase filters', () => {
  const filters = parseProductsListFilters(
    new URLSearchParams(
      'query=mleko&page=3&missingPurchaseCost=1&manualUnset=1',
    ),
  );
  assert.deepEqual(filters, {
    query: 'mleko',
    page: 2,
    missingPurchaseCost: true,
    manualUnset: true,
    channels: [],
  });
});

test('manualUnset is ignored unless missing purchase cost is on', () => {
  const filters = parseProductsListFilters(
    new URLSearchParams('manualUnset=1&page=0&query='),
  );
  assert.equal(filters.manualUnset, false);
  assert.equal(filters.missingPurchaseCost, false);
  assert.equal(filters.page, 0);
  assert.equal(filters.query, '');
});

test('productsListSearchString keeps only list filters', () => {
  const search = productsListSearchString(
    new URLSearchParams(
      'query=ser%20zolty&page=2&missingPurchaseCost=1&manualUnset=1&tab=other',
    ),
  );
  const params = new URLSearchParams(search);
  assert.equal(params.get('query'), 'ser zolty');
  assert.equal(params.get('page'), '2');
  assert.equal(params.get('missingPurchaseCost'), '1');
  assert.equal(params.get('manualUnset'), '1');
  assert.equal(params.get('tab'), null);
});

test('productsListSearchString omits defaults', () => {
  assert.equal(productsListSearchString(new URLSearchParams('page=1')), '');
});

test('productsListSearchString keeps known sales channels in catalog order', () => {
  const search = productsListSearchString(
    new URLSearchParams('channel=erli&channel=allegro&channel=shop&query=a'),
  );
  const params = new URLSearchParams(search);
  assert.equal(params.get('query'), 'a');
  assert.deepEqual(params.getAll('channel'), ['allegro', 'erli']);
});
