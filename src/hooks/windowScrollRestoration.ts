export type HistoryNavigationType = 'POP' | 'PUSH' | 'REPLACE';

export type ScrollAction =
  | { type: 'top' }
  | { type: 'restore'; y: number }
  | { type: 'keep' };

export type DecideWindowScrollInput = {
  navigationType: HistoryNavigationType;
  locationKey: string;
  previousKey: string | null;
  url: string;
  restoreScroll: boolean;
  savedByKey: Readonly<Record<string, number>>;
  savedByUrl: Readonly<Record<string, number>>;
  currentScrollY: number;
};

export type DecideWindowScrollResult = {
  action: ScrollAction;
  /** Scroll to copy onto the new history key before any scrollTo. REPLACE only. */
  rememberY: number | null;
};

export const scrollRestorationUrl = (
  pathname: string,
  search: string,
): string => {
  const params = new URLSearchParams(
    search.startsWith('?') ? search.slice(1) : search,
  );
  const entries = Array.from(params.entries()).sort((left, right) => {
    if (left[0] !== right[0]) return left[0] < right[0] ? -1 : 1;
    if (left[1] === right[1]) return 0;
    return left[1] < right[1] ? -1 : 1;
  });
  const normalized = new URLSearchParams();
  for (const [key, value] of entries) normalized.append(key, value);
  const serialized = normalized.toString();
  return serialized ? `${pathname}?${serialized}` : pathname;
};

export const wantsRestoreScroll = (state: unknown): boolean =>
  typeof state === 'object' &&
  state !== null &&
  'restoreScroll' in state &&
  (state as { restoreScroll?: unknown }).restoreScroll === true;

const savedY = (
  positions: Readonly<Record<string, number>>,
  key: string,
): number | null => {
  const y = positions[key];
  return typeof y === 'number' ? y : null;
};

export const decideWindowScroll = (
  input: DecideWindowScrollInput,
): DecideWindowScrollResult => {
  if (input.navigationType === 'REPLACE') {
    const previousY =
      input.previousKey == null
        ? null
        : savedY(input.savedByKey, input.previousKey);
    return {
      action: { type: 'keep' },
      rememberY: previousY ?? input.currentScrollY,
    };
  }

  if (input.navigationType === 'POP') {
    const y = savedY(input.savedByKey, input.locationKey);
    if (y == null) return { action: { type: 'keep' }, rememberY: null };
    return { action: { type: 'restore', y }, rememberY: null };
  }

  if (input.restoreScroll) {
    const y = savedY(input.savedByUrl, input.url);
    if (y != null) return { action: { type: 'restore', y }, rememberY: null };
  }

  return { action: { type: 'top' }, rememberY: null };
};
