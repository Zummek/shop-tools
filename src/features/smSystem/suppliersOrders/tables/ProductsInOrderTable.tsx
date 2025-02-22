import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';

import { ProductsInOrderTableProps } from '../types/index';
import '../../../../styles/styles.css';

const ProductsInOrderTable = ({
  products,
  selectedProductLp,
  setSelectedProductLp,
}: ProductsInOrderTableProps) => {
  const columns: GridColDef[] = [
    {
      field: 'lp',
      headerName: 'LP',
      width: 50,
    },
    {
      field: 'name',
      headerName: 'Nazwa produktu',
      width: 200,
    },
    {
      field: 'totalToOrder',
      headerName: 'Suma',
      width: 60,
    },
    {
      field: 'action',
      headerName: '',
      width: 50,
      renderCell: () => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          <ChevronRightIcon style={{ fontSize: 30 }} />
        </div>
      ),
    },
  ];
  const handleRowClick = (params: GridRowParams) => {
    setSelectedProductLp(params.row.lp);
  };

  return (
    <DataGrid
      rows={products}
      columns={columns}
      disableColumnSorting
      disableColumnMenu
      disableRowSelectionOnClick
      onRowClick={handleRowClick}
      hideFooter
      getRowId={(row) => row.lp}
      getRowClassName={(params) =>
        params.row.lp === selectedProductLp ? 'selected-row' : ''
      }
      initialState={{
        sorting: {
          sortModel: [{ field: 'id', sort: 'asc' }],
        },
      }}
    />
  );
};

export default ProductsInOrderTable;
