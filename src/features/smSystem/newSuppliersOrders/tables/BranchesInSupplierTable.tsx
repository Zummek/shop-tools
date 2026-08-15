import { DataGrid, GridColDef } from '@mui/x-data-grid';

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
  const { branches, pagination, setPagination, isLoading } = useGetBranches();

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
      paginationModel={pagination}
      onPaginationModelChange={setPagination}
      paginationMode="server"
      rowCount={branches?.count ?? 0}
      localeText={{
        noRowsLabel: 'Brak sklepów',
      }}
      sx={{
        height: 500,
      }}
    />
  );
};
