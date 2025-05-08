import { DataGrid, GridColDef } from '@mui/x-data-grid';

import { ProductDetailsInBranchesTableProps } from '../../app/types';

const ProductDetailsInBranchesTable = ({
  orderDetails,
  selectedProductId,
}: ProductDetailsInBranchesTableProps) => {

  const getDate = (rowDate: string) => {
    const dateObj = new Date(rowDate);
    const date = `${dateObj.toLocaleDateString('pl-PL')} ${dateObj.toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })}`;
    return date
  }

  const rows = orderDetails.products_to_order
  .find(product => product.id === selectedProductId)
  ?.not_selected_branches.map(branch => ({
    id: branch.branch.id,
    name: branch.branch.name,
    stock: branch.stock,
    stockUpdatedAt: getDate(branch.stock_updated_at)
  })) || null;


  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 50 },
    { field: 'name', headerName: 'Sklep', width: 150 },
    { field: 'stock', headerName: 'Stan', width: 70 },
    { field: 'stockUpdatedAt', headerName: 'Ostatnia\naktualizacja\nstanu', width: 150 },
  ];

  if (!rows) {
    return (
      <DataGrid
        rows={[]}
        columns={columns}
        disableColumnSorting
        disableColumnMenu
        disableRowSelectionOnClick
        hideFooter
        localeText={{
          noRowsLabel: 'Wybierz produkt',
        }}
        sx={{
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
  }

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
        noRowsLabel: 'Brak dodatkowych sklepów',
      }}
      sx={{
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

export default ProductDetailsInBranchesTable;
