// While a game is on screen, a sideways phone gives the whole screen to the table: the app
// header and tab bar hide (CSS, keyed on this attribute + a short landscape viewport).
import { useEffect, useSyncExternalStore } from 'react';

export function useImmersive(on: boolean): void {
  useEffect(() => {
    if (!on) return;
    document.documentElement.dataset.immersive = '1';
    return () => { delete document.documentElement.dataset.immersive; };
  }, [on]);
}

const LANDSCAPE = '(orientation: landscape) and (max-height: 540px)';

function subscribe(cb: () => void) {
  const mq = matchMedia(LANDSCAPE);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

/** A phone held sideways (short landscape viewport). */
export function useLandscape(): boolean {
  return useSyncExternalStore(subscribe, () => matchMedia(LANDSCAPE).matches, () => false);
}
