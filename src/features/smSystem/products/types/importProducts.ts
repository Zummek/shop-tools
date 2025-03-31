export interface ImportProductPreparedProduct {
  id: string;
  name: string;
  bardcodes: string[];
  internalId: string;
  vat: number;
  deletedAt: string | null;
}

export interface ImportProduct {
  id: string;
  internalId: string;
  name: string;
  barcodes: string[];
  vat: number;
  netPrice: number;
  active: boolean;
  createdById: string;
  createdAt: string;
  updatedById: string | null;
  updatedAt: string;
}

export enum ImportProductsStatus {
  PREPARED = 'PREPARED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}
