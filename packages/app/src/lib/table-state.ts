// Shared, persisted table round so the Wind Round Tracker survives tab
// switches / reloads and can seed the calculator's round wind. Mirrors the
// display.ts store pattern (localStorage + useSyncExternalStore).
import { useSyncExternalStore } from 'react';
import type { Wind } from '@mahjongkaki/engine';

export const WIND_ORDER: Wind[] = ['east', 'south', 'west', 'north'];

export interface TableState {
  /** Prevailing (round) wind as an index into WIND_ORDER. */
  roundWindIdx: number;
  /** Current dealer seat, 0-3. */
  dealerIdx: number;
}

const DEFAULT: TableState = { roundWindIdx: 0, dealerIdx: 0 };
const KEY = 'mk_table_state';

let state: TableState = load();
const listeners = new Set<() => void>();

function load(): TableState {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch {
    return DEFAULT;
  }
}
function emit() { listeners.forEach((l) => l()); }

export function getTableState(): TableState { return state; }

export function setTableState(patch: Partial<TableState>): void {
  state = { ...state, ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  emit();
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

export function useTableState(): TableState {
  return useSyncExternalStore(subscribe, getTableState, getTableState);
}

export function roundWind(): Wind {
  return WIND_ORDER[getTableState().roundWindIdx] ?? 'east';
}
