import { ChannelProductLink } from '../types/channelLinks';

export const isEndedChannelOffer = (link: ChannelProductLink) =>
  link.offerStatus === 'ENDED' ||
  link.offerStatus === 'trash' ||
  link.offerStatus === 'inactive' ||
  !link.isActive;
