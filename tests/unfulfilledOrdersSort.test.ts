import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveUnfulfilledSort } from '../src/features/smSystem/reports/utils/unfulfilledOrdersSort.ts';

const fields = ['product_name', 'order_count'] as const;

test('resolveUnfulfilledSort keeps storage when the url has no sort', () => {
  assert.deepEqual(
    resolveUnfulfilledSort({
      urlSortBy: null,
      urlSortOrder: null,
      urlHasSortBy: false,
      urlHasSortOrder: false,
      storedField: 'order_count',
      storedOrder: 'desc',
      fields,
      defaultField: 'product_name',
    }),
    { sortBy: 'order_count', sortOrder: 'desc' },
  );
});

test('resolveUnfulfilledSort does not mix a partial url with storage', () => {
  assert.deepEqual(
    resolveUnfulfilledSort({
      urlSortBy: 'product_name',
      urlSortOrder: null,
      urlHasSortBy: true,
      urlHasSortOrder: false,
      storedField: 'order_count',
      storedOrder: 'desc',
      fields,
      defaultField: 'product_name',
    }),
    { sortBy: 'product_name', sortOrder: 'asc' },
  );
  assert.deepEqual(
    resolveUnfulfilledSort({
      urlSortBy: null,
      urlSortOrder: 'desc',
      urlHasSortBy: false,
      urlHasSortOrder: true,
      storedField: 'order_count',
      storedOrder: 'asc',
      fields,
      defaultField: 'product_name',
    }),
    { sortBy: 'product_name', sortOrder: 'desc' },
  );
});

test('resolveUnfulfilledSort ignores an invalid stored field', () => {
  assert.deepEqual(
    resolveUnfulfilledSort({
      urlSortBy: null,
      urlSortOrder: null,
      urlHasSortBy: false,
      urlHasSortOrder: false,
      storedField: 'nope',
      storedOrder: 'desc',
      fields,
      defaultField: 'product_name',
    }),
    { sortBy: 'product_name', sortOrder: 'desc' },
  );
});
