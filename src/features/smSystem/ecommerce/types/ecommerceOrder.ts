import { Product } from '../../products/types';

export type OrderStatus =
  | 'new'
  | 'receiptPrepared'
  | 'packed'
  | 'shipped'
  | 'canceled';

export interface EcommerceOrderItem {
  id: number;
  externalId: string;
  externalName: string;
  externalPricePerItem: number;
  quantity: number;
  internalProduct: Product;
  internalProductManuallySelected: boolean;
  internalProductPopulatedFromPreviousOrder: boolean;
}

export interface EcommerceOrderDetails {
  id: number;
  orderDate: string;
  orderSource: string;
  externalId: string;
  paymentMethod: string;
  deliveryMethod: string;
  status: OrderStatus;
  messageFromBuyer: string;
  buyerName: string;
  buyerAddress: string;
  buyerContact: string;
  orderItems: EcommerceOrderItem[];
  itemsAmount: number;
  productsAmount: number;
  createdAt: string;
  updatedAt: string;
}
