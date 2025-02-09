import { Branch, User } from '../../types/smSystem';

export type ProductsDocumentStatus =
  | 'PREPARING'
  | 'PREPARED'
  | 'RECEIVED'
  | 'POSTED'
  | 'CANCELED';

interface ProductsDocumentProduct {
  id: string;
  amount: number;
  receivedAmount?: string | null;
}

export interface ProductsDocumentListItem {
  id: string;
  name: string;
  status: ProductsDocumentStatus;
  sourceBranch: Branch | null;
  destinationBranch: Branch | null;
  productsDocumentProducts: ProductsDocumentProduct[];
  comment: string;
  createdAt: Date;
  createdBy: User;
  updatedAt: Date | null;
  updatedBy: User | null;
}
