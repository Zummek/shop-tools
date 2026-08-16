import * as Sentry from '@sentry/react';
import { ReactNode, useEffect } from 'react';

import { useAppSelector } from '../hooks';

interface SentryContextProps {
  children: ReactNode;
}

export const SentryContext = ({ children }: SentryContextProps) => {
  const user = useAppSelector((state) => state.smSystemUser.user);

  useEffect(() => {
    if (user) {
      Sentry.setUser({
        id: user.id.toString(),
      });
    } else {
      Sentry.setUser(null);
    }
  }, [user]);

  return <>{children}</>;
};
