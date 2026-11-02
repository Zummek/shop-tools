import { ChannelProductLink } from '../types/channelLinks';

// Same groups as ecommerce/offer_status.py, compared without regard to case.
const NOT_LIVE_STATUSES = [
  'ended',
  'trash',
  'archived',
  'inactive',
  'draft',
  'private',
];

export const isEndedChannelOffer = (link: ChannelProductLink) =>
  NOT_LIVE_STATUSES.includes((link.offerStatus ?? '').trim().toLowerCase()) ||
  !link.isActive;
