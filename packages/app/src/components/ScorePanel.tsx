import type { ScoringResult, PayoutResult, StakeConfig } from '@mahjongkaki/engine';
import { formatCurrency, formatSettlement, STAKE_PRESETS } from '@mahjongkaki/engine';
import { TermTip } from './TermTip';

interface ScorePanelProps {
  scoring: ScoringResult | null;
  payout: PayoutResult | null;
  stakeIndex: number;
  onStakeChange: (i: number) => void;
  playerNames: [string, string, string, string];
  winnerIndex: number;
  shooterIndex: number | undefined;
  winType: 'zimo' | 'discard';
  onWinnerChange: (i: number) => void;
  onShooterChange: (i: number | undefined) => void;
  onPlayerNameChange: (i: number, name: string) => void;
}

export function ScorePanel({
  scoring, payout, stakeIndex, onStakeChange,
  playerNames, winnerIndex, shooterIndex, winType,
  onWinnerChange, onShooterChange, onPlayerNameChange,
}: ScorePanelProps) {
  return (
    <div className="space-y-4">
      {scoring && (
        <div className="card p-4">
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="section-title"><TermTip term="tai">Tai</TermTip> Breakdown</h3>
            <div className="flex items-baseline gap-1" aria-live="polite">
              <span className={`text-2xl font-bold ${scoring.isValid ? 'text-emerald-400' : 'text-red-400'}`}>
                {scoring.cappedTai}
              </span>
              <span className="text-xs text-slate-500">
                tai{scoring.totalTai !== scoring.cappedTai ? ` (${scoring.totalTai} uncapped)` : ''}
              </span>
            </div>
          </div>

          {!scoring.isValid && (
            <div className="text-xs text-red-400 mb-2 bg-red-900/20 px-2 py-1 rounded">
              {scoring.invalidReason}
            </div>
          )}

          <div className="space-y-1">
            {scoring.elements.map((el, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-slate-300">
                  {el.name}
                  <span className="text-slate-500 ml-1">{el.nameZh}</span>
                </span>
                <span className="text-emerald-400 font-mono">+{el.tai}</span>
              </div>
            ))}
            {scoring.elements.length === 0 && (
              <div className="empty-state">No tai elements (chicken hand)</div>
            )}
          </div>
        </div>
      )}

      {scoring?.isValid && (
        <div className="card p-4 space-y-3">
          <h3 className="section-title">Settlement</h3>

          <div>
            <h3 className="section-title mb-1">Stake</h3>
            <div className="flex gap-1 flex-wrap">
              {STAKE_PRESETS.map((preset, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onStakeChange(i)}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    stakeIndex === i
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <h3 className="section-title">Players</h3>
            {playerNames.map((name, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => onPlayerNameChange(i, e.target.value)}
                  className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200"
                />
                <button
                  type="button"
                  onClick={() => onWinnerChange(i)}
                  className={`px-2 py-1 text-[12px] rounded ${
                    winnerIndex === i ? 'bg-emerald-700 text-white' : 'bg-slate-700 text-slate-500'
                  }`}
                >
                  Win
                </button>
                {winType === 'discard' && (
                  <button
                    type="button"
                    onClick={() => onShooterChange(i === winnerIndex ? undefined : i)}
                    className={`px-2 py-1 text-[12px] rounded ${
                      shooterIndex === i ? 'bg-red-700 text-white' : 'bg-slate-700 text-slate-500'
                    }`}
                    disabled={i === winnerIndex}
                  >
                    Shot
                  </button>
                )}
              </div>
            ))}
          </div>

          {payout && (
            <div className="pt-2 border-t border-slate-700 space-y-1" aria-live="polite">
              {payout.payments.map((p, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-slate-300">{p.name}</span>
                  <span className={p.amount < 0 ? 'text-red-400' : 'text-emerald-400'}>
                    {formatCurrency(p.amount)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between text-xs font-semibold pt-1">
                <span className="text-emerald-300">{payout.winner} wins</span>
                <span className="text-emerald-400">
                  {formatCurrency(payout.netPerPlayer[payout.winner])}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-700">
                <h3 className="section-title mb-1">Transfers</h3>
                {formatSettlement(payout.netPerPlayer).map((line, i) => (
                  <div key={i} className="text-xs text-slate-300">{line}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
