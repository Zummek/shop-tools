export type GridPinnedColumnFields = {
  left?: string[];
  right?: string[];
};

type PinableGridApi<TState extends { pinnedColumns?: GridPinnedColumnFields }> =
  {
    state: TState;
    setState: (updater: (state: TState) => TState) => unknown;
    resize?: () => void;
  };

export const isColumnPinnedLeft = (
  pinned: GridPinnedColumnFields | undefined,
  field: string,
) =>
  Array.isArray(pinned?.left) &&
  pinned.left.length === 1 &&
  pinned.left[0] === field;

export const nextPinnedColumnsState = (
  field: string,
): { left: string[]; right: string[] } => ({
  left: [field],
  right: [],
});

export const pinDataGridColumnLeft = <
  TState extends { pinnedColumns?: GridPinnedColumnFields },
>(
  api: PinableGridApi<TState>,
  field: string,
) => {
  if (isColumnPinnedLeft(api.state.pinnedColumns, field)) return false;
  api.setState((state) => ({
    ...state,
    pinnedColumns: nextPinnedColumnsState(field),
  }));
  api.resize?.();
  return true;
};

const sameFields = (current: string[] | undefined, next: string[]) =>
  Array.isArray(current) &&
  current.length === next.length &&
  current.every((field, index) => field === next[index]);

/** Community DataGrid has no `pinnedColumns` prop; write the state directly. */
export const pinDataGridColumns = <
  TState extends { pinnedColumns?: GridPinnedColumnFields },
>(
  api: PinableGridApi<TState>,
  pinned: { left: string[]; right: string[] },
) => {
  const current = api.state.pinnedColumns;
  if (
    sameFields(current?.left, pinned.left) &&
    sameFields(current?.right, pinned.right)
  )
    return false;
  api.setState((state) => ({
    ...state,
    pinnedColumns: { left: [...pinned.left], right: [...pinned.right] },
  }));
  api.resize?.();
  return true;
};
