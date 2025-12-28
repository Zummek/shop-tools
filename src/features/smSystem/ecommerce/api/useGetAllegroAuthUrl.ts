import { useMutation } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';

interface Response {
  authorizationUrl: string;
}

const endpoint = '/api/v1/ecommerce/allegro/auth-url/';

export const useGetAllegroAuthUrl = () => {
  const { mutateAsync: getAllegroAuthUrl, isPending } = useMutation({
    mutationFn: () => axiosInstance.get<Response>(endpoint),
  });

  return { getAllegroAuthUrl, isPending };
};
