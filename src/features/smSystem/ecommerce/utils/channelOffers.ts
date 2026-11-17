import type { ChannelProductLink } from '../types/channelLinks';
import type { ChannelPriceSchedule } from '../types/priceSchedules';

// Same groups as ecommerce/offer_status.py, compared without regard to case.
const NOT_LIVE_STATUSES = [
  'ended',
  'trash',
  'archived',
  'inactive',
  'draft',
  'private',
];

export const isEndedChannelOffer = (
  link: Pick<ChannelProductLink, 'offerStatus' | 'isActive'>,
) =>
  NOT_LIVE_STATUSES.includes((link.offerStatus ?? '').trim().toLowerCase()) ||
  !link.isActive;

/** Matches enable_schedule: only ENDED and an inactive link are rejected. */
export const isPriceScheduleOfferEnded = (
  status: string | null | undefined,
) => (status ?? '').trim().toLowerCase() === 'ended';

export const isPriceScheduleOfferClosed = (
  schedule: Pick<ChannelPriceSchedule, 'offerStatus' | 'linkIsActive'>,
) =>
  schedule.linkIsActive === false ||
  isPriceScheduleOfferEnded(schedule.offerStatus);

export const priceScheduleOfferClosedHint = (
  schedule: Pick<ChannelPriceSchedule, 'offerStatus' | 'linkIsActive'>,
) =>
  isPriceScheduleOfferEnded(schedule.offerStatus)
    ? 'Nie można włączyć harmonogramu dla zakończonej oferty. Podepnij go do aktywnej oferty.'
    : 'Nie można włączyć harmonogramu dla nieaktywnej oferty. Podepnij go do aktywnej oferty.';
