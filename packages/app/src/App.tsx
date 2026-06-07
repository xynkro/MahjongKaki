import { useState, type ReactNode } from 'react';
import { Calculator } from './components/Calculator';
import { ChipTracker } from './components/ChipTracker';
import { TableUtils } from './components/TableUtils';
import { PlayTab } from './components/game/PlayTab';
import { TrainTab } from './components/trainer/TrainTab';
import { LegalSheet, FirstRunDisclaimer, useFirstRunDisclaimer } from './components/LegalSheet';

type Tab = 'calculator' | 'chips' | 'table' | 'play' | 'train';

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: 'calculator', label: 'Score', icon: <IconScore /> },
  { id: 'chips', label: 'Chips', icon: <IconChips /> },
  { id: 'table', label: 'Table', icon: <IconTable /> },
  { id: 'play', label: 'Play', icon: <IconPlay /> },
  { id: 'train', label: 'Train', icon: <IconTrain /> },
];

export function App() {
  const [tab, setTab] = useState<Tab>('calculator');
  const [legalOpen, setLegalOpen] = useState(false);
  const disclaimer = useFirstRunDisclaimer();

  return (
    <div className="flex flex-col h-dvh">
      <header
        className="relative pb-3 bg-slate-900/80 backdrop-blur border-b border-amber-400/15"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
      >
        <div className="relative flex items-center justify-center">
          <h1 className="font-display text-2xl font-semibold tracking-wide text-slate-100">
            Mahjong<span className="text-amber-400">Kaki</span>
          </h1>
          <button
            onClick={() => setLegalOpen(true)}
            aria-label="About and legal"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 grid place-items-center rounded-full border border-slate-700/60 text-slate-400 active:scale-90"
          >
            <span className="font-serif text-base font-semibold leading-none italic">i</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div key={tab} className={`anim-tab ${tab === 'play' ? 'h-full' : 'p-4'}`}>
          {tab === 'calculator' && <Calculator />}
          {tab === 'chips' && <ChipTracker />}
          {tab === 'table' && <TableUtils />}
          {tab === 'play' && <PlayTab />}
          {tab === 'train' && <TrainTab />}
        </div>
      </main>

      <nav className="flex border-t border-amber-400/10 bg-slate-900/95 backdrop-blur pb-safe">
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex-1 flex flex-col items-center gap-1 pt-2.5 pb-2 active:scale-95 ${
                active ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(63,182,131,0.6)]" />
              )}
              <span className="w-6 h-6">{t.icon}</span>
              <span className="text-[13px] font-medium">{t.label}</span>
            </button>
          );
        })}
      </nav>

      <LegalSheet open={legalOpen} onClose={() => setLegalOpen(false)} />
      {disclaimer.show && <FirstRunDisclaimer onAccept={disclaimer.accept} />}
    </div>
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
function IconPlay() {
  return <SVG><rect x="6" y="3" width="12" height="18" rx="2.5" /><circle cx="12" cy="9" r="2.2" /><line x1="9.5" y1="15" x2="14.5" y2="15" /><line x1="9.5" y1="17.5" x2="14.5" y2="17.5" /></SVG>;
}
function IconTrain() {
  return <SVG><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1" fill="currentColor" /></SVG>;
}
