import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';

import { ProductsToOrder } from '../../app/types';

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
  },
  {
    field: 'ordersPerBranch',
    headerName: 'Suma',
    width: 60,
    valueGetter: (value: ProductsToOrder['ordersPerBranch']) =>
      value.reduce((acc, curr) => acc + curr.toOrderAmount, 0),
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
      filterModel={{
        items: [
          {
            field: 'name',
            operator: 'contains',
            value: filterText,
          },
        ],
      }}
      hideFooter
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
