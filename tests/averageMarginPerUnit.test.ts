import assert from 'node:assert/strict';
import test from 'node:test';

import { averageMarginPerUnitCents } from '../src/features/smSystem/reports/utils/marginSharePercent.ts';

test('average margin per unit is row margin divided by sold units', () => {
  assert.equal(averageMarginPerUnitCents(1000, 2), 500);
  assert.equal(averageMarginPerUnitCents(1001, 2), 501);
  assert.equal(averageMarginPerUnitCents(-300, 2), -150);
  assert.equal(averageMarginPerUnitCents(-1001, 2), -501);
});

test('average margin per unit is empty when nothing was sold', () => {
  assert.equal(averageMarginPerUnitCents(1000, 0), null);
  assert.equal(averageMarginPerUnitCents(1000, -1), null);
});
