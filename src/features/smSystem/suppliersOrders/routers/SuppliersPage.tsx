import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, FormControl, InputLabel, Stack, TextField } from '@mui/material';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';

import { Pages } from '../../../../utils';
import { useGetSuppliers } from '../api';
import { Supplier } from '../types';

const columns: GridColDef<Supplier>[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 70,
  },
  {
    field: 'name',
    headerName: 'Dostawca',
    width: 400,
    flex: 1,
  },
  {
    field: 'branches',
    headerName: 'Podpięte sklepy',
    minWidth: 130,
    type: 'number',
    valueGetter: (value: Supplier['branches']) => value.length,
  },
  {
    field: 'action',
    headerName: '',
    headerAlign: 'right',
    align: 'right',
    renderCell: () => (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          height: '100%',
        }}
      >
        <ChevronRightIcon style={{ fontSize: 30 }} />
      </Box>
    ),
  },
];

export const SuppliersPage = () => {
  const navigate = useNavigate();

  const { suppliers, isLoading, pagination, setPagination, name, setName } =
    useGetSuppliers();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setName(value);
  };

  const handleRowClick = (params: GridRowParams) => {
    navigate(`${Pages.smSystemSuppliers}/${params.id}`);
  };

  return (
    <Stack spacing={2}>
      <FormControl sx={{ width: 300 }}>
        <InputLabel shrink>{'Wyszukaj'}</InputLabel>
        <TextField
          placeholder="Nazwa dostawcy"
          value={name}
          onChange={handleChange}
        />
      </FormControl>

      <Box height={500}>
        <DataGrid
          rows={suppliers?.results ?? []}
          loading={isLoading}
          columns={columns}
          disableColumnSorting
          disableColumnMenu
          disableRowSelectionOnClick
          onRowClick={handleRowClick}
          pageSizeOptions={[25, 50]}
          paginationModel={pagination}
          onPaginationModelChange={setPagination}
          paginationMode="server"
          rowCount={suppliers?.count ?? 0}
          localeText={{
            noRowsLabel: 'Brak dostawców',
          }}
        />
      </Box>
    </Stack>
  );
};
