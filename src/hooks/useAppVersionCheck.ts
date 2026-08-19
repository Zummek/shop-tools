import { useCallback, useEffect, useRef, useState } from 'react';

import { appVersion, isDev } from '../utils';

const CHECK_INTERVAL_MS = 3 * 60 * 1000;

const fetchPublishedVersion = async (): Promise<string | null> => {
  try {
    const response = await fetch(
      `${import.meta.env.BASE_URL}version.json?t=${Date.now()}`,
      { cache: 'no-store' },
    );

    if (!response.ok) return null;

    const data: unknown = await response.json();
    if (
      typeof data === 'object' &&
      data !== null &&
      'version' in data &&
      typeof data.version === 'string'
    )
      return data.version;

    return null;
  } catch {
    return null;
  }
};

export const useAppVersionCheck = () => {
  const [hasNewVersion, setHasNewVersion] = useState(false);
  const hasNewVersionRef = useRef(false);

  const checkVersion = useCallback(async () => {
    if (isDev || hasNewVersionRef.current) return;

    const publishedVersion = await fetchPublishedVersion();
    if (publishedVersion && publishedVersion !== appVersion) {
      hasNewVersionRef.current = true;
      setHasNewVersion(true);
    }
  }, []);

  useEffect(() => {
    if (isDev) return undefined;

    void checkVersion();

    const intervalId = window.setInterval(() => {
      void checkVersion();
    }, CHECK_INTERVAL_MS);

    const onVisible = () => {
      if (document.visibilityState === 'visible') void checkVersion();
    };

    window.addEventListener('focus', onVisible);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', onVisible);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [checkVersion]);

  const reload = useCallback(() => {
    window.location.reload();
  }, []);

  return { hasNewVersion, reload };
};
