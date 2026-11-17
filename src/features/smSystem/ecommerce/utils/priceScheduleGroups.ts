import type {
  ChannelPriceSchedule,
  PriceScheduleUnscheduledOffer,
} from '../types/priceSchedules';

const isEndedOfferStatus = (status: string | null | undefined) =>
  (status ?? '').trim().toLowerCase() === 'ended';

export const isSchedulableUnscheduledOffer = (
  offer: PriceScheduleUnscheduledOffer,
) =>
  offer.isActive &&
  offer.price != null &&
  !isEndedOfferStatus(offer.offerStatus);

export const foldedUnscheduledOffers = (group: PriceScheduleProductGroup) =>
  group.offersWithoutSchedule.filter(
    (offer) =>
      !isSchedulableUnscheduledOffer(offer) &&
      !isEndedOfferStatus(offer.offerStatus),
  );

const polishCount = (count: number, one: string, few: string, many: string) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (count === 1) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
};

export const foldedUnscheduledOfferLabel = (
  offers: PriceScheduleUnscheduledOffer[],
) => {
  const count = offers.length;
  return `+ ${count} ${polishCount(
    count,
    'oferta bez harmonogramu',
    'oferty bez harmonogramu',
    'ofert bez harmonogramu',
  )}`;
};

export const movableEndedSchedules = (schedules: ChannelPriceSchedule[]) =>
  schedules.filter(
    (schedule) =>
      !schedule.isEnabled &&
      !schedule.isApplied &&
      isEndedOfferStatus(schedule.offerStatus),
  );

export interface PriceScheduleProductGroup {
  /** Stable key: the product id, or "none" for offers without a product. */
  key: string;
  productId: number | null;
  productName: string | null;
  schedules: ChannelPriceSchedule[];
  /** Allegro offers of this product that have no schedule, deduped by link. */
  offersWithoutSchedule: PriceScheduleUnscheduledOffer[];
  appliedCount: number;
  failingCount: number;
  /**
   * Earliest upcoming price change across the group, ISO string.
   * An applied schedule contributes its window end; the others contribute
   * their next window start.
   */
  nextChangeAt: string | null;
}

export const NO_PRODUCT_GROUP_KEY = 'none';

const compareNames = (a: string, b: string) =>
  a.localeCompare(b, 'pl', { sensitivity: 'base', numeric: true });

/** Instant of the next price change, matching the row's "next change" column. */
const nextChangeTime = (schedule: ChannelPriceSchedule): number | null => {
  const iso = schedule.isApplied
    ? schedule.currentWindowEndsAt
    : schedule.nextWindowStartsAt;
  if (!iso) return null;
  const time = Date.parse(iso);
  return Number.isNaN(time) ? null : time;
};

/**
 * One group per product, sorted by product name. Offers without a product
 * form a single group at the end. Rows inside a group are ordered by offer
 * name, then id, so the list does not jump between refetches.
 */
export const groupSchedulesByProduct = (
  schedules: ChannelPriceSchedule[],
): PriceScheduleProductGroup[] => {
  const byKey = new Map<string, PriceScheduleProductGroup>();
  for (const schedule of schedules) {
    const key =
      schedule.productId == null
        ? NO_PRODUCT_GROUP_KEY
        : String(schedule.productId);
    let group = byKey.get(key);
    if (!group) {
      group = {
        key,
        productId: schedule.productId,
        productName: schedule.productName,
        schedules: [],
        offersWithoutSchedule: [],
        appliedCount: 0,
        failingCount: 0,
        nextChangeAt: null,
      };
      byKey.set(key, group);
    }
    group.schedules.push(schedule);
    for (const offer of schedule.productOffersWithoutSchedule ?? []) {
      if (
        group.offersWithoutSchedule.some(
          (existing) => existing.linkId === offer.linkId,
        )
      )
        continue;
      group.offersWithoutSchedule.push(offer);
    }
    if (schedule.isApplied) group.appliedCount += 1;
    if (schedule.consecutiveFailures > 0) group.failingCount += 1;
    const nextTime = nextChangeTime(schedule);
    const nextIso = schedule.isApplied
      ? schedule.currentWindowEndsAt
      : schedule.nextWindowStartsAt;
    if (
      nextTime != null &&
      nextIso &&
      (group.nextChangeAt == null || nextTime < Date.parse(group.nextChangeAt))
    )
      group.nextChangeAt = nextIso;
  }

  const groups = [...byKey.values()];
  for (const group of groups) {
    group.schedules.sort((a, b) => {
      if (a.isEnabled !== b.isEnabled) return a.isEnabled ? -1 : 1;
      return compareNames(a.offerName || '', b.offerName || '') || a.id - b.id;
    });
    group.offersWithoutSchedule.sort((a, b) =>
      compareNames(a.externalOfferId, b.externalOfferId),
    );
  }
  groups.sort((a, b) => {
    if (a.key === NO_PRODUCT_GROUP_KEY) return 1;
    if (b.key === NO_PRODUCT_GROUP_KEY) return -1;
    return (
      compareNames(a.productName || '', b.productName || '') ||
      (a.productId ?? 0) - (b.productId ?? 0)
    );
  });
  return groups;
};

