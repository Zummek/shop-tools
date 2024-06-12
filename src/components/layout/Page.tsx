import { Container, Stack, StackProps, Typography } from '@mui/material';
import { ReactNode } from 'react';

import { Header } from './Header';

interface Props extends StackProps {
  children: ReactNode;
  headerTitle: string;
}

export const Page = ({ children, headerTitle, ...props }: Props) => {
  return (
    <Container maxWidth="lg">
      <Header />
      <Stack spacing={4} mt={4} {...props}>
        <Typography variant="h3">{headerTitle}</Typography>
        {children}
      </Stack>
    </Container>
  );
};
