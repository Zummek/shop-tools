import type { GridApi } from '@mui/x-data-grid';
import { RefObject, useLayoutEffect } from 'react';

import { pinDataGridColumnLeft } from './pinDataGridColumn';

const MAX_PIN_ATTEMPTS = 30;

export const usePinDataGridColumn = (
  apiRef: RefObject<GridApi>,
  field: string,
  enabled: boolean,
) => {
  useLayoutEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;
    let attempts = 0;
    let frame = 0;

    const tryPin = () => {
      if (cancelled) return;
      const api = apiRef.current;
      if (api?.setState && api.state?.columns) {
        pinDataGridColumnLeft(api, field);
        return;
      }
      if (attempts >= MAX_PIN_ATTEMPTS) return;
      attempts += 1;
      frame = requestAnimationFrame(tryPin);
    };

    tryPin();
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [apiRef, enabled, field]);
};

export const reportDataGridLayoutSx = {
  '& .MuiDataGrid-columnHeaderTitle': {
    whiteSpace: 'pre-line',
    lineHeight: 1.15,
    textOverflow: 'clip',
  },
  '& .MuiDataGrid-columnHeader--alignRight .MuiDataGrid-columnHeaderTitle': {
    textAlign: 'right',
  },
  '& .MuiDataGrid-virtualScroller--hasScrollX .MuiDataGrid-cell--pinnedLeft, & .MuiDataGrid-virtualScroller--hasScrollX .MuiDataGrid-columnHeader--pinnedLeft':
    {
      boxShadow: '4px 0 6px -2px rgba(0, 0, 0, 0.18)',
    },
};
