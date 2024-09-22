export enum InvoideProvider {
  dary = 'Dary Natury',
  wiesiolek = 'wiesiolek',
  bezGluten = 'Bez Gluten',
  medicaline = 'Medicaline',
}

export interface Contractor {
  id: string;
  name: string;
  nip: string;
}

export interface Product {
  id: string;
  name: string;
  barcode: string;
  vat: number | 'zw';
  unit: string;
  netPrice: string;
  category: string | null;
}

export interface ProductGroup {
  amount: number;
  product: Product;
}

export interface Invoice {
  provider: InvoideProvider;
  documentNumber: string;
  date: Date | null;
  paymentWay: string | null;
  paymentDeadline: Date | null;
  exhibitor: Contractor | null;
  recipient: Contractor | null;
  products: ProductGroup[];
}
