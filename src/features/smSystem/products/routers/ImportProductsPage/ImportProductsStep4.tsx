import { CircularProgress, Stack, Typography } from '@mui/material';
import { useEffect } from 'react';

import { useAppSelector } from '../../../../../hooks';
import { useImportProducts } from '../../api';
import { useGetImportProductsStatus } from '../../api/useGetImportProductsStatus';

export const ImportProductsStep4 = () => {
  const { importProducts, isPending, isError } = useImportProducts();
  const { getImportProductsStatus, importProgress, isLoading } =
    useGetImportProductsStatus();

  const isProcessing =
    isLoading || isPending || importProgress?.status === 'inProgress';

  const { categoryIdsToRemove, productIdsToRemove, productsFile } =
    useAppSelector((state) => state.smImportProducts);

  const importProductProcess = async () => {
    if (!productsFile) return;

    const { processId } = await importProducts({
      productsFile,
      categoryIdsToRemove,
      productIdsToRemove,
    });
    getImportProductsStatus({ processId });
  };

  useEffect(() => {
    importProductProcess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Stack spacing={2} alignItems="center">
      {isProcessing && (
        <>
          <Typography variant="h6">{'Importuję'}</Typography>
          <CircularProgress />
          <Typography>
            {'Proszę czekać, trwa importowanie produktów... Progres: ' +
              importProgress?.progress || 0 + '%'}
          </Typography>
        </>
      )}
      {(isError || importProgress?.status === 'failed') && (
        <Typography variant="h6">{'Wystąpił błąd'}</Typography>
      )}
      {importProgress?.status === 'completed' && (
        <>
          <Typography variant="h6">{'Import zakończony'}</Typography>
          <Typography>{'Produkty zostały zaimportowane pomyślnie'}</Typography>
        </>
      )}
    </Stack>
  );
};
