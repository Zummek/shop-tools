import { axiosInstance } from '../../../services';

interface LoginPayload {
  companyName: string;
  email: string;
  password: string;
}

interface LoginResponse {
  status: string;
  message: string;
  data:
    | {
        tokenType: string;
        token: string;
      }
    | undefined;
}

export const login = async ({ companyName, password, email }: LoginPayload) => {
  const response = await axiosInstance.post<LoginResponse>('/api/v1/login', {
    companyName,
    email,
    password,
  });

  const accessToken = response.data.data?.token;

  if (!accessToken) return null;

  return { accessToken };
};
