import assert from 'node:assert/strict';
import test from 'node:test';

import {
  externalStatusLabel,
  paymentMethodLabel,
} from '../src/features/smSystem/ecommerce/utils/orderStatusConfig.ts';

test('Erli status and payment codes have Polish labels', () => {
  assert.equal(externalStatusLabel('erli', 'purchased'), 'Kupione');
  assert.equal(paymentMethodLabel('COMPLETED'), 'Opłacone');
  assert.equal(paymentMethodLabel('cod'), 'Za pobraniem');
  assert.equal(paymentMethodLabel('Przelewy24 - BLIK'), 'Przelewy24 - BLIK');
  assert.equal(paymentMethodLabel(''), '');
});
