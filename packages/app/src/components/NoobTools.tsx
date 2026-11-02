import type { ReactNode } from 'react';
import { haptics } from '../lib/haptics';

export type NoobTool = 'tais' | 'chips' | 'table';

interface ToolDef { id: NoobTool; label: string; description: string; icon: ReactNode }

const TOOLS: ToolDef[] = [
  { id: 'chips', label: 'No Chips Game', description: 'No chips at the table? Record each round and keep a running tally.', icon: <IconChips /> },
  { id: 'tais', label: 'Count My Tais', description: 'Enter a hand and see the tai and who pays what.', icon: <IconScore /> },
  { id: 'table', label: 'Table Tracker', description: 'Roll dice, shuffle seats, and track the round and dealer.', icon: <IconTable /> },
];

export function NoobMenu({ onSelect }: { onSelect: (tool: NoobTool) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="page-title">For Noobs</h2>
        <div className="page-title-rule" />
      </div>
      <p className="text-xs text-slate-400">Handy tools for a real table</p>

      {TOOLS.map(t => (
        <button
          key={t.id}
          onClick={() => { haptics.tap(); onSelect(t.id); }}
          className="w-full text-left card p-4 active:bg-slate-700/50 flex items-center gap-3"
        >
          <span className="w-6 h-6 shrink-0 text-amber-400/80" aria-hidden>{t.icon}</span>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-200">{t.label}</div>
            <p className="text-xs text-slate-400 mt-1">{t.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

export function NoobBack({ onBack }: { onBack: () => void }) {
  return (
    <button
      onClick={() => { haptics.tap(); onBack(); }}
      className="-mt-2 mb-1 min-h-[44px] text-sm text-slate-400 active:text-slate-200"
    >
      ← For Noobs
    </button>
  );
}

const SVG = (props: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">{props.children}</svg>
);

function IconScore() {
  return <SVG><rect x="5" y="3" width="14" height="18" rx="2" /><line x1="8" y1="7" x2="16" y2="7" /><circle cx="9" cy="12" r="0.6" fill="currentColor" /><circle cx="12" cy="12" r="0.6" fill="currentColor" /><circle cx="15" cy="12" r="0.6" fill="currentColor" /><circle cx="9" cy="16" r="0.6" fill="currentColor" /><circle cx="12" cy="16" r="0.6" fill="currentColor" /><circle cx="15" cy="16" r="0.6" fill="currentColor" /></SVG>;
}
function IconChips() {
  return <SVG><ellipse cx="12" cy="7" rx="7" ry="3" /><path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7" /><path d="M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" /></SVG>;
}
function IconTable() {
  return <SVG><rect x="4" y="4" width="16" height="16" rx="3" /><circle cx="9" cy="9" r="1.1" fill="currentColor" /><circle cx="15" cy="9" r="1.1" fill="currentColor" /><circle cx="9" cy="15" r="1.1" fill="currentColor" /><circle cx="15" cy="15" r="1.1" fill="currentColor" /></SVG>;
}
