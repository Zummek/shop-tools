import { DataGrid, GridColDef } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { useMemo } from 'react';

import { OrderDetails, SimpleBranch } from '../../app/types';

const columns: GridColDef[] = [
  {
    field: 'branch',
    headerName: 'Sklep',
    flex: 1,
    valueGetter: (value: SimpleBranch) => value.name,
  },
  {
    field: 'stock',
    headerName: 'Stan',
    width: 70,
    type: 'number',
  },
  {
    field: 'stockUpdatedAt',
    headerName: 'Ostatnia\naktualizacja\nstanu',
    width: 150,
    valueGetter: (value: string) => dayjs(value).format('DD.MM.YYYY HH:mm'),
  },
];

interface Props {
  orderDetails: OrderDetails | undefined;
  selectedProductId: number | null;
}

export const ProductDetailsInBranchesTable = ({
  orderDetails,
  selectedProductId,
}: Props) => {
  const selectedProduct = useMemo(
    () =>
      orderDetails?.productsToOrder.find(
        (product) => product.id === selectedProductId
      ),
    [orderDetails, selectedProductId]
  );

  return (
    <DataGrid
      rows={selectedProduct?.notSelectedBranches ?? []}
      columns={columns}
      disableColumnSorting
      disableColumnMenu
      disableRowSelectionOnClick
      hideFooter
      getRowId={(row) => row.branch.id}
      initialState={{
        sorting: {
          sortModel: [{ field: 'id', sort: 'asc' }],
        },
      }}
      localeText={{
        noRowsLabel: selectedProductId
          ? 'Brak nie wybranych sklepów'
          : 'Wybierz produkt',
      }}
      sx={{
        height: 250,
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
