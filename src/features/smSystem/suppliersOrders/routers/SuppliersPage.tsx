import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, FormControl, InputLabel, Stack, TextField } from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridPaginationModel,
  GridRowParams,
} from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';

import { Pages } from '../../../../utils';
import { useGetSuppliers } from '../api/useGetSuppliers';

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
    width: 300,
  },
  {
    field: 'action',
    headerName: '',
    headerAlign: 'right',
    align: 'right',
    flex: 1,
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

  const {
    suppliers,
    isLoading,
    pageSize,
    setPageSize,
    page,
    setPage,
    name,
    setName,
  } = useGetSuppliers();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setName(value);
  };

  const handlePaginationChange = (model: GridPaginationModel) => {
    setPage(model.page + 1);
    setPageSize(model.pageSize);
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

      <DataGrid
        rows={suppliers?.results ?? []}
        loading={isLoading}
        columns={columns}
        disableColumnSorting
        disableColumnMenu
        disableRowSelectionOnClick
        onRowClick={handleRowClick}
        pageSizeOptions={[25, 50]}
        paginationModel={{ page, pageSize }}
        onPaginationModelChange={handlePaginationChange}
        paginationMode="server"
        rowCount={suppliers?.count ?? 0}
        localeText={{
          noRowsLabel: 'Brak dostawców',
        }}
      />
    </Stack>
  );
};
