import { useState } from 'react';
import { Calculator } from './components/Calculator';
import { ChipTracker } from './components/ChipTracker';
import { TableUtils } from './components/TableUtils';
import { PlayTab } from './components/game/PlayTab';
import { TrainTab } from './components/trainer/TrainTab';

type Tab = 'calculator' | 'chips' | 'table' | 'play' | 'train';

export function App() {
  const [tab, setTab] = useState<Tab>('calculator');

  return (
    <div className="flex flex-col h-dvh">
      <header className="flex items-center justify-center py-3 bg-slate-900/80 backdrop-blur border-b border-amber-400/15">
        <h1 className="font-display text-xl font-semibold tracking-wide text-slate-100">
          Mahjong<span className="text-amber-400">Kaki</span>
        </h1>
      </header>

      <main className={`flex-1 overflow-y-auto ${tab === 'play' ? '' : 'p-4'}`}>
        {tab === 'calculator' && <Calculator />}
        {tab === 'chips' && <ChipTracker />}
        {tab === 'table' && <TableUtils />}
        {tab === 'play' && <PlayTab />}
        {tab === 'train' && <TrainTab />}
      </main>

      <nav className="flex border-t border-amber-400/10 bg-slate-900/90 backdrop-blur pb-safe">
        <TabButton label="Score" active={tab === 'calculator'} onClick={() => setTab('calculator')} />
        <TabButton label="Chips" active={tab === 'chips'} onClick={() => setTab('chips')} />
        <TabButton label="Table" active={tab === 'table'} onClick={() => setTab('table')} />
        <TabButton label="Play" active={tab === 'play'} onClick={() => setTab('play')} />
        <TabButton label="Train" active={tab === 'train'} onClick={() => setTab('train')} />
      </nav>
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 text-sm font-medium transition-colors ${
        active ? 'text-emerald-400 border-t-2 border-emerald-400' : 'text-slate-400'
      }`}
    >
      {label}
    </button>
  );
}

