import { useState } from 'react';
import { type AiProfile, ALL_PROFILES } from '@mahjongkaki/ai';
import { STAKE_PRESETS } from '@mahjongkaki/engine';
import { haptics } from '../../lib/haptics';

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

  const seatLabels = ['East', 'South', 'West', 'North'];
  const pill = (active: boolean) =>
    `min-h-[44px] rounded-lg text-sm font-medium transition-colors ${
      active ? 'bg-emerald-700 text-white' : 'bg-slate-700 text-slate-300 active:bg-slate-600'
    }`;

  return (
    <div className="space-y-4 pb-4">
      <h2 className="text-lg font-bold text-slate-200">New Match</h2>

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
        className="w-full min-h-[48px] text-base font-semibold bg-emerald-700 text-white rounded-xl active:scale-95 active:bg-emerald-600">
        Start Match
      </button>
    </div>
  );
}
