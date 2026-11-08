import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyColumnOrder,
  applyColumnWidths,
  emptyPersistedGridState,
  gridStorageKey,
  hiddenToVisibilityModel,
  parsePersistedGridState,
  patchPersistedGridState,
  reorderKeepingFixed,
  visibilityModelToHidden,
  type GridStorage,
} from '../src/components/dataGrid/persistedGridState.ts';

const memoryStorage = (): GridStorage => {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
};

test('parsePersistedGridState ignores broken and partial payloads', () => {
  assert.deepEqual(parsePersistedGridState(null), emptyPersistedGridState());
  assert.deepEqual(parsePersistedGridState('{'), emptyPersistedGridState());
  assert.deepEqual(parsePersistedGridState('[]'), emptyPersistedGridState());
  assert.deepEqual(
    parsePersistedGridState(
      JSON.stringify({
        widths: { name: 240, sku: 'wide', stock: 0, cover: -4 },
        order: ['sku', 'sku', 1, 'name'],
        hidden: ['stock', 'stock'],
        sort: [
          { field: 'name', sort: 'desc' },
          { field: 'sku', sort: 'nope' },
          { sort: 'asc' },
        ],
        ordering: 'units',
      }),
    ),
    {
      v: 1,
      widths: { name: 240 },
      order: ['sku', 'name'],
      hidden: ['stock'],
      sort: [{ field: 'name', sort: 'desc' }],
      ordering: 'units',
    },
  );
});

test('missing sort stays unset and an empty sort list is kept', () => {
  assert.equal(parsePersistedGridState('{}').sort, null);
  assert.deepEqual(parsePersistedGridState('{"sort":[]}').sort, []);
});

test('applyColumnOrder places new columns after their definition predecessor', () => {
  const columns = ['a', 'b', 'c', 'd'].map((field) => ({ field }));
  assert.deepEqual(
    applyColumnOrder(columns, ['c', 'a']).map((column) => column.field),
    ['c', 'd', 'a', 'b'],
  );
  assert.deepEqual(
    applyColumnOrder(
      ['n', 'a', 'b'].map((field) => ({ field })),
      ['b', 'a'],
    ).map((column) => column.field),
    ['n', 'b', 'a'],
  );
  assert.deepEqual(
    applyColumnOrder(
      ['a', 'n1', 'n2', 'b'].map((field) => ({ field })),
      ['b', 'a'],
    ).map((column) => column.field),
    ['b', 'a', 'n1', 'n2'],
  );
  assert.deepEqual(
    applyColumnOrder(columns, []).map((column) => column.field),
    ['a', 'b', 'c', 'd'],
  );
});

test('applyColumnWidths drops flex when a saved width exists', () => {
  assert.deepEqual(
    applyColumnWidths(
      [
        { field: 'name', flex: 1, width: 100 },
        { field: 'sku', width: 80 },
      ],
      { name: 240 },
    ),
    [
      { field: 'name', width: 240 },
      { field: 'sku', width: 80 },
    ],
  );
});

test('reorderKeepingFixed leaves pinned fields in place', () => {
  assert.deepEqual(
    reorderKeepingFixed(['name', 'a', 'b', 'c'], ['a', 'b', 'c'], 'c', 'a'),
    ['name', 'c', 'a', 'b'],
  );
  assert.deepEqual(
    reorderKeepingFixed(['a', 'name', 'b'], ['a', 'b'], 'b', 'a'),
    ['b', 'name', 'a'],
  );
});

test('visibility model only stores hidden fields', () => {
  assert.deepEqual(hiddenToVisibilityModel(['sku', 'stock']), {
    sku: false,
    stock: false,
  });
  assert.deepEqual(
    visibilityModelToHidden({ sku: false, name: true, stock: false }),
    ['sku', 'stock'],
  );
});

test('patchPersistedGridState merges a later width write over a sort write', () => {
  const storage = memoryStorage();
  patchPersistedGridState(storage, 'invoices', {
    sort: [{ field: 'invoiceDate', sort: 'asc' }],
  });
  patchPersistedGridState(storage, 'invoices', {
    widths: { sellerName: 320 },
  });
  assert.deepEqual(
    parsePersistedGridState(storage.getItem(gridStorageKey('invoices'))),
    {
      v: 1,
      widths: { sellerName: 320 },
      order: [],
      hidden: [],
      sort: [{ field: 'invoiceDate', sort: 'asc' }],
      ordering: null,
    },
  );
});
