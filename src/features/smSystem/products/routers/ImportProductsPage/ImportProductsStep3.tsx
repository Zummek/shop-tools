import { CircularProgress, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

import { useAppSelector } from '../../../../../hooks';
import { useImportProducts } from '../../api';
import { useGetImportProductsStatus } from '../../api/useGetImportProductsStatus';

export const ImportProductsStep3 = () => {
  const [isImporting, setIsImporting] = useState(false);

  const { importProducts, isError } = useImportProducts();
  const { getImportProductsStatus, importProgress } =
    useGetImportProductsStatus();

  const { productIdsToRemove, productsFile, productsImportTaskId } =
    useAppSelector((state) => state.smImportProducts);

  const getImportProductsStatusUntilCompleted = async (processId: number) => {
    setTimeout(async () => {
      const statusData = await getImportProductsStatus({ processId });

      if (statusData?.status === 'IN_PROGRESS')
        getImportProductsStatusUntilCompleted(processId);
      else setIsImporting(false);
    }, 3000);
  };

  const importProductProcess = async () => {
    if (!productsFile || !productsImportTaskId) return;

    setIsImporting(true);

    const { processId } = await importProducts({
      productsImportTaskId,
      notListedProductsIdsToRemove: productIdsToRemove,
    });
    getImportProductsStatusUntilCompleted(processId);
  };

  useEffect(() => {
    importProductProcess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Stack spacing={2} alignItems="center">
      {isImporting && (
        <>
          <Typography variant="h6">{'Importuję produkty...'}</Typography>
          <CircularProgress />
          <Typography>
            {'Proszę czekać, trwa importowanie produktów...'}
          </Typography>
        </>
      )}
      {(isError || importProgress?.status === 'FAILED') && (
        <>
          <Typography variant="h6">{'Wystąpił błąd'}</Typography>
          <Typography variant="h6">{importProgress?.errorMessage}</Typography>
        </>
      )}
      {importProgress?.status === 'COMPLETED' && (
        <>
          <Typography variant="h6">{'Import zakończony'}</Typography>
          <Typography>{'Produkty zostały zaimportowane pomyślnie'}</Typography>
          <Typography variant="body2">
            {`Utworzono ${importProgress?.summary?.productsCreatedAmount} produktów`}
          </Typography>
          <Typography variant="body2">
            {`Zaktualizowano ${importProgress?.summary?.productsUpdatedAmount} produktów`}
          </Typography>
          <Typography variant="body2">
            {`Przywrócono ${importProgress?.summary?.productsReactivatedAmount} produktów`}
          </Typography>
          <Typography variant="body2">
            {`Usunięto ${importProgress?.summary?.productsDeletedAmount} produktów`}
          </Typography>
        </>
      )}
    </Stack>
  );
};
