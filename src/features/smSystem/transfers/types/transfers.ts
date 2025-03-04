import { Branch, User } from '../../types/smSystem';

export type TransferStatus =
  | 'PREPARING'
  | 'PREPARED'
  | 'RECEIVED'
  | 'POSTED'
  | 'CANCELED';

interface TransferProduct {
  id: string;
  // orderProduct: OrderProduct | null;
  // transfer?: Transfer;
  // product: any;
  amount: number;
  receivedAmount?: string | null;
  // comment: string;
  // receivedComment?: string | null;
}

export interface TransferListItem {
  id: string;
  date: string;
  status: TransferStatus;
  sourceBranch: Branch | null;
  destinationBranch: Branch | null;
  transferProducts: TransferProduct[];
  comment: string;
  sender: User;
  recipient?: User;
  createdAt: Date;
  createdBy: User;
  updatedAt: Date | null;
  updatedBy: User | null;
}
