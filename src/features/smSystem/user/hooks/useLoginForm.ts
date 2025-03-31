import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import { SubmitErrorHandler, SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';

import { useAppDispatch, useNotify } from '../../../../hooks';
import { login } from '../api';
import { setSession } from '../store';

const formSchema = z.object({
  username: z.string().nonempty(),
  password: z.string().nonempty(),
});

type LoginFormValues = z.infer<typeof formSchema>;

export const useLoginForm = () => {
  const dispatch = useAppDispatch();
  const { notify } = useNotify();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
  });
  const { handleSubmit, formState } = form;

  const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    try {
      const { username, password } = data;
      const response = await login({ username, password });
      if (!response) {
        notify('error', 'Nieprawidłowa nazwa użytkownika lub hasło');
        return;
      }
      dispatch(setSession(response));
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const { response } = err;
        const { username, password, detail } = response?.data || {};
        const knownError = username?.[0] || password?.[0] || detail;

        if (knownError) {
          notify('error', knownError);
          return;
        }

        if (response?.status === 401) {
          notify('error', 'Nieprawidłowa nazwa użytkownika lub hasło');
          return;
        }
      }

      notify('error', 'Wystąpił błąd podczas logowania');
    }
  };

  const onError: SubmitErrorHandler<LoginFormValues> = () => {
    notify('error', 'Wystąpił błąd podczas logowania');
  };

  const onSubmitPress = handleSubmit(onSubmit, onError);

  const isSubmitting = formState.isSubmitting;

  return {
    form,
    onSubmitPress,
    isSubmitting,
  };
};
