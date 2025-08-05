import { RootState } from './store';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Migration = (state: any) => any;
type Migrations = Record<number, Migration>;

export const storeMigrations: Migrations = {
  0: (state: RootState) => state,

  1: (state: RootState): RootState => {
    return { ...state };
  },
};
