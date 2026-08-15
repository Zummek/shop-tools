import { DataGrid, GridColDef } from '@mui/x-data-grid';

import { ProductConditions } from '../types';

interface Props {
  products: ProductConditions[] | undefined;
  isLoading: boolean;
}

const columns: GridColDef[] = [
  {
    field: 'name',
    headerName: 'Produkt',
    flex: 1,
  },
];

export const ProductsInSupplierTable = ({ products, isLoading }: Props) => {
  return (
    <DataGrid
      rows={products ?? []}
      columns={columns}
      loading={isLoading}
      disableColumnSorting
      disableColumnMenu
      disableRowSelectionOnClick
      pageSizeOptions={[25, 50]}
      rowCount={products?.length ?? 0}
      localeText={{
        noRowsLabel: 'Brak produktów',
      }}
      sx={{
        height: 500,
      }}
    />
  );
};
