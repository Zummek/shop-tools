import assert from 'node:assert/strict';
import test from 'node:test';

import { pendingWaitLabel } from '../src/features/smSystem/ecommerce/utils/pendingWaitLabel.ts';

test('pending wait labels name the missing payment', () => {
  assert.equal(pendingWaitLabel({ reason: 'no_payment' }), 'Brak wpłaty');
  assert.equal(
    pendingWaitLabel({ reason: 'payment_started' }),
    'Płatność rozpoczęta, pieniądze jeszcze nie doszły',
  );
  assert.equal(
    pendingWaitLabel({
      reason: 'deferred_payment',
      paymentMethod: 'EXTENDED_TERM',
    }),
    'Płatność odroczona (Allegro Pay) — do pliku po wysłaniu',
  );
  assert.equal(
    pendingWaitLabel({
      reason: 'unrecognized_payment',
      paymentMethod: 'WIRE_TRANSFER',
    }),
    'Płatność „WIRE_TRANSFER” nie jest opłacona online ani pobraniem',
  );
  assert.equal(
    pendingWaitLabel({ reason: 'erli_unpaid', paymentMethod: 'PENDING' }),
    'Erli: płatność oczekuje na wpłatę',
  );
  assert.equal(
    pendingWaitLabel({
      reason: 'woo_on_hold',
      paymentMethod: 'Przelew bankowy',
    }),
    'Płatność wstrzymana (Przelew bankowy)',
  );
  assert.equal(
    pendingWaitLabel({ reason: 'woo_pending', paymentMethod: 'PayU' }),
    'WooCommerce czeka na płatność (PayU)',
  );
  assert.equal(
    pendingWaitLabel({
      reason: 'woo_unpaid',
      externalStatus: 'checkout-draft',
    }),
    'Status WooCommerce: checkout-draft — jeszcze nieopłacone',
  );
});
