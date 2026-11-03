import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

import {
  decideWindowScroll,
  scrollRestorationUrl,
  wantsRestoreScroll,
} from './windowScrollRestoration';

const RESTORE_FRAME_LIMIT = 60;

const SCROLL_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'PageUp',
  'PageDown',
  'Home',
  'End',
  ' ',
]);

const maxScrollOffset = (): number =>
  Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

const restoreScrollWhenReady = (
  y: number,
  onDone: () => void,
): (() => void) => {
  let frame = 0;
  let rafId = 0;
  let stopped = false;

  const detach = () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener('wheel', cancel, true);
    window.removeEventListener('touchstart', cancel, true);
    window.removeEventListener('keydown', onKey, true);
  };

  const finish = (apply: boolean) => {
    if (stopped) return;
    stopped = true;
    detach();
    onDone();
    if (!apply) return;
    window.scrollTo(0, Math.min(y, maxScrollOffset()));
  };

  const cancel = () => finish(false);

  const onKey = (event: KeyboardEvent) => {
    if (SCROLL_KEYS.has(event.key)) cancel();
  };

  const tick = () => {
    if (stopped) return;
    const max = maxScrollOffset();
    if (y <= max + 1 || frame >= RESTORE_FRAME_LIMIT) {
      finish(true);
      return;
    }
    frame += 1;
    rafId = requestAnimationFrame(tick);
  };

  if (y <= maxScrollOffset() + 1) {
    finish(true);
    return () => finish(false);
  }

  window.addEventListener('wheel', cancel, { passive: true, capture: true });
  window.addEventListener('touchstart', cancel, {
    passive: true,
    capture: true,
  });
  window.addEventListener('keydown', onKey, true);
  rafId = requestAnimationFrame(tick);
  return cancel;
};

export const useWindowScrollRestoration = (): void => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const positionsByKey = useRef<Record<string, number>>({});
  const positionsByUrl = useRef<Record<string, number>>({});
  const keyRef = useRef<string | null>(null);
  const urlRef = useRef('');
  const restoreLock = useRef(false);
  const cancelRestoreRef = useRef<(() => void) | null>(null);

  const url = scrollRestorationUrl(location.pathname, location.search);
  const restoreScroll = wantsRestoreScroll(location.state);

  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';

    const onScroll = () => {
      if (restoreLock.current) return;
      const y = window.scrollY;
      const key = keyRef.current;
      const savedUrl = urlRef.current;
      if (key) positionsByKey.current[key] = y;
      if (savedUrl) positionsByUrl.current[savedUrl] = y;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.history.scrollRestoration = previous;
    };
  }, []);

  useLayoutEffect(() => {
    cancelRestoreRef.current?.();
    cancelRestoreRef.current = null;
    restoreLock.current = false;

    const decision = decideWindowScroll({
      navigationType,
      locationKey: location.key,
      previousKey: keyRef.current,
      url,
      restoreScroll,
      savedByKey: positionsByKey.current,
      savedByUrl: positionsByUrl.current,
      currentScrollY: window.scrollY,
    });

    if (typeof decision.rememberY === 'number') {
      positionsByKey.current[location.key] = decision.rememberY;
      positionsByUrl.current[url] = decision.rememberY;
    }

    // Point the scroll listener at the new entry before scrollTo, so a reset
    // does not overwrite the page we just left.
    keyRef.current = location.key;
    urlRef.current = url;

    if (decision.action.type === 'top') {
      positionsByKey.current[location.key] = 0;
      positionsByUrl.current[url] = 0;
      window.scrollTo(0, 0);
      return;
    }

    if (decision.action.type !== 'restore') return;

    restoreLock.current = true;
    cancelRestoreRef.current = restoreScrollWhenReady(decision.action.y, () => {
      restoreLock.current = false;
    });

    return () => {
      cancelRestoreRef.current?.();
      cancelRestoreRef.current = null;
      restoreLock.current = false;
    };
  }, [location.key, navigationType, restoreScroll, url]);
};
