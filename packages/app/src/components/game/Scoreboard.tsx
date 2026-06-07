import { formatCurrency } from '@mahjongkaki/engine';
import { type MatchState, seatWindOf } from './match';

const WIND_CHARS: Record<string, string> = { east: '東', south: '南', west: '西', north: '北' };

function money(n: number): string {
  if (n === 0) return '—';
  return (n > 0 ? '+' : '') + formatCurrency(n);
}

export function Scoreboard({ match, deltas }: { match: MatchState; deltas?: number[] }) {
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
              className={`rounded-lg p-2 text-center border ${
                isYou ? 'border-emerald-500/50 bg-emerald-900/15' : 'border-slate-700/40'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                <span className="text-base font-bold text-slate-200">{WIND_CHARS[seatWindOf(seat, match.dealerSeat)]}</span>
                {isDealer && <span className="text-[9px] text-amber-400 font-bold">庄</span>}
              </div>
              <div className="text-[10px] text-slate-500">{isYou ? 'You' : 'AI'}</div>
              <div className={`text-sm font-bold ${total > 0 ? 'text-emerald-400' : total < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                {money(total)}
              </div>
              {d !== 0 && (
                <div className={`text-[10px] ${d > 0 ? 'text-emerald-400/70' : 'text-red-400/70'}`}>{money(d)}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
