export type InvoiceStatus =
  | 'IMPORTED'
  | 'PENDING_RECEIPT'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED';

export type ProductMatchType = 'NONE' | 'GTIN' | 'MANUAL' | 'PREVIOUS_MANUAL';

export interface InvoiceProduct {
  id: number;
  internalId: string;
  name: string;
  barcodes: string[];
  vat: number | null;
  unit: string | null;
}

export interface InvoiceItem {
  id: number;
  lineNumber: number;
  productName: string;
  supplierCode: string | null;
  gtin: string | null;
  unit: string;
  quantity: string;
  unitNetPrice?: number;
  unitNetDiscount?: number;
  unitGrossPrice?: number;
  netAmount?: number;
  grossAmount?: number;
  vatRate: number;
  hasDiscount?: boolean;
  discountAmount?: number;
  discountPercentage?: number;
  product: InvoiceProduct | null;
  productMatchType: ProductMatchType;
  receivedQuantity: string | null;
  receivedBy: number | null;
  receivedAt: string | null;
}

export interface InvoiceListItem {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  sellerName: string;
  buyerName: string;
  grossAmount: string;
  status: InvoiceStatus;
  paymentDueDate: string | null;
  currency: string;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceType: string;
  currency: string;
  sellerNip: string;
  sellerName: string;
  buyerNip: string;
  buyerName: string;
  netAmount?: string;
  vatAmount?: string;
  grossAmount?: string;
  paymentDueDate: string | null;
  paymentMethod: string | null;
  status: InvoiceStatus;
  sourceXml: string;
  items: InvoiceItem[];
  createdAt: string;
  createdBy: number;
  updatedAt: string;
  updatedBy: number;
}

export interface InvoiceListFilters {
  invoiceNumber?: string;
  sellerName?: string;
  invoiceDateFrom?: string;
  invoiceDateTo?: string;
  page?: number;
  pageSize?: number;
}
