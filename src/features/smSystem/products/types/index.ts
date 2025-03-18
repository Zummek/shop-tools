import { SimpleBranch } from '../../branches/types';

export * from './importProducts';

export interface Product {
  id: number;
  name: string;
  internalId: string;
  barcodes: string[];
  vat: number;
  branches: ProductBranch[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductBranch {
  branch: SimpleBranch;
  stock: number;
  stockUpdatedAt: string;
  netPrice: number;
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
