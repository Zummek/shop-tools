import { LoadingButton } from '@mui/lab';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useNotify } from '../../../../hooks';
import { Pages } from '../../../../utils';
import { useGetBranches } from '../../branches/api';
import { remanentsPageSize, useCreateRemanent, useGetRemanents } from '../api';
import { RemanentStatusChip } from '../components/RemanentStatusChip';
import { RemanentListItem } from '../types';

import { errorMessage } from './errorMessage';

const columns: GridColDef<RemanentListItem>[] = [
  { field: 'name', headerName: 'Nazwa', flex: 1, minWidth: 160 },
  {
    field: 'branch',
    headerName: 'Sklep',
    width: 180,
    valueGetter: (_value, row) => row.branch?.name || '',
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 150,
    renderCell: ({ row }) => <RemanentStatusChip status={row.status} />,
  },
  {
    field: 'openedAt',
    headerName: 'Otwarty',
    width: 160,
    valueFormatter: (value) =>
      value ? dayjs(value).format('DD-MM-YYYY HH:mm') : '',
  },
  {
    field: 'closedAt',
    headerName: 'Zamknięty',
    width: 160,
    valueFormatter: (value) =>
      value ? dayjs(value).format('DD-MM-YYYY HH:mm') : '',
  },
  { field: 'documentCount', headerName: 'Skany', width: 90 },
];

export const RemanentsPage = () => {
  const { notify } = useNotify();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [branchId, setBranchId] = useState<number | ''>('');

  const { remanents, totalCount, isLoading } = useGetRemanents({ page });
  const { branches } = useGetBranches({ defaultPageSize: 100 });
  const { createRemanent, isPending } = useCreateRemanent();

  const openDialog = () => {
    setName('');
    setBranchId('');
    setDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!name.trim() || branchId === '') return;
    try {
      const created = await createRemanent({
        name: name.trim(),
        branchId,
      });
      setDialogOpen(false);
      navigate(`${Pages.smSystemRemanents}/${created.id}`);
    } catch (error) {
      notify('error', errorMessage(error, 'Nie udało się otworzyć remanentu'));
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">{'Remanenty'}</Typography>
        <Button variant="contained" onClick={openDialog}>
          {'Otwórz remanent'}
        </Button>
      </Stack>
      <DataGrid
        rows={remanents}
        columns={columns}
        loading={isLoading}
        rowCount={totalCount}
        paginationMode="server"
        pageSizeOptions={[remanentsPageSize]}
        paginationModel={{ page, pageSize: remanentsPageSize }}
        onPaginationModelChange={(model) => setPage(model.page)}
        disableColumnSorting
        disableColumnMenu
        onRowClick={(params) =>
          navigate(`${Pages.smSystemRemanents}/${params.id}`)
        }
        sx={{ height: 560, cursor: 'pointer' }}
      />
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth>
        <DialogTitle>{'Nowy remanent'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Nazwa"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
            />
            <TextField
              select
              label="Sklep"
              value={branchId}
              onChange={(event) => setBranchId(Number(event.target.value))}
            >
              {(branches?.results ?? []).map((branch) => (
                <MenuItem key={branch.id} value={branch.id}>
                  {branch.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{'Anuluj'}</Button>
          <LoadingButton
            variant="contained"
            loading={isPending}
            disabled={!name.trim() || branchId === ''}
            onClick={handleCreate}
          >
            {'Otwórz'}
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};
