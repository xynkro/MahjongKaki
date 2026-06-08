import { useState, useEffect, useRef } from 'react';
import { type GameState, type GameAction } from '@mahjongkaki/game';
import { tileToIndex, type Meld, type Wind, type BonusTile, WINDS } from '@mahjongkaki/engine';
import { TileRow } from './TileRow';
import { TileFace } from './TileFace';
import { haptics, sound } from '../../lib/haptics';

const WIND_CHARS: Record<Wind, string> = { east: '東', south: '南', west: '西', north: '北' };
const IVORY = 'linear-gradient(to bottom, #FBF4E4 0%, #F1E7D2 55%, #E4D2AC 100%)';

const BONUS_CHARS: Record<string, string> = {
  plum: '梅', orchid: '蘭', chrysanthemum: '菊', bamboo_flower: '竹',
  spring: '春', summer: '夏', autumn: '秋', winter: '冬',
  cat: '猫', rat: '鼠', rooster: '雞', centipede: '蜈',
};
function bonusChar(b: BonusTile): string {
  if (b.kind === 'flower') return BONUS_CHARS[b.flower];
  if (b.kind === 'season') return BONUS_CHARS[b.season];
  return BONUS_CHARS[b.animal];
}

interface GameBoardProps {
  state: GameState;
  availableActions: GameAction[];
  onDiscard: (tile: number) => void;
  onDeclareKong: (tile: number) => void;
  onTsumo: () => void;
  onQuit: () => void;
  /** Play the born-home discard settle (suppressed at fast/instant speed). */
  animateDiscards?: boolean;
}

function seatWind(seat: number, dealerSeat: number): Wind {
  return WINDS[(seat - dealerSeat + 4) % 4];
}

function meldToIndices(meld: Meld): number[] {
  return meld.tiles.map(t => tileToIndex(t));
}

function discDir(player: number, hs: number): string {
  if (player === hs) return 'disc-bottom';
  if (player === (hs + 2) % 4) return 'disc-top';
  if (player === (hs + 1) % 4) return 'disc-right';
  return 'disc-left';
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
        <span className="text-[12px] text-slate-500">{state.hands[seat].length}</span>
        {state.flowers[seat].length > 0 && (
          <span className="text-[12px] text-amber-400">✿{state.flowers[seat].length}</span>
        )}
      </div>
      {showBacks && <div className="mt-1"><TileBack count={state.hands[seat].length} /></div>}
      {state.melds[seat].length > 0 && (
        <div className="mt-1 flex justify-center">
          <TileRow tiles={state.melds[seat].flatMap(meldToIndices)} size="sm" sortTiles={false} animateEntrance={false} />
        </div>
      )}
      <div className="text-[11px] text-slate-600 mt-0.5">{label}</div>
    </div>
  );
}

// Large centre-stage tile used by the draw/discard flash overlays.
function BigTile({ tile, cls }: { tile: number; cls: string }) {
  return (
    <div
      className={`relative overflow-hidden tile-sheen w-20 h-28 rounded-xl border-2 border-amber-400/80 shadow-tile-up flex items-center justify-center ${cls}`}
      style={{ backgroundImage: IVORY }}
    >
      <div className="scale-[1.9]"><TileFace index={tile} size="md" /></div>
    </div>
  );
}

