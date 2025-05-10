import SettingsIcon from '@mui/icons-material/Settings';
import { Checkbox } from '@mui/material';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { FetchNextPageOptions, InfiniteData, InfiniteQueryObserverResult } from '@tanstack/react-query';

import { GetProductsResponse } from '../api/useGetProducts';

export const ProductsInSupplierTable = ({
  data,
  isFetchingNextPage,
  fetchNextPage,
  page,
  setPage,
  selectedProducts,
  handleCheckboxChange,
}: {
  data: InfiniteData<GetProductsResponse> | undefined;
  isFetchingNextPage: boolean;
  fetchNextPage: (
    options?: FetchNextPageOptions
  ) => Promise<InfiniteQueryObserverResult<InfiniteData<GetProductsResponse>, Error>>;
  page: number;
  setPage: (page: number) => void;
  selectedProducts: number[];
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
      headerName: 'Produkt',
      width: 350,
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
            checked={selectedProducts.includes(row.id)}
            onChange={() => handleCheckboxChange(row.id)}
            style={{ fontSize: 50 }}
          />
        </div>
      ),
    },
    {
      field: 'actionSettings',
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
          <SettingsIcon style={{ fontSize: 25 }} />
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
          noRowsLabel: 'Brak produktów',
        }}
      />
    );
  }

  const products = data?.pages?.[page]?.results ?? [];
  const rows = products.map((product) => {
    return {
      id: product.id,
      name: product.name,
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
        noRowsLabel: 'Brak produktów',
      }}
    />
  );
};
