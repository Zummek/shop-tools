export interface CurrentUser {
  id: number;
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
}

export interface SimpleUser {
  id: number;
  name: string;
}
