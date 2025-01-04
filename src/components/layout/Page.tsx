import {
  Box,
  Button,
  Container,
  Modal,
  Stack,
  StackProps,
  Typography,
} from '@mui/material';
import { ReactNode, useState } from 'react';

import { Header } from './Header';

interface Props extends StackProps {
  children: ReactNode;
  headerTitle: string;
  onDemoButtonClick?: () => void;
  onButtonClick?: () => void;
  buttonLabel?: string;
}

export const Page = ({
  children,
  headerTitle,
  onDemoButtonClick,
  onButtonClick,
  buttonLabel,
  ...props
}: Props) => {
  const [openWarningModal, setOpenWarningModal] = useState(false);

  const handleDemoButtonClick = () => {
    setOpenWarningModal(false);
    onDemoButtonClick?.();
  };

  return (
    <Container maxWidth="lg">
      <Header />
      <Stack spacing={4} mt={4} {...props}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          width="100%"
        >
          <Typography variant="h3">{headerTitle}</Typography>
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
          {!!onButtonClick && (
            <Button
              variant="outlined"
              color="primary"
              onClick={onButtonClick}
              size="small"
            >
              {buttonLabel}
            </Button>
          )}
        </Box>
        {children}
      </Stack>
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
    </Container>
  );
};
