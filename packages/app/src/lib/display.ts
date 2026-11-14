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
  /** Play vs AI: on your turn, tap the wall to take your tile instead of it arriving by itself. */
  drawYourself: boolean;
  /** Play vs AI: show the wall being built, the dice and the deal at the start of each hand. */
  showDeal: boolean;
  /** Play: the table in perspective (walls, standing hands). Off = the flat rows view. */
  table3d: boolean;
  /** Play: one plain sentence saying whose turn it is and what to do next. */
  turnGuide: boolean;
}

const DEFAULT: DisplayConfig = { tileMode: 'beginner', tooltips: true, coach: true, money: false, drawYourself: true, showDeal: true, table3d: true, turnGuide: true };
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
