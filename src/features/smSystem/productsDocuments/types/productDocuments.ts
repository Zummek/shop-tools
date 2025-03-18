import { SimpleBranch } from '../../branches/types';
import { SimpleUser } from '../../user/types';

export type ProductsDocumentStatus =
  | 'PREPARING'
  | 'PREPARED'
  | 'POSTED'
  | 'CANCELED';

export interface ProductsDocumentListItem {
  id: string;
  name: string;
  status: ProductsDocumentStatus;
  branch: SimpleBranch | null;
  comment: string;
  documentProductsAmount: number;
  createdAt: Date;
  createdBy: SimpleUser | null;
  updatedAt: Date | null;
  updatedBy: SimpleUser | null;
}
