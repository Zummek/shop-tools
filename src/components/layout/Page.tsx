import { Container, Stack, StackProps } from '@mui/material';
import { ReactNode } from 'react';

import { Header } from './Header';

interface Props extends StackProps {
  children: ReactNode;
  headerTitle?: string;
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
  return (
    <Container maxWidth="lg">
      <Header
        headerTitle={headerTitle || ''}
        onButtonClick={onButtonClick}
        buttonLabel={buttonLabel || ''}
        onDemoButtonClick={onDemoButtonClick}
      />
      <Stack spacing={4} mt={4} {...props}>
        {children}
      </Stack>
    </Container>
  );
};
