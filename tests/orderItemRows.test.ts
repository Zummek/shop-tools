import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildOrderItemRows,
  catalogUnitGross,
  isMatchedComponent,
  offerQuantityLabel,
} from '../src/features/smSystem/ecommerce/components/orderItemRows.ts';
import type { EcommerceOrderItem } from '../src/features/smSystem/ecommerce/types/ecommerceOrder.ts';
import type { Product } from '../src/features/smSystem/products/types/products.ts';

function product(
  id: number,
  name: string,
  branches: Product['branches'] = [],
): Product {
  return { id, name, branches } as Product;
}

function item(
  overrides: Partial<EcommerceOrderItem> & Pick<EcommerceOrderItem, 'id'>,
): EcommerceOrderItem {
  return {
    externalId: 'offer',
    externalName: 'Oferta',
    externalPricePerItem: 1000,
    externalCurrency: 'PLN',
    quantity: 1,
    unitsInOffer: 1,
    offerComponents: [],
    offerComponentMatchTypes: [],
    internalProduct: null,
    productMatchType: 'MANUAL',
    ...overrides,
  };
}

test('a single product stays one row', () => {
  const mag = product(1, 'Mag');
  const rows = buildOrderItemRows([item({ id: 10, internalProduct: mag })]);
  assert.deepEqual(
    rows.map((row) => [row.kind, row.product?.id]),
    [['line', 1]],
  );
});

test('a bundle lists the offer and each component once', () => {
  const mag = product(1, 'Mag');
  const potas = product(2, 'Potas');
  const rows = buildOrderItemRows([
    item({
      id: 10,
      internalProduct: mag,
      productMatchType: 'PREVIOUS_MANUAL',
      offerComponents: [mag, potas],
      offerComponentMatchTypes: ['PREVIOUS_MANUAL', 'OFFER_NAME'],
    }),
  ]);
  assert.deepEqual(
    rows.map((row) => [
      row.kind,
      row.id,
      row.product?.id ?? null,
      row.componentIndex,
    ]),
    [
      ['offer', 'item-10', null, null],
      ['component', 'item-10-part-0', 1, 0],
      ['component', 'item-10-part-1', 2, 1],
    ],
  );
  assert.equal(isMatchedComponent(rows[1]), true);
  assert.equal(isMatchedComponent(rows[2]), false);
  assert.deepEqual(
    rows.map((row) => row.matchType),
    [null, 'PREVIOUS_MANUAL', 'OFFER_NAME'],
  );
});

test('an assigned product outside the bundle gets its own editable row', () => {
  const mag = product(1, 'Mag');
  const potas = product(2, 'Potas');
  const other = product(9, 'Inny');
  const rows = buildOrderItemRows([
    item({
      id: 10,
      internalProduct: other,
      offerComponents: [mag, potas],
    }),
  ]);
  assert.deepEqual(
    rows.map((row) => [row.kind, row.product?.id ?? null, row.componentIndex]),
    [
      ['offer', null, null],
      ['component', 9, null],
      ['component', 1, 0],
      ['component', 2, 1],
    ],
  );
  assert.equal(isMatchedComponent(rows[1]), true);
  assert.equal(isMatchedComponent(rows[2]), false);
});

test('two parts with the same product keep distinct indexes', () => {
  const mag = product(1, 'Mag');
  const rows = buildOrderItemRows([
    item({
      id: 10,
      internalProduct: mag,
      offerComponents: [mag, mag],
    }),
  ]);
  assert.deepEqual(
    rows.map((row) => [row.id, row.componentIndex]),
    [
      ['item-10', null],
      ['item-10-part-0', 0],
      ['item-10-part-1', 1],
    ],
  );
});

test('offer quantity label follows Polish plural rules', () => {
  assert.equal(offerQuantityLabel(1), 'oferta');
  assert.equal(offerQuantityLabel(2), 'oferty');
  assert.equal(offerQuantityLabel(4), 'oferty');
  assert.equal(offerQuantityLabel(5), 'ofert');
  assert.equal(offerQuantityLabel(12), 'ofert');
  assert.equal(offerQuantityLabel(22), 'oferty');
});

test('catalog unit gross uses the lowest branch id and keeps zero', () => {
  assert.equal(catalogUnitGross(null), null);
  assert.equal(catalogUnitGross(product(1, 'Mag')), null);
  assert.equal(
    catalogUnitGross(
      product(1, 'Mag', [
        {
          branch: { id: 8, name: 'B' },
          grossPrice: 5000,
        } as Product['branches'][number],
        {
          branch: { id: 2, name: 'A' },
          grossPrice: 0,
        } as Product['branches'][number],
      ]),
    ),
    0,
  );
  assert.equal(
    catalogUnitGross(
      product(1, 'Mag', [
        {
          branch: { id: 3, name: 'B' },
          grossPrice: 2790,
        } as Product['branches'][number],
        {
          branch: { id: 1, name: 'A' },
          grossPrice: 5000,
        } as Product['branches'][number],
      ]),
    ),
    5000,
  );
});