export type PriceScheduleGridRow =
  | { kind: 'product'; id: string; group: PriceScheduleProductGroup }
  | {
      kind: 'schedule';
      id: number;
      groupKey: string;
      schedule: ChannelPriceSchedule;
    }
  | {
      kind: 'offer';
      id: string;
      groupKey: string;
      offer: PriceScheduleUnscheduledOffer;
      neighbor: ChannelPriceSchedule | null;
      moveSources: ChannelPriceSchedule[];
    }
  | {
      kind: 'endedToggle';
      id: string;
      groupKey: string;
      offers: PriceScheduleUnscheduledOffer[];
      expanded: boolean;
    }
  | {
      kind: 'endedOffer';
      id: string;
      groupKey: string;
      offer: PriceScheduleUnscheduledOffer;
    };

export const priceScheduleGridRows = (
  groups: PriceScheduleProductGroup[],
  collapsedKeys: ReadonlySet<string>,
  options?: {
    includeUnscheduledOffers?: boolean;
    expandedEndedKeys?: ReadonlySet<string>;
  },
): PriceScheduleGridRow[] => {
  const includeUnscheduledOffers = options?.includeUnscheduledOffers !== false;
  const expandedEndedKeys = options?.expandedEndedKeys ?? new Set<string>();
  return groups.flatMap((group) => {
    const header: PriceScheduleGridRow = {
      kind: 'product',
      id: `product:${group.key}`,
      group,
    };
    if (collapsedKeys.has(group.key)) return [header];
    const schedules = group.schedules.map(
      (schedule): PriceScheduleGridRow => ({
        kind: 'schedule',
        id: schedule.id,
        groupKey: group.key,
        schedule,
      }),
    );
    if (!includeUnscheduledOffers) return [header, ...schedules];
    const sources = movableEndedSchedules(group.schedules);
    const offerRows: PriceScheduleGridRow[] = group.offersWithoutSchedule
      .filter(isSchedulableUnscheduledOffer)
      .map((offer) => ({
        kind: 'offer' as const,
        id: `offer:${offer.linkId}`,
        groupKey: group.key,
        offer,
        neighbor: group.schedules[0] ?? null,
        moveSources: sources,
      }));
    const folded = foldedUnscheduledOffers(group);
    const expanded = expandedEndedKeys.has(group.key);
    const endedRows: PriceScheduleGridRow[] =
      folded.length === 0
        ? []
        : [
            {
              kind: 'endedToggle',
              id: `ended:${group.key}`,
              groupKey: group.key,
              offers: folded,
              expanded,
            },
            ...(expanded
              ? folded.map(
                  (offer): PriceScheduleGridRow => ({
                    kind: 'endedOffer',
                    id: `ended-offer:${offer.linkId}`,
                    groupKey: group.key,
                    offer,
                  }),
                )
              : []),
          ];
    return [header, ...schedules, ...offerRows, ...endedRows];
  });
};

export const pageOfGroups = <T>(
  groups: T[],
  page: number,
  pageSize: number,
): { rows: T[]; page: number; pageCount: number } => {
  const pageCount = Math.max(1, Math.ceil(groups.length / pageSize));
  const safePage = Math.min(Math.max(page, 0), pageCount - 1);
  return {
    rows: groups.slice(safePage * pageSize, (safePage + 1) * pageSize),
    page: safePage,
    pageCount,
  };
};
