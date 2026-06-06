import { useState, useCallback } from 'react';

const WINDS = ['East', 'South', 'West', 'North'] as const;
const WIND_ZH: Record<string, string> = { East: '東', South: '南', West: '西', North: '北' };

function rollDice(): [number, number, number] {
  return [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
  ];
}

function shuffleSeats(): [string, string, string, string] {
  const arr = [...WINDS];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr as [string, string, string, string];
}

export function TableUtils() {
  const [dice, setDice] = useState<[number, number, number] | null>(null);
  const [seats, setSeats] = useState<[string, string, string, string] | null>(null);
  const [windRound, setWindRound] = useState(0);
  const [dealerIndex, setDealerIndex] = useState(0);

  const handleRollDice = useCallback(() => {
    setDice(rollDice());
  }, []);

  const handleShuffleSeats = useCallback(() => {
    setSeats(shuffleSeats());
  }, []);

  const nextDealer = useCallback(() => {
    setDealerIndex(prev => {
      const next = (prev + 1) % 4;
      if (next === 0) setWindRound(wr => Math.min(wr + 1, 3));
      return next;
    });
  }, []);

  const prevDealer = useCallback(() => {
    setDealerIndex(prev => {
      const next = (prev - 1 + 4) % 4;
      if (prev === 0) setWindRound(wr => Math.max(wr - 1, 0));
      return next;
    });
  }, []);

  const resetWind = useCallback(() => {
    setWindRound(0);
    setDealerIndex(0);
  }, []);

  return (
    <div className="space-y-4 pb-4">
      <section className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Dice Roller</h2>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleRollDice}
            className="px-4 py-2 text-sm font-medium bg-emerald-700 text-white rounded-lg active:bg-emerald-600"
          >
            Roll 3 Dice
          </button>
          {dice && (
            <div className="flex gap-2">
              {dice.map((d, i) => (
                <DiceFace key={i} value={d} />
              ))}
              <span className="text-sm text-slate-400 self-center ml-1">
                = {dice[0] + dice[1] + dice[2]}
              </span>
            </div>
          )}
        </div>
      </section>

      <section className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Seat Randomizer</h2>
        <button
          type="button"
          onClick={handleShuffleSeats}
          className="px-4 py-2 text-sm font-medium bg-emerald-700 text-white rounded-lg active:bg-emerald-600 mb-3"
        >
          Shuffle Seats
        </button>
        {seats && (
          <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
            <div />
            <SeatCard wind={seats[2]} position="Top" />
            <div />
            <SeatCard wind={seats[3]} position="Left" />
            <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center text-xs text-slate-500">
              Table
            </div>
            <SeatCard wind={seats[1]} position="Right" />
            <div />
            <SeatCard wind={seats[0]} position="Bottom" />
            <div />
          </div>
        )}
      </section>

      <section className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-300">Wind Round Tracker</h2>
          <button
            type="button"
            onClick={resetWind}
            className="text-xs text-slate-400 active:text-slate-200"
          >
            Reset
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 mb-4">
          {WINDS.map((w, i) => (
            <div
              key={w}
              className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center transition-colors ${
                windRound === i
                  ? 'bg-emerald-700 text-white'
                  : windRound > i
                    ? 'bg-slate-600 text-slate-400'
                    : 'bg-slate-700/50 text-slate-500'
              }`}
            >
              <span className="text-lg font-bold">{WIND_ZH[w]}</span>
              <span className="text-[9px]">{w}</span>
            </div>
          ))}
        </div>

        <div className="text-center mb-3">
          <div className="text-xs text-slate-400">
            Prevailing Wind: <span className="text-emerald-400 font-medium">{WIND_ZH[WINDS[windRound]]} {WINDS[windRound]}</span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Dealer: <span className="text-emerald-400 font-medium">Seat {dealerIndex + 1} ({WIND_ZH[WINDS[dealerIndex]]} {WINDS[dealerIndex]})</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={prevDealer}
            className="px-3 py-1.5 text-xs bg-slate-700 text-slate-300 rounded-lg active:bg-slate-600"
          >
            Prev Dealer
          </button>
          <button
            type="button"
            onClick={nextDealer}
            className="px-3 py-1.5 text-xs bg-emerald-700 text-white rounded-lg active:bg-emerald-600"
          >
            Next Dealer
          </button>
        </div>
      </section>
    </div>
  );
}

function DiceFace({ value }: { value: number }) {
  const dotMap: Record<number, [number, number][]> = {
    1: [[1, 1]],
    2: [[0, 2], [2, 0]],
    3: [[0, 2], [1, 1], [2, 0]],
    4: [[0, 0], [0, 2], [2, 0], [2, 2]],
    5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
    6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
  };
  const dots = dotMap[value] ?? [];

  return (
    <div className="w-10 h-10 bg-white rounded-lg grid grid-cols-3 grid-rows-3 p-1 gap-0.5">
      {Array.from({ length: 9 }, (_, idx) => {
        const row = Math.floor(idx / 3);
        const col = idx % 3;
        const hasDot = dots.some(([r, c]) => r === row && c === col);
        return (
          <div key={idx} className="flex items-center justify-center">
            {hasDot && (
              <div className={`w-1.5 h-1.5 rounded-full ${
                value === 1 || value === 4 ? 'bg-red-600' : 'bg-slate-800'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SeatCard({ wind, position }: { wind: string; position: string }) {
  return (
    <div className="w-12 h-12 bg-emerald-800/50 rounded-lg flex flex-col items-center justify-center border border-emerald-700/30">
      <span className="text-base font-bold text-emerald-300">{WIND_ZH[wind]}</span>
      <span className="text-[8px] text-slate-400">{position}</span>
    </div>
  );
}
