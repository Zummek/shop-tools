export type ChannelLinkMatchType = 'SKU' | 'EAN' | 'NONE';
export type ChannelName = 'allegro' | 'woocommerce' | 'erli';

export interface ChannelProductLink {
  id: number;
  channel: ChannelName | string;
  externalOfferId: string;
  externalProductId: string | null;
  sku: string | null;
  ean: string | null;
  marketplace: string | null;
  offerName: string;
  matchType: ChannelLinkMatchType;
  matchStatus: string;
  isActive: boolean;
  price: number | null;
  currency: string | null;
  stockAvailable: number | null;
  stockSold: number | null;
  offerStatus: string | null;
  lastSyncedAt: string | null;
  externalUrl: string | null;
  productId: number | null;
  productName: string | null;
  productInternalId: string | null;
}

export interface ChannelSyncRun {
  id: number;
  channel: string;
  status: 'running' | 'completed' | 'failed' | string;
  startedAt: string;
  finishedAt: string | null;
  offersSeen: number;
  matchedSku: number;
  matchedEan: number;
  unmatched: number;
  errors: number;
  errorMessage: string | null;
}
