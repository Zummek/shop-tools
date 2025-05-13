import EmailIcon from '@mui/icons-material/Email';
import { LoadingButton } from '@mui/lab';
import { Box, Container, Paper, Stack } from '@mui/material';
import { FormProvider } from 'react-hook-form';

import logo from '../../../../assets/logo/horizontal-blue-black-logo.png';
import {
  ControlledPasswordField,
  ControlledTextField,
} from '../../../../components/inputs';
import { useLoginForm } from '../hooks';

export const LoginPage = () => {
  const { form, onSubmitPress, isSubmitting } = useLoginForm();

  return (
    <Container maxWidth="xs">
      <Paper
        elevation={3}
        sx={{
          p: 8,
          width: '100%',
          borderRadius: 4,
        }}
      >
        <Box mb={8}>
          <img src={logo} alt="logo" style={{ width: '100%' }} />
        </Box>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(() => onSubmitPress())}>
            <Stack spacing={4} mt={4} mb={8}>
              <ControlledTextField
                id="username"
                name="username"
                type="text"
                label="Nazwa użytkownika"
                autoComplete="username"
                autoCapitalize="off"
                margin="normal"
                fullWidth
                alwaysShowLabel
              />
              <ControlledPasswordField
                id="password"
                name="password"
                label="Hasło"
                autoComplete="current-password"
              />
            </Stack>
            <LoadingButton
              type="submit"
              itemType="submit"
              variant="contained"
              fullWidth
              onClick={onSubmitPress}
              loading={isSubmitting}
              startIcon={<EmailIcon />}
              size="large"
            >
              <Box flex={1}>{'Zaloguj się'}</Box>
            </LoadingButton>
          </form>
        </FormProvider>
      </Paper>
    </Container>
  );
};
