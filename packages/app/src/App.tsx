import { useState } from 'react';
import { Calculator } from './components/Calculator';

type Tab = 'calculator' | 'chips' | 'table';

export function App() {
  const [tab, setTab] = useState<Tab>('calculator');

  return (
    <div className="flex flex-col h-dvh">
      <header className="flex items-center justify-center py-3 bg-slate-800 border-b border-slate-700">
        <h1 className="text-lg font-bold tracking-wide">MahjongKaki</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        {tab === 'calculator' && <Calculator />}
        {tab === 'chips' && <Placeholder label="Chip Tracker" />}
        {tab === 'table' && <Placeholder label="Table Utilities" />}
      </main>

      <nav className="flex border-t border-slate-700 bg-slate-800 pb-safe">
        <TabButton label="Calculator" active={tab === 'calculator'} onClick={() => setTab('calculator')} />
        <TabButton label="Chips" active={tab === 'chips'} onClick={() => setTab('chips')} />
        <TabButton label="Table" active={tab === 'table'} onClick={() => setTab('table')} />
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

function Placeholder({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-slate-500">
      <p className="text-xl font-semibold">{label}</p>
      <p className="text-sm mt-1">Coming soon</p>
    </div>
  );
}
