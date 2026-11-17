import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isPriceScheduleOfferClosed,
  priceScheduleOfferClosedHint,
} from '../src/features/smSystem/ecommerce/utils/channelOffers.ts';

test('a paused offer can still be enabled', () => {
  assert.equal(
    isPriceScheduleOfferClosed({
      offerStatus: 'INACTIVE',
      linkIsActive: true,
    }),
    false,
  );
});

test('an ended offer stays closed', () => {
  assert.equal(
    isPriceScheduleOfferClosed({ offerStatus: 'ENDED', linkIsActive: true }),
    true,
  );
  assert.match(
    priceScheduleOfferClosedHint({ offerStatus: 'ended', linkIsActive: true }),
    /zakończonej/,
  );
});

test('an inactive link stays closed even when the status is active', () => {
  assert.equal(
    isPriceScheduleOfferClosed({ offerStatus: 'ACTIVE', linkIsActive: false }),
    true,
  );
  assert.match(
    priceScheduleOfferClosedHint({
      offerStatus: 'ACTIVE',
      linkIsActive: false,
    }),
    /nieaktywnej/,
  );
});
