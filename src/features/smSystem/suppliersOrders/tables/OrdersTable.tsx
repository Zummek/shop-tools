import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { DataGrid, GridColDef, GridPaginationModel, GridRowParams } from '@mui/x-data-grid';
import { FetchNextPageOptions, InfiniteData, InfiniteQueryObserverResult } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

import { Pages } from '../../../../utils';
import { GetOrdersResponse } from '../api/useGetOrders';

export const OrdersTable = ({
  data,
  isFetchingNextPage,
  fetchNextPage,
  page,
  setPage,
}: {
  data: InfiniteData<GetOrdersResponse> | undefined;
  isFetchingNextPage: boolean;
  fetchNextPage: (
    options?: FetchNextPageOptions
  ) => Promise<InfiniteQueryObserverResult<InfiniteData<GetOrdersResponse>, Error>>;
  page: number;
  setPage: (page: number) => void;
}) => {
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
      field: 'createdAt',
      headerName: 'Data utworzenia',
      width: 180,
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
  if (!data) {
    return (
      <DataGrid
        rows={[]}
        columns={columns}
        disableColumnSorting
        disableColumnMenu
        disableRowSelectionOnClick
        pagination
        pageSizeOptions={[5]}
        paginationModel={{ page, pageSize: 5 }}
        localeText={{
          noRowsLabel: 'Brak zamówień',
        }}
      />
    );
  }

  const orders = data?.pages?.[page]?.results ?? [];
  const rows = orders.map((order) => {
    return {
      id: order.id,
      supplierName: order.supplier?.name ?? '–',
      selectedBranches: order.selectedBranches?.map(b => b.name).join(', ') ?? '',
      createdAt: dayjs(order.createdAt).format('DD.MM.YYYY HH:MM'),
    };
  });


  const handleRowClick = (params: GridRowParams) => {
    navigate(`${Pages.smSystemOrders}/${params.id}`);
  };
  
  const handlePaginationChange = (model: GridPaginationModel) => {
    const nextPageIndex = model.page;
  
    const isGoingForward = nextPageIndex > page;
    const pageAlreadyFetched = !!data?.pages?.[nextPageIndex];
  
    const shouldFetchNextPage =
      isGoingForward &&
      !pageAlreadyFetched &&
      !isFetchingNextPage &&
      !!data?.pages?.[page]?.next;
  
    if (shouldFetchNextPage) {
      fetchNextPage().then(() => {
        setPage(nextPageIndex);
      });
    } else {
      setPage(nextPageIndex);
    }
  };
  
  
  return (
    <DataGrid
      rows={rows}
      columns={columns}
      disableColumnSorting
      disableColumnMenu
      disableRowSelectionOnClick
      onRowClick={handleRowClick}
      pagination
      pageSizeOptions={[5]}
      paginationModel={{ page, pageSize: 5 }}
      onPaginationModelChange={handlePaginationChange}
      paginationMode="server"
      rowCount={data?.pages[0].count}
      localeText={{
        noRowsLabel: 'Brak zamówień',
      }}
    />
  );
};
