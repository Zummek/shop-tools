import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';

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
  const { products, isLoading, page, setPage, setPageSize, pageSize } =
    useGetProducts();

  const handlePaginationChange = ({ page, pageSize }: GridPaginationModel) => {
    setPage(page);
    setPageSize(pageSize);
  };

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
      pagination
      pageSizeOptions={[25, 50]}
      paginationModel={{ page, pageSize }}
      onPaginationModelChange={handlePaginationChange}
      paginationMode="server"
      rowCount={products?.count}
      localeText={{
        noRowsLabel: 'Brak produktów',
      }}
      sx={{
        height: 500,
      }}
    />
  );
};
