import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { TextField, Typography, Stack } from '@mui/material';
import { DataGrid, GridRowParams, GridColDef } from '@mui/x-data-grid';

import { Supplier } from '../../../app/types';
import { useGetSuppliers } from '../../api/useGetSuppliers';

interface Props {
  onSupplierSelected: (supplier: Supplier) => void;
}

const columns: GridColDef[] = [
  {
    field: 'name',
    headerName: 'Dostawca',
    flex: 1,
  },
  {
    field: 'action',
    headerName: '',
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

export const SelectingSupplier = ({ onSupplierSelected }: Props) => {
  const {
    suppliers: data,
    isLoading,
    handleDebouncedChangeName,
    pagination,
    setPagination,
  } = useGetSuppliers();

  const handleRowClick = (params: GridRowParams<Supplier>) => {
    onSupplierSelected(params.row);
  };

  return (
    <Stack spacing={2} height={491}>
      <Typography variant="h6" align="center">
        {'Wybierz dostawcę'}
      </Typography>

      <TextField
        label="Wyszukaj"
        variant="outlined"
        onChange={handleDebouncedChangeName}
        size="small"
        sx={{ width: '180px' }}
      />

      <DataGrid
        rows={data?.results ?? []}
        columns={columns}
        loading={isLoading}
        disableColumnSorting
        disableColumnMenu
        disableRowSelectionOnClick
        onRowClick={handleRowClick}
        pageSizeOptions={[25, 50]}
        paginationModel={pagination}
        onPaginationModelChange={setPagination}
        paginationMode="server"
        rowCount={data?.count ?? 0}
        localeText={{
          noRowsLabel: 'Brak dostawców',
        }}
      />
    </Stack>
  );
};
