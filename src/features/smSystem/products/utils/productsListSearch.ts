import { parseIsoDateParam } from './salesPeriod';

const FLAG = '1';

export const PRODUCT_LIST_CHANNELS = [
  'allegro',
  'woocommerce',
  'erli',
] as const;

export type ProductListChannel = (typeof PRODUCT_LIST_CHANNELS)[number];

export const SALES_ORDERINGS = ['units', '-units', 'delta', '-delta'] as const;

export type SalesOrdering = (typeof SALES_ORDERINGS)[number];

export const parseSalesOrdering = (
  value: string | null,
): SalesOrdering | null =>
  SALES_ORDERINGS.includes(value as SalesOrdering)
    ? (value as SalesOrdering)
    : null;

export const parseProductListChannels = (
  searchParams: URLSearchParams,
): ProductListChannel[] =>
  PRODUCT_LIST_CHANNELS.filter((channel) =>
    searchParams.getAll('channel').some((value) => value === channel),
  );

export const parseProductsListPage = (
  searchParams: URLSearchParams,
): number => {
  const pageParam = searchParams.get('page');
  if (!pageParam) return 0;
  const parsed = Number(pageParam) - 1;
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
};

export const parseProductsListFilters = (searchParams: URLSearchParams) => {
  const missingPurchaseCost = searchParams.get('missingPurchaseCost') === FLAG;
  return {
    query: searchParams.get('query') ?? '',
    page: parseProductsListPage(searchParams),
    missingPurchaseCost,
    manualUnset:
      missingPurchaseCost && searchParams.get('manualUnset') === FLAG,
    channels: parseProductListChannels(searchParams),
    startDate: parseIsoDateParam(searchParams.get('start_date')),
    endDate: parseIsoDateParam(searchParams.get('end_date')),
    soldOnly: searchParams.get('sold') === FLAG,
    ordering: parseSalesOrdering(searchParams.get('ordering')),
  };
};

export const productsListSearchString = (
  searchParams: URLSearchParams,
): string => {
  const next = new URLSearchParams();
  const query = searchParams.get('query');
  if (query) next.set('query', query);

  const page = parseProductsListPage(searchParams);
  if (page > 0) next.set('page', String(page + 1));

  if (searchParams.get('missingPurchaseCost') === FLAG) {
    next.set('missingPurchaseCost', FLAG);
    if (searchParams.get('manualUnset') === FLAG) next.set('manualUnset', FLAG);
  }

  for (const channel of parseProductListChannels(searchParams))
    next.append('channel', channel);

  const startDate = parseIsoDateParam(searchParams.get('start_date'));
  const endDate = parseIsoDateParam(searchParams.get('end_date'));
  if (startDate && endDate) {
    next.set('start_date', startDate);
    next.set('end_date', endDate);
  }

  if (searchParams.get('sold') === FLAG) next.set('sold', FLAG);

  const ordering = parseSalesOrdering(searchParams.get('ordering'));
  if (ordering) next.set('ordering', ordering);

  const serialized = next.toString();
  return serialized ? `?${serialized}` : '';
};
