import { Container, Stack, StackProps } from '@mui/material';
import { ReactNode } from 'react';

import { Header } from './Header';

interface Props extends StackProps {
  children: ReactNode;
  headerTitle?: string;
  onDemoButtonClick?: () => void;
}

export const Page = ({
  children,
  headerTitle,
  onDemoButtonClick,
  ...props
}: Props) => {
  return (
    <Container maxWidth="lg">
      <Header
        headerTitle={headerTitle || ''}
        onDemoButtonClick={onDemoButtonClick}
      />
      <Stack spacing={4} mt={4} {...props}>
        {children}
      </Stack>
    </Container>
  );
};
