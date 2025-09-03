import { SimpleBranch } from '../../branches/types';

export enum ProductUnit {
  kg = 'kg',
  l = 'l',
  pc = 'pc',
}

export enum ProductUnitWeightScale {
  kg = 'kg',
  g = 'g',
  mg = 'mg',
}

export enum ProductUnitVolumeScale {
  l = 'l',
  ml = 'ml',
}

export type ProductUnitScale =
  | ProductUnitWeightScale
  | ProductUnitVolumeScale
  | null;

export interface Product {
  id: number;
  name: string;
  priceTagName: string;
  internalId: string;
  barcodes: string[];
  vat: number;
  branches: ProductBranch[];
  unit: ProductUnit;
  unitScale: ProductUnitScale;
  unitScaleValue: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductBranch {
  branch: SimpleBranch;
  stock: number;
  stockUpdatedAt: string;
  netPrice: number;
  grossPrice: number;
  netPriceUpdatedAt: string;
}

export interface SimpleProduct {
  id: number;
  name: string;
  internalId: string;
  barcodes: string[];
  vat: number;
  deletedAt: string | null;
}
