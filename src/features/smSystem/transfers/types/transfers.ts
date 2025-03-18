import { SimpleBranch } from '../../branches/types';
import { SimpleProduct } from '../../products/types';
import { SimpleUser } from '../../user/types';
import { TransferStatusEnum } from '../utils/transfers';

export interface TransferListItem {
  id: number;
  humanId: number;
  status: TransferStatusEnum;
  comment: string;
  sourceBranch: SimpleBranch;
  destinationBranch: SimpleBranch | null;
  sender: SimpleUser;
  receiver: SimpleUser | null;
  createdAt: string;
  createdBy: SimpleUser;
  updatedAt: string;
  updatedBy: SimpleUser;
  transferProductsAmount: number;
}

export type TransferProduct = {
  product: SimpleProduct;
  toTransferAmount: number | null;
  comment: string;
  receivedAmount: number | null;
  receivedComment: string;
  orderComment: string;
  orderedAmount: number | null;
  remainingOrderedAmount: number | null;
};

export type Transfer = Omit<TransferListItem, 'transferProductsAmount'> & {
  transferProducts: TransferProduct[];
};
