import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';

import { Pages } from '../../../../utils';
import { OrdersList } from '../../app/types/index';

const OrdersTable = ({ orders }: { orders: OrdersList }) => {
  const rows = orders.map((order) => {
    const formatDate = (dateString: string): string => {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();

      return `${day}-${month}-${year}`;
    };

    return {
      id: order.id,
      supplierName: order.supplier.name,
      selectedBranches: order.selected_branches
        .map((branch) => branch.name)
        .join(', '),
      updatedAt: formatDate(order.updated_at),
    };
  });

  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      width: 100,
    },
    {
      field: 'supplierName',
      headerName: 'Dostawca',
      width: 200,
    },
    {
      field: 'selectedBranches',
      headerName: 'Wybrane sklepy',
      width: 350,
    },
    {
      field: 'updatedAt',
      headerName: 'Data utworzenia \n Data modyfikacji',
      width: 180,
      renderHeader: () => (
        <div style={{ whiteSpace: 'pre-line' }}>
          {'Data utworzenia / \n Data modyfikacji'}
        </div>
      ),
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
      rows={rows}
      columns={columns}
      disableColumnSorting
      disableColumnMenu
      disableRowSelectionOnClick
      onRowClick={handleRowClick}
      hideFooter
      initialState={{
        sorting: {
          sortModel: [{ field: 'id', sort: 'desc' }],
        },
      }}
      localeText={{
        noRowsLabel: 'Brak zamówień',
      }}
    />
  );
};

export default OrdersTable;
