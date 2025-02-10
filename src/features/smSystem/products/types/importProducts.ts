export interface ImportProductPreparedProduct {
  id: string;
  name: string;
  bardcode: string;
}

export interface ImportProduct {
  id: string;
  internalId: string;
  name: string;
  categoryId: string;
  description: string;
  barcodes: string[];
  vat: number;
  netPrice: number;
  active: boolean;
  createdById: string;
  createdAt: string;
  updatedById: string | null;
  updatedAt: string;
}

export interface ImportCategory {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  hierarchyLevel: number;
}
