import { Checkbox } from '@mui/material';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { FetchNextPageOptions, InfiniteData, InfiniteQueryObserverResult } from '@tanstack/react-query';

import { GetBranchesResponse } from '../api/useGetBranches';

const BranchesInSupplierTable = ({
  data,
  isFetchingNextPage,
  fetchNextPage,
  page,
  setPage,
  selectedBranches,
  handleCheckboxChange,
}: {
  data: InfiniteData<GetBranchesResponse> | undefined;
  isFetchingNextPage: boolean;
  fetchNextPage: (
    options?: FetchNextPageOptions
  ) => Promise<InfiniteQueryObserverResult<InfiniteData<GetBranchesResponse>, Error>>;
  page: number;
  setPage: (page: number) => void;
  selectedBranches: number[];
  handleCheckboxChange: (id: number) => void;
}) => {
  
  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      width: 70,
    },
    {
      field: 'name',
      headerName: 'Sklep',
      width: 400,
    },
    {
      field: 'actionSelect',
      headerName: '',
      width: 50,
      renderCell: ({ row }: { row: {id: number, name: string} }) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          <Checkbox
            checked={selectedBranches.includes(row.id)}
            onChange={() => handleCheckboxChange(row.id)}
            style={{ fontSize: 50 }}
          />
        </div>
      ),
    },
  ];

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
          noRowsLabel: 'Brak sklepów',
        }}
      />
    );
  }

  const branches = data?.pages?.[page]?.results ?? [];
  const rows = branches.map((branch) => {
    return {
      id: branch.id,
      name: branch.name,
    };
  });

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
      pagination
      pageSizeOptions={[5]}
      paginationModel={{ page, pageSize: 5 }}
      onPaginationModelChange={handlePaginationChange}
      paginationMode="server"
      rowCount={data?.pages[0].count}
      localeText={{
        noRowsLabel: 'Brak sklepów',
      }}
    />
  );
};

export default BranchesInSupplierTable;
