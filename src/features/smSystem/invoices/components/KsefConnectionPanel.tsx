import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Link,
  List,
  ListItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { isAxiosError } from 'axios';
import dayjs from 'dayjs';
import { useState } from 'react';

import {
  useConnectKsef,
  useDisconnectKsef,
  useGetKsefConnection,
} from '../api';

const taxpayerAppUrl = (environment: string) => {
  if (environment === 'prod') return 'https://ap.ksef.mf.gov.pl';
  if (environment === 'test') return 'https://ap-test.ksef.mf.gov.pl';
  return 'https://ap-demo.ksef.mf.gov.pl';
};

const environmentLabel = (environment: string) => {
  if (environment === 'prod') return 'produkcyjne';
  if (environment === 'test') return 'testowe';
  return 'przedprodukcyjne (Demo)';
};

const loginMethod = (environment: string) =>
  environment === 'test'
    ? ' przez „Zaloguj uwierzytelnieniem testowym” i podaj fikcyjny NIP.'
    : ' przez login.gov.pl albo certyfikat kwalifikowany, w kontekście NIP firmy.';

const instructionItemSx = { display: 'list-item', py: 0.25, pl: 0.5 };

const KsefSetupInstructions = ({ environment }: { environment: string }) => (
  <Stack spacing={1}>
    {environment !== 'prod' && (
      <Typography variant="body2">
        {
          'Token z innego środowiska nie zadziała. Ten serwer łączy się ze środowiskiem '
        }
        <strong>{environmentLabel(environment)}</strong>
        {'.'}
      </Typography>
    )}
    <List dense disablePadding sx={{ listStyleType: 'decimal', pl: 2.5 }}>
      <ListItem sx={instructionItemSx}>
        <Typography variant="body2">
          {'Zaloguj się do '}
          <Link
            href={taxpayerAppUrl(environment)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {'Aplikacji Podatnika KSeF'}
          </Link>
          {loginMethod(environment)}
        </Typography>
      </ListItem>
      <ListItem sx={instructionItemSx}>
        <Typography variant="body2">
          {'W menu wybierz Tokeny, a potem Generuj token.'}
        </Typography>
      </ListItem>
      <ListItem sx={instructionItemSx}>
        <Typography variant="body2">
          {
            'Nadaj nazwę, na przykład „SM odczyt”, i zaznacz tylko przeglądanie faktur. Nie zaznaczaj wystawiania — to połączenie wyłącznie czyta faktury.'
          }
        </Typography>
      </ListItem>
      <ListItem sx={instructionItemSx}>
        <Typography variant="body2">
          {
            'Kliknij Generuj token i skopiuj ciąg od razu. KSeF pokazuje go tylko raz.'
          }
        </Typography>
      </ListItem>
      <ListItem sx={instructionItemSx}>
        <Typography variant="body2">
          {'Wklej poniżej NIP firmy i token, a potem kliknij Połącz.'}
        </Typography>
      </ListItem>
    </List>
    {environment === 'test' && (
      <Typography variant="body2">
        {
          'Faktura zakupowa pojawi się, gdy inny fikcyjny NIP w tym samym środowisku wystawi fakturę sprzedażową na wpisany tutaj NIP.'
        }
      </Typography>
    )}
  </Stack>
);

const getErrorMessage = (error: unknown): string => {
  if (isAxiosError(error)) {
    const responseError = error.response?.data?.error;
    if (typeof responseError === 'string' && responseError)
      return responseError;
    const nipError = error.response?.data?.nip;
    if (Array.isArray(nipError) && typeof nipError[0] === 'string')
      return nipError[0];
    const tokenError = error.response?.data?.token;
    if (Array.isArray(tokenError) && typeof tokenError[0] === 'string')
      return tokenError[0];
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Nie udało się połączyć z KSeF';
};

export const KsefConnectionPanel = () => {
  const { connection, isLoading, isError } = useGetKsefConnection();
  const { connectKsef, isPending: isConnecting } = useConnectKsef();
  const { disconnectKsef, isPending: isDisconnecting } = useDisconnectKsef();
  const [nip, setNip] = useState('');
  const [token, setToken] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleConnect = async () => {
    setFormError(null);
    try {
      await connectKsef({ nip, token });
      setToken('');
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  const handleDisconnect = async () => {
    setFormError(null);
    try {
      await disconnectKsef();
      setNip('');
      setToken('');
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  if (isLoading) return <CircularProgress size={24} />;
  if (isError || !connection) {
    return (
      <Alert severity="error">{'Nie udało się odczytać połączenia KSeF'}</Alert>
    );
  }

  return (
    <Box>
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h6">{'Połączenie KSeF'}</Typography>
          <Chip size="small" label={connection.environment} />
          {connection.isConnected && (
            <Chip size="small" color="success" label="Połączono" />
          )}
        </Stack>

        {connection.isConnected ? (
          <Stack spacing={1.5}>
            <Typography variant="body2">
              {`NIP ${connection.nip}`}
              {connection.lastAuthAt
                ? ` · ostatnie uwierzytelnienie ${dayjs(connection.lastAuthAt).format('YYYY-MM-DD HH:mm')}`
                : ''}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {
                'Nowe faktury wybierzesz na zakładce Faktury przyciskiem Zaimportuj z KSeF. Lista pokazuje niezaimportowane faktury zakupowe co najmniej z ostatnich 30 dni, a jeśli integracja jest włączona dłużej — od momentu jej włączenia. Zostają na liście, dopóki ich nie wybierzesz. Korekty, zaliczki i faktury już zapisane (także z XML) nie pojawiają się.'
              }
            </Typography>
            {connection.lastError && (
              <Alert severity="warning">{connection.lastError}</Alert>
            )}
            <Box>
              <Button
                variant="outlined"
                color="inherit"
                disabled={isDisconnecting}
                onClick={handleDisconnect}
              >
                {'Rozłącz'}
              </Button>
            </Box>
          </Stack>
        ) : (
          <Stack spacing={1.5}>
            <KsefSetupInstructions environment={connection.environment} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                label="NIP"
                value={nip}
                onChange={(event) => setNip(event.target.value)}
                size="small"
                inputProps={{ inputMode: 'numeric' }}
              />
              <TextField
                label="Token KSeF"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                size="small"
                type="password"
                autoComplete="off"
                sx={{ minWidth: 280 }}
              />
              <Button
                variant="contained"
                disabled={isConnecting || !nip || !token}
                onClick={handleConnect}
              >
                {'Połącz'}
              </Button>
            </Stack>
          </Stack>
        )}

        {formError && <Alert severity="error">{formError}</Alert>}
      </Stack>
    </Box>
  );
};
