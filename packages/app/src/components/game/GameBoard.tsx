import { useState, useEffect, useRef, useMemo } from 'react';
import { coachDiscard, tileName } from '../../lib/coach';
import { useDisplay, setDisplay } from '../../lib/display';
import { type GameState, type GameAction } from '@mahjongkaki/game';
import { tileToIndex, type Meld, type Wind, type BonusTile, WINDS } from '@mahjongkaki/engine';
import { AnimalArt, FlowerArt } from '../BonusArt';
import { TileRow } from './TileRow';
import { TileFace } from './TileFace';
import { NumbersCard } from './NumbersCard';
import { haptics, sound } from '../../lib/haptics';
import { Table3D } from './Table3D';
import { turnGuide } from '../../lib/guide';
import { useImmersive, useLandscape } from '../../lib/immersive';
import { WallRing, useDealIntro, DiceFace, rollDice, dealtCount, breakSeat, wallUsage, totalTiles } from './Wall';

const WIND_CHARS: Record<Wind, string> = { east: '東', south: '南', west: '西', north: '北' };
const WIND_EN: Record<Wind, string> = { east: 'East', south: 'South', west: 'West', north: 'North' };
const IVORY = 'linear-gradient(to bottom, #FBF4E4 0%, #F1E7D2 55%, #E4D2AC 100%)';

function bonusName(b: BonusTile): string {
  if (b.kind === 'flower') return b.flower === 'bamboo_flower' ? 'bamboo' : b.flower === 'chrysanthemum' ? 'chrysanth.' : b.flower;
  if (b.kind === 'season') return b.season;
  return b.animal;
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
  /** Online: who's in each seat. Without it seats read across/left/right. */
  seatNames?: string[];
  /** Online: overrides the status text at the top right. */
  statusText?: string;
  /** Online games with friends pass false: the coach is for practice against the AI only. */
  allowCoach?: boolean;
  /** Play the wall-building, dice and deal intro; the game waits until onDealDone. */
  dealIntro?: boolean;
  onDealDone?: () => void;
  /** Play vs AI: the Faster button (AI moves quicker; your own turns are never timed). */
  fast?: boolean;
  onToggleFast?: () => void;
  /** Opens the game options (view, guide, coach…). */
  onOptions?: () => void;
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

const ivoryTile = 'relative rounded-[6px] flex items-center justify-center overflow-hidden border border-[#C6AE84] shadow-tile';

function sentenceCase(t: string) { return t.charAt(0).toUpperCase() + t.slice(1); }

/** The most recent throw, large, with who threw it in words. */
function LastThrown({ last, takenBy, who, wind, wallLeft, animCls, compact }: {
  last: { tile: number; player: number } | null; takenBy: string | null; who: string; wind: string; wallLeft: number; animCls: string;
  /** Floating over the 3D table: smaller, and no wall count (the table shows it). */
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-black/70 px-2 py-1 shadow-lg">
        {last ? (
          <>
            <div key={`${last.player}:${last.tile}:${wallLeft}`} className={animCls}>
              <div style={{ backgroundImage: IVORY }} className={`${ivoryTile} w-[40px] h-[56px] ring-[3px] ring-amber-400`}>
                <TileFace index={last.tile} size="md" />
              </div>
            </div>
            <div className="min-w-0 leading-tight">
              <div className="text-[12px] text-amber-100/70">Just thrown by</div>
              <div className="text-[14px] font-bold text-amber-50 truncate">{wind} {who}</div>
              <div className="text-[13px] font-semibold text-amber-200 truncate">{sentenceCase(tileName(last.tile))}</div>
            </div>
          </>
        ) : takenBy ? (
          <div className="text-[13px] font-semibold text-amber-50 leading-snug">Taken by {takenBy}</div>
        ) : null}
      </div>
    );
  }
  return (
    <div className="shrink-0 flex items-center gap-3 rounded-lg bg-black/30 px-2.5 py-1 min-h-[80px]">
      {last ? (
        <>
          <div key={`${last.player}:${last.tile}:${wallLeft}`} className={animCls}>
            <div style={{ backgroundImage: IVORY }} className={`${ivoryTile} w-[52px] h-[72px] ring-[3px] ring-amber-400`}>
              <TileFace index={last.tile} size="lg" />
            </div>
          </div>
          <div className="min-w-0 leading-tight">
            <div className="text-[13px] text-amber-100/70">Just thrown by</div>
            <div className="text-[17px] font-bold text-amber-50 truncate">{wind} {who}</div>
            <div className="text-[15px] font-semibold text-amber-200">{sentenceCase(tileName(last.tile))}</div>
          </div>
        </>
      ) : takenBy ? (
        <div className="text-[16px] font-semibold text-amber-50 leading-snug">The last tile was taken by<br />{takenBy}</div>
      ) : (
        <div className="text-[15px] text-amber-100/70">Thrown tiles show up here</div>
      )}
      <div className="ml-auto self-start text-right text-[12px] leading-tight text-amber-100/70 shrink-0">
        <span className="block text-[17px] font-bold text-amber-50">{wallLeft}</span>left in<br />the wall
      </div>
    </div>
  );
}

