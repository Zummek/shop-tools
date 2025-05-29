import { Button, Typography, Stack, Box, ToggleButtonGroup, ToggleButton } from '@mui/material';
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

const getDateMinusDays = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const SelectingBranches = ({ selectedSupplier, onBack }: Props) => {
  const navigate = useNavigate();

  const [selectedBranches, setSelectedBranches] = useState<number[]>([]);
  const [saleDate, setSaleDate] = useState<number>(7);

  const options = [3, 7, 14];

  const { createOrder, isCreating } = useCreateOrder();

  const handleAddOrder = async () => {
    if (selectedSupplier === null || selectedBranches.length === 0) return;
    
    try {
      const id = await createOrder({
        supplierId: selectedSupplier.id,
        selectedBranchesIds: selectedBranches,
        saleStartDate: getDateMinusDays(saleDate),
        saleEndDate: getDateMinusDays(0),
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

      <ToggleButtonGroup
        value={saleDate}
        exclusive
        onChange={(_, newValue) => {
          if (newValue !== null) 
            setSaleDate(newValue);
        }}
        size="small"
        color="primary"
        sx={{ alignSelf: 'center' }}
      >
        {options.map((days) => (
          <ToggleButton key={days} value={days}>
            {days} {'dni'}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>


      <Button variant="contained" onClick={handleAddOrder} loading={isCreating}>
        {'Stwórz zamówienie'}
      </Button>
    </Stack>
  );
};
