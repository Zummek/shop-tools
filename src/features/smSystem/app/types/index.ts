export interface ListResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const EMPTY_LIST_RESPONSE: ListResponse<never> = {
  results: [],
  count: 0,
  next: null,
  previous: null,
};
