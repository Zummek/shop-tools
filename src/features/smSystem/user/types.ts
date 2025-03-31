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
}

export interface SimpleUser {
  id: number;
  name: string;
}
