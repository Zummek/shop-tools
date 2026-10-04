const FLAG = '1';

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

  const serialized = next.toString();
  return serialized ? `?${serialized}` : '';
};
