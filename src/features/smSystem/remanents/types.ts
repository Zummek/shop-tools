import { SimpleBranch } from '../branches/types';

export type RemanentStatus = 'OPEN' | 'CLOSED';

export type RemanentBucket =
  | 'match'
  | 'difference'
  | 'unscanned'
  | 'scanned';

export interface RemanentListItem {
  id: number;
  name: string;
  status: RemanentStatus;
  branch: SimpleBranch;
  openedAt: string;
  closedAt: string | null;
  createdAt: string;
  documentCount: number;
}

export interface RemanentCounts {
  match: number;
  difference: number;
  unscanned: number;
}

export interface RemanentDocumentLink {
  id: number;
  name: string;
  status: string;
  createdAt: string;
  attachedAt: string;
}

export interface RemanentDetails extends RemanentListItem {
  counts: RemanentCounts;
}

export interface RemanentLineSession {
  documentId: number;
  documentName: string;
  amount: string;
}

export interface RemanentLine {
  product: {
    id: number;
    name: string;
    internalId: string;
    barcodes: string[];
  };
  openingStock: string;
  openingStockUpdatedAt: string | null;
  referenceStock: string | null;
  referenceStockUpdatedAt: string | null;
  countedAmount: string | null;
  difference: string | null;
  differenceNow: string | null;
  movement: string | null;
  bucket: RemanentBucket;
  sessions: RemanentLineSession[];
  sessionsSum: string | null;
}
