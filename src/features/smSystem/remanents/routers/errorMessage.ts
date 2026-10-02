import { AxiosError } from 'axios';

export const errorMessage = (error: unknown, fallback: string) => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { detail?: string } | undefined;
    if (typeof data?.detail === 'string') return data.detail;
  }
  return fallback;
};
