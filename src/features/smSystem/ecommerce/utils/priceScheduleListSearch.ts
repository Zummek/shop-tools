export type PriceScheduleListTab = 'active' | 'inactive';

export type PriceScheduleListParams = {
  tab: PriceScheduleListTab;
  query: string;
  /** Zero-based DataGrid page. URL stores it 1-based. */
  page: number;
  scheduleId: number | null;
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
  tab: searchParams.get('tab') === 'inactive' ? 'inactive' : 'active',
  query: searchParams.get('q') ?? '',
  page: parsePage(searchParams),
  scheduleId: parseScheduleId(searchParams),
});

export type ScheduleDeepLinkAction =
  | 'idle'
  | 'wait'
  | 'open'
  | 'clear-filter'
  | 'switch-tab'
  | 'missing';

export const resolveScheduleDeepLink = (input: {
  scheduleId: number | null;
  isLoading: boolean;
  isPlaceholderData: boolean;
  isFetching: boolean;
  isError: boolean;
  found: boolean;
  hasQuery: boolean;
  triedOtherTab: boolean;
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
  if (input.hasQuery) return 'clear-filter';
  if (!input.triedOtherTab) return 'switch-tab';
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

  if (merged.tab === 'inactive') params.set('tab', 'inactive');
  else params.delete('tab');

  if (merged.query) params.set('q', merged.query);
  else params.delete('q');

  if (merged.page > 0) params.set('page', String(merged.page + 1));
  else params.delete('page');

  if (merged.scheduleId != null)
    params.set('schedule', String(merged.scheduleId));
  else params.delete('schedule');

  return params;
};
