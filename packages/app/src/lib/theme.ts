// Jade Night (default) or Daylight. The choice lives on <html data-theme>, so CSS tokens do the rest.
import { useSyncExternalStore } from 'react';

export type Theme = 'jade' | 'daylight';
const KEY = 'mk_theme';
const listeners = new Set<() => void>();

function read(): Theme {
  try { return localStorage.getItem(KEY) === 'daylight' ? 'daylight' : 'jade'; } catch { return 'jade'; }
}

let theme: Theme = read();

export function applyTheme() {
  if (theme === 'daylight') document.documentElement.dataset.theme = 'daylight';
  else delete document.documentElement.dataset.theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'daylight' ? '#ffffff' : '#16181b');
}

export function setTheme(next: Theme) {
  theme = next;
  try { localStorage.setItem(KEY, next); } catch { /* the switch still works for this visit */ }
  applyTheme();
  listeners.forEach(l => l());
}

export function useTheme(): Theme {
  return useSyncExternalStore(l => { listeners.add(l); return () => { listeners.delete(l); }; }, () => theme);
}
