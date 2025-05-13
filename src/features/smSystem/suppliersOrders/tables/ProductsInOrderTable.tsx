import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';

import { ProductsToOrder } from '../../app/types';

interface Props {
  isLoading: boolean;
  products: ProductsToOrder[];
  selectedProductId: number | null;
  setSelectedProductId: (id: number | null) => void;
  filterText: string;
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
}: Props) => {
  const handleRowClick = (params: GridRowParams<ProductsToOrder>) => {
    setSelectedProductId(params.row.id);
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
      localeText={{
        noRowsLabel: 'Brak produktów',
      }}
    />
  );
};
