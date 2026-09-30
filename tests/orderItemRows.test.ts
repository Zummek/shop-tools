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
    internalProduct: null,
    productMatchType: 'MANUAL',
    ...overrides,
  };
}

test('a single product stays one row', () => {
  const mag = product(1, 'Mag');
  const rows = buildOrderItemRows([
    item({ id: 10, internalProduct: mag }),
  ]);
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
      offerComponents: [mag, potas],
    }),
  ]);
  assert.deepEqual(
    rows.map((row) => [row.kind, row.id, row.product?.id ?? null]),
    [
      ['offer', 'item-10', null],
      ['component', 'item-10-product-1', 1],
      ['component', 'item-10-product-2', 2],
    ],
  );
  assert.equal(isMatchedComponent(rows[1]), true);
  assert.equal(isMatchedComponent(rows[2]), false);
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
    rows.map((row) => [row.kind, row.product?.id ?? null]),
    [
      ['offer', null],
      ['component', 9],
      ['component', 1],
      ['component', 2],
    ],
  );
  assert.equal(isMatchedComponent(rows[1]), true);
  assert.equal(isMatchedComponent(rows[2]), false);
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
        { branch: { id: 8, name: 'B' }, grossPrice: 5000 } as Product['branches'][number],
        { branch: { id: 2, name: 'A' }, grossPrice: 0 } as Product['branches'][number],
      ]),
    ),
    0,
  );
  assert.equal(
    catalogUnitGross(
      product(1, 'Mag', [
        { branch: { id: 3, name: 'B' }, grossPrice: 2790 } as Product['branches'][number],
        { branch: { id: 1, name: 'A' }, grossPrice: 5000 } as Product['branches'][number],
      ]),
    ),
    5000,
  );
});
