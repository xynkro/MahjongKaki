// Display / accessibility preferences (separate from house rules). Persisted to
// localStorage; consumed by TileFace so beginner labels apply everywhere at once.
import { useSyncExternalStore } from 'react';

export type TileMode = 'classic' | 'beginner';
export interface DisplayConfig {
  tileMode: TileMode;
  /** Tap underlined terms (Tai, Shooter…) to see a plain-English definition. */
  tooltips: boolean;
  /** Play vs AI: suggest a throw on your turn, with a one-line reason. */
  coach: boolean;
  /** Show AI-game scores in cents/dollars instead of points. Off by default; never used online. */
  money: boolean;
}

const DEFAULT: DisplayConfig = { tileMode: 'beginner', tooltips: true, coach: true, money: false };
const KEY = 'mk_display';

let cfg: DisplayConfig = load();
const listeners = new Set<() => void>();

function load(): DisplayConfig {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch {
    return DEFAULT;
  }
}
function emit() { listeners.forEach(l => l()); }

export function getDisplay(): DisplayConfig { return cfg; }

export function setDisplay<K extends keyof DisplayConfig>(key: K, value: DisplayConfig[K]): void {
  cfg = { ...cfg, [key]: value };
  try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch { /* ignore */ }
  emit();
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

export function useDisplay(): DisplayConfig {
  return useSyncExternalStore(subscribe, getDisplay, getDisplay);
}
