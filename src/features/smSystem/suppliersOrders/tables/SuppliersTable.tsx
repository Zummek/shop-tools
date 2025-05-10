import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { DataGrid, GridColDef, GridPaginationModel, GridRowParams } from '@mui/x-data-grid';
import { FetchNextPageOptions, InfiniteData, InfiniteQueryObserverResult } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { Pages } from '../../../../utils';
import { GetSuppliersResponse } from '../api/useGetSuppliers';

interface SupppliersTableProps {
  data: InfiniteData<GetSuppliersResponse> | undefined;
  isFetchingNextPage: boolean;
  fetchNextPage: (
    options?: FetchNextPageOptions
  ) => Promise<InfiniteQueryObserverResult<InfiniteData<GetSuppliersResponse>, Error>>;
  page: number;
  setPage: (page: number) => void;
}

export const SuppliersTable = ({
  data,
  isFetchingNextPage,
  fetchNextPage,
  page,
  setPage,
}: SupppliersTableProps) => {
  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      width: 70,
    },
    {
      field: 'name',
      headerName: 'Dostawca',
      width: 400,
    },
    {
      field: 'branchesCount',
      headerName: 'Podpięte sklepy',
      width: 130,
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
  
  const suppliers = data?.pages?.[page]?.results ?? [];
  const rows = suppliers
    .map((supplier) => {
      return {
        id: supplier.id,
        name: supplier.name,
        branchesCount: supplier.branches.length,
    };
  });

  const handleRowClick = (params: GridRowParams) => {
    navigate(`${Pages.smSystemSuppliers}/${params.id}`);
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
        noRowsLabel: 'Brak dostawców',
      }}
    />
  );
};
