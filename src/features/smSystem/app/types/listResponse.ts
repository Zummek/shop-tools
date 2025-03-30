export interface ListResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const EMPTY_LIST_RESPONSE = {
  count: 0,
  next: null,
  previous: null,
  results: []
};