/** One player's row: name, tiles in hand, flowers, their melds (outlined), then everything they have thrown. */
function PlayerRow({ state, seat, title, short, count, lastIdx }: {
  state: GameState; seat: number; title: string; short: string; count?: number; lastIdx: number;
}) {
  const w = seatWind(seat, state.dealerSeat);
  const tiles = count ?? state.hands[seat].length;
  const isCurrent = state.currentPlayer === seat;
  const thrown = state.discardLog.map((d, i) => ({ ...d, i })).filter(d => d.player === seat);
  const melds = state.melds[seat];
  return (
    <section
      data-seat={seat}
      className={`rounded-lg px-1.5 py-1 transition-colors duration-300 ${isCurrent ? 'bg-emerald-400/15 ring-2 ring-emerald-400/70' : 'bg-black/20'}`}
      aria-label={`${title}: ${thrown.length} thrown`}
    >
      <div className="flex flex-wrap gap-[3px] items-center">
        {/* Name chip, the same height as a tile, so a short row stays one line tall. */}
        <div className="h-[42px] min-w-[64px] max-w-[96px] mr-1 flex flex-col justify-center leading-none">
          <div className="flex items-baseline gap-1 min-w-0">
            <span className={`text-[17px] font-bold ${isCurrent ? 'text-emerald-300' : 'text-amber-50'}`}>{WIND_CHARS[w]}</span>
            <span className={`text-[13px] font-semibold truncate ${isCurrent ? 'text-emerald-200' : 'text-amber-50/90'}`}>{short}</span>
          </div>
          <div className="mt-1 text-[11.5px] text-amber-100/65 whitespace-nowrap">
            {isCurrent ? <span className="font-semibold text-emerald-300">playing · </span> : null}{tiles} tiles
            {state.flowers[seat].length > 0 && <span className="text-amber-400"> ✿{state.flowers[seat].length}</span>}
          </div>
        </div>
        {melds.map((m, mi) => (
          <div key={`m${mi}`} className="flex gap-px rounded-md ring-2 ring-sky-300/80 p-px mr-1" title={`${m.type} shown`}>
            {meldToIndices(m).map((t, k) => (
              <div key={k} style={{ backgroundImage: IVORY }} className={`${ivoryTile} w-[30px] h-[42px]`}><TileFace index={t} size="sm" /></div>
            ))}
          </div>
        ))}
        {thrown.map(d => (
          <div key={d.i} style={{ backgroundImage: IVORY }} className={`${ivoryTile} w-[30px] h-[42px] ${d.i === lastIdx ? 'ring-[3px] ring-amber-400' : ''}`}>
            <TileFace index={d.tile} size="sm" />
          </div>
        ))}
        {melds.length === 0 && thrown.length === 0 && <span className="text-[12px] text-amber-100/50">nothing thrown yet</span>}
      </div>
    </section>
  );
}

