// House-rules settings store. Persists a RulesConfig to localStorage and exposes
// a React hook so the Calculator, chip tracker, and AI match all score by the
// user's chosen rules instead of the hardcoded defaults.
import { useSyncExternalStore } from 'react';
import { DEFAULT_RULES, mergeRules, type RulesConfig } from '@mahjongkaki/engine';

const KEY = 'mk_rules';
let rules: RulesConfig = load();
const listeners = new Set<() => void>();

function load(): RulesConfig {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? mergeRules(JSON.parse(raw)) : DEFAULT_RULES;
  } catch {
    return DEFAULT_RULES;
  }
}
function emit() { listeners.forEach(l => l()); }

export function getRules(): RulesConfig { return rules; }

export function setRule<K extends keyof RulesConfig>(key: K, value: RulesConfig[K]): void {
  rules = mergeRules({ ...rules, [key]: value });
  try { localStorage.setItem(KEY, JSON.stringify(rules)); } catch { /* ignore */ }
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
