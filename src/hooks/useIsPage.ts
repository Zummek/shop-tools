import { matchPath, useLocation } from 'react-router-dom';

import { Pages } from '../utils';

export const useIsPage = (page: Pages | Pages[]): boolean => {
  const { pathname } = useLocation();
  const pages = Array.isArray(page) ? page : [page];

  return pages.some((p) => matchPath(p, pathname));
};
