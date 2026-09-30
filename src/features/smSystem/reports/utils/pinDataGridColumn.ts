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
