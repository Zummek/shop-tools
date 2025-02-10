import { Box, Button, Stack, Typography } from '@mui/material';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';

import { useAppDispatch, useAppSelector } from '../../../../../hooks';
import { setCategoriesIdsToRemove } from '../../store';
import { ImportCategory } from '../../types';

interface Props {
  onNextStep: () => void;
}

const columns: GridColDef<ImportCategory>[] = [
  { field: 'id', headerName: 'ID', width: 70 },
  { field: 'name', headerName: 'Nazwa', width: 300 },
];

export const ImportProductsStep3 = ({ onNextStep }: Props) => {
  const dispatch = useAppDispatch();

  const { notListedCategories, categoryIdsToRemove } = useAppSelector(
    (state) => state.smImportProducts
  );

  const setCategoriesSelection = (
    selectedCategories: GridRowSelectionModel
  ) => {
    dispatch(setCategoriesIdsToRemove(selectedCategories as string[]));
  };

  return (
    <Stack spacing={2} maxWidth={800}>
      <Typography variant="h6">{'Podsumowanie kategorii'}</Typography>
      <Typography>
        {'Liczba kategorii, które zostaną dodane lub zaktualizowane: ' +
          notListedCategories.length}
      </Typography>
      <Typography>
        {'Kategorie, które nie znajdują się w pliku (' +
          notListedCategories.length +
          ')'}
      </Typography>
      <Typography>
        {
          'Możesz usunąc masowo kategorie, które nie znajdują się w importowanym pliku. Aby to zrobić zaznacz je na liście poniżej.'
        }
      </Typography>
      <Typography variant="h6">
        {notListedCategories.length === 0
          ? 'Brak kategorii do usunięcia'
          : 'Zaznacz kategorie do usunięcia z bazy'}
      </Typography>
      <DataGrid
        rows={notListedCategories}
        columns={columns}
        disableColumnSorting
        disableColumnMenu
        checkboxSelection
        hideFooterPagination
        onRowSelectionModelChange={setCategoriesSelection}
      />
      <Box>
        <Button variant="contained" onClick={onNextStep}>
          {notListedCategories.length > 0 &&
            (categoryIdsToRemove.length
              ? 'Usuń wybrane i przejdź dalej'
              : 'Przejdź dalej')}
          {notListedCategories.length === 0 && 'Przejdź dalej'}
        </Button>
      </Box>
    </Stack>
  );
};
