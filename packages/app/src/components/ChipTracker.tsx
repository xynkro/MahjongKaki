import { useState, useEffect, type CSSProperties } from 'react';
import { useActiveSession } from '../lib/use-sessions';
import { formatCurrency, STAKE_PRESETS } from '@mahjongkaki/engine';
import { haptics } from '../lib/haptics';
import { NewSession } from './NewSession';
import { AddRound } from './AddRound';

interface ChipTrackerProps {
  /** A round handed over from the calculator (tai + win-type), awaiting a winner. */
  pendingRound?: { tai: number; winType: 'zimo' | 'discard' } | null;
  onConsumePending?: () => void;
}

export function ChipTracker({ pendingRound, onConsumePending }: ChipTrackerProps = {}) {
  const {
    session, rounds, balances, loading,
    startSession, addRound, deleteRound, endSession,
  } = useActiveSession();
  const [showAddRound, setShowAddRound] = useState(false);
  const [prefill, setPrefill] = useState<{ tai: number; winType: 'zimo' | 'discard' } | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // A hand sent from the calculator: once a session exists, open the round form
  // pre-filled with its tai + win-type (the user still picks the winner).
  useEffect(() => {
    if (session && pendingRound) {
      setPrefill(pendingRound);
      setShowAddRound(true);
      onConsumePending?.();
    }
  }, [session, pendingRound, onConsumePending]);

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Loading...</div>;
  }

  if (!session) {
    return <NewSession onStart={startSession} />;
  }

  return (
    <div className="space-y-4 pb-4">
      <section className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="section-title">Session</h3>
            <div className="text-[12px] text-slate-500 mt-0.5">
              {session.stakeLabel} &middot; {rounds.length} round{rounds.length !== 1 ? 's' : ''}
            </div>
          </div>
          {!confirmEnd ? (
            <button
              type="button"
              onClick={() => { haptics.select(); setConfirmEnd(true); }}
              className="px-3 py-1 text-xs text-slate-400 rounded-md border border-slate-700 active:bg-slate-700"
            >
              End Session
            </button>
          ) : (
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => { endSession(); setConfirmEnd(false); }}
                className="px-3 py-1 text-xs text-red-300 bg-red-900/40 rounded-md"
              >
                Confirm End
              </button>
              <button
                type="button"
                onClick={() => setConfirmEnd(false)}
                className="px-3 py-1 text-xs text-slate-400"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Equal columns; the amount size follows the longest balance so four never touch (cqw = grid width) */}
        <div
          className="grid grid-cols-4 gap-2 [container-type:inline-size]"
          style={{ '--n': Math.max(6, ...balances.map(b => formatCurrency(b).length)) } as CSSProperties}
          aria-live="polite"
        >
          {session.playerNames.map((name, i) => (
            <div key={i} className="min-w-0 text-center">
              <div className="text-xs text-slate-400 truncate">{name}</div>
              <div
                className={`font-bold tabular-nums whitespace-nowrap ${
                  balances[i] > 0 ? 'text-emerald-400' :
                  balances[i] < 0 ? 'text-red-400' : 'text-slate-300'
                }`}
                style={{ fontSize: 'min(1.125rem, calc((25cqw - 6px) / (var(--n) * 0.6)))' }}
              >
                {formatCurrency(balances[i])}
              </div>
            </div>
          ))}
        </div>
      </section>

      {!showAddRound && (
        <button
          type="button"
          onClick={() => { haptics.tap(); setPrefill(null); setShowAddRound(true); }}
          className="w-full min-h-[44px] py-3 text-sm font-medium btn-primary rounded-xl active:bg-emerald-600"
        >
          + Record Round
        </button>
      )}

      {showAddRound && (
        <AddRound
          key={prefill ? `calc-${prefill.tai}-${prefill.winType}` : 'manual'}
          playerNames={session.playerNames}
          stakeLabel={session.stakeLabel}
          initialTai={prefill?.tai ?? 1}
          initialWinType={prefill?.winType ?? 'discard'}
          fromCalculator={!!prefill}
          onAdd={(round) => { haptics.success(); addRound(round); setShowAddRound(false); setPrefill(null); }}
          onCancel={() => { setShowAddRound(false); setPrefill(null); }}
        />
      )}

      {rounds.length > 0 ? (
        <section className="space-y-1.5">
          <h3 className="section-title">Round History</h3>
          {[...rounds].reverse().map((round, idx) => (
            <div
              key={round.id}
              className="card px-3 py-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-300">
                    <span className="font-medium text-emerald-400">{round.winnerName}</span>
                    {' '}{round.tai} tai
                    {' '}<span className="text-slate-500">({round.winType === 'zimo' ? 'self-draw' : 'discard'})</span>
                  </div>
                  <div className="flex gap-2 mt-0.5">
                    {round.deltas.map((d, i) => (
                      <span key={i} className={`text-[12px] font-mono ${
                        d > 0 ? 'text-emerald-400' : d < 0 ? 'text-red-400' : 'text-slate-500'
                      }`}>
                        {d > 0 ? '+' : ''}{formatCurrency(d)}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { haptics.select(); setConfirmDeleteId(round.id ?? null); }}
                  aria-label={`Delete round ${rounds.length - idx}: ${round.winnerName}, ${round.tai} tai`}
                  className="ml-2 -mr-2 -my-1 w-11 h-11 shrink-0 grid place-items-center text-slate-600 text-base active:text-red-400"
                >
                  ×
                </button>
              </div>
              {confirmDeleteId !== null && confirmDeleteId === round.id && (
                <div className="mt-1 pt-2 border-t border-slate-700/50 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-300">Delete this round?</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => { deleteRound(round.id!); setConfirmDeleteId(null); }}
                      className="min-h-[44px] px-4 text-xs text-red-300 bg-red-900/40 rounded-md"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="min-h-[44px] px-4 text-xs text-slate-400"
                    >
                      Keep
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </section>
      ) : (
        <div className="empty-state">
          <span className="text-4xl opacity-40">🀄</span>
          <p>No rounds yet — record your first</p>
        </div>
      )}
    </div>
  );
}
