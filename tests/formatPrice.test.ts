import assert from 'node:assert/strict';
import test from 'node:test';

import { formatPrice } from '../src/features/smSystem/products/utils/formatPrice.ts';

test('formatPrice keeps grosze for positive amounts', () => {
  assert.equal(formatPrice(0), '0,00');
  assert.equal(formatPrice(5), '0,05');
  assert.equal(formatPrice(50), '0,50');
  assert.equal(formatPrice(1540), '15,40');
  assert.equal(formatPrice(100000), '1000,00');
  assert.equal(formatPrice(1540, 'PLN'), '15,40 PLN');
});

test('formatPrice keeps the minus in front of amounts under 1 PLN', () => {
  assert.equal(formatPrice(-5), '-0,05');
  assert.equal(formatPrice(-15), '-0,15');
  assert.equal(formatPrice(-50), '-0,50');
  assert.equal(formatPrice(-99), '-0,99');
  assert.equal(formatPrice(-100), '-1,00');
  assert.equal(formatPrice(-1500, 'PLN'), '-15,00 PLN');
});
