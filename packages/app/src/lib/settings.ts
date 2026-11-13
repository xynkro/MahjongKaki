// House-rules settings store. Persists a RulesConfig to localStorage and exposes
// a React hook so the Calculator, chip tracker, and AI match all score by the
// user's chosen rules instead of the hardcoded defaults.
import { useSyncExternalStore } from 'react';
import { DEFAULT_RULES, mergeRules, type RulesConfig } from '@mahjongkaki/engine';

const KEY = 'mk_rules';
// Bumped when the defaults move. v2 (Nov 2026): Singapore rules, so only your seat's flowers
// score and there is no concealed-hand tai. Saved rules from before move to the new defaults once.
const VERSION_KEY = 'mk_rules_v';
const VERSION = 2;

let rules: RulesConfig = load();
const listeners = new Set<() => void>();

function load(): RulesConfig {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_RULES;
    let saved = mergeRules(JSON.parse(raw));
    if (Number(localStorage.getItem(VERSION_KEY) ?? 1) < VERSION) {
      saved = { ...saved, anyFlowerScores: DEFAULT_RULES.anyFlowerScores, concealedHandTai: DEFAULT_RULES.concealedHandTai };
      localStorage.setItem(KEY, JSON.stringify(saved));
      localStorage.setItem(VERSION_KEY, String(VERSION));
    }
    return saved;
  } catch {
    return DEFAULT_RULES;
  }
}
function emit() { listeners.forEach(l => l()); }

export function getRules(): RulesConfig { return rules; }

export function setRule<K extends keyof RulesConfig>(key: K, value: RulesConfig[K]): void {
  rules = mergeRules({ ...rules, [key]: value });
  try { localStorage.setItem(KEY, JSON.stringify(rules)); localStorage.setItem(VERSION_KEY, String(VERSION)); } catch { /* ignore */ }
  emit();
}

export function resetRules(): void {
  rules = DEFAULT_RULES;
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  emit();
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

export function useRules(): RulesConfig {
  return useSyncExternalStore(subscribe, getRules, getRules);
}
