import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';

import { useGetBranches } from '../../branches/api';

interface Props {
  selectedBranchIds: number[];
  onChangeSelectedBranches: (ids: number[]) => void;
}

const columns: GridColDef[] = [
  {
    field: 'name',
    headerName: 'Sklep',
    flex: 1,
  },
];

export const BranchesInSupplierTable = ({
  selectedBranchIds,
  onChangeSelectedBranches,
}: Props) => {
  const { branches, page, setPage, pageSize, setPageSize, isLoading } =
    useGetBranches();

  const handlePaginationChange = ({ page, pageSize }: GridPaginationModel) => {
    setPage(page + 1);
    setPageSize(pageSize);
  };

  return (
    <DataGrid
      rows={branches?.results ?? []}
      columns={columns}
      loading={isLoading}
      disableColumnSorting
      disableColumnMenu
      disableRowSelectionOnClick
      checkboxSelection
      rowSelectionModel={selectedBranchIds}
      onRowSelectionModelChange={(ids) =>
        onChangeSelectedBranches(ids as number[])
      }
      pagination
      pageSizeOptions={[25, 50]}
      paginationModel={{ page, pageSize }}
      onPaginationModelChange={handlePaginationChange}
      paginationMode="server"
      rowCount={branches?.count}
      localeText={{
        noRowsLabel: 'Brak sklepów',
      }}
      sx={{
        height: 500,
      }}
    />
  );
};
