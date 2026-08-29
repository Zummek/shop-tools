import type { NavigateOptions } from 'react-router-dom';

type AppNavigate = (to: string, options?: NavigateOptions) => void;

let navigateRef: AppNavigate | null = null;

export const registerAppNavigate = (navigate: AppNavigate) => {
  navigateRef = navigate;
};

export const appNavigate = (to: string, options?: NavigateOptions) => {
  if (navigateRef) {
    navigateRef(to, options);
    return;
  }

  const hashPath = to.startsWith('/') ? to : `/${to}`;
  window.location.hash = `#${hashPath}`;
};
