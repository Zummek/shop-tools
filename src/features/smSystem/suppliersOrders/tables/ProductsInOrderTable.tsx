import { Typography } from '@mui/material';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';

import { ProductsToOrder } from '../types';

interface Props {
  isLoading: boolean;
  products: ProductsToOrder[];
  selectedProductId: number | null;
  setSelectedProductId: (id: number | null) => void;
  filterText: string;
  disableSelectingProduct?: boolean;
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

export const ProductsInOrderTable = ({
  isLoading,
  products,
  selectedProductId,
  setSelectedProductId,
  filterText,
  disableSelectingProduct: disabled = false,
}: Props) => {
  const handleRowClick = (params: GridRowParams<ProductsToOrder>) => {
    if (!disabled) setSelectedProductId(params.row.id);
  };

  return (
    <DataGrid
      rows={products}
      columns={columns}
      loading={isLoading}
      disableColumnSorting
      disableColumnMenu
      disableRowSelectionOnClick
      onRowClick={handleRowClick}
      rowCount={products.length}
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
      sx={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        '& .MuiDataGrid-row': {
          opacity: disabled ? 0.7 : 1,
        },
      }}
      localeText={{
        noRowsLabel: 'Brak produktów',
      }}
    />
  );
};
