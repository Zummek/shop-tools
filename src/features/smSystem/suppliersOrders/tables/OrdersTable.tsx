import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';

import { Pages } from '../../../../utils';
import { OrderList } from '../types/index';

const OrdersTable = ({ orders }: { orders: OrderList[] }) => {
  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      width: 50,
    },
    {
      field: 'supplierName',
      headerName: 'Dostawca',
      width: 200,
    },
    {
      field: 'date',
      headerName: 'Data',
      width: 110,
    },
    {
      field: 'branchesNames',
      headerName: 'Wybrane sklepy',
      width: 240,
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

  const navigate = useNavigate();

  const handleRowClick = (params: GridRowParams) => {
    navigate(`${Pages.smSystemOrders}/${params.id}`);
  };

  return (
    <DataGrid
      rows={orders}
      columns={columns}
      disableColumnSorting
      disableColumnMenu
      disableRowSelectionOnClick
      onRowClick={handleRowClick}
      pagination
      initialState={{
        sorting: {
          sortModel: [{ field: 'id', sort: 'desc' }],
        },
        pagination: {
          paginationModel: { pageSize: 5, page: 0 },
        },
      }}
    />
  );
};

export default OrdersTable;
