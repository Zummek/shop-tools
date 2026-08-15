import { Typography } from '@mui/material';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { useMemo } from 'react';

import { ProductsToOrder } from '../types';
import {
  getStockUrgencyClassName,
  StockUrgencyThresholds,
  stockUrgencyRowSx,
} from '../utils/stockUrgency';

interface Props {
  isLoading: boolean;
  products: ProductsToOrder[];
  selectedProductId: number | null;
  setSelectedProductId: (id: number | null) => void;
  filterText: string;
  disableSelectingProduct?: boolean;
  urgencyThresholds: StockUrgencyThresholds;
}

const columns: GridColDef<ProductsToOrder>[] = [
  {
    field: 'name',
    headerName: 'Nazwa produktu',
    flex: 1,
    minWidth: 250,
    renderCell: (params) => (
      <Typography
        sx={{
          whiteSpace: 'normal',
          lineHeight: 'normal',
          wordBreak: 'break-word',
          alignItems: 'center',
          display: 'flex',
          minHeight: 40,
          py: 1,
        }}
        variant="body2"
      >
        {params.value}
      </Typography>
    ),
  },
  {
    field: 'ordersPerBranch',
    headerName: 'Suma',
    width: 60,
    valueGetter: (value: ProductsToOrder['ordersPerBranch']) =>
      value.reduce((acc, curr) => acc + curr.toOrderAmount, 0),
    renderCell: (params) => (
      <Typography
        variant="body2"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        {params.value}
      </Typography>
    ),
  },
];

const minDaysOfStock = (product: ProductsToOrder): number | null => {
  const values = product.ordersPerBranch
    .map((row) => row.daysOfStock)
    .filter((value): value is number => value != null);
  if (values.length === 0) return null;
  return Math.min(...values);
};

export const ProductsInOrderTable = ({
  isLoading,
  products,
  selectedProductId,
  setSelectedProductId,
  filterText,
  disableSelectingProduct: disabled = false,
  urgencyThresholds,
}: Props) => {
  const sortedProducts = useMemo(
    () =>
      [...products].sort((a, b) => {
        const aDays = minDaysOfStock(a) ?? Number.POSITIVE_INFINITY;
        const bDays = minDaysOfStock(b) ?? Number.POSITIVE_INFINITY;
        return aDays - bDays;
      }),
    [products],
  );

  const handleRowClick = (params: GridRowParams<ProductsToOrder>) => {
    if (!disabled) setSelectedProductId(params.row.id);
  };

  return (
    <DataGrid
      rows={sortedProducts}
      columns={columns}
      loading={isLoading}
      disableColumnSorting
      disableColumnMenu
      disableRowSelectionOnClick
      onRowClick={handleRowClick}
      rowCount={sortedProducts.length}
      hideFooterSelectedRowCount
      pageSizeOptions={[25]}
      filterModel={{
        items: [
          {
            field: 'name',
            operator: 'contains',
            value: filterText,
          },
        ],
      }}
      rowSelectionModel={selectedProductId ? [selectedProductId] : []}
      getRowClassName={(params) =>
        getStockUrgencyClassName(minDaysOfStock(params.row), urgencyThresholds)
      }
      sx={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        '& .MuiDataGrid-row': {
          opacity: disabled ? 0.7 : 1,
        },
        ...stockUrgencyRowSx,
      }}
      localeText={{
        noRowsLabel: 'Brak produktów',
      }}
    />
  );
};
