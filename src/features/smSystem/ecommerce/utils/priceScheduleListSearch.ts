export type PriceScheduleEnabledFilter = 'all' | 'enabled' | 'disabled';

export type PriceScheduleListParams = {
  query: string;
  /** Zero-based page of product groups. URL stores it 1-based. */
  page: number;
  scheduleId: number | null;
  /** Whether the schedule is switched on. Absent in the URL means all. */
  status: PriceScheduleEnabledFilter;
  /** Offer already has another enabled schedule. Legacy `with_active=1`. */
  offerHasActive: boolean;
};

const parseStatus = (
  searchParams: URLSearchParams,
): PriceScheduleEnabledFilter => {
  const status = searchParams.get('status');
  if (status === 'enabled' || status === 'disabled') return status;
  // Bookmarks from the old tabs. An explicit status wins.
  const tab = searchParams.get('tab');
  if (tab === 'inactive') return 'disabled';
  if (tab === 'active') return 'enabled';
  return 'all';
};

const parsePage = (searchParams: URLSearchParams): number => {
  const pageParam = searchParams.get('page');
  if (!pageParam) return 0;
  const parsed = Number(pageParam) - 1;
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
};

const parseScheduleId = (searchParams: URLSearchParams): number | null => {
  const raw = searchParams.get('schedule');
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export const parsePriceScheduleListParams = (
  searchParams: URLSearchParams,
): PriceScheduleListParams => ({
  query: searchParams.get('q') ?? '',
  page: parsePage(searchParams),
  scheduleId: parseScheduleId(searchParams),
  status: parseStatus(searchParams),
  offerHasActive: searchParams.get('with_active') === '1',
});

export type ScheduleDeepLinkAction =
  | 'idle'
  | 'wait'
  | 'open'
  | 'clear-filter'
  | 'missing';

export const resolveScheduleDeepLink = (input: {
  scheduleId: number | null;
  isLoading: boolean;
  isPlaceholderData: boolean;
  isFetching: boolean;
  isError: boolean;
  found: boolean;
  hasFilter: boolean;
}): ScheduleDeepLinkAction => {
  if (input.scheduleId == null) return 'idle';
  if (
    input.isLoading ||
    input.isPlaceholderData ||
    input.isFetching ||
    input.isError
  )
    return 'wait';
  if (input.found) return 'open';
  if (input.hasFilter) return 'clear-filter';
  return 'missing';
};

export const applyPriceScheduleListParams = (
  current: URLSearchParams,
  next: Partial<PriceScheduleListParams>,
): URLSearchParams => {
  const params = new URLSearchParams(current);
  const merged: PriceScheduleListParams = {
    ...parsePriceScheduleListParams(params),
    ...next,
  };

  params.delete('tab');

  if (merged.query) params.set('q', merged.query);
  else params.delete('q');

  if (merged.page > 0) params.set('page', String(merged.page + 1));
  else params.delete('page');

  if (merged.scheduleId != null)
    params.set('schedule', String(merged.scheduleId));
  else params.delete('schedule');

  if (merged.status === 'all') params.delete('status');
  else params.set('status', merged.status);

  if (merged.offerHasActive) params.set('with_active', '1');
  else params.delete('with_active');

  return params;
};
