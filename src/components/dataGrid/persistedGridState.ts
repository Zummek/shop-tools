export const GRID_STORAGE_PREFIX = 'sm.grid.';

export const gridStorageIds = {
  products: 'products',
  invoices: 'invoices',
  ecommerceOrders: 'ecommerce-orders',
  ecommerceOffers: 'ecommerce-offers',
  priceSchedules: 'price-schedules',
  alerts: 'alerts',
  channelMargin: 'channel-margin',
  allegroPriceSim: 'allegro-price-sim',
  unfulfilledOrders: 'unfulfilled-orders',
  transfers: 'transfers',
  productDocuments: 'product-documents',
  remanents: 'remanents',
  priceTags: 'price-tags',
  supplierOrders: 'supplier-orders',
  suppliers: 'suppliers',
  supplierConditions: 'supplier-conditions',
} as const;

export type PersistedSortItem = {
  field: string;
  sort: 'asc' | 'desc';
};

export type PersistedGridState = {
  v: 1;
  widths: Record<string, number>;
  order: string[];
  hidden: string[];
  sort: PersistedSortItem[] | null;
  ordering: string | null;
};

export type GridStorage = Pick<Storage, 'getItem' | 'setItem'>;

export type ColumnWithWidth = {
  field: string;
  flex?: number;
  width?: number;
};

const LOCKED_COLUMN_FIELDS = new Set(['action', 'actions']);

export const emptyPersistedGridState = (): PersistedGridState => ({
  v: 1,
  widths: {},
  order: [],
  hidden: [],
  sort: null,
  ordering: null,
});

export const gridStorageKey = (id: string) => `${GRID_STORAGE_PREFIX}${id}`;

export const isLockedColumnField = (field: string) =>
  LOCKED_COLUMN_FIELDS.has(field);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const sanitizeWidths = (value: unknown): Record<string, number> => {
  if (!isRecord(value)) return {};
  const widths: Record<string, number> = {};
  for (const [field, width] of Object.entries(value)) {
    if (typeof width !== 'number' || !Number.isFinite(width) || width <= 0)
      continue;
    widths[field] = width;
  }
  return widths;
};

const sanitizeStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  const fields: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string' || !item || fields.includes(item)) continue;
    fields.push(item);
  }
  return fields;
};

export const sanitizeSort = (value: unknown): PersistedSortItem[] | null => {
  if (value == null || !Array.isArray(value)) return null;
  const items: PersistedSortItem[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    if (typeof item.field !== 'string' || !item.field) continue;
    if (item.sort !== 'asc' && item.sort !== 'desc') continue;
    items.push({ field: item.field, sort: item.sort });
  }
  return items;
};

export const parsePersistedGridState = (raw: string | null): PersistedGridState => {
  if (!raw) return emptyPersistedGridState();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return emptyPersistedGridState();
    return {
      v: 1,
      widths: sanitizeWidths(parsed.widths),
      order: sanitizeStringList(parsed.order),
      hidden: sanitizeStringList(parsed.hidden),
      sort: sanitizeSort(parsed.sort),
      ordering: typeof parsed.ordering === 'string' ? parsed.ordering : null,
    };
  } catch {
    return emptyPersistedGridState();
  }
};

export const browserStorage = (): GridStorage | null => {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
};

export const readPersistedGridState = (
  storage: GridStorage | null,
  id: string,
): PersistedGridState => {
  if (!storage) return emptyPersistedGridState();
  try {
    return parsePersistedGridState(storage.getItem(gridStorageKey(id)));
  } catch {
    return emptyPersistedGridState();
  }
};

export const writePersistedGridState = (
  storage: GridStorage | null,
  id: string,
  state: PersistedGridState,
): void => {
  if (!storage) return;
  try {
    storage.setItem(gridStorageKey(id), JSON.stringify({ ...state, v: 1 }));
  } catch {
    // Private mode or a full quota should leave the grid usable.
  }
};

export const patchPersistedGridState = (
  storage: GridStorage | null,
  id: string,
  patch: Partial<Omit<PersistedGridState, 'v'>>,
): PersistedGridState => {
  const next: PersistedGridState = {
    ...readPersistedGridState(storage, id),
    ...patch,
    v: 1,
  };
  writePersistedGridState(storage, id, next);
  return next;
};

export const applyColumnOrder = <T extends { field: string }>(
  columns: readonly T[],
  savedOrder: readonly string[],
): T[] => {
  if (!savedOrder.length) return [...columns];
  const byField = new Map(columns.map((column) => [column.field, column]));
  const savedKnown: string[] = [];
  for (const field of savedOrder) {
    if (!byField.has(field) || savedKnown.includes(field)) continue;
    savedKnown.push(field);
  }
  const placed = new Set(savedKnown);
  const result = savedKnown.map((field) => byField.get(field) as T);
  const defaultFields = columns.map((column) => column.field);

  defaultFields.forEach((field, index) => {
    if (placed.has(field)) return;
    let insertAt = 0;
    for (let previous = index - 1; previous >= 0; previous -= 1) {
      const position = result.findIndex(
        (item) => item.field === defaultFields[previous],
      );
      if (position === -1) continue;
      insertAt = position + 1;
      break;
    }
    result.splice(insertAt, 0, byField.get(field) as T);
    placed.add(field);
  });

  return result;
};

export const applyColumnWidths = <T extends ColumnWithWidth>(
  columns: readonly T[],
  widths: Record<string, number>,
): T[] =>
  columns.map((column) => {
    const width = widths[column.field];
    if (width == null) return column;
    const next = { ...column, width };
    delete next.flex;
    return next;
  });

export const hiddenToVisibilityModel = (
  hidden: readonly string[],
): Record<string, boolean> => {
  const model: Record<string, boolean> = {};
  for (const field of hidden) model[field] = false;
  return model;
};

export const visibilityModelToHidden = (
  model: Record<string, boolean | undefined> | undefined,
): string[] => {
  if (!model) return [];
  return Object.entries(model)
    .filter(([, visible]) => visible === false)
    .map(([field]) => field);
};

export const reorderFields = (
  fields: readonly string[],
  from: string,
  to: string,
): string[] => {
  if (from === to) return [...fields];
  const fromIndex = fields.indexOf(from);
  const toIndex = fields.indexOf(to);
  if (fromIndex === -1 || toIndex === -1) return [...fields];
  const next = [...fields];
  next.splice(fromIndex, 1);
  next.splice(toIndex, 0, from);
  return next;
};

export const reorderKeepingFixed = (
  fields: readonly string[],
  movable: readonly string[],
  from: string,
  to: string,
): string[] => {
  const nextMovable = reorderFields(movable, from, to);
  let index = 0;
  return fields.map((field) => {
    if (!movable.includes(field)) return field;
    const next = nextMovable[index];
    index += 1;
    return next;
  });
};
