import assert from 'node:assert/strict';
import test from 'node:test';

import {
  exclusiveSalesChannels,
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
    startDate: null,
    endDate: null,
    soldOnly: false,
    ordering: null,
    coverWithin: null,
    listing: null,
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

test('productsListSearchString keeps cover, ordering, and dates', () => {
  const search = productsListSearchString(
    new URLSearchParams(
      'cover_within=14&ordering=-delta&sold=1&start_date=2026-05-01&end_date=2026-05-10',
    ),
  );
  const params = new URLSearchParams(search);
  assert.equal(params.get('cover_within'), '14');
  assert.equal(params.get('ordering'), '-delta');
  assert.equal(params.get('sold'), '1');
  assert.equal(params.get('start_date'), '2026-05-01');
  assert.equal(params.get('end_date'), '2026-05-10');
});

test('parse keeps name ordering and drops unknown values', () => {
  const filters = parseProductsListFilters(
    new URLSearchParams('cover_within=3&ordering=-name'),
  );
  assert.equal(filters.coverWithin, null);
  assert.equal(filters.ordering, '-name');
  const unknown = parseProductsListFilters(
    new URLSearchParams('ordering=price'),
  );
  assert.equal(unknown.ordering, null);
});

test('productsListSearchString keeps known sales channels in catalog order', () => {
  const search = productsListSearchString(
    new URLSearchParams('channel=erli&channel=allegro&channel=shop&query=a'),
  );
  const params = new URLSearchParams(search);
  assert.equal(params.get('query'), 'a');
  assert.deepEqual(params.getAll('channel'), ['allegro', 'erli']);
});

test('exclusiveSalesChannels keeps till receipts off online channels', () => {
  assert.deepEqual(
    exclusiveSalesChannels(['allegro'], ['allegro', 'receipt']),
    ['receipt'],
  );
  assert.deepEqual(
    exclusiveSalesChannels(['receipt'], ['receipt', 'woocommerce']),
    ['woocommerce'],
  );
  assert.deepEqual(
    exclusiveSalesChannels(['allegro', 'receipt'], ['allegro', 'receipt']),
    ['allegro'],
  );
});

test('parse drops an unknown listing and the search string keeps a known one', () => {
  assert.equal(
    parseProductsListFilters(new URLSearchParams('listing=nope')).listing,
    null,
  );
  const search = productsListSearchString(
    new URLSearchParams('listing=zero&tab=channels&query=mleko'),
  );
  const params = new URLSearchParams(search);
  assert.equal(params.get('listing'), 'zero');
  assert.equal(params.get('query'), 'mleko');
  assert.equal(params.get('tab'), null);
});

test('productsListSearchString keeps receipts after ecommerce channels', () => {
  const search = productsListSearchString(
    new URLSearchParams('channel=receipt&channel=woocommerce'),
  );
  const params = new URLSearchParams(search);
  assert.deepEqual(params.getAll('channel'), ['woocommerce', 'receipt']);
});
