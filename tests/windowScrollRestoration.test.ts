import assert from 'node:assert/strict';
import test from 'node:test';

import {
  decideWindowScroll,
  scrollRestorationUrl,
  wantsRestoreScroll,
  type DecideWindowScrollInput,
} from '../src/hooks/windowScrollRestoration.ts';

const base = (
  overrides: Partial<DecideWindowScrollInput> = {},
): DecideWindowScrollInput => ({
  navigationType: 'PUSH',
  locationKey: 'next',
  previousKey: 'prev',
  url: '/sm-system/products?query=tea',
  restoreScroll: false,
  savedByKey: { prev: 800 },
  savedByUrl: { '/sm-system/products?query=tea': 800 },
  currentScrollY: 800,
  ...overrides,
});

test('PUSH to a new page scrolls to the top', () => {
  const decision = decideWindowScroll(base());
  assert.deepEqual(decision, { action: { type: 'top' }, rememberY: null });
});

test('PUSH with restoreScroll restores the saved URL position', () => {
  const decision = decideWindowScroll(base({ restoreScroll: true }));
  assert.deepEqual(decision, {
    action: { type: 'restore', y: 800 },
    rememberY: null,
  });
});

test('PUSH with restoreScroll and no saved URL scrolls to the top', () => {
  const decision = decideWindowScroll(
    base({ restoreScroll: true, savedByUrl: {} }),
  );
  assert.deepEqual(decision, { action: { type: 'top' }, rememberY: null });
});

test('PUSH restores a saved URL position of zero', () => {
  const decision = decideWindowScroll(
    base({
      restoreScroll: true,
      savedByUrl: { '/sm-system/products?query=tea': 0 },
    }),
  );
  assert.deepEqual(decision, {
    action: { type: 'restore', y: 0 },
    rememberY: null,
  });
});

test('POP restores the history entry and ignores a missing one', () => {
  assert.deepEqual(
    decideWindowScroll(
      base({
        navigationType: 'POP',
        locationKey: 'prev',
        savedByKey: { prev: 640 },
      }),
    ),
    { action: { type: 'restore', y: 640 }, rememberY: null },
  );

  assert.deepEqual(
    decideWindowScroll(
      base({ navigationType: 'POP', locationKey: 'fresh', savedByKey: {} }),
    ),
    { action: { type: 'keep' }, rememberY: null },
  );
});

test('REPLACE keeps scroll and copies the previous entry position', () => {
  const decision = decideWindowScroll(
    base({
      navigationType: 'REPLACE',
      locationKey: 'replaced',
      previousKey: 'prev',
      savedByKey: { prev: 420 },
      currentScrollY: 10,
    }),
  );
  assert.deepEqual(decision, { action: { type: 'keep' }, rememberY: 420 });
});

test('REPLACE without a previous save uses the current scroll offset', () => {
  const decision = decideWindowScroll(
    base({
      navigationType: 'REPLACE',
      previousKey: null,
      savedByKey: {},
      currentScrollY: 75,
    }),
  );
  assert.deepEqual(decision, { action: { type: 'keep' }, rememberY: 75 });
});

test('scroll restoration URL ignores param order and a leading question mark', () => {
  const left = scrollRestorationUrl(
    '/sm-system/products',
    '?channel=erli&channel=allegro&query=tea',
  );
  const right = scrollRestorationUrl(
    '/sm-system/products',
    'query=tea&channel=allegro&channel=erli',
  );
  assert.equal(left, right);
  assert.equal(
    scrollRestorationUrl('/sm-system/products', ''),
    '/sm-system/products',
  );
});

test('wantsRestoreScroll only accepts an explicit true flag', () => {
  assert.equal(wantsRestoreScroll({ restoreScroll: true }), true);
  assert.equal(wantsRestoreScroll({ restoreScroll: false }), false);
  assert.equal(wantsRestoreScroll(null), false);
  assert.equal(wantsRestoreScroll(undefined), false);
});
