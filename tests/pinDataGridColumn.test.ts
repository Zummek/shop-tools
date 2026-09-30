import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isColumnPinnedLeft,
  nextPinnedColumnsState,
  pinDataGridColumnLeft,
} from '../src/features/smSystem/reports/utils/pinDataGridColumn.ts';

test('isColumnPinnedLeft requires exactly the given field on the left', () => {
  assert.equal(isColumnPinnedLeft(undefined, 'name'), false);
  assert.equal(isColumnPinnedLeft({ left: [], right: [] }, 'name'), false);
  assert.equal(
    isColumnPinnedLeft({ left: ['name', 'stock'], right: [] }, 'name'),
    false,
  );
  assert.equal(
    isColumnPinnedLeft({ left: ['stock'], right: [] }, 'name'),
    false,
  );
  assert.equal(isColumnPinnedLeft({ left: ['name'], right: [] }, 'name'), true);
});

test('pinDataGridColumnLeft writes left pin and calls resize', () => {
  let pinned = { left: [] as string[], right: [] as string[] };
  let resized = 0;
  const api = {
    state: { pinnedColumns: pinned },
    setState: (
      updater: (state: { pinnedColumns: typeof pinned }) => {
        pinnedColumns: typeof pinned;
      },
    ) => {
      const next = updater({ pinnedColumns: pinned });
      pinned = next.pinnedColumns;
      api.state.pinnedColumns = pinned;
    },
    resize: () => {
      resized += 1;
    },
  };

  assert.equal(pinDataGridColumnLeft(api, 'name'), true);
  assert.deepEqual(pinned, nextPinnedColumnsState('name'));
  assert.equal(resized, 1);
  assert.equal(pinDataGridColumnLeft(api, 'name'), false);
  assert.equal(resized, 1);
});
