import { DataGrid, GridColDef } from '@mui/x-data-grid';

import { useGetProducts } from '../api/useGetProducts';

interface Props {
  selectedProductIds: number[];
}

const columns: GridColDef[] = [
  {
    field: 'name',
    headerName: 'Produkt',
    flex: 1,
  },
];

export const ProductsInSupplierTable = ({ selectedProductIds }: Props) => {
  const { products, isLoading, pagination, setPagination } = useGetProducts();

  return (
    <DataGrid
      rows={products?.results ?? []}
      columns={columns}
      loading={isLoading}
      disableColumnSorting
      disableColumnMenu
      disableRowSelectionOnClick
      isRowSelectable={() => false}
      checkboxSelection
      rowSelectionModel={selectedProductIds}
      pageSizeOptions={[25, 50]}
      paginationModel={pagination}
      onPaginationModelChange={setPagination}
      paginationMode="server"
      rowCount={products?.count ?? 0}
      localeText={{
        noRowsLabel: 'Brak produktów',
      }}
      sx={{
        height: 500,
      }}
    />
  );
};
