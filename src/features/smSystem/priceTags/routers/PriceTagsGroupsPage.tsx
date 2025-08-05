import AddIcon from '@mui/icons-material/Add';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Pages } from '../../../../utils';
import { useGetPriceTagGroups, pageSize } from '../api/useGetPriceTagGroups';
import { CreatePriceTagGroup } from '../modals/CreatePriceTagGroup';
import { PriceTagGroupListItem } from '../types';

const columns: GridColDef<PriceTagGroupListItem>[] = [
  { field: 'id', headerName: 'ID' },
  {
    field: 'name',
    headerName: 'Nazwa grupy',
    minWidth: 300,
  },
  {
    field: 'productsCount',
    headerName: 'Ilość produktów',
    align: 'center',
  },
  {
    field: 'action',
    headerName: '',
    headerAlign: 'right',
    align: 'right',
    width: 50,
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

export const PriceTagsGroupsPage = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    priceTagGroups,
    totalCount,
    isLoading,
    phrase,
    setPhrase,
    page,
    setPage,
  } = useGetPriceTagGroups();

  const handlePageChange = (_event: unknown, page: number): void =>
    setPage(page);

  const handleRowClick = (params: GridRowParams) => {
    navigate(`${Pages.smSystemPriceTagsGroups}/${params.id}`);
  };

  return (
    <Stack spacing={4}>
      <Typography variant="h4" component="h1">
        {'Grupy etykiet cenowych'}
      </Typography>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <TextField
          label="Szukaj po nazwie"
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          size="small"
        />
        <Button
          variant="contained"
          endIcon={<AddIcon />}
          onClick={() => setIsModalOpen(true)}
        >
          {'Dodaj grupę'}
        </Button>
      </Box>
      <Box height={500} width="100%">
        <DataGrid
          sx={{
            '& .MuiDataGrid-columnHeaderTitle': {
              whiteSpace: 'normal',
              lineHeight: 'normal',
            },
            '& .MuiDataGrid-cell': {
              display: 'flex',
              alignItems: 'center',
            },
          }}
          rows={priceTagGroups}
          rowCount={totalCount || 0}
          columns={columns}
          pageSizeOptions={[pageSize]}
          loading={isLoading}
          paginationModel={{
            page,
            pageSize,
          }}
          paginationMode="server"
          disableColumnSorting
          disableRowSelectionOnClick
          onRowClick={handleRowClick}
          disableColumnMenu
          style={{
            width: '100%',
          }}
          slotProps={{
            pagination: {
              showFirstButton: true,
              onPageChange: handlePageChange,
            },
          }}
        />
        <CreatePriceTagGroup
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </Box>
    </Stack>
  );
};
