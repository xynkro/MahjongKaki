import { useState } from 'react';
import { type AiProfile, ALL_PROFILES } from '@mahjongkaki/ai';

export type SpeedSetting = 'slow' | 'normal' | 'fast' | 'instant';

interface GameSetupProps {
  onStart: (config: {
    difficulty: AiProfile['difficulty'];
    speed: SpeedSetting;
    humanSeat: number;
  }) => void;
}

export function GameSetup({ onStart }: GameSetupProps) {
  const [difficulty, setDifficulty] = useState<AiProfile['difficulty']>('medium');
  const [speed, setSpeed] = useState<SpeedSetting>('normal');
  const [humanSeat, setHumanSeat] = useState(0);

  const seatLabels = ['East (0)', 'South (1)', 'West (2)', 'North (3)'];

  return (
    <div className="space-y-4 pb-4">
      <section className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
        <h2 className="text-sm font-semibold text-slate-300 mb-3">AI Difficulty</h2>
        <div className="grid grid-cols-2 gap-2">
          {ALL_PROFILES.map(p => (
            <button
              key={p.difficulty}
              type="button"
              onClick={() => setDifficulty(p.difficulty)}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                difficulty === p.difficulty
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </section>

      <section className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Game Speed</h2>
        <div className="grid grid-cols-4 gap-1">
          {(['slow', 'normal', 'fast', 'instant'] as const).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
                speed === s
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </section>

      <section className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Your Seat</h2>
        <div className="grid grid-cols-4 gap-1">
          {seatLabels.map((label, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setHumanSeat(i)}
              className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
                humanSeat === i
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={() => onStart({ difficulty, speed, humanSeat })}
        className="w-full py-3 text-sm font-medium bg-emerald-700 text-white rounded-xl active:bg-emerald-600"
      >
        Start Game
      </button>
    </div>
  );
}
