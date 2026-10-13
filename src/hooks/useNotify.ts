import { Button } from '@mui/material';
import { useSnackbar, VariantType } from 'notistack';
import { createElement, useCallback } from 'react';

export type NotifyOptions = {
  actionLabel?: string;
  onAction?: () => void;
};

export const useNotify = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const notify = useCallback(
    (variant: VariantType, message: string, options?: NotifyOptions) => {
      const notifyKey = enqueueSnackbar(message, {
        variant,
        autoHideDuration: options?.onAction ? 12000 : 5000,
        preventDuplicate: true,
        action: options?.onAction
          ? (key) =>
              createElement(
                Button,
                {
                  color: 'inherit',
                  size: 'small',
                  onClick: (event: { stopPropagation: () => void }) => {
                    event.stopPropagation();
                    options.onAction?.();
                    closeSnackbar(key);
                  },
                },
                options.actionLabel ?? 'Otwórz',
              )
          : undefined,
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
