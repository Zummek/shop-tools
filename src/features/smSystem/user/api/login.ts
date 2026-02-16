import { axiosInstance } from '../../../../services';

interface LoginPayload {
  username: string;
  password: string;
}

interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    pk: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    defaultBranch: {
      id: number;
      name: string;
    };
    permissions?: {
      canAccessEcommerce: boolean;
      canViewPurchasePrices: boolean;
    };
    organization: {
      id: number;
      name: string;
    };
    role: {
      groups: string[];
      isActive: boolean;
    };
  };
}

const endpoint = '/api/v1/auth/login/';

export const login = async ({ username, password }: LoginPayload) => {
  const response = await axiosInstance.post<LoginResponse>(endpoint, {
    username,
    password,
  });

  const { access, refresh, user } = response.data;

  if (!access || !refresh || !user) return null;

  return {
    accessToken: access,
    refreshToken: refresh,
    user: {
      id: user.pk,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      defaultBranch: user.defaultBranch,
      permissions: user.permissions,
      organization: user.organization,
      role: user.role,
    },
  };
};
