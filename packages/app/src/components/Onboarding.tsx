import { useState, useEffect, type ReactNode } from 'react';
import { CinematicHero } from './CinematicHero';
import { setDisplay, useDisplay } from '../lib/display';
import { haptics } from '../lib/haptics';

const ONBOARD_KEY = 'mk_onboard_v1';

// One-time orientation shown on first launch (after the legal disclaimer).
export function useFirstRunOnboarding() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      if (!localStorage.getItem(ONBOARD_KEY)) setShow(true);
    } catch {
      /* private mode — skip */
    }
  }, []);
  const done = () => {
    try {
      localStorage.setItem(ONBOARD_KEY, '1');
    } catch {
      /* ignore */
    }
    setShow(false);
  };
  return { show, done };
}

function Feature({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-xl leading-none mt-0.5 w-6 text-center" aria-hidden>{icon}</span>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-100">{title}</div>
        <div className="text-xs text-slate-400 leading-snug">{desc}</div>
      </div>
    </div>
  );
}

function Switch({ on }: { on: boolean }) {
  return (
    <span
      className={`shrink-0 relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${
        on ? 'bg-emerald-600' : 'bg-slate-700'
      }`}
      aria-hidden
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          on ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </span>
  );
}

export function Onboarding({ onDone, onLearn }: { onDone: () => void; onLearn: () => void }) {
  const { tileMode } = useDisplay();
  const beginner = tileMode === 'beginner';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div
          className="max-w-sm mx-auto px-5 pb-4 space-y-5"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
        >
          <CinematicHero caption="Welcome to MahjongKaki" />

          <p className="text-sm text-slate-300 leading-relaxed text-center">
            Your companion for Singapore mahjong — score hands, settle chips, run the table, and sharpen your play.
          </p>

          <div className="card p-4 space-y-3">
            <Feature icon="🀄" title="Score any hand" desc="Tap in the tiles — get the tai and who pays what." />
            <Feature icon="🪙" title="Track the chips" desc="Record each round; balances settle automatically." />
            <Feature icon="🎯" title="Play & learn" desc="Practise against AI and drill the fundamentals." />
          </div>

          <button
            type="button"
            onClick={() => { haptics.select(); setDisplay('tileMode', beginner ? 'classic' : 'beginner'); }}
            aria-pressed={beginner}
            className="w-full card p-3.5 flex items-center justify-between text-left gap-3 active:scale-[0.99] transition-transform"
          >
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-100">Beginner tile labels</div>
              <div className="text-xs text-slate-400 leading-snug">
                Put numbers &amp; letters on every tile — handy if you don't read Chinese.
              </div>
            </div>
            <Switch on={beginner} />
          </button>
        </div>
      </div>

      <div
        className="shrink-0 border-t border-slate-800 bg-slate-900/95 px-5 pt-3 space-y-2"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
      >
        <button
          type="button"
          onClick={() => { haptics.tap(); onDone(); }}
          className="w-full min-h-[50px] btn-primary rounded-xl text-base font-semibold"
        >
          Get started
        </button>
        <button
          type="button"
          onClick={() => { haptics.tap(); onLearn(); }}
          className="w-full min-h-[44px] btn-ghost rounded-xl text-sm font-medium"
        >
          New to mahjong? Learn the basics →
        </button>
      </div>
    </div>
  );
}
