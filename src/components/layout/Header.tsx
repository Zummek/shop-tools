import { AppBar, Box, Modal, Stack, Toolbar, Typography, Button } from '@mui/material';
import { useState } from 'react';

import { AppSwitcher } from './AppSwitcher';
import { UserMenu } from './UserMenu';

interface Props {
  headerTitle: string;
  onDemoButtonClick?: () => void;
}

export const Header = ({ headerTitle, onDemoButtonClick }: Props) => {
  const [openWarningModal, setOpenWarningModal] = useState(false);

  const handleDemoButtonClick = () => {
    setOpenWarningModal(false);
    onDemoButtonClick?.();
  };

  return (
    <>
      <AppBar
        position="static"
        color="default"
        elevation={0}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          mb: 3,
        }}
      >
        <Toolbar disableGutters sx={{ gap: 2 }}>
          <AppSwitcher />
          <Box sx={{ flexGrow: 1 }} />
          {!!onDemoButtonClick && (
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setOpenWarningModal(true)}
              size="small"
            >
              {'Demo'}
            </Button>
          )}
          <UserMenu />
        </Toolbar>
      </AppBar>

      {headerTitle && (
        <Typography variant="h4" component="h1" mb={2}>
          {headerTitle}
        </Typography>
      )}

      <Modal
        open={openWarningModal}
        onClose={() => setOpenWarningModal(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Stack
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
          }}
          spacing={4}
        >
          <Typography id="modal-modal-title" variant="h6" component="h2">
            {'Załadować demo?'}
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            {
              'Załadowanie demo spowoduje utratę wprowadzonych danych. Czy na pewno chcesz kontynuować?'
            }
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              onClick={() => setOpenWarningModal(false)}
            >
              {'Zamknij'}
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDemoButtonClick}
            >
              {'Załaduj demo'}
            </Button>
          </Stack>
        </Stack>
      </Modal>
    </>
  );
};
