import { Box, Button, Stack, Typography } from '@mui/material';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import { useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '../../../../../hooks';
import { usePrepareImportProducts } from '../../api';
import { loadPreparedImport, setProductsIdsToRemove } from '../../store';
import { ImportProduct } from '../../types';

interface Props {
  onNextStep: () => void;
}

const columns: GridColDef<ImportProduct>[] = [
  { field: 'id', headerName: 'ID', width: 70 },
  { field: 'name', headerName: 'Nazwa', width: 200 },
  { field: 'barcode', headerName: 'Kod kreskowy', width: 150 },
];

export const ImportProductsStep2 = ({ onNextStep }: Props) => {
  const dispatch = useAppDispatch();

  const { isPending, prepareImportProducts } = usePrepareImportProducts();

  const {
    productsFile,
    notListedProducts,
    listedProductsAmount,
    productIdsToRemove,
  } = useAppSelector((state) => state.smImportProducts);

  const prepareImport = async () => {
    if (!productsFile) return;

    const res = await prepareImportProducts({ productsFile });
    dispatch(loadPreparedImport(res.data.data));
  };

  useEffect(() => {
    prepareImport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setProductsSelection = (selectedProducts: GridRowSelectionModel) => {
    dispatch(setProductsIdsToRemove(selectedProducts as string[]));
  };

  return (
    <Stack spacing={2} maxWidth={800}>
      <Typography variant="h6">{'Podsumowanie produktów'}</Typography>
      <Typography>
        {'Liczba produktów, które zostaną dodane lub zaktualizowane: ' +
          listedProductsAmount}
      </Typography>
      <Typography>
        {'Produkty, które nie znajdują się w pliku (' +
          notListedProducts.length}
        {')'}
      </Typography>
      <Typography>
        {
          'Możesz usunąc masowo produkty, które nie znajdują się w importowanym pliku. Aby to zrobić zaznacz je na liście poniżej.'
        }
      </Typography>
      <Typography variant="h6">
        {notListedProducts.length === 0
          ? 'Brak produktów do usunięcia'
          : 'Zaznacz produkty do usunięcia z bazy'}
      </Typography>
      <DataGrid
        rows={notListedProducts}
        columns={columns}
        loading={isPending}
        disableColumnSorting
        disableColumnMenu
        checkboxSelection
        hideFooterPagination
        onRowSelectionModelChange={setProductsSelection}
      />
      <Box>
        <Button
          variant="contained"
          disabled={!productsFile}
          onClick={onNextStep}
        >
          {notListedProducts.length > 0 &&
            (productIdsToRemove.length
              ? 'Usuń wybrane i przejdź dalej'
              : 'Przejdź dalej')}
          {notListedProducts.length === 0 && 'Przejdź dalej'}
        </Button>
      </Box>
    </Stack>
  );
};
