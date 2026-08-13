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
import { useNotify } from '../../../../hooks';
import { getInvoicesQueryKeyBase, useUploadInvoice } from '../api';

interface Props {
  open: boolean;
  onClose: () => void;
}

const MAX_VISIBLE_FILES = 8;

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return (
    (error as { response?: { data?: { error?: string } } })?.response?.data
      ?.error || 'Błąd podczas importowania faktury'
  );
};

export const ImportInvoiceModal = ({ open, onClose }: Props) => {
  const queryClient = useQueryClient();
  const { notify } = useNotify();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  const { uploadInvoice, isPending } = useUploadInvoice();
  const isUploading = isPending || progress !== null;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    setSelectedFiles(files);
    setUploadError(null);
    event.target.value = '';
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setUploadError('Nie wybrano pliku');
      return;
    }

    const total = selectedFiles.length;
    const failures: { file: File; message: string }[] = [];
    let successCount = 0;

    setUploadError(null);
    setProgress({ current: 0, total });

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setProgress({ current: i + 1, total });
        try {
          await uploadInvoice({ file });
          successCount += 1;
        } catch (error: unknown) {
          failures.push({ file, message: getErrorMessage(error) });
        }
      }

      queryClient.invalidateQueries({
        queryKey: [getInvoicesQueryKeyBase],
      });

      if (failures.length === 0) {
        setSelectedFiles([]);
        setUploadError(null);
        notify(
          'success',
          successCount === 1
            ? 'Zaimportowano 1 fakturę'
            : `Zaimportowano ${successCount} faktur`,
        );
        onClose();
        return;
      }

      setSelectedFiles(failures.map((f) => f.file));
      setUploadError(
        failures.map((f) => `${f.file.name}: ${f.message}`).join('\n'),
      );

      if (successCount > 0) {
        notify(
          'warning',
          `Częściowy import: ${successCount} OK, ${failures.length} błędów`,
        );
      } else {
        notify('error', 'Nie udało się zaimportować faktur');
      }
    } finally {
      setProgress(null);
    }
  };

  const handleClose = () => {
    setSelectedFiles([]);
    setUploadError(null);
    setProgress(null);
    onClose();
  };

  const visibleFiles = selectedFiles.slice(0, MAX_VISIBLE_FILES);
  const hiddenCount = selectedFiles.length - visibleFiles.length;

  return (
    <Modal open={open} onClose={handleClose}>
      <Stack sx={modalStyle({ width: 600 })} spacing={4}>
        <Typography variant="h4" align="center">
          {'Importuj faktury'}
        </Typography>

        <Alert severity="info">
          {
            'Wybierz jeden lub więcej plików faktur w formacie XML (KSeF) do zaimportowania.'
          }
        </Alert>

        <Stack spacing={2} alignItems="center">
          <Button
            variant={selectedFiles.length > 0 ? 'outlined' : 'contained'}
            component="label"
            startIcon={<CloudUploadIcon />}
            disabled={isUploading}
          >
            {selectedFiles.length > 0 ? 'Zmień pliki' : 'Wybierz pliki XML'}
            <VisuallyHiddenInput
              type="file"
              accept=".xml"
              multiple
              onChange={handleFileChange}
            />
          </Button>

          {selectedFiles.length > 0 && (
            <Stack spacing={0.5} alignItems="center" sx={{ width: '100%' }}>
              <Typography variant="body2" color="text.secondary">
                {selectedFiles.length === 1
                  ? 'Wybrano 1 plik:'
                  : `Wybrano ${selectedFiles.length} plików:`}
              </Typography>
              {visibleFiles.map((file) => (
                <Typography
                  key={`${file.name}-${file.size}-${file.lastModified}`}
                  variant="body2"
                  color="text.secondary"
                >
                  {file.name}
                </Typography>
              ))}
              {hiddenCount > 0 && (
                <Typography variant="body2" color="text.secondary">
                  {`i ${hiddenCount} więcej`}
                </Typography>
              )}
            </Stack>
          )}

          {uploadError && (
            <Alert
              severity="error"
              sx={{ width: '100%', whiteSpace: 'pre-line' }}
            >
              {uploadError}
            </Alert>
          )}
        </Stack>

        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button
            variant="outlined"
            onClick={handleClose}
            disabled={isUploading}
          >
            {'Anuluj'}
          </Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || isUploading}
            startIcon={isUploading ? <CircularProgress size={20} /> : null}
          >
            {progress
              ? `Importowanie ${progress.current}/${progress.total}...`
              : 'Importuj'}
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
};
