import type { Product } from '../../products/types';
import type { EcommerceOrderItem } from '../types';

type PricedProduct = {
  branches?: { grossPrice?: number; branch?: { id?: number } }[];
} | null | undefined;

export type OrderItemRowKind = 'line' | 'offer' | 'component';

export interface OrderItemGridRow {
  id: string;
  kind: OrderItemRowKind;
  item: EcommerceOrderItem;
  product: Product | null;
}

export function buildOrderItemRows(
  items: EcommerceOrderItem[],
): OrderItemGridRow[] {
  const rows: OrderItemGridRow[] = [];
  for (const item of items) {
    const components = item.offerComponents ?? [];
    if (components.length < 2) {
      rows.push({
        id: `item-${item.id}`,
        kind: 'line',
        item,
        product: item.internalProduct,
      });
      continue;
    }
    rows.push({
      id: `item-${item.id}`,
      kind: 'offer',
      item,
      product: null,
    });
    const assigned = item.internalProduct;
    const componentIds = new Set(components.map((product) => product.id));
    if (assigned && !componentIds.has(assigned.id)) {
      rows.push({
        id: `item-${item.id}-assigned-${assigned.id}`,
        kind: 'component',
        item,
        product: assigned,
      });
    }
    for (const product of components) {
      rows.push({
        id: `item-${item.id}-product-${product.id}`,
        kind: 'component',
        item,
        product,
      });
    }
  }
  return rows;
}

export function isMatchedComponent(row: OrderItemGridRow) {
  return (
    row.kind === 'component' &&
    row.product != null &&
    row.product.id === row.item.internalProduct?.id
  );
}

export function offerQuantityLabel(count: number) {
  if (count === 1) return 'oferta';
  const teen = count % 100;
  if (count % 10 >= 2 && count % 10 <= 4 && (teen < 12 || teen > 14))
    return 'oferty';
  return 'ofert';
}

/** Catalog gross of the branch with the lowest id. Missing price stays null, 0 stays 0. */
export function catalogUnitGross(product: PricedProduct): number | null {
  const branches = product?.branches;
  if (!branches?.length) return null;
  const ordered = [...branches].sort(
    (a, b) =>
      (a.branch?.id ?? Number.MAX_SAFE_INTEGER) -
      (b.branch?.id ?? Number.MAX_SAFE_INTEGER),
  );
  const gross = ordered[0]?.grossPrice;
  return gross == null ? null : gross;
}
