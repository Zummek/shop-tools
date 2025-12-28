import { LoadingButton } from '@mui/lab';
import {
  Stack,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Paper,
  Chip,
} from '@mui/material';
import { useSearchParams } from 'react-router-dom';

import { LabelData } from '../../../../components';
import {
  useAllegroDisconnect,
  useGetAllegroAuthUrl,
  useGetAllegroConnection,
} from '../api';

export const EcommerceAllegroIntegrationPage = () => {
  const [searchParams] = useSearchParams();
  const isConnectionSuccess = searchParams.get('success') === 'true';
  const isConnectionError = searchParams.get('error') === 'true';

  const { allegroConnection, isLoading } = useGetAllegroConnection();
  const { getAllegroAuthUrl, isPending: isGettingAllegroAuthUrl } =
    useGetAllegroAuthUrl();
  const { disconnectAllegro, isPending: isDisconnectingAllegro } =
    useAllegroDisconnect();

  const isConnected = !!allegroConnection?.isActive;

  const handleGetAllegroAuthUrl = async () => {
    const { data } = await getAllegroAuthUrl();
    window.location.href = data.authorizationUrl;
  };

  return (
    <Stack spacing={4}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="h4" component="h1">
          {'Integracja z Allegro'}
        </Typography>
      </Box>

      {isConnectionSuccess && (
        <Alert severity="success">
          {'Połączenie z Allegro zostało pomyślnie utworzone'}
        </Alert>
      )}
      {isConnectionError && (
        <Alert severity="error">
          {'Wystąpił błąd podczas łączenia z Allegro'}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack spacing={3}>
          <Typography variant="subtitle1" fontWeight={600} color="text.primary">
            {'🔗 Status połączenia'}
          </Typography>

          {isLoading && (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              py={2}
            >
              <CircularProgress />
            </Box>
          )}

          {isConnected && !isLoading && (
            <Stack spacing={3}>
              <Stack
                direction="row"
                flexWrap="wrap"
                gap={4}
                alignItems="flex-start"
              >
                <Stack sx={{ minWidth: 180 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    fontWeight={500}
                  >
                    {'Status'}
                  </Typography>
                  <Chip
                    label="Połączono"
                    color="success"
                    size="small"
                    sx={{ mt: 0.5, width: 'fit-content' }}
                  />
                </Stack>
                <LabelData
                  label="Login Allegro"
                  value={allegroConnection?.allegroUserLogin}
                  minWidth={180}
                />
              </Stack>
              <Box>
                <LoadingButton
                  variant="outlined"
                  color="error"
                  onClick={() => disconnectAllegro()}
                  loading={isDisconnectingAllegro}
                >
                  {'Rozłącz konto'}
                </LoadingButton>
              </Box>
            </Stack>
          )}

          {!isConnected && !isLoading && (
            <Stack spacing={3}>
              <Stack sx={{ minWidth: 180 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  fontWeight={500}
                >
                  {'Status'}
                </Typography>
                <Chip
                  label="Nie połączono"
                  color="warning"
                  size="small"
                  sx={{ mt: 0.5, width: 'fit-content' }}
                />
              </Stack>
              <Box>
                <LoadingButton
                  variant="contained"
                  color="primary"
                  onClick={handleGetAllegroAuthUrl}
                  loading={isGettingAllegroAuthUrl}
                >
                  {'Połącz z Allegro'}
                </LoadingButton>
              </Box>
            </Stack>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
};
