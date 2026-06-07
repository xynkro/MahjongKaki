import { useState, useEffect } from 'react';
import { type GameState, type GameAction } from '@mahjongkaki/game';
import { tileToIndex, type Meld, type Wind, WINDS } from '@mahjongkaki/engine';
import { TileRow } from './TileRow';

const WIND_CHARS: Record<Wind, string> = { east: '東', south: '南', west: '西', north: '北' };

interface GameBoardProps {
  state: GameState;
  availableActions: GameAction[];
  onDiscard: (tile: number) => void;
  onDeclareKong: (tile: number) => void;
  onTsumo: () => void;
  onQuit: () => void;
}

function seatWind(seat: number, dealerSeat: number): Wind {
  return WINDS[(seat - dealerSeat + 4) % 4];
}

function meldToIndices(meld: Meld): number[] {
  return meld.tiles.map(t => tileToIndex(t));
}

function TileBack({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5 flex-wrap justify-center">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="w-4 h-6 rounded-[3px] border border-emerald-950/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          style={{ backgroundImage: 'linear-gradient(to bottom, #234231 0%, #16291e 100%)' }}
        />
      ))}
    </div>
  );
}

function Seat({
  state, seat, label, showBacks,
}: { state: GameState; seat: number; label: string; showBacks?: boolean }) {
  const w = seatWind(seat, state.dealerSeat);
  const isCurrent = state.currentPlayer === seat;
  return (
    <div
      className={`rounded-xl border bg-slate-900/40 px-2 py-1.5 text-center backdrop-blur-sm transition-all duration-300
        ${isCurrent ? 'glow-seat border-emerald-500/50' : 'border-slate-700/40'}`}
    >
      <div className="flex items-center justify-center gap-1.5">
        <span className={`text-base font-bold ${isCurrent ? 'text-emerald-400' : 'text-slate-300'}`}>{WIND_CHARS[w]}</span>
        <span className="text-[10px] text-slate-500">{state.hands[seat].length}</span>
        {state.flowers[seat].length > 0 && (
          <span className="text-[10px] text-amber-400">✿{state.flowers[seat].length}</span>
        )}
      </div>
      {showBacks && <div className="mt-1"><TileBack count={state.hands[seat].length} /></div>}
      {state.melds[seat].length > 0 && (
        <div className="mt-1 flex justify-center">
          <TileRow tiles={state.melds[seat].flatMap(meldToIndices)} size="sm" sortTiles={false} animateEntrance={false} />
        </div>
      )}
      <div className="text-[9px] text-slate-600 mt-0.5">{label}</div>
    </div>
  );
}

