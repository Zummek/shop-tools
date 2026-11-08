export const resolveUnfulfilledSort = <TField extends string>(options: {
  urlSortBy: string | null;
  urlSortOrder: string | null;
  urlHasSortBy: boolean;
  urlHasSortOrder: boolean;
  storedField: string | null | undefined;
  storedOrder: string | null | undefined;
  fields: readonly TField[];
  defaultField: TField;
  defaultOrder?: 'asc' | 'desc';
}): { sortBy: TField; sortOrder: 'asc' | 'desc' } => {
  const defaultOrder = options.defaultOrder ?? 'asc';
  const fieldFromUrl = options.fields.includes(options.urlSortBy as TField)
    ? (options.urlSortBy as TField)
    : null;
  const orderFromUrl =
    options.urlSortOrder === 'asc' || options.urlSortOrder === 'desc'
      ? options.urlSortOrder
      : null;
  const urlSpecifiesSort = options.urlHasSortBy || options.urlHasSortOrder;

  if (urlSpecifiesSort) {
    return {
      sortBy: fieldFromUrl ?? options.defaultField,
      sortOrder: orderFromUrl ?? defaultOrder,
    };
  }

  const storedField = options.fields.includes(options.storedField as TField)
    ? (options.storedField as TField)
    : null;
  const storedOrder =
    options.storedOrder === 'asc' || options.storedOrder === 'desc'
      ? options.storedOrder
      : null;

  return {
    sortBy: storedField ?? options.defaultField,
    sortOrder: storedOrder ?? defaultOrder,
  };
};
