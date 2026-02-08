import { Product } from '../../products/types';

export type OrderStatus =
  | 'new'
  | 'receipt_prepared'
  | 'packed'
  | 'shipped'
  | 'canceled';

export interface EcommerceOrderItem {
  id: number;
  externalId: string;
  externalName: string;
  externalPricePerItem: number;
  externalCurrency: string;
  quantity: number;
  internalProduct: Product | null;
  internalProductManuallySelected: boolean;
  internalProductPopulatedFromPreviousOrder: boolean;
}

export interface EcommerceOrderDetails {
  id: number;
  orderDate: string;
  orderSource: string;
  externalId: string;
  paymentMethod: string;
  invoiceRequired: boolean;
  deliveryMethod: string;
  deliveryCost: number | null;
  deliveryCostCurrency: string | null;
  status: OrderStatus;
  messageFromBuyer: string;
  buyerName: string;
  buyerLogin: string;
  buyerAddress: string;
  buyerContact: string;
  orderItems: EcommerceOrderItem[];
  itemsAmount: number;
  productsAmount: number;
  createdAt: string;
  updatedAt: string;
}
