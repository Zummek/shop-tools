import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  TextField,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  gridClasses,
  GridColumnsManagementProps,
  GridSortModel,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  useGridApiContext,
  useGridApiRef,
  type DataGridProps,
} from '@mui/x-data-grid';
import { plPL } from '@mui/x-data-grid/locales';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  applyColumnOrder,
  applyColumnWidths,
  browserStorage,
  hiddenToVisibilityModel,
  isLockedColumnField,
  patchPersistedGridState,
  readPersistedGridState,
  reorderKeepingFixed,
  sanitizeSort,
  visibilityModelToHidden,
  type PersistedGridState,
} from './persistedGridState';

const DRAG_THRESHOLD_PX = 4;

const BLOCKED_REORDER_TARGET =
  'button, a, input, textarea, select, label, .MuiDataGrid-columnSeparator, .MuiCheckbox-root';

type GridLayoutActions = {
  order: string[];
  hidden: string[];
  resetArrangement: () => void;
};

const GridLayoutContext = createContext<GridLayoutActions | null>(null);

const isReorderBlockedTarget = (target: EventTarget | null) =>
  target instanceof Element && Boolean(target.closest(BLOCKED_REORDER_TARGET));

const ColumnsManagement = ({
  getTogglableColumns,
}: GridColumnsManagementProps) => {
  const apiRef = useGridApiContext();
  const layout = useContext(GridLayoutContext);
  const [search, setSearch] = useState('');
  const [, setRevision] = useState(0);

  useEffect(() => {
    const api = apiRef.current;
    if (!api?.subscribeEvent) return undefined;
    return api.subscribeEvent('columnsChange', () => {
      setRevision((current) => current + 1);
    });
  }, [apiRef]);

  const columns = apiRef.current?.getAllColumns?.() ?? [];
  const togglableFields = getTogglableColumns
    ? new Set(getTogglableColumns(columns))
    : null;
  const query = search.trim().toLowerCase();
  const visibleColumns = columns.filter((column) => {
    if (column.field.startsWith('__')) return false;
    if (isLockedColumnField(column.field)) return false;
    if (togglableFields && !togglableFields.has(column.field)) return false;
    if (!query) return true;
    return (column.headerName || column.field).toLowerCase().includes(query);
  });
  const visibility = apiRef.current?.state?.columns.columnVisibilityModel;
  const hideable = visibleColumns.filter((column) => column.hideable !== false);
  const allVisible = hideable.every(
    (column) => visibility?.[column.field] !== false,
  );
  const allHidden =
    hideable.length > 0 &&
    hideable.every((column) => visibility?.[column.field] === false);
  const resetDisabled = !layout?.hidden.length && !layout?.order.length;

  const toggleColumn = (field: string, isVisible: boolean) => {
    apiRef.current.setColumnVisibility(field, isVisible);
  };

  const toggleAll = (isVisible: boolean) => {
    const model = {
      ...(apiRef.current.state.columns.columnVisibilityModel ?? {}),
    };
    for (const column of hideable) {
      if (isVisible) delete model[column.field];
      else model[column.field] = false;
    }
    apiRef.current.setColumnVisibilityModel(model);
  };

  const text = (
    key:
      | 'columnsManagementSearchTitle'
      | 'columnsManagementNoColumns'
      | 'columnsManagementShowHideAllText'
      | 'columnsManagementReset',
  ) => apiRef.current.getLocaleText(key);

  return (
    <Box sx={{ p: 1.5, width: 280 }}>
      <TextField
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={text('columnsManagementSearchTitle')}
        size="small"
        fullWidth
        autoFocus
      />
      <Box sx={{ maxHeight: 320, overflow: 'auto', mt: 1 }}>
        {visibleColumns.length === 0 ? (
          <Box sx={{ py: 1, color: 'text.secondary', typography: 'body2' }}>
            {text('columnsManagementNoColumns')}
          </Box>
        ) : (
          visibleColumns.map((column) => (
            <FormControlLabel
              key={column.field}
              sx={{ display: 'flex', mx: 0 }}
              control={
                <Checkbox
                  size="small"
                  disabled={column.hideable === false}
                  checked={visibility?.[column.field] !== false}
                  onChange={(event) =>
                    toggleColumn(column.field, event.target.checked)
                  }
                />
              }
              label={column.headerName || column.field}
            />
          ))
        )}
      </Box>
      {hideable.length > 0 ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            mt: 1,
          }}
        >
          <FormControlLabel
            sx={{ mx: 0 }}
            control={
              <Checkbox
                size="small"
                checked={allVisible}
                indeterminate={!allVisible && !allHidden}
                onChange={() => toggleAll(!allVisible)}
              />
            }
            label={text('columnsManagementShowHideAllText')}
          />
          <Button
            size="small"
            disabled={resetDisabled}
            onClick={() => {
              apiRef.current.setColumnVisibilityModel({});
              layout?.resetArrangement();
            }}
          >
            {text('columnsManagementReset')}
          </Button>
        </Box>
      ) : null}
    </Box>
  );
};

