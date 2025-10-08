import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { LoadingButton } from '@mui/lab';
import { Button, Modal, Stack, Typography } from '@mui/material';
import { useState } from 'react';

import { modalStyle, VisuallyHiddenInput } from '../../../../components';
import { useNotify } from '../../../../hooks';
import { useImportEcommerceOrders } from '../api';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const ImportEcommerceOrderModal = ({ open, onClose }: Props) => {
  const { notify } = useNotify();

  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { importEcommerceOrders, isPending } = useImportEcommerceOrders();

  const handleCloseModal = () => {
    onClose();
    setFile(null);
  };

  const handleImportEcommerceOrders = async () => {
    if (!file) {
      setError('Plik jest wymagany');
      return;
    }

    setError(null);

    const { createdOrdersIds, errors } = await importEcommerceOrders({ file });
    const createdOrdersIdsAmount = createdOrdersIds.length;
    const errorsAmount = errors.length;
    notify(
      'success',
      `${createdOrdersIdsAmount} zamówienia zostały zaimportowane`
    );
    if (errorsAmount > 0)
      notify('error', `${errorsAmount} zamówienia nie zostały zaimportowane`);

    handleCloseModal();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFile(file);
  };

  return (
    <Modal open={open} onClose={handleCloseModal}>
      <Stack sx={modalStyle({ width: 400 })} spacing={8}>
        <Typography variant="h4" align="center">
          {'Zaimportuj zamówienia'}
        </Typography>
        <Stack spacing={2} alignItems="center">
          <Typography variant="body1">{'Wybierz plik zamówień'}</Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              variant={file?.name ? 'outlined' : 'contained'}
              color="primary"
              component="label"
              role={undefined}
              tabIndex={-1}
              startIcon={<CloudUploadIcon />}
              sx={{ whiteSpace: 'nowrap' }}
              disabled={isPending}
            >
              {file?.name ? 'Zmień plik' : 'Wybierz plik'}
              <VisuallyHiddenInput type="file" onChange={handleFileChange} />
            </Button>
            {file?.name && (
              <Typography variant="body1">
                {'Wybrany plik: '}
                {file?.name}
              </Typography>
            )}
          </Stack>
        </Stack>
        {error && (
          <Typography variant="body1" color="error">
            {error}
          </Typography>
        )}
        <LoadingButton
          variant="contained"
          endIcon={<AddIcon />}
          onClick={handleImportEcommerceOrders}
          loading={isPending}
        >
          {'Zaimportuj'}
        </LoadingButton>
      </Stack>
    </Modal>
  );
};
