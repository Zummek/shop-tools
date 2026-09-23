import { SimpleBranch } from '../../branches/types';

export type ProductMatchType =
  | 'NONE'
  | 'GTIN'
  | 'EAN'
  | 'MANUAL'
  | 'PREVIOUS_MANUAL'
  | 'SIMILARITY'
  | 'CHANNEL_LINK'
  | 'SKU';

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

export type ProductHistoryDays = 7 | 30 | 90;

export interface ProductHistoryDailySale {
  date: string;
  branchId: number;
  branchName: string;
  quantity: number;
}

export interface ProductHistorySale {
  id: number;
  documentNumber: string;
  saleDate: string;
  branchId: number;
  branchName: string;
  quantity: number;
  unitGrossCents: number | null;
}

export interface ProductHistoryTransfer {
  id: number;
  humanId: number;
  status: string;
  sourceBranchId: number;
  sourceBranchName: string;
  destinationBranchId: number | null;
  destinationBranchName: string | null;
  toTransferAmount: number | null;
  receivedAmount: number | null;
  createdAt: string;
}

export interface ProductHistoryPurchase {
  id: number;
  invoiceId: number;
  invoiceNumber: string;
  invoiceDate: string;
  sellerName: string;
  quantity: number;
  receivedQuantity: number | null;
  unitNetPrice: number | null;
  status: string;
  currency: string;
}

export interface ProductHistory {
  days: ProductHistoryDays;
  salesDaily: ProductHistoryDailySale[];
  transfers: ProductHistoryTransfer[];
  transfersTruncated: boolean;
  purchases?: ProductHistoryPurchase[];
  purchasesTruncated?: boolean;
}

export interface ProductDaySales {
  date: string;
  branchId: number;
  sales: ProductHistorySale[];
  salesTruncated: boolean;
}
