import { useAppSelector } from '../../../../hooks';

export const useUserSession = () => {
  const isSessionActive = useAppSelector(
    (state) => !!state.smSystemUser.accessToken
  );

  return {
    isSessionActive,
  };
};
