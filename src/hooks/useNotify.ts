import { useSnackbar, VariantType } from 'notistack';
import { useCallback } from 'react';

export const useNotify = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const notify = useCallback(
    (variant: VariantType, message: string) => {
      const notifyKey = enqueueSnackbar(message, {
        variant,
        autoHideDuration: 5000,
        preventDuplicate: true,
        SnackbarProps: {
          onClick: () => {
            closeSnackbar(notifyKey);
          },
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          'data-test': 'notify-message',
        },
      });
    },
    [closeSnackbar, enqueueSnackbar],
  );

  return { notify };
};
