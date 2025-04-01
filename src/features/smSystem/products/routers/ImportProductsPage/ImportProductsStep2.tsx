import { Box, Button, Stack, Typography } from '@mui/material';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import { useEffect } from 'react';

import {
  useAppDispatch,
  useAppSelector,
  useNotify,
} from '../../../../../hooks';
import { usePrepareImportProducts } from '../../api';
import { loadPreparedImport, setProductsIdsToRemove } from '../../store';
import { ImportProductPreparedProduct } from '../../types';

interface Props {
  onNextStep: () => void;
}

const columns: GridColDef<ImportProductPreparedProduct>[] = [
  { field: 'internalId', headerName: 'ID PC-Market', width: 110 },
  { field: 'name', headerName: 'Nazwa', width: 350 },
  {
    field: 'barcodes',
    headerName: 'Kody kreskowe',
    flex: 1,
    valueGetter: (codes: string[]) => codes.join(', '),
  },
];

export const ImportProductsStep2 = ({ onNextStep }: Props) => {
  const dispatch = useAppDispatch();
  const { notify } = useNotify();

  const { isPending, prepareImportProducts } = usePrepareImportProducts();

  const {
    productsFile,
    productsNotListed,
    productsToCreateAmount,
    productsToUpdateAmount,
    productsNotListedAmount,
    productIdsToRemove,
  } = useAppSelector((state) => state.smImportProducts);

  const prepareImport = async () => {
    if (!productsFile) return;

    try {
      const res = await prepareImportProducts({ productsFile });
      if (res.status === 200) {
        dispatch(loadPreparedImport(res.data));
      } else {
        notify(
          'error',
          'Wystąpił błąd podczas importowania produktów: ' + res.data
        );
        // eslint-disable-next-line no-console
        console.error(res.data);
      }
    } catch (error) {
      notify(
        'error',
        'Wystąpił błąd podczas importowania produktów: ' + JSON.stringify(error)
      );
      // eslint-disable-next-line no-console
      console.error(error);
    }
  };

  useEffect(() => {
    prepareImport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setProductsSelection = (selectedProducts: GridRowSelectionModel) => {
    dispatch(setProductsIdsToRemove(selectedProducts.map(Number)));
  };

  return (
    <Stack spacing={2} maxWidth={800}>
      <Typography variant="h6">{'Podsumowanie produktów'}</Typography>
      <Typography>
        {`Liczba produktów, które zostaną dodane: ${productsToCreateAmount}`}
      </Typography>
      <Typography>
        {`Liczba produktów, które zostaną zaktualizowane: ${productsToUpdateAmount}`}
      </Typography>
      <Typography color={productsNotListedAmount > 0 ? 'error' : 'initial'}>
        {`Produkty, które nie znajdują się w pliku: ${productsNotListedAmount}`}
      </Typography>
      <Typography>
        {
          'Możesz usunąc masowo produkty, które nie znajdują się w importowanym pliku. Aby to zrobić zaznacz je na liście poniżej.'
        }
      </Typography>
      <Typography variant="h6">
        {productsNotListedAmount === 0
          ? 'Brak produktów do usunięcia'
          : 'Zaznacz produkty do usunięcia z bazy'}
      </Typography>
      <Box sx={{ height: 500, width: '100%' }}>
        <DataGrid
          rows={productsNotListed}
          columns={columns}
          loading={isPending}
          disableColumnSorting
          disableColumnMenu
          checkboxSelection
          hideFooterPagination
          onRowSelectionModelChange={setProductsSelection}
          sx={{
            '& .MuiDataGrid-columnHeaders': {
              position: 'sticky',
              top: 0,
              zIndex: 1,
              backgroundColor: 'background.paper',
            },
            '& .MuiDataGrid-footerContainer': {
              position: 'sticky',
              bottom: 0,
              zIndex: 1,
              backgroundColor: 'background.paper',
            },
          }}
        />
      </Box>
      <Box>
        <Button
          variant="contained"
          disabled={!productsFile}
          onClick={onNextStep}
        >
          {productsNotListedAmount > 0 &&
            (productIdsToRemove.length
              ? 'Usuń wybrane i przejdź dalej'
              : 'Przejdź dalej')}
          {productsNotListedAmount === 0 && 'Przejdź dalej'}
        </Button>
      </Box>
    </Stack>
  );
};