const ColumnsToolbar = () => (
  <GridToolbarContainer sx={{ minHeight: 40, px: 1 }}>
    <GridToolbarColumnsButton />
  </GridToolbarContainer>
);

export type PersistedDataGridProps = DataGridProps & {
  storageKey: string;
};

const lockColumns = (columns: readonly GridColDef[]): GridColDef[] =>
  columns.map((column) =>
    isLockedColumnField(column.field) ? { ...column, hideable: false } : column,
  );

export const PersistedDataGrid = ({
  storageKey,
  columns,
  sortModel,
  onSortModelChange,
  onColumnWidthChange,
  onColumnVisibilityModelChange,
  initialState,
  localeText,
  slots,
  slotProps,
  disableColumnSorting,
  apiRef: apiRefProp,
  sx,
  ...rest
}: PersistedDataGridProps) => {
  const ownApiRef = useGridApiRef();
  const apiRef = apiRefProp ?? ownApiRef;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [layout, setLayout] = useState<PersistedGridState>(() =>
    readPersistedGridState(browserStorage(), storageKey),
  );
  const sortControlled = sortModel !== undefined;
  const [uncontrolledSort, setUncontrolledSort] = useState<GridSortModel>(
    () => layout.sort ?? initialState?.sorting?.sortModel ?? [],
  );

  const displayColumns = useMemo(
    () =>
      applyColumnWidths(
        applyColumnOrder(lockColumns(columns), layout.order),
        layout.widths,
      ),
    [columns, layout.order, layout.widths],
  );
  const fieldsRef = useRef<string[]>([]);
  fieldsRef.current = displayColumns.map((column) => column.field);
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  const commit = useCallback(
    (patch: Partial<Omit<PersistedGridState, 'v'>>) => {
      const next = patchPersistedGridState(browserStorage(), storageKey, patch);
      const current = layoutRef.current;
      if (
        JSON.stringify(next.widths) === JSON.stringify(current.widths) &&
        JSON.stringify(next.order) === JSON.stringify(current.order) &&
        JSON.stringify(next.hidden) === JSON.stringify(current.hidden) &&
        JSON.stringify(next.sort) === JSON.stringify(current.sort) &&
        next.ordering === current.ordering
      )
        return next;
      layoutRef.current = next;
      setLayout(next);
      return next;
    },
    [storageKey],
  );

  const resetArrangement = useCallback(() => {
    commit({ hidden: [], order: [] });
  }, [commit]);

  const layoutActions = useMemo<GridLayoutActions>(
    () => ({
      order: layout.order,
      hidden: layout.hidden,
      resetArrangement,
    }),
    [layout.hidden, layout.order, resetArrangement],
  );

  const reorder = useCallback(
    (from: string, to: string) => {
      const root = containerRef.current;
      const pinned = apiRef.current?.state?.pinnedColumns;
      const pinnedFields = new Set([
        ...(pinned?.left ?? []),
        ...(pinned?.right ?? []),
      ]);
      const movable = root
        ? Array.from(
            root.querySelectorAll<HTMLElement>(`.${gridClasses.columnHeader}`),
          )
            .map((header) => header.getAttribute('data-field'))
            .filter((field): field is string => {
              if (!field || field.startsWith('__')) return false;
              return !pinnedFields.has(field);
            })
        : fieldsRef.current.filter((field) => !pinnedFields.has(field));
      commit({
        order: reorderKeepingFixed(fieldsRef.current, movable, from, to),
      });
    },
    [apiRef, commit],
  );
  const reorderRef = useRef(reorder);
  reorderRef.current = reorder;

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return undefined;

    let sourceField: string | null = null;
    let targetField: string | null = null;
    let startX = 0;
    let startY = 0;
    let dragging = false;
    let swallowClick: ((event: MouseEvent) => void) | null = null;
    let swallowTimer = 0;

    const clearSwallow = () => {
      window.clearTimeout(swallowTimer);
      if (!swallowClick) return;
      window.removeEventListener('click', swallowClick, { capture: true });
      swallowClick = null;
    };

    const pinnedFields = () => {
      const pinned = apiRef.current?.state?.pinnedColumns;
      return new Set([...(pinned?.left ?? []), ...(pinned?.right ?? [])]);
    };

    const clearMarks = () => {
      root
        .querySelectorAll('.sm-col-drag-source, .sm-col-drag-target')
        .forEach((node) => {
          node.classList.remove('sm-col-drag-source', 'sm-col-drag-target');
        });
      root
        .querySelector(`.${gridClasses.root}`)
        ?.classList.remove('sm-col-dragging');
    };

    const mark = (field: string | null, className: string) => {
      if (!field) return;
      root
        .querySelector(
          `.${gridClasses.columnHeader}[data-field="${CSS.escape(field)}"]`,
        )
        ?.classList.add(className);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || isReorderBlockedTarget(event.target)) return;
      const header =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>(`.${gridClasses.columnHeader}`)
          : null;
      if (!header || !root.contains(header)) return;
      const field = header.getAttribute('data-field');
      if (!field || field.startsWith('__') || pinnedFields().has(field)) return;
      sourceField = field;
      targetField = null;
      startX = event.clientX;
      startY = event.clientY;
      dragging = false;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!sourceField) return;
      const distance = Math.hypot(
        event.clientX - startX,
        event.clientY - startY,
      );
      if (!dragging && distance < DRAG_THRESHOLD_PX) return;
      if (!dragging) {
        dragging = true;
        root
          .querySelector(`.${gridClasses.root}`)
          ?.classList.add('sm-col-dragging');
        mark(sourceField, 'sm-col-drag-source');
      }
      const under = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest<HTMLElement>(`.${gridClasses.columnHeader}`);
      const field =
        under && root.contains(under) ? under.getAttribute('data-field') : null;
      const nextTarget =
        field && !field.startsWith('__') && !pinnedFields().has(field)
          ? field
          : null;
      if (nextTarget === targetField) return;
      root.querySelectorAll('.sm-col-drag-target').forEach((node) => {
        node.classList.remove('sm-col-drag-target');
      });
      targetField = nextTarget;
      if (targetField && targetField !== sourceField)
        mark(targetField, 'sm-col-drag-target');
    };

    const onPointerUp = () => {
      if (
        dragging &&
        sourceField &&
        targetField &&
        sourceField !== targetField
      ) {
        reorderRef.current(sourceField, targetField);
        clearSwallow();
        const swallow = (clickEvent: MouseEvent) => {
          clickEvent.preventDefault();
          clickEvent.stopPropagation();
          clearSwallow();
        };
        swallowClick = swallow;
        window.addEventListener('click', swallow, { capture: true });
        swallowTimer = window.setTimeout(clearSwallow, 0);
      }
      clearMarks();
      sourceField = null;
      targetField = null;
      dragging = false;
    };

    const gridRoot =
      root.querySelector<HTMLElement>(`.${gridClasses.root}`) ?? root;
    gridRoot.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    return () => {
      gridRoot.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      clearSwallow();
      clearMarks();
    };
  }, [apiRef]);

  const visibilityModel = useMemo(() => {
    const model = hiddenToVisibilityModel(
      layout.hidden.filter((field) => !isLockedColumnField(field)),
    );
    for (const column of columns)
      if (isLockedColumnField(column.field)) model[column.field] = true;
    return model;
  }, [columns, layout.hidden]);

  const handleVisibility: NonNullable<
    DataGridProps['onColumnVisibilityModelChange']
  > = (model, details) => {
    commit({
      hidden: visibilityModelToHidden(model).filter(
        (field) => !isLockedColumnField(field),
      ),
    });
    onColumnVisibilityModelChange?.(model, details);
  };

  const handleWidth: NonNullable<DataGridProps['onColumnWidthChange']> = (
    params,
    event,
    details,
  ) => {
    if (Number.isFinite(params.width) && params.width > 0) {
      const current = readPersistedGridState(browserStorage(), storageKey);
      commit({
        widths: { ...current.widths, [params.colDef.field]: params.width },
      });
    }
    onColumnWidthChange?.(params, event, details);
  };

  const resolvedSort = sortControlled ? sortModel : uncontrolledSort;
  const handleSort: NonNullable<DataGridProps['onSortModelChange']> = (
    model,
    details,
  ) => {
    if (!disableColumnSorting && !sortControlled) {
      const next = sanitizeSort(model) ?? [];
      setUncontrolledSort(next);
      commit({ sort: next });
    }
    onSortModelChange?.(model, details);
  };

  const forwardedInitialState = useMemo(() => {
    if (!initialState?.sorting) return initialState;
    const restState = { ...initialState };
    delete restState.sorting;
    return restState;
  }, [initialState]);

  const togglableColumns = useCallback(
    (columnDefs: GridColDef[]) => {
      const custom = slotProps?.columnsManagement?.getTogglableColumns;
      const fields = custom
        ? custom(columnDefs)
        : columnDefs.map((column) => column.field);
      return fields.filter(
        (field) => !isLockedColumnField(field) && !field.startsWith('__'),
      );
    },
    [slotProps?.columnsManagement?.getTogglableColumns],
  );

  return (
    <GridLayoutContext.Provider value={layoutActions}>
      <Box ref={containerRef} sx={{ display: 'contents' }}>
        <DataGrid
          {...rest}
          apiRef={apiRef}
          columns={displayColumns}
          disableColumnSorting={disableColumnSorting}
          sortModel={disableColumnSorting ? sortModel : resolvedSort}
          onSortModelChange={handleSort}
          columnVisibilityModel={visibilityModel}
          onColumnVisibilityModelChange={handleVisibility}
          onColumnWidthChange={handleWidth}
          initialState={forwardedInitialState}
          localeText={{
            ...plPL.components.MuiDataGrid.defaultProps.localeText,
            ...localeText,
          }}
          slots={{
            ...slots,
            toolbar: ColumnsToolbar,
            columnsManagement: ColumnsManagement,
          }}
          slotProps={{
            ...slotProps,
            columnsManagement: {
              ...slotProps?.columnsManagement,
              getTogglableColumns: togglableColumns,
            },
          }}
          sx={[
            {
              [`& .${gridClasses.columnHeader}.sm-col-drag-source`]: {
                opacity: 0.55,
              },
              [`& .${gridClasses.columnHeader}.sm-col-drag-target`]: {
                boxShadow: (theme) =>
                  `inset 3px 0 0 ${theme.palette.primary.main}`,
              },
              [`&.sm-col-dragging .${gridClasses.columnHeader}`]: {
                cursor: 'grabbing',
              },
            },
            ...(sx == null ? [] : Array.isArray(sx) ? sx : [sx]),
          ]}
        />
      </Box>
    </GridLayoutContext.Provider>
  );
};