// Large centre-stage tile used by the draw/discard flash overlays.
function BigTile({ tile, cls }: { tile: number; cls: string }) {
  return (
    <div
      className={`relative overflow-hidden tile-sheen w-20 h-28 rounded-xl border-2 border-amber-400/80 shadow-tile-up ${cls}`}
      style={{ backgroundImage: IVORY }}
    >
      <div className="absolute inset-0 p-2 flex items-center justify-center"><TileFace index={tile} size="md" /></div>
    </div>
  );
}

export function GameBoard({
  state, availableActions, onDiscard, onDeclareKong, onTsumo, onQuit, animateDiscards = true, seatNames, statusText, allowCoach = true,
  dealIntro = false, onDealDone, fast, onToggleFast, onOptions,
}: GameBoardProps) {
  useImmersive(true);
  const landscape = useLandscape();
  // Until they've tried it once, suggest turning the phone for the bigger table.
  const [seenSideways, setSeenSideways] = useState(() => { try { return localStorage.getItem('mk_seen_landscape') === '1'; } catch { return true; } });
  useEffect(() => {
    if (landscape && !seenSideways) {
      setSeenSideways(true);
      try { localStorage.setItem('mk_seen_landscape', '1'); } catch { /* ignore */ }
    }
  }, [landscape, seenSideways]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showNumbers, setShowNumbers] = useState(false);
  const [selectedTileValue, setSelectedTileValue] = useState<number | null>(null);

  const hs = state.humanSeat;
  const isHumanTurn = state.currentPlayer === hs && state.phase === 'discard';
  const { coach, drawYourself, table3d, turnGuide: guideOn } = useDisplay();
  const [dice] = useState(rollDice);

  // Draw it yourself: the engine has already drawn your tile; hold it back until you tap the wall.
  const [awaiting, setAwaiting] = useState<{ tile: number; fromBack: boolean } | null>(null);
  const kongs = state.melds[hs].filter(m => m.type === 'kong').length;
  const prevKongs = useRef(kongs);
  useEffect(() => { if (!isHumanTurn && awaiting) setAwaiting(null); }, [isHumanTurn, awaiting]);
  const canAct = isHumanTurn && !awaiting && !dealIntro;

  const tip = useMemo(
    () => (allowCoach && coach && canAct ? coachDiscard(state.hands[hs], state.melds[hs], state.discardLog) : null),
    // Recompute once per turn, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allowCoach, coach, canAct, state.turnCount, state.hands[hs].length],
  );

  const hasFlowers = state.flowers.some(f => f.length > 0);
  const intro = useDealIntro(dealIntro, state, hasFlowers);
  const usage = wallUsage(state);

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
      prevDraw.current = ld;
      // A kong replacement comes from the back of the wall; a normal draw from the front.
      const fromBack = kongs > prevKongs.current;
      prevKongs.current = kongs;
      if (allowCoach && drawYourself) { setAwaiting({ tile: ld.tile, fromBack }); return; }
      return showDraw(ld.tile);
    }
    prevDraw.current = ld;
    prevKongs.current = kongs;
  }, [state.lastDraw, hs]); // eslint-disable-line react-hooks/exhaustive-deps

  function showDraw(tile: number) {
    drawNonce.current += 1;
    setDrawFlash({ tile, nonce: drawNonce.current });
    sound.draw();
    const id = setTimeout(() => setDrawFlash(null), 820);
    return () => clearTimeout(id);
  }

  function takeFromWall() {
    if (!awaiting) return;
    haptics.tap();
    const tile = awaiting.tile;
    setAwaiting(null);
    showDraw(tile);
  }

  // Discard flash: big centre reveal of any thrown tile before it shrinks to the pool.
  const discNonce = useRef(0);
  const prevDiscLen = useRef(state.discardLog.length);
  const [discardFlash, setDiscardFlash] = useState<{ tile: number; nonce: number } | null>(null);
  // Set when the latest throw is claimed (it leaves the pool); cleared by the next throw.
  const [lastTaken, setLastTaken] = useState(false);
  useEffect(() => {
    const len = state.discardLog.length;
    if (len < prevDiscLen.current) setLastTaken(true);
    if (len > prevDiscLen.current) {
      setLastTaken(false);
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
  const showActions = canAct && (selectedTileValue !== null || kongActions.length > 0 || canTsumo);

  const lastIdx = state.discardLog.length - 1;
  // The latest throw. Skipped claims leave it in the pool; a claimed one leaves it, and then the
  // strip says who took it instead of showing an older tile as if it were new.
  const lastEntry = state.discardLog[lastIdx];
  const liveLast = lastEntry && !lastTaken ? lastEntry : null;
  // When the rows overflow, keep the row of whoever just threw in view.
  const rowsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!lastEntry) return;
    const box = rowsRef.current;
    const row = box?.querySelector<HTMLElement>(`[data-seat="${lastEntry.player}"]`);
    if (!box || !row) return;
    const top = row.offsetTop - box.offsetTop;
    if (top < box.scrollTop || top + row.offsetHeight > box.scrollTop + box.clientHeight) {
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      box.scrollTo({ top: Math.max(0, top + row.offsetHeight - box.clientHeight), behavior: reduce ? 'auto' : 'smooth' });
    }
  }, [state.discardLog.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const seatTitle = (seat: number) => {
    const wind = WIND_EN[seatWind(seat, state.dealerSeat)];
    if (seat === hs) return `You (${wind})`;
    const name = seatNames?.[seat];
    const where = seat === rightSeat ? 'right' : seat === leftSeat ? 'left' : 'across';
    return name ? `${name} (${wind})` : `${wind} (${where})`;
  };
  const drawnTile = canAct && state.lastDraw?.player === hs ? state.lastDraw.tile : undefined;

  // What your hand shows: during the deal, only the tiles dealt so far; while your draw is
  // waiting in the wall, everything except that tile.
  let myTiles = state.hands[hs];
  if (dealIntro) myTiles = myTiles.slice(0, dealtCount(intro.dealt, hs, state.dealerSeat));
  else if (awaiting) {
    const at = myTiles.lastIndexOf(awaiting.tile);
    myTiles = at < 0 ? myTiles : [...myTiles.slice(0, at), ...myTiles.slice(at + 1)];
  }
  const seatCount = (seat: number) => (dealIntro ? dealtCount(intro.dealt, seat, state.dealerSeat) : undefined);

  function handleTileClick(tile: number, idx: number) {
    if (!canAct) return;
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

  // Drag a hand tile up and release to throw (discard) it.
  function handleThrow(tile: number) {
    if (!canAct) return;
    haptics.select();
    onDiscard(tile);
    setSelectedIdx(null);
    setSelectedTileValue(null);
  }

  const shortName = (seat: number) => (seat === hs ? 'You' : (seatNames?.[seat] ?? WIND_EN[seatWind(seat, state.dealerSeat)]));
  const guide = guideOn && !dealIntro && !awaiting // the Draw card already says it
    ? turnGuide(state, { awaiting: Boolean(awaiting), canTsumo: canAct && canTsumo, canKong: canAct && kongActions.length > 0, seatName: s => seatTitle(s) })
    : null;
  const status = statusText ?? (dealIntro ? 'Dealing' : isHumanTurn ? (awaiting ? 'Your turn: draw a tile' : 'Your turn') : `${WIND_EN[seatWind(state.currentPlayer, state.dealerSeat)]} is playing…`);
  const wallProps = {
    front: dealIntro ? (intro.step === 'flowers' ? usage.front : intro.dealt) : awaiting && !awaiting.fromBack ? Math.max(0, usage.front - 1) : undefined,
    back: dealIntro ? (intro.step === 'flowers' ? usage.back : 0) : awaiting?.fromBack ? Math.max(0, usage.back - 1) : undefined,
    built: dealIntro ? intro.built : undefined,
    showBreak: !dealIntro || intro.step !== 'build',
    glowNext: Boolean(awaiting),
  };
  const lastThrown = (
    <LastThrown
      last={liveLast}
      takenBy={lastTaken ? seatTitle(state.currentPlayer) : null}
      who={liveLast ? seatTitle(liveLast.player) : ''}
      wind={liveLast ? WIND_CHARS[seatWind(liveLast.player, state.dealerSeat)] : ''}
      wallLeft={state.wall.length + (awaiting ? 1 : 0)}
      animCls={liveLast && animateDiscards && !table3d ? discDir(liveLast.player, hs) : ''}
      compact={table3d}
    />
  );
  const guideStrip = guide && (
    <div className={`pointer-events-none rounded-xl bg-black/70 px-3 py-1.5 leading-snug font-semibold text-amber-50 shadow-lg ${landscape ? 'text-[13px]' : 'text-[14px]'}`} role="status" aria-live="polite">
      {guide}
    </div>
  );
  const awaitingHint = awaiting && (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center z-20">
      <div className="rounded-full bg-black/75 px-3 py-1.5 text-[14px] font-semibold text-amber-100 shadow-lg whitespace-nowrap anim-pop">
        Tap to draw from the glowing stack
      </div>
    </div>
  );

  // The table itself: 3D (walls, standing hands, throws in front of each player) or the flat rows.
  const table = table3d ? (
    <div className={`relative h-full ${awaiting ? 'cursor-pointer' : ''}`} onClick={awaiting ? takeFromWall : undefined}>
      <Table3D
        state={state}
        dice={dice}
        {...wallProps}
        handCount={seat => seatCount(seat) ?? state.hands[seat].length}
        seatName={shortName}
        lastIdx={liveLast ? lastIdx : -1}
        showDice={dealIntro && intro.step !== 'build'}
        compact={!landscape}
        hideFlowers={dealIntro && intro.step !== 'flowers'}
      />
      {!landscape && awaitingHint}
    </div>
  ) : (
    <div className="flex-1 min-h-0 h-full table-frame">
     <div className="relative isolate h-full felt rounded-[0.85rem] overflow-hidden p-1.5">
      <div className="felt-medallion -z-10" />
        <div
          className={`relative h-full rounded-xl ${awaiting ? 'cursor-pointer' : ''}`}
          onClick={awaiting ? takeFromWall : undefined}
        >
         <WallRing state={state} dice={dice} {...wallProps} />
         <div className="absolute inset-3.5 rounded-lg flex flex-col gap-1.5 min-h-0">
          {dealIntro && intro.step !== 'build' ? (
            <div className="h-full flex flex-col items-center justify-center gap-1">
              <div className="flex gap-2"><DiceFace value={dice.a} /><DiceFace value={dice.b} /></div>
              <div className="text-[15px] font-semibold text-amber-100/90">{dice.a} + {dice.b} = {dice.a + dice.b}</div>
            </div>
          ) : (
            <>
              {lastThrown}
              <div ref={rowsRef} className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1 pb-1">
                {[rightSeat, acrossSeat, leftSeat, hs].map(seat => (
                  <PlayerRow
                    key={seat}
                    state={state}
                    seat={seat}
                    title={seatTitle(seat)}
                    short={shortName(seat)}
                    count={seatCount(seat)}
                    lastIdx={lastIdx}
                  />
                ))}
              </div>
            </>
          )}
         </div>
         {awaitingHint}
        </div>
     </div>
    </div>
  );

  const cards = (
    <>
      {dealIntro && (
        <DealCard
          step={intro.step}
          state={state}
          dice={dice}
          ready={intro.ready}
          last={intro.last}
          onNext={() => { haptics.tap(); if (intro.last) onDealDone?.(); else intro.next(); }}
          onSkip={() => onDealDone?.()}
        />
      )}
      {awaiting && (
        <div className="mb-2 flex items-center gap-2 rounded-xl bg-surface border border-line px-2.5 py-2 anim-pop" role="status">
          <p className="flex-1 text-[13px] leading-snug text-ink">
            <span className="font-semibold text-accent">Your turn. </span>
            Take the next tile from the wall, then throw one.
          </p>
          <button onClick={takeFromWall} className="shrink-0 btn-primary h-10 px-3 rounded-lg text-[13px] font-semibold active:scale-95">Draw</button>
        </div>
      )}
      {tip && (
        <div className="mb-2 flex items-center gap-2 rounded-xl bg-surface border border-line px-2.5 py-2 anim-pop" role="status">
          <span className="w-7 h-9 shrink-0 rounded-[5px] overflow-hidden border border-[#C6AE84]" style={{ background: '#F6EDDA' }}>
            <TileFace index={tip.tile} size="sm" />
          </span>
          <p className="flex-1 text-[13px] leading-snug text-ink"><span className="font-semibold text-accent">Coach: </span>{tip.text}</p>
          <button onClick={() => setDisplay('coach', false)} className="shrink-0 text-[12px] text-mute px-1.5 py-1 active:scale-95" aria-label="Turn the coach off">Hide</button>
        </div>
      )}
    </>
  );

  const hand = (
    <TileRow
      tiles={myTiles}
      onTileClick={canAct ? handleTileClick : undefined}
      onThrow={canAct ? handleThrow : undefined}
      selectedTiles={canAct && selectedIdx !== null ? new Set([selectedIdx]) : undefined}
      highlightTiles={drawnTile !== undefined ? new Set([drawnTile]) : undefined}
      drawnTile={drawnTile}
      nowrap={landscape}
    />
  );

  const actions = showActions && (
    <div className="anim-pop flex gap-2 justify-center">
      {selectedTileValue !== null && (
        <button
          onClick={() => { haptics.select(); onDiscard(selectedTileValue); setSelectedIdx(null); setSelectedTileValue(null); }}
          className="flex-1 min-w-0 max-w-[8.5rem] h-11 px-3 btn-primary rounded-lg text-sm font-medium active:scale-95 active:bg-emerald-600"
        >
          Discard
        </button>
      )}
      {kongActions.map((a, i) => (
        <button
          key={i}
          onClick={() => { if (a.type === 'declare_kong') { haptics.select(); onDeclareKong(a.tile); } }}
          className="flex-1 min-w-0 max-w-[8.5rem] h-11 px-3 bg-amber-600 text-white rounded-lg text-sm font-medium active:scale-95 active:bg-amber-500"
        >
          Kong
        </button>
      ))}
      {canTsumo && (
        <button
          onClick={() => { haptics.select(); onTsumo(); }}
          className="anim-tsumo flex-1 min-w-0 max-w-[8.5rem] h-11 px-3 bg-red-600 text-white rounded-lg text-sm font-bold shadow-[0_0_18px_rgba(218,90,68,0.5)] active:scale-95 active:bg-red-500"
        >
          Tsumo!
        </button>
      )}
    </div>
  );

  const iconBtn = 'h-9 px-2.5 rounded-lg bg-black/45 border border-amber-400/30 text-amber-100 text-[13px] font-semibold active:scale-95';
  const controls = (
    <>
      <button onClick={onQuit} aria-label="End match" className={`${iconBtn} w-9 px-0`}>✕</button>
      {onOptions && <button onClick={() => { haptics.tap(); onOptions(); }} className={iconBtn}>Options</button>}
      {onToggleFast && (
        <button onClick={() => { haptics.tap(); onToggleFast(); }} aria-pressed={fast} className={`${iconBtn} ${fast ? 'bg-amber-400 text-[#2a1a0c] border-amber-300' : ''}`}>
          {fast ? 'Fast ✓' : 'Faster'}
        </button>
      )}
      <button onClick={() => setShowNumbers(true)} aria-label="Chinese numbers 1 to 9" className={iconBtn}>一 = 1</button>
    </>
  );

  const overlays = (
    <>
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
                  {b.kind === 'animal' ? <AnimalArt animal={b.animal} className="w-full h-[52px]" />
                    : b.kind === 'flower' ? <FlowerArt tile={{ kind: 'flower', name: b.flower }} className="w-full h-[52px]" />
                    : <FlowerArt tile={{ kind: 'season', name: b.season }} className="w-full h-[52px]" />}
                  <span className="text-[10px] text-amber-700/70 mt-0.5">{bonusName(b)}</span>
                </div>
              ))}
            </div>
            <div className="absolute -bottom-7 text-amber-300 text-xs font-semibold whitespace-nowrap drop-shadow">
              +{flowerPop.tiles.length} flower · draw again
            </div>
          </div>
        </div>
      )}
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
      {showNumbers && <NumbersCard onClose={() => setShowNumbers(false)} />}
    </>
  );

  const bg = { background: 'radial-gradient(130% 100% at 50% 22%, #34160c, #190a06)' };

  // Sideways phone: the table fills the screen, the hand runs along the bottom, everything else floats.
  if (landscape) {
    return (
      <div className="relative h-full overflow-hidden" style={{ ...bg, paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}>
        <div className="absolute inset-x-0 top-0" style={{ bottom: 84 }}>{table}</div>
        <div className="absolute left-2 top-2 z-20 flex gap-1.5" style={{ marginLeft: 'env(safe-area-inset-left)' }}>{controls}</div>
        <div className="absolute right-2 top-2 z-20 text-right" style={{ marginRight: 'env(safe-area-inset-right)' }}>
          <span className={`inline-block rounded-lg bg-black/45 px-2 py-1 text-[13px] font-semibold ${isHumanTurn ? 'text-emerald-300' : 'text-amber-100/80'}`}>{status}</span>
        </div>
        {table3d && (liveLast || lastTaken) && !dealIntro && (
          <div className="absolute left-2 top-14 z-20 w-[190px]">{lastThrown}</div>
        )}
        {(dealIntro || awaiting || tip || guideStrip) && (
          <div className="absolute right-2 top-12 z-20 w-[min(220px,28vw)] max-h-[64%] overflow-y-auto" style={{ marginRight: 'env(safe-area-inset-right)' }}>
            {guideStrip && <div className="mb-2">{guideStrip}</div>}
            {cards}
          </div>
        )}
        {showActions && <div className="absolute right-2 z-30 w-[190px]" style={{ bottom: 90, marginRight: 'env(safe-area-inset-right)' }}>{actions}</div>}
        <div className={`absolute inset-x-0 bottom-0 z-20 h-[84px] flex items-end justify-center px-2 pb-1.5 ${isHumanTurn ? 'glow-turn' : ''}`}>
          <div className="min-w-0">{hand}</div>
        </div>
        {overlays}
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full" style={bg}>
      {/* Status bar */}
      <div className="flex items-center justify-between gap-1.5 px-2 py-1.5 bg-black/30 border-b border-amber-400/10 text-xs text-amber-100/70 backdrop-blur">
        <div className="flex gap-1.5">{controls}</div>
        <span className={`text-right leading-tight ${isHumanTurn ? 'text-emerald-300 font-bold' : 'text-amber-100/70'}`}>{status}</span>
      </div>

      <div className="relative flex-1 min-h-0 mx-1 mt-1 mb-1">
        {table}
        {table3d && (liveLast || lastTaken) && !dealIntro && (
          <div className="pointer-events-none absolute left-1 top-1 z-10 w-[176px]">{lastThrown}</div>
        )}
        {table3d && !seenSideways && (
          <div className="pointer-events-none absolute right-1 bottom-1 z-10 rounded-full bg-black/60 px-2.5 py-1 text-[12px] font-semibold text-amber-100">
            ⟳ Turn your phone sideways for a bigger table
          </div>
        )}
      </div>

      {/* Player area */}
      <div className={`border-t border-slate-700/50 bg-slate-900/50 px-2 pt-2 pb-2 backdrop-blur transition-shadow duration-500 ${isHumanTurn ? 'glow-turn' : ''}`}>
        <div className="flex items-center gap-2 mb-1.5 min-h-[20px]">
          <span className="text-xs font-bold text-emerald-400">{WIND_CHARS[seatWind(hs, state.dealerSeat)]} You, {WIND_EN[seatWind(hs, state.dealerSeat)]}{state.dealerSeat === hs ? ' · dealer' : ''}</span>
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
        {guideStrip && <div className="mb-2">{guideStrip}</div>}
        {cards}
        {hand}
        {/* Reserved 44px row: buttons appear inside it, so selecting a tile never shifts the hand */}
        <div className="mt-2 h-11">{actions}</div>
      </div>
      {overlays}
    </div>
  );
}

function DealCard({ step, state, dice, ready, last, onNext, onSkip }: {
  step: ReturnType<typeof useDealIntro>['step'];
  state: GameState;
  dice: { a: number; b: number };
  ready: boolean;
  last: boolean;
  onNext: () => void;
  onSkip: () => void;
}) {
  const hs = state.humanSeat;
  const d = dice.a + dice.b;
  const bs = breakSeat(dice, state.dealerSeat);
  const where = bs === hs ? 'your wall' : bs === (hs + 1) % 4 ? 'the wall on your right' : bs === (hs + 2) % 4 ? 'the wall opposite you' : 'the wall on your left';
  const dealerIsYou = state.dealerSeat === hs;
  const copy: Record<typeof step, { title: string; body: string }> = {
    build: {
      title: 'Building the wall',
      body: totalTiles(state) === 148
        ? 'Each player stacks tiles two high in a wall in front of them. East and West build 19 stacks, South and North build 18. Yours is the one nearest you.'
        : 'Each player stacks tiles two high in a wall of 18 stacks in front of them. Yours is the one nearest you.',
    },
    dice: {
      title: 'Rolling the dice',
      body: `${dealerIsYou ? 'You are the dealer and roll' : 'The dealer rolls'} ${dice.a} and ${dice.b}, so ${d}. Count ${d} players round the table, starting with the dealer as 1. That picks ${where}. Count ${d} stacks in from its right-hand end and split the wall there.`,
    },
    deal: {
      title: 'Dealing',
      body: `From the split, each player takes 4 tiles at a time, three times round, then 1 more each. The dealer takes one extra and starts with 14, so the dealer throws first. ${dealerIsYou ? 'That’s you.' : ''}`.trim(),
    },
    flowers: {
      title: 'Flowers and animals',
      body: 'Bonus tiles never stay in your hand. Each one goes face up beside you, and you take a replacement from the other end of the wall, behind the split.',
    },
  };
  return (
    <div className="mb-2 rounded-xl bg-surface border border-line px-3 py-2 anim-pop" role="status" aria-live="polite">
      <p className="text-[12.5px] leading-snug text-ink"><span className="font-semibold text-accent">{copy[step].title}. </span>{copy[step].body}</p>
      <div className="mt-1.5 flex gap-2">
        <button onClick={onSkip} className="h-9 px-3 rounded-lg text-[13px] text-mute active:scale-95">Skip</button>
        <button
          onClick={onNext}
          disabled={!ready}
          className="flex-1 h-9 btn-primary rounded-lg text-[13px] font-semibold active:scale-[0.98] disabled:opacity-40"
        >
          {last ? 'Start playing' : 'Next'}
        </button>
      </div>
    </div>
  );
}
