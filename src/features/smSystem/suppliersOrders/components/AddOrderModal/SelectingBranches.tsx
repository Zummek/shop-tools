import { Button, Typography, Stack, Box } from '@mui/material';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Pages } from '../../../../../utils';
import { Supplier } from '../../../app/types';
import { useCreateOrder } from '../../api/useCreateOrder';

interface Props {
  selectedSupplier: Supplier;
  onBack: () => void;
}

const columns: GridColDef[] = [
  {
    field: 'name',
    headerName: 'Sklep',
    width: 400,
  },
];

export const SelectingBranches = ({ selectedSupplier, onBack }: Props) => {
  const navigate = useNavigate();

  const [selectedBranches, setSelectedBranches] = useState<number[]>([]);

  const { createOrder, isCreating } = useCreateOrder();

  const handleAddOrder = async () => {
    if (selectedSupplier === null || selectedBranches.length === 0) return;

    try {
      const id = await createOrder({
        supplierId: selectedSupplier.id,
        selectedBranchesIds: selectedBranches,
      });

      if (id) navigate(`${Pages.smSystemOrders}/${id}`);
    } catch (err) {
      console.error('Błąd przy tworzeniu zamówienia', err);
    }
  };

  const handleRowSelectionModelChange = (
    selectedBranchesIds: GridRowSelectionModel
  ) => {
    setSelectedBranches(selectedBranchesIds as number[]);
  };

  return (
    <Stack spacing={2} height={475}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="outlined" onClick={onBack}>
          {'Wstecz'}
        </Button>
        <Typography variant="h6" align="center">
          {'Zaznacz sklepy'}
        </Typography>
        <Button
          variant="outlined"
          onClick={onBack}
          sx={{ opacity: 0 }}
          disabled
        >
          {'Wstecz'}
        </Button>
      </Box>

      <DataGrid
        rows={selectedSupplier.branches}
        columns={columns}
        disableColumnSorting
        disableColumnMenu
        rowSelection
        checkboxSelection
        pagination
        pageSizeOptions={[25]}
        onRowSelectionModelChange={handleRowSelectionModelChange}
        localeText={{
          noRowsLabel: 'Brak sklepów',
        }}
      />

      <Button variant="contained" onClick={handleAddOrder} loading={isCreating}>
        {'Stwórz zamówienie'}
      </Button>
    </Stack>
  );
};
