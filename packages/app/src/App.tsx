import { useState } from 'react';
import { Calculator } from './components/Calculator';
import { ChipTracker } from './components/ChipTracker';
import { TableUtils } from './components/TableUtils';
import { PlayTab } from './components/game/PlayTab';
import { TrainTab } from './components/trainer/TrainTab';

type Tab = 'calculator' | 'chips' | 'table' | 'play' | 'train';

const TABS: { id: Tab; label: string }[] = [
  { id: 'calculator', label: 'Score' },
  { id: 'chips', label: 'Chips' },
  { id: 'table', label: 'Table' },
  { id: 'play', label: 'Play' },
  { id: 'train', label: 'Train' },
];

export function App() {
  const [tab, setTab] = useState<Tab>('calculator');

  return (
    <div className="flex flex-col h-dvh">
      <header className="flex items-center justify-center py-3 bg-slate-900/80 backdrop-blur border-b border-amber-400/15">
        <h1 className="font-display text-xl font-semibold tracking-wide text-slate-100">
          Mahjong<span className="text-amber-400">Kaki</span>
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* key forces remount per tab → CSS slide-in replays (transform-only, always visible) */}
        <div key={tab} className={`anim-tab ${tab === 'play' ? 'h-full' : 'p-4'}`}>
          {tab === 'calculator' && <Calculator />}
          {tab === 'chips' && <ChipTracker />}
          {tab === 'table' && <TableUtils />}
          {tab === 'play' && <PlayTab />}
          {tab === 'train' && <TrainTab />}
        </div>
      </main>

      <nav className="flex border-t border-amber-400/10 bg-slate-900/90 backdrop-blur pb-safe">
        {TABS.map(t => (
          <TabButton key={t.id} label={t.label} active={tab === t.id} onClick={() => setTab(t.id)} />
        ))}
      </nav>
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex-1 py-3 text-sm font-medium transition-colors active:scale-90 ${
        active ? 'text-emerald-400' : 'text-slate-400'
      }`}
    >
      {active && (
        <span className="absolute top-0 left-1/2 -translate-x-1/2 w-9 h-0.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(63,182,131,0.6)]" />
      )}
      {label}
    </button>
  );
}
