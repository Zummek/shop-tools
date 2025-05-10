import { DataGrid, GridColDef } from '@mui/x-data-grid';
import dayjs from 'dayjs';

import { ProductDetailsInBranchesTableProps } from '../../app/types';

export const ProductDetailsInBranchesTable = ({
  orderDetails,
  selectedProductId,
}: ProductDetailsInBranchesTableProps) => {
  const selectedProduct = orderDetails.productsToOrder.find(
    (product) => product.id === selectedProductId
  );

  const notSelectedBranches = selectedProduct?.notSelectedBranches || [];

  const rows =
    notSelectedBranches.map((branch) => ({
      id: branch.branch.id,
      name: branch.branch.name,
      stock: branch.stock,
      stockUpdatedAt: dayjs(branch.stockUpdatedAt).format('DD.MM.YYYY HH:MM'),
  })) || [];


  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 50 },
    { field: 'name', headerName: 'Sklep', width: 150 },
    { field: 'stock', headerName: 'Stan', width: 70 },
    { field: 'stockUpdatedAt', headerName: 'Ostatnia\naktualizacja\nstanu', width: 150 },
  ];

  return (
    <DataGrid
      rows={rows}
      columns={columns}
      disableColumnSorting
      disableColumnMenu
      disableRowSelectionOnClick
      hideFooter
      initialState={{
        sorting: {
          sortModel: [{ field: 'id', sort: 'asc' }],
        },
      }}
      localeText={{
        noRowsLabel:
          'Wybierz produkt',
      }}
      sx={{
        height: 162,
        '& .MuiDataGrid-columnHeaderTitle': {
          whiteSpace: 'normal',
          lineHeight: 'normal',
        },
        '& .MuiDataGrid-cell': {
          display: 'flex',
          alignItems: 'center',
        },
      }}
    />
  );
};
