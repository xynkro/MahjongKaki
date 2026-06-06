import { useState } from 'react';
import { STAKE_PRESETS } from '@mahjongkaki/engine';

interface NewSessionProps {
  onStart: (names: [string, string, string, string], stakeLabel: string) => void;
}

export function NewSession({ onStart }: NewSessionProps) {
  const [names, setNames] = useState<[string, string, string, string]>(['', '', '', '']);
  const [stakeIdx, setStakeIdx] = useState(0);

  const windLabels = ['East', 'South', 'West', 'North'];

  function handleStart() {
    const filled = names.map((n, i) => n.trim() || `Player ${i + 1}`) as [string, string, string, string];
    onStart(filled, STAKE_PRESETS[stakeIdx].label);
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="text-center py-4">
        <h2 className="text-lg font-semibold text-slate-200">New Session</h2>
        <p className="text-xs text-slate-500 mt-1">Enter player names and stake</p>
      </div>

      <section className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 space-y-3">
        {names.map((name, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-slate-500 w-10 shrink-0">{windLabels[i]}</span>
            <input
              type="text"
              value={name}
              placeholder={`Player ${i + 1}`}
              onChange={(e) => {
                const next = [...names] as [string, string, string, string];
                next[i] = e.target.value;
                setNames(next);
              }}
              className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200
                placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        ))}
      </section>

      <section className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
        <div className="text-xs text-slate-400 mb-2">Stake</div>
        <div className="flex gap-1 flex-wrap">
          {STAKE_PRESETS.map((preset, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStakeIdx(i)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                stakeIdx === i
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={handleStart}
        className="w-full py-3 text-sm font-medium bg-emerald-700 text-white rounded-xl active:bg-emerald-600"
      >
        Start Session
      </button>
    </div>
  );
}