export function GameBoard({
  state, availableActions, onDiscard, onDeclareKong, onTsumo, onQuit,
}: GameBoardProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [selectedTileValue, setSelectedTileValue] = useState<number | null>(null);

  const hs = state.humanSeat;
  const isHumanTurn = state.currentPlayer === hs && state.phase === 'discard';

  useEffect(() => {
    setSelectedIdx(null);
    setSelectedTileValue(null);
  }, [state.turnCount, state.phase]);

  const rightSeat = (hs + 1) % 4;
  const acrossSeat = (hs + 2) % 4;
  const leftSeat = (hs + 3) % 4;

  const kongActions = availableActions.filter(a => a.type === 'declare_kong');
  const canTsumo = availableActions.some(a => a.type === 'claim' && a.claimType === 'win');

  // Central pool: every discard on the table, latest highlighted.
  const pool = [0, 1, 2, 3].flatMap(s => state.discards[s]);
  const lastTile = state.lastDiscard?.tile;
  const showActions = isHumanTurn && (selectedTileValue !== null || kongActions.length > 0 || canTsumo);

  function handleTileClick(tile: number, idx: number) {
    if (!isHumanTurn) return;
    if (selectedIdx === idx) {
      onDiscard(tile);
      setSelectedIdx(null);
      setSelectedTileValue(null);
    } else {
      setSelectedIdx(idx);
      setSelectedTileValue(tile);
    }
  }

  return (
    <div className="flex flex-col h-full felt">
      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/60 border-b border-amber-400/10 text-xs text-slate-400 backdrop-blur">
        <button onClick={onQuit} className="text-slate-500 active:text-slate-300 text-base leading-none active:scale-90">✕</button>
        <span className="font-medium">Round {WIND_CHARS[state.prevailingWind]} · {state.roundNumber}</span>
        <span className={isHumanTurn ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
          {isHumanTurn ? 'Your turn' : `${WIND_CHARS[seatWind(state.currentPlayer, state.dealerSeat)]} playing…`}
        </span>
      </div>

      {/* The table */}
      <div className="flex-1 flex flex-col min-h-0 px-2 py-2 gap-2">
        {/* Across opponent */}
        <div className="flex justify-center">
          <div className="w-44"><Seat state={state} seat={acrossSeat} label="across" showBacks /></div>
        </div>

        {/* Left | pool | right */}
        <div className="flex-1 flex items-stretch gap-2 min-h-0">
          <div className="w-16 flex items-center"><div className="w-full"><Seat state={state} seat={leftSeat} label="left" /></div></div>

          {/* Centre discard pool */}
          <div className="flex-1 relative rounded-2xl border border-emerald-950/40 bg-emerald-950/20 p-2 overflow-y-auto">
            <div className="absolute top-1.5 right-2 text-[10px] text-slate-500 bg-slate-900/50 rounded-full px-2 py-0.5 z-10">
              wall {state.wall.length}
            </div>
            {pool.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[11px] text-slate-600">
                discards land here
              </div>
            ) : (
              <div className="flex flex-wrap gap-1 justify-center content-start pt-5">
                <TileRow
                  tiles={pool}
                  size="sm"
                  sortTiles={false}
                  highlightTiles={lastTile !== undefined ? new Set([lastTile]) : undefined}
                />
              </div>
            )}
          </div>

          <div className="w-16 flex items-center"><div className="w-full"><Seat state={state} seat={rightSeat} label="right" /></div></div>
        </div>
      </div>

      {/* Player area */}
      <div
        className={`border-t border-slate-700/50 bg-slate-900/50 px-2 pt-2 pb-2 backdrop-blur transition-shadow duration-500
          ${isHumanTurn ? 'glow-turn' : ''}`}
      >
        <div className="flex items-center gap-2 mb-1.5 min-h-[20px]">
          <span className="text-xs font-bold text-emerald-400">{WIND_CHARS[seatWind(hs, state.dealerSeat)]} You</span>
          {state.flowers[hs].length > 0 && (
            <span className="text-[10px] text-amber-400">✿ {state.flowers[hs].length}</span>
          )}
          {state.melds[hs].length > 0 && (
            <div className="flex">
              <TileRow tiles={state.melds[hs].flatMap(meldToIndices)} size="sm" sortTiles={false} animateEntrance={false} />
            </div>
          )}
        </div>

        <TileRow
          tiles={state.hands[hs]}
          onTileClick={isHumanTurn ? handleTileClick : undefined}
          selectedTiles={isHumanTurn && selectedIdx !== null ? new Set([selectedIdx]) : undefined}
        />

        {showActions && (
          <div className="anim-pop flex gap-2 mt-2 justify-center">
            {selectedTileValue !== null && (
              <button
                onClick={() => { onDiscard(selectedTileValue); setSelectedIdx(null); setSelectedTileValue(null); }}
                className="px-5 py-2 bg-emerald-700 text-white rounded-lg text-sm font-medium active:scale-95 active:bg-emerald-600"
              >
                Discard
              </button>
            )}
            {kongActions.map((a, i) => (
              <button
                key={i}
                onClick={() => { if (a.type === 'declare_kong') onDeclareKong(a.tile); }}
                className="px-5 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium active:scale-95 active:bg-amber-500"
              >
                Kong
              </button>
            ))}
            {canTsumo && (
              <button
                onClick={onTsumo}
                className="anim-tsumo px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-bold shadow-[0_0_18px_rgba(218,90,68,0.5)] active:scale-95 active:bg-red-500"
              >
                Tsumo!
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
