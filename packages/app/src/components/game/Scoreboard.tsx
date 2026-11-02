import { useEffect, useState } from 'react';
import { formatCurrency } from '@mahjongkaki/engine';
import { type MatchState, seatWindOf } from './match';

const WIND_CHARS: Record<string, string> = { east: '東', south: '南', west: '西', north: '北' };

function money(n: number): string {
  if (n === 0) return '—';
  return (n > 0 ? '+' : '') + formatCurrency(n);
}

export interface TotalCount { delayMs: number; durationMs: number; winner: number }

// Timer, not rAF: it reads the clock each tick, so a throttled or hidden page still lands on the true total.
function useCountedTotal(from: number, to: number, count?: TotalCount): number {
  const [shown, setShown] = useState(count ? from : to);
  const delayMs = count?.delayMs;
  const durationMs = count?.durationMs;

  useEffect(() => {
    if (delayMs === undefined || durationMs === undefined || from === to) { setShown(to); return; }
    const start = performance.now();
    const id = window.setInterval(() => {
      const t = (performance.now() - start - delayMs) / durationMs;
      if (t >= 1) { setShown(to); clearInterval(id); return; }
      if (t > 0) setShown(Math.round((from + (to - from) * (1 - (1 - t) ** 3)) * 100) / 100);
    }, 40);
    return () => clearInterval(id);
  }, [from, to, delayMs, durationMs]);

  return shown;
}

function SeatTotal({ seat, total, delta, count }: { seat: number; total: number; delta: number; count?: TotalCount }) {
  const shown = useCountedTotal(Math.round((total - delta) * 100) / 100, total, count);
  return (
    <div
      data-seat-total={seat}
      className={`text-sm font-bold tabular-nums ${shown > 0 ? 'text-emerald-400' : shown < 0 ? 'text-red-400' : 'text-slate-500'}`}
    >
      <span className="sr-only">{money(total)}</span>
      <span
        aria-hidden
        className="inline-block"
        style={count?.winner === seat
          ? { animation: `totalPunch ${count.durationMs}ms ease-out ${count.delayMs}ms backwards` }
          : undefined}
      >
        {money(shown)}
      </span>
    </div>
  );
}

export function Scoreboard({ match, deltas, count }: { match: MatchState; deltas?: number[]; count?: TotalCount }) {
  return (
    <div className="card p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="section-title">Standings · {WIND_CHARS[match.prevailingWind]} round</h3>
        <span className="text-xs text-slate-500">Hand {match.handNo}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[0, 1, 2, 3].map(seat => {
          const total = match.totals[seat];
          const d = deltas?.[seat] ?? 0;
          const isDealer = seat === match.dealerSeat;
          const isYou = seat === match.humanSeat;
          return (
            <div
              key={seat}
              className={`rounded-lg p-2 text-center border bg-gradient-to-b ${
                isYou
                  ? 'from-emerald-900/45 to-emerald-950/25 border-emerald-500/45 shadow-[inset_0_1px_0_rgba(120,214,168,0.14)]'
                  : isDealer
                  ? 'from-[#2c2517] to-[#211c14] border-amber-500/35 shadow-[inset_0_1px_0_rgba(214,178,96,0.12)]'
                  : 'from-[#272219] to-[#1e1a14] border-slate-700/40'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                <span className="text-base font-bold text-slate-200">{WIND_CHARS[seatWindOf(seat, match.dealerSeat)]}</span>
                {isDealer && <span className="text-[11px] text-amber-400 font-bold">庄</span>}
              </div>
              <div className="text-[12px] text-slate-500">{isYou ? 'You' : 'AI'}</div>
              <SeatTotal seat={seat} total={total} delta={d} count={count} />
              {d !== 0 && (
                <div className={`text-[12px] ${d > 0 ? 'text-emerald-400/70' : 'text-red-400/70'}`}>{money(d)}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
