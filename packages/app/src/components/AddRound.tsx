import { useState, useMemo } from 'react';
import { calculatePayout, formatCurrency, STAKE_PRESETS } from '@mahjongkaki/engine';
import { haptics } from '../lib/haptics';
import { useRules } from '../lib/settings';
import type { Round } from '../lib/db';

interface AddRoundProps {
  playerNames: [string, string, string, string];
  stakeLabel: string;
  onAdd: (round: Omit<Round, 'id' | 'sessionId' | 'timestamp'>) => void;
  onCancel: () => void;
}

export function AddRound({ playerNames, stakeLabel, onAdd, onCancel }: AddRoundProps) {
  const [winnerIndex, setWinnerIndex] = useState(0);
  const [tai, setTai] = useState(1);
  const [winType, setWinType] = useState<'zimo' | 'discard'>('discard');
  const [shooterIndex, setShooterIndex] = useState(1);
  const rules = useRules();

  const stake = STAKE_PRESETS.find(s => s.label === stakeLabel) ?? STAKE_PRESETS[0];

  const deltas = useMemo(() => {
    const cap = rules.taiCap ?? 13;
    const scoring = { elements: [], totalTai: tai, cappedTai: Math.min(tai, cap), isValid: true };
    const payout = calculatePayout({
      scoring,
      stake,
      winnerIndex,
      shooterIndex: winType === 'zimo' ? undefined : shooterIndex,
      playerNames,
      rules,
    });

    const d: [number, number, number, number] = [0, 0, 0, 0];
    for (let i = 0; i < 4; i++) {
      d[i] = payout.netPerPlayer[playerNames[i]] ?? 0;
    }
    return d;
  }, [winnerIndex, tai, winType, shooterIndex, playerNames, stake, rules]);

  function handleSubmit() {
    onAdd({
      winnerIndex,
      winnerName: playerNames[winnerIndex],
      tai,
      winType,
      deltas,
    });
  }

  const shooterOptions = Array.from({ length: 4 }, (_, i) => i).filter(i => i !== winnerIndex);

  return (
    <section className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="section-title">Record Round</h3>
        <button type="button" onClick={onCancel} className="text-xs text-slate-400 active:text-slate-200">
          Cancel
        </button>
      </div>

      <div>
        <h3 className="section-title mb-1">Winner</h3>
        <div className="grid grid-cols-4 gap-1">
          {playerNames.map((name, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                haptics.select();
                setWinnerIndex(i);
                if (shooterIndex === i) {
                  const others = [0, 1, 2, 3].filter(j => j !== i);
                  setShooterIndex(others[0]);
                }
              }}
              className={`px-2 py-1.5 text-xs rounded-lg truncate transition-colors ${
                winnerIndex === i
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="section-title mb-1">Tai</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { haptics.tap(); setTai(t => Math.max(1, t - 1)); }}
            className="w-8 h-8 text-lg bg-slate-700 rounded-lg text-slate-300 active:bg-slate-600"
          >
            -
          </button>
          <span className="text-lg font-bold text-slate-200 w-8 text-center font-mono">{tai}</span>
          <button
            type="button"
            onClick={() => { haptics.tap(); setTai(t => Math.min(rules.taiCap ?? 13, t + 1)); }}
            className="w-8 h-8 text-lg bg-slate-700 rounded-lg text-slate-300 active:bg-slate-600"
          >
            +
          </button>
          <div className="flex gap-1 ml-2 flex-wrap">
            {[1, 3, 5, 10].map(v => (
              <button
                key={v}
                type="button"
                onClick={() => { haptics.select(); setTai(v); }}
                className={`px-2 py-1 text-xs rounded-md ${
                  tai === v ? 'bg-emerald-700 text-white' : 'bg-slate-700 text-slate-400'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3 className="section-title mb-1">Win Type</h3>
        <div className="flex gap-1">
          {(['discard', 'zimo'] as const).map(wt => (
            <button
              key={wt}
              type="button"
              onClick={() => { haptics.select(); setWinType(wt); }}
              className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${
                winType === wt
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              {wt === 'zimo' ? 'Self-draw' : 'Discard'}
            </button>
          ))}
        </div>
      </div>

      {winType === 'discard' && (
        <div>
          <h3 className="section-title mb-1">Shooter</h3>
          <div className="grid grid-cols-3 gap-1">
            {shooterOptions.map(i => (
              <button
                key={i}
                type="button"
                onClick={() => { haptics.select(); setShooterIndex(i); }}
                className={`px-2 py-1.5 text-xs rounded-lg truncate transition-colors ${
                  shooterIndex === i
                    ? 'bg-red-700/80 text-white'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {playerNames[i]}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="card p-2" aria-live="polite">
        <h3 className="section-title mb-1">Payout Preview</h3>
        <div className="grid grid-cols-4 gap-2">
          {playerNames.map((name, i) => (
            <div key={i} className="text-center">
              <div className="text-[12px] text-slate-500 truncate">{name}</div>
              <div className={`text-sm font-bold font-mono ${
                deltas[i] > 0 ? 'text-emerald-400' : deltas[i] < 0 ? 'text-red-400' : 'text-slate-400'
              }`}>
                {deltas[i] > 0 ? '+' : ''}{formatCurrency(deltas[i])}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        className="w-full min-h-[44px] py-2.5 text-sm font-medium bg-emerald-700 text-white rounded-xl active:bg-emerald-600"
      >
        Add Round
      </button>
    </section>
  );
}
