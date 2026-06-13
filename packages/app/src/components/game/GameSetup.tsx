import { useState } from 'react';
import { type AiProfile, ALL_PROFILES } from '@mahjongkaki/ai';
import { STAKE_PRESETS } from '@mahjongkaki/engine';
import { haptics } from '../../lib/haptics';
import { CinematicHero } from '../CinematicHero';

export type SpeedSetting = 'slow' | 'normal' | 'fast' | 'instant';

export interface MatchConfig {
  difficulty: AiProfile['difficulty'];
  speed: SpeedSetting;
  humanSeat: number;
  stakeIndex: number;
}

interface GameSetupProps {
  onStart: (config: MatchConfig) => void;
}

export function GameSetup({ onStart }: GameSetupProps) {
  const [difficulty, setDifficulty] = useState<AiProfile['difficulty']>('medium');
  const [speed, setSpeed] = useState<SpeedSetting>('normal');
  const [humanSeat, setHumanSeat] = useState(0);
  const [stakeIndex, setStakeIndex] = useState(1);
  const [showHint, setShowHint] = useState(() => {
    try { return localStorage.getItem('mk_play_hint') !== '0'; } catch { return true; }
  });
  const dismissHint = () => {
    setShowHint(false);
    try { localStorage.setItem('mk_play_hint', '0'); } catch { /* ignore */ }
  };

  const seatLabels = ['East', 'South', 'West', 'North'];
  const pill = (active: boolean) => `seg min-h-[44px] text-sm ${active ? 'seg-on' : 'seg-off'}`;

  return (
    <div className="space-y-4 pb-4">
      <CinematicHero aspect="aspect-[21/9]" />

      <div>
        <h2 className="page-title">New Match</h2>
        <div className="page-title-rule" />
      </div>

      {showHint && (
        <section className="card p-4 border-amber-400/25">
          <div className="flex items-start justify-between gap-3">
            <h3 className="section-title">How to play</h3>
            <button onClick={dismissHint} aria-label="Dismiss" className="-mt-1 -mr-1 w-7 h-7 grid place-items-center text-slate-500 active:scale-90 text-base">✕</button>
          </div>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-300 list-disc list-inside marker:text-amber-400/60">
            <li><strong className="text-slate-100">Drag a tile up &amp; release</strong> to throw it — or tap to select, tap again to discard.</li>
            <li>When someone discards, <strong className="text-slate-100">Pung / Chow / Kong</strong> or <strong className="text-emerald-400">Hu!</strong> if offered — or Skip.</li>
            <li>Win with <strong className="text-slate-100">4 sets + a pair</strong> at the minimum tai. Chips settle after each hand; dealer rotates.</li>
          </ul>
          <button onClick={dismissHint} className="mt-3 w-full min-h-[40px] rounded-lg bg-slate-700 text-slate-200 text-sm font-medium active:bg-slate-600">
            Got it
          </button>
        </section>
      )}

      <section className="card p-4">
        <h3 className="section-title mb-3">AI Difficulty</h3>
        <div className="grid grid-cols-2 gap-2">
          {ALL_PROFILES.map(p => (
            <button key={p.difficulty} type="button"
              onClick={() => { haptics.select(); setDifficulty(p.difficulty); }}
              className={pill(difficulty === p.difficulty)}>
              {p.name}
            </button>
          ))}
        </div>
      </section>

      <section className="card p-4">
        <h3 className="section-title mb-3">Stake (for the chip scoreboard)</h3>
        <div className="grid grid-cols-3 gap-2">
          {STAKE_PRESETS.map((s, i) => (
            <button key={s.label} type="button"
              onClick={() => { haptics.select(); setStakeIndex(i); }}
              className={pill(stakeIndex === i)}>
              {s.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card p-4">
        <h3 className="section-title mb-3">Game Speed</h3>
        <div className="grid grid-cols-4 gap-1.5">
          {(['slow', 'normal', 'fast', 'instant'] as const).map(s => (
            <button key={s} type="button"
              onClick={() => { haptics.select(); setSpeed(s); }}
              className={`${pill(speed === s)} text-xs`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </section>

      <section className="card p-4">
        <h3 className="section-title mb-3">Your Seat</h3>
        <div className="grid grid-cols-4 gap-1.5">
          {seatLabels.map((label, i) => (
            <button key={i} type="button"
              onClick={() => { haptics.select(); setHumanSeat(i); }}
              className={`${pill(humanSeat === i)} text-xs`}>
              {label}
            </button>
          ))}
        </div>
      </section>

      <button type="button"
        onClick={() => { haptics.success(); onStart({ difficulty, speed, humanSeat, stakeIndex }); }}
        className="btn-primary w-full min-h-[52px] text-base font-semibold rounded-xl">
        Start Match
      </button>
    </div>
  );
}
