import { useState, useEffect, type ReactNode } from 'react';
import { Calculator } from './components/Calculator';
import { PlayTab } from './components/game/PlayTab';
import { LearnTab } from './learn/LearnTab';
import { LevelPick } from './learn/LevelPick';
import { LegalSheet, FirstRunDisclaimer, useFirstRunDisclaimer } from './components/LegalSheet';
import { SettingsSheet } from './components/SettingsSheet';
import { useProgress } from './lib/progress';

// Three jobs, three tabs (docs/REDESIGN.md): Learn the game, Play it, explain a Hand.
type Tab = 'learn' | 'play' | 'hand';

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: 'learn', label: 'Learn', icon: <IconLearn /> },
  { id: 'play', label: 'Play', icon: <IconPlay /> },
  { id: 'hand', label: 'Hand', icon: <IconHand /> },
];

export function App() {
  const { level } = useProgress();
  const [tab, setTab] = useState<Tab>(level === 'player' ? 'play' : 'learn');
  const [legalOpen, setLegalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const disclaimer = useFirstRunDisclaimer();
  const askLevel = !disclaimer.show && level === null;

  // Lock the page behind any open sheet so iOS doesn't scroll-chain ("phantom" scroll).
  useEffect(() => {
    document.body.style.overflow = (settingsOpen || legalOpen || disclaimer.show || askLevel) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [settingsOpen, legalOpen, disclaimer.show, askLevel]);

  return (
    <div className="app-full flex flex-col bg-bg">
      <header
        className="app-shell-header relative pb-3 border-b border-line"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
      >
        <div className="relative flex items-center justify-center">
          <h1 className="font-display text-[1.6rem] leading-none text-ink">
            Mahjong<span className="text-accent">Kaki</span>
          </h1>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <button
              onClick={() => setSettingsOpen(true)}
              aria-label="Settings"
              className="w-9 h-9 grid place-items-center rounded-full text-mute active:scale-90"
            >
              <IconGear />
            </button>
            <button
              onClick={() => setLegalOpen(true)}
              aria-label="About and legal"
              className="w-9 h-9 grid place-items-center rounded-full text-mute active:scale-90"
            >
              <IconInfo />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div key={tab} className={`anim-tab ${tab === 'play' ? 'h-full' : 'p-4'}`}>
          {tab === 'learn' && <LearnTab />}
          {tab === 'play' && <PlayTab />}
          {tab === 'hand' && <HandTab />}
        </div>
      </main>

      <nav className="app-shell-nav flex border-t border-line bg-surface pb-safe">
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-current={active ? 'page' : undefined}
              className={`relative flex-1 flex flex-col items-center gap-1 pt-2.5 pb-2 active:scale-95 ${active ? 'text-accent' : 'text-mute'}`}
            >
              {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-full bg-accent" />}
              <span className="w-6 h-6">{t.icon}</span>
              <span className="text-[13px] font-medium">{t.label}</span>
            </button>
          );
        })}
      </nav>

      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <LegalSheet open={legalOpen} onClose={() => setLegalOpen(false)} />
      {disclaimer.show ? (
        <FirstRunDisclaimer onAccept={disclaimer.accept} />
      ) : askLevel ? (
        <LevelPick onPicked={l => setTab(l === 'player' ? 'play' : 'learn')} />
      ) : null}
    </div>
  );
}

function HandTab() {
  return (
    <div className="max-w-lg mx-auto">
      <img
        src={`${import.meta.env.BASE_URL}art/may-tea.webp`}
        alt="May relaxing with a cup of tea at the table"
        className="w-full h-40 object-cover object-[50%_45%] rounded-2xl mb-4"
      />
      <h1 className="font-display text-[28px] leading-tight text-ink">Explain my hand</h1>
      <p className="text-mute mt-1 mb-4">Tap in a winning hand and see what it’s worth, and why.</p>
      <Calculator />
    </div>
  );
}

const SVG = (props: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">{props.children}</svg>
);

function IconLearn() {
  return <SVG><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z" /><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z" /></SVG>;
}
function IconPlay() {
  return <SVG><rect x="3.5" y="5" width="7" height="10" rx="1.6" /><rect x="13.5" y="9" width="7" height="10" rx="1.6" /></SVG>;
}
function IconHand() {
  return <SVG><rect x="4" y="8" width="4.4" height="7" rx="1" /><rect x="9.8" y="8" width="4.4" height="7" rx="1" /><rect x="15.6" y="8" width="4.4" height="7" rx="1" /><path d="M6 18.5h12" /></SVG>;
}
function IconInfo() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="w-[18px] h-[18px]"><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5" /><circle cx="12" cy="8" r="0.6" fill="currentColor" /></svg>;
}
function IconGear() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v2.5M12 19v2.5M21.5 12H19M5 12H2.5M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8M18.4 18.4l-1.8-1.8M7.4 7.4 5.6 5.6" />
    </svg>
  );
}
