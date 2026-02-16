import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import {
  Alert,
  Button,
  CircularProgress,
  Modal,
  Stack,
  Typography,
} from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { modalStyle } from '../../../../components';
import { VisuallyHiddenInput } from '../../../../components/inputs';
import { getInvoicesQueryKeyBase, useUploadInvoice } from '../api';






interface Props {
  open: boolean;
  onClose: () => void;
}

export const ImportInvoiceModal = ({ open, onClose }: Props) => {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { uploadInvoice, isPending } = useUploadInvoice();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError('Nie wybrano pliku');
      return;
    }

    try {
      await uploadInvoice({ file: selectedFile });
      queryClient.invalidateQueries({
        queryKey: [getInvoicesQueryKeyBase],
      });
      setSelectedFile(null);
      setUploadError(null);
      onClose();
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { error?: string } }; message?: string })
          ?.response?.data?.error ||
        (error as { message?: string })?.message ||
        'Błąd podczas importowania faktury';
      setUploadError(errorMessage);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setUploadError(null);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Stack sx={modalStyle({ width: 600 })} spacing={4}>
        <Typography variant="h4" align="center">
          {'Importuj fakturę'}
        </Typography>

        <Alert severity="info">
          {'Wybierz plik faktury w formacie XML (KSeF) do zaimportowania.'}
        </Alert>

        <Stack spacing={2} alignItems="center">
          <Button
            variant={selectedFile ? 'outlined' : 'contained'}
            component="label"
            startIcon={<CloudUploadIcon />}
            disabled={isPending}
          >
            {selectedFile ? 'Zmień plik' : 'Wybierz plik XML'}
            <VisuallyHiddenInput
              type="file"
              accept=".xml"
              onChange={handleFileChange}
            />
          </Button>

          {selectedFile && (
            <Typography variant="body2" color="text.secondary">
              {'Wybrany plik: '}{selectedFile.name}
            </Typography>
          )}

          {uploadError && (
            <Alert severity="error" sx={{ width: '100%' }}>
              {uploadError}
            </Alert>
          )}
        </Stack>

        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button variant="outlined" onClick={handleClose} disabled={isPending}>
            {'Anuluj'}
          </Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!selectedFile || isPending}
            startIcon={isPending ? <CircularProgress size={20} /> : null}
          >
            {isPending ? 'Importowanie...' : 'Importuj'}
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
};