export function GameBoard({
  state, availableActions, onDiscard, onDeclareKong, onTsumo, onQuit, animateDiscards = true,
}: GameBoardProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [selectedTileValue, setSelectedTileValue] = useState<number | null>(null);

  const hs = state.humanSeat;
  const isHumanTurn = state.currentPlayer === hs && state.phase === 'discard';

  useEffect(() => {
    setSelectedIdx(null);
    setSelectedTileValue(null);
  }, [state.turnCount, state.phase]);

  // Flower pop: fire when the human's flower count grows.
  const prevFlowers = useRef(state.flowers[hs].length);
  const popNonce = useRef(0);
  const [flowerPop, setFlowerPop] = useState<{ tiles: BonusTile[]; nonce: number } | null>(null);
  const flowerCount = state.flowers[hs].length;
  useEffect(() => {
    if (flowerCount > prevFlowers.current) {
      const added = state.flowers[hs].slice(prevFlowers.current);
      haptics.flower();
      popNonce.current += 1;
      setFlowerPop({ tiles: added, nonce: popNonce.current });
      prevFlowers.current = flowerCount;
      const id = setTimeout(() => setFlowerPop(null), 1200);
      return () => clearTimeout(id);
    }
    prevFlowers.current = flowerCount;
  }, [flowerCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // Draw flash: big centre reveal of the human's freshly drawn tile before it joins the hand.
  const drawNonce = useRef(0);
  const prevDraw = useRef(state.lastDraw);
  const [drawFlash, setDrawFlash] = useState<{ tile: number; nonce: number } | null>(null);
  useEffect(() => {
    const ld = state.lastDraw;
    if (ld && ld !== prevDraw.current && ld.player === hs) {
      drawNonce.current += 1;
      setDrawFlash({ tile: ld.tile, nonce: drawNonce.current });
      sound.draw();
      prevDraw.current = ld;
      const id = setTimeout(() => setDrawFlash(null), 820);
      return () => clearTimeout(id);
    }
    prevDraw.current = ld;
  }, [state.lastDraw, hs]);

  // Discard flash: big centre reveal of any thrown tile before it shrinks to the pool.
  const discNonce = useRef(0);
  const prevDiscLen = useRef(state.discardLog.length);
  const [discardFlash, setDiscardFlash] = useState<{ tile: number; nonce: number } | null>(null);
  useEffect(() => {
    const len = state.discardLog.length;
    if (len > prevDiscLen.current) {
      const last = state.discardLog[len - 1];
      discNonce.current += 1;
      setDiscardFlash({ tile: last.tile, nonce: discNonce.current });
      if (last.player !== hs) sound.throw(); // human's own throw is sounded by the discard tap
      prevDiscLen.current = len;
      const id = setTimeout(() => setDiscardFlash(null), 680);
      return () => clearTimeout(id);
    }
    prevDiscLen.current = len;
  }, [state.discardLog, hs]);

  const rightSeat = (hs + 1) % 4;
  const acrossSeat = (hs + 2) % 4;
  const leftSeat = (hs + 3) % 4;

  const kongActions = availableActions.filter(a => a.type === 'declare_kong');
  const canTsumo = availableActions.some(a => a.type === 'claim' && a.claimType === 'win');
  const showActions = isHumanTurn && (selectedTileValue !== null || kongActions.length > 0 || canTsumo);

  const lastIdx = state.discardLog.length - 1;
  const drawnTile = isHumanTurn && state.lastDraw?.player === hs ? state.lastDraw.tile : undefined;

  function handleTileClick(tile: number, idx: number) {
    if (!isHumanTurn) return;
    if (selectedIdx === idx) {
      haptics.select();
      onDiscard(tile);
      setSelectedIdx(null);
      setSelectedTileValue(null);
    } else {
      haptics.tap();
      setSelectedIdx(idx);
      setSelectedTileValue(tile);
    }
  }

  return (
    <div className="relative flex flex-col h-full" style={{ background: 'radial-gradient(130% 100% at 50% 22%, #34160c, #190a06)' }}>
      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-black/30 border-b border-amber-400/10 text-xs text-amber-100/70 backdrop-blur">
        <button onClick={onQuit} className="text-amber-100/60 active:text-amber-100 text-base leading-none active:scale-90">✕</button>
        <span className="round-badge">{WIND_CHARS[state.prevailingWind]} {state.roundNumber}</span>
        <span className={isHumanTurn ? 'text-emerald-300 font-bold' : 'text-amber-100/70'}>
          {isHumanTurn ? 'Your turn' : `${WIND_CHARS[seatWind(state.currentPlayer, state.dealerSeat)]} playing…`}
        </span>
      </div>

      {/* The table — ornate framed felt, tilted back in 3D perspective (hand stays flat) */}
      <div
        className="flex-1 min-h-0 mx-2 mt-1 mb-3 table-frame"
        style={{ transform: 'perspective(1300px) rotateX(16deg)', transformOrigin: '50% 90%' }}
      >
       <div className="relative isolate h-full felt rounded-[0.85rem] overflow-hidden flex flex-col p-2 gap-2">
        <div className="felt-medallion -z-10" />
        <div className="flex justify-center">
          <div className="w-44"><Seat state={state} seat={acrossSeat} label="across" showBacks /></div>
        </div>

        <div className="flex-1 flex items-stretch gap-2 min-h-0">
          <div className="w-16 flex items-center"><div className="w-full"><Seat state={state} seat={leftSeat} label="left" /></div></div>

          {/* Centre discard pool — born-home tiles, latest leans in from its seat */}
          <div className="flex-1 relative rounded-xl border border-emerald-950/25 bg-emerald-950/10 p-2 overflow-y-auto">
            <div className="absolute top-1.5 right-2 text-[12px] text-slate-500 bg-slate-900/50 rounded-full px-2 py-0.5 z-10">
              wall {state.wall.length}
            </div>
            {state.discardLog.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[13px] text-slate-600">discards land here</div>
            ) : (
              <div className="flex flex-wrap gap-1 justify-center content-start pt-5">
                {state.discardLog.map((d, i) => {
                  const isLast = i === lastIdx;
                  return (
                    <div key={i} className={isLast && animateDiscards ? discDir(d.player, hs) : ''}>
                      <div
                        style={{ backgroundImage: IVORY }}
                        className={`w-7 h-10 relative rounded-[6px] flex items-center justify-center overflow-hidden border border-[#C6AE84] shadow-tile
                          ${isLast ? 'ring-2 ring-amber-400' : ''}`}
                      >
                        <TileFace index={d.tile} size="sm" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="w-16 flex items-center"><div className="w-full"><Seat state={state} seat={rightSeat} label="right" /></div></div>
        </div>
       </div>
      </div>

      {/* Player area */}
      <div className={`border-t border-slate-700/50 bg-slate-900/50 px-2 pt-2 pb-2 backdrop-blur transition-shadow duration-500 ${isHumanTurn ? 'glow-turn' : ''}`}>
        <div className="flex items-center gap-2 mb-1.5 min-h-[20px]">
          <span className="text-xs font-bold text-emerald-400">{WIND_CHARS[seatWind(hs, state.dealerSeat)]} You</span>
          {flowerCount > 0 && (
            <span key={flowerPop?.nonce ?? 'f'} className={`text-[12px] text-amber-400 inline-block ${flowerPop ? 'anim-badge' : ''}`}>
              ✿ {flowerCount}
            </span>
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
          highlightTiles={drawnTile !== undefined ? new Set([drawnTile]) : undefined}
          drawnTile={drawnTile}
        />

        {showActions && (
          <div className="anim-pop flex gap-2 mt-2 justify-center">
            {selectedTileValue !== null && (
              <button
                onClick={() => { haptics.select(); onDiscard(selectedTileValue); setSelectedIdx(null); setSelectedTileValue(null); }}
                className="px-5 py-2 bg-emerald-700 text-white rounded-lg text-sm font-medium active:scale-95 active:bg-emerald-600"
              >
                Discard
              </button>
            )}
            {kongActions.map((a, i) => (
              <button
                key={i}
                onClick={() => { if (a.type === 'declare_kong') { haptics.select(); onDeclareKong(a.tile); } }}
                className="px-5 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium active:scale-95 active:bg-amber-500"
              >
                Kong
              </button>
            ))}
            {canTsumo && (
              <button
                onClick={() => { haptics.success(); onTsumo(); }}
                className="anim-tsumo px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-bold shadow-[0_0_18px_rgba(218,90,68,0.5)] active:scale-95 active:bg-red-500"
              >
                Tsumo!
              </button>
            )}
          </div>
        )}
      </div>

      {/* Flower pop — the hero moment */}
      {flowerPop && (
        <div key={flowerPop.nonce} className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <div className="relative flex items-center justify-center">
            <div
              className="anim-bloom absolute w-24 h-24 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(201,162,75,0.55), transparent 65%)' }}
            />
            <div className="relative flex gap-2">
              {flowerPop.tiles.map((b, i) => (
                <div
                  key={i}
                  className="anim-flower relative overflow-hidden tile-sheen w-14 h-[72px] rounded-lg border-2 border-amber-400 shadow-tile-up flex flex-col items-center justify-center"
                  style={{ backgroundImage: IVORY, animationDelay: `${i * 90}ms` }}
                >
                  <span className="text-3xl font-bold text-amber-700 leading-none">{bonusChar(b)}</span>
                  <span className="text-[10px] text-amber-700/70 mt-0.5">bonus</span>
                </div>
              ))}
            </div>
            <div className="absolute -bottom-7 text-amber-300 text-xs font-semibold whitespace-nowrap drop-shadow">
              +{flowerPop.tiles.length} flower · draw again
            </div>
          </div>
        </div>
      )}

      {/* Big centre-stage flashes — draw (settles toward hand) + discard (shrinks to pool) */}
      {drawFlash && (
        <div key={`draw${drawFlash.nonce}`} className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
          <BigTile tile={drawFlash.tile} cls="anim-drawbig" />
        </div>
      )}
      {discardFlash && (
        <div key={`disc${discardFlash.nonce}`} className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
          <BigTile tile={discardFlash.tile} cls="anim-discardbig" />
        </div>
      )}
    </div>
  );
}
