import RefreshIcon from '@mui/icons-material/Refresh';
import { Alert, Button, Snackbar } from '@mui/material';

import { useAppVersionCheck } from '../hooks/useAppVersionCheck';

export const NewVersionNotifier = () => {
  const { hasNewVersion, reload } = useAppVersionCheck();

  return (
    <Snackbar
      open={hasNewVersion}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        severity="info"
        variant="filled"
        icon={<RefreshIcon />}
        onClick={reload}
        sx={{
          alignItems: 'center',
          maxWidth: 360,
          cursor: 'pointer',
        }}
        action={
          <Button
            color="inherit"
            size="small"
            variant="outlined"
            onClick={reload}
          >
            {'Odśwież'}
          </Button>
        }
      >
        {'Dostępna nowa wersja aplikacji. Odśwież stronę, aby wczytać zmiany.'}
      </Alert>
    </Snackbar>
  );
};
