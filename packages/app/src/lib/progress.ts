// Learn progress and the first-open level answer, kept on this device only.
import { useSyncExternalStore } from 'react';

export type Level = 'new' | 'basics' | 'player';
interface Progress { level: Level | null; done: string[] }

const KEY = 'mk_progress_v1';
const listeners = new Set<() => void>();

function read(): Progress {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) ?? '') as Progress;
    return { level: p.level ?? null, done: Array.isArray(p.done) ? p.done : [] };
  } catch {
    return { level: null, done: [] };
  }
}

let state: Progress = read();

function save(next: Progress) {
  state = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* still works for this visit */ }
  listeners.forEach(l => l());
}

export function useProgress(): Progress {
  return useSyncExternalStore(l => { listeners.add(l); return () => { listeners.delete(l); }; }, () => state);
}

export function setLevel(level: Level) {
  save({ ...state, level });
}

export function markDone(key: string) {
  if (!state.done.includes(key)) save({ ...state, done: [...state.done, key] });
}

export function resetProgress() {
  save({ level: state.level, done: [] });
}
