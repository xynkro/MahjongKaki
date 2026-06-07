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

export function GameBoard({
  state,
  availableActions,
  onDiscard,
  onDeclareKong,
  onTsumo,
  onQuit,
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
  const opponents = [rightSeat, acrossSeat, leftSeat];

  const kongActions = availableActions.filter(a => a.type === 'declare_kong');
  const canTsumo = availableActions.some(
    a => a.type === 'claim' && a.claimType === 'win',
  );

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
    <div className="flex flex-col h-full">
      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-800/80 border-b border-slate-700/50 text-xs text-slate-400">
        <button
          onClick={onQuit}
          className="text-slate-500 active:text-slate-300"
        >
          ✕
        </button>
        <span>{WIND_CHARS[state.prevailingWind]} R{state.roundNumber}</span>
        <span>Wall: {state.wall.length}</span>
        <span
          className={
            state.currentPlayer === hs
              ? 'text-emerald-400 font-bold'
              : ''
          }
        >
          {state.currentPlayer === hs
            ? 'Your turn'
            : `${WIND_CHARS[seatWind(state.currentPlayer, state.dealerSeat)]} thinking...`}
        </span>
      </div>

      {/* Opponents */}
      <div className="grid grid-cols-3 gap-1.5 px-2 py-2">
        {opponents.map(seat => {
          const w = seatWind(seat, state.dealerSeat);
          const isCurrent = state.currentPlayer === seat;
          return (
            <div
              key={seat}
              className={`rounded-lg p-2 text-center border ${
                isCurrent
                  ? 'bg-slate-700 border-emerald-500/50'
                  : 'bg-slate-800/50 border-slate-700/50'
              }`}
            >
              <div className="text-lg font-bold text-slate-300">
                {WIND_CHARS[w]}
              </div>
              <div className="text-[10px] text-slate-500">
                {state.hands[seat].length} tiles
              </div>
              {state.melds[seat].length > 0 && (
                <div className="mt-1 flex justify-center">
                  <TileRow
                    tiles={state.melds[seat].flatMap(meldToIndices)}
                    size="sm"
                    sortTiles={false}
                  />
                </div>
              )}
              {state.flowers[seat].length > 0 && (
                <div className="text-[10px] text-amber-400 mt-0.5">
                  +{state.flowers[seat].length}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Discard ponds */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
        {[0, 1, 2, 3].map(seat => {
          const w = seatWind(seat, state.dealerSeat);
          const isLastDiscarder = state.lastDiscard?.player === seat;
          return (
            <div key={seat} className="flex items-start gap-1">
              <span
                className={`text-[10px] w-4 shrink-0 mt-1 ${
                  isLastDiscarder ? 'text-amber-400 font-bold' : 'text-slate-600'
                }`}
              >
                {WIND_CHARS[w]}
              </span>
              {state.discards[seat].length > 0 ? (
                <TileRow tiles={state.discards[seat]} size="sm" sortTiles={false} />
              ) : (
                <span className="text-[10px] text-slate-700 mt-1">--</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Player area */}
      <div className="border-t border-slate-700/50 bg-slate-800/50 px-2 pt-2 pb-2">
        <div className="flex items-center gap-2 mb-1.5 min-h-[20px]">
          <span className="text-xs font-bold text-emerald-400">
            {WIND_CHARS[seatWind(hs, state.dealerSeat)]} You
          </span>
          {state.flowers[hs].length > 0 && (
            <span className="text-[10px] text-amber-400">
              Flowers: {state.flowers[hs].length}
            </span>
          )}
          {state.melds[hs].length > 0 && (
            <div className="flex">
              <TileRow
                tiles={state.melds[hs].flatMap(meldToIndices)}
                size="sm"
                sortTiles={false}
              />
            </div>
          )}
        </div>

        <TileRow
          tiles={state.hands[hs]}
          onTileClick={isHumanTurn ? handleTileClick : undefined}
          selectedTiles={
            isHumanTurn && selectedIdx !== null
              ? new Set([selectedIdx])
              : undefined
          }
        />

        {isHumanTurn && (
          <div className="flex gap-2 mt-2 justify-center">
            {selectedTileValue !== null && (
              <button
                onClick={() => {
                  onDiscard(selectedTileValue);
                  setSelectedIdx(null);
                  setSelectedTileValue(null);
                }}
                className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-sm font-medium active:bg-emerald-600"
              >
                Discard
              </button>
            )}
            {kongActions.map((a, i) => (
              <button
                key={i}
                onClick={() => {
                  if (a.type === 'declare_kong') onDeclareKong(a.tile);
                }}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium active:bg-amber-500"
              >
                Kong
              </button>
            ))}
            {canTsumo && (
              <button
                onClick={onTsumo}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold active:bg-red-500"
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
