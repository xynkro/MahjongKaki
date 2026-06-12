import { useState, useEffect, useRef } from 'react';
import {
  type GameState,
  type GameAction,
  type Claim,
  createGame,
  applyAction,
  getAvailableActions,
} from '@mahjongkaki/game';
import { ALL_PROFILES, aiDecide } from '@mahjongkaki/ai';
import { GameSetup, type SpeedSetting, type MatchConfig } from './GameSetup';
import { GameBoard } from './GameBoard';
import { ClaimOverlay } from './ClaimOverlay';
import { RoundResult } from './RoundResult';
import { Scoreboard } from './Scoreboard';
import { type MatchState, newMatch, advanceMatch, handDeltas } from './match';
import { db } from '../../lib/db';
import { getRules } from '../../lib/settings';

const SPEED_MS: Record<SpeedSetting, number> = { slow: 2000, normal: 1000, fast: 400, instant: 50 };

type PlayView = 'setup' | 'playing' | 'result' | 'matchover';

function startHand(match: MatchState): GameState {
  const gs = createGame(match.humanSeat, match.dealerSeat, match.prevailingWind, match.rules);
  gs.roundNumber = match.handNo;
  return gs;
}

export function PlayTab() {
  const [view, setView] = useState<PlayView>('setup');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [match, setMatch] = useState<MatchState | null>(null);
  const [deltas, setDeltas] = useState<number[] | null>(null);
  const [resumeChecked, setResumeChecked] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const profile = match
    ? ALL_PROFILES.find(p => p.difficulty === match.difficulty) ?? ALL_PROFILES[1]
    : ALL_PROFILES[1];
  const speedMs = match ? SPEED_MS[match.speed] : SPEED_MS.normal;

  // --- Persistence (whole match + current hand) ---
  const saveIdRef = useRef<number | null>(null);
  const latestRef = useRef<{ gs: GameState | null; match: MatchState | null; view: PlayView }>({
    gs: null, match: null, view: 'setup',
  });
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function persistSave(gs: GameState, m: MatchState) {
    try {
      const payload = {
        state: JSON.stringify({ game: gs, match: m }),
        difficulty: m.difficulty, speed: m.speed, isActive: 1 as const, updatedAt: Date.now(),
      };
      if (saveIdRef.current != null) {
        await db.gameSaves.update(saveIdRef.current, payload);
      } else {
        await db.gameSaves.where('isActive').equals(1).modify({ isActive: 0 });
        saveIdRef.current = await db.gameSaves.add({ ...payload, createdAt: Date.now() });
      }
    } catch { /* best-effort */ }
  }

  function flushSave() {
    const { gs, match: m, view: v } = latestRef.current;
    if (v === 'playing' && gs && m && gs.phase !== 'finished') void persistSave(gs, m);
  }

  async function endSave() {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    const id = saveIdRef.current;
    saveIdRef.current = null;
    if (id != null) { try { await db.gameSaves.delete(id); } catch { /* ignore */ } }
  }

  // Resume on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const save = await db.gameSaves.where('isActive').equals(1).last();
        if (!cancelled && save) {
          const parsed = JSON.parse(save.state);
          const gs: GameState | undefined = parsed?.game;
          const m: MatchState | undefined = parsed?.match;
          if (gs && m && Array.isArray(gs.hands) && gs.phase && gs.phase !== 'finished') {
            saveIdRef.current = save.id ?? null;
            setMatch(m);
            setGameState(gs);
            setView('playing');
          } else if (save.id != null) {
            await db.gameSaves.delete(save.id); // old/finished/corrupt
          }
        }
      } catch { /* start fresh */ }
      if (!cancelled) setResumeChecked(true);
    })();
    return () => { cancelled = true; };
  }, []);

  // Mirror latest + autosave (debounced) while playing.
  useEffect(() => {
    latestRef.current = { gs: gameState, match, view };
    if (view === 'playing' && gameState && match && gameState.phase !== 'finished') {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(flushSave, 400);
    }
  }, [gameState, match, view]);

  // Flush on hide / unmount.
  useEffect(() => {
    window.addEventListener('pagehide', flushSave);
    const onHide = () => { if (document.visibilityState === 'hidden') flushSave(); };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('pagehide', flushSave);
      document.removeEventListener('visibilitychange', onHide);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      flushSave();
    };
  }, []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  async function handleStart(config: MatchConfig) {
    await endSave();
    const m = newMatch(config, getRules());
    const gs = startHand(m);
    setMatch(m);
    setGameState(gs);
    setDeltas(null);
    setView('playing');
    void persistSave(gs, m);
  }

  // Game loop + end-of-hand handling.
  useEffect(() => {
    if (!gameState || !match || view !== 'playing') return;
    if (timerRef.current) clearTimeout(timerRef.current);

    if (gameState.phase === 'finished') {
      void endSave();
      const d = handDeltas(gameState, match.stakeIndex);
      setDeltas(d);
      setMatch(advanceMatch(match, d, gameState.winner));
      setView('result');
      return;
    }

    const isHumanTurn = gameState.currentPlayer === gameState.humanSeat;

    if (gameState.phase === 'draw') {
      timerRef.current = setTimeout(() => {
        setGameState(prev => (prev ? applyAction(prev, { type: 'auto_draw' }) : prev));
      }, isHumanTurn ? 100 : speedMs);
      return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }

    if (gameState.phase === 'discard' && !isHumanTurn) {
      timerRef.current = setTimeout(() => {
        setGameState(prev => (prev ? applyAction(prev, aiDecide(prev, prev.currentPlayer, profile)) : prev));
      }, speedMs);
      return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }

    if (gameState.phase === 'claim') {
      const humanClaims = gameState.pendingClaims.filter(c => c.player === gameState.humanSeat);
      if (humanClaims.length === 0) {
        timerRef.current = setTimeout(resolveAiClaims, speedMs);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
      }
    }
  }, [gameState, match, view]); // eslint-disable-line react-hooks/exhaustive-deps

  function resolveAiClaims() {
    setGameState(prev => {
      if (!prev) return prev;
      const accepted: GameAction[] = [];
      for (let seat = 0; seat < 4; seat++) {
        if (seat === prev.humanSeat) continue;
        const action = aiDecide(prev, seat, profile);
        if (action.type === 'claim') accepted.push(action);
      }
      if (accepted.length === 0) return applyAction(prev, { type: 'skip_claim' });
      const pri: Record<string, number> = { win: 0, kong: 1, pung: 1, chow: 2 };
      accepted.sort((a, b) => (a.type !== 'claim' || b.type !== 'claim' ? 0 : (pri[a.claimType] ?? 9) - (pri[b.claimType] ?? 9)));
      return applyAction(prev, accepted[0]);
    });
  }

  function handleDiscard(tile: number) {
    setGameState(prev => (prev ? applyAction(prev, { type: 'discard', tile }) : prev));
  }
  function handleDeclareKong(tile: number) {
    setGameState(prev => (prev ? applyAction(prev, { type: 'declare_kong', tile }) : prev));
  }
  function handleTsumo() {
    setGameState(prev => (prev ? applyAction(prev, { type: 'claim', claimType: 'win', player: prev.humanSeat, tilesFromHand: [] }) : prev));
  }
  function handleClaim(claim: Claim) {
    setGameState(prev => {
      if (!prev) return prev;
      const all: GameAction[] = [{ type: 'claim', claimType: claim.claimType, player: claim.player, tilesFromHand: claim.tilesFromHand }];
      for (let seat = 0; seat < 4; seat++) {
        if (seat === prev.humanSeat) continue;
        const action = aiDecide(prev, seat, profile);
        if (action.type === 'claim') all.push(action);
      }
      const pri: Record<string, number> = { win: 0, kong: 1, pung: 1, chow: 2 };
      all.sort((a, b) => (a.type !== 'claim' || b.type !== 'claim' ? 0 : (pri[a.claimType] ?? 9) - (pri[b.claimType] ?? 9)));
      return applyAction(prev, all[0]);
    });
  }
  function handleSkipClaim() { resolveAiClaims(); }

  function nextHand() {
    if (!match) return;
    const gs = startHand(match);
    setGameState(gs);
    setDeltas(null);
    setView('playing');
    void persistSave(gs, match);
  }

  function endMatch() {
    void endSave();
    setView('matchover');
  }

  function newMatchSetup() {
    void endSave();
    setMatch(null);
    setGameState(null);
    setDeltas(null);
    setView('setup');
  }

  if (!resumeChecked) {
    return <div className="h-full flex items-center justify-center text-slate-500 text-sm">Loading…</div>;
  }

  if (view === 'setup' || !match) {
    return <GameSetup onStart={handleStart} />;
  }

  if (view === 'matchover') {
    const leader = match.totals.indexOf(Math.max(...match.totals));
    const youWon = leader === match.humanSeat;
    return (
      <div className="space-y-4 p-1">
        <section className="card anim-rise p-6 text-center">
          <h2 className={`text-2xl font-bold mb-1 ${youWon ? 'text-emerald-400' : 'text-slate-200'}`}>
            {youWon ? 'You came out ahead!' : 'Match over'}
          </h2>
          <p className="text-slate-400 text-xs">{match.handNo - 1} hands played</p>
        </section>
        <div className="anim-rise" style={{ animationDelay: '80ms' }}>
          <Scoreboard match={match} />
        </div>
        <button
          onClick={newMatchSetup}
          className="anim-rise w-full min-h-[48px] btn-primary text-base font-semibold rounded-xl"
          style={{ animationDelay: '160ms' }}
        >
          New Match
        </button>
      </div>
    );
  }

  if (view === 'result' && gameState) {
    return (
      <RoundResult
        state={gameState}
        match={match}
        deltas={deltas ?? [0, 0, 0, 0]}
        onNextHand={nextHand}
        onEndMatch={endMatch}
      />
    );
  }

  if (!gameState) return null;

  const humanActions = getAvailableActions(gameState, gameState.humanSeat);
  const humanClaims = gameState.phase === 'claim'
    ? gameState.pendingClaims.filter(c => c.player === gameState.humanSeat)
    : [];
  const showClaimOverlay = gameState.phase === 'claim' && humanClaims.length > 0 && gameState.lastDiscard !== null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <GameBoard
          state={gameState}
          availableActions={humanActions}
          onDiscard={handleDiscard}
          onDeclareKong={handleDeclareKong}
          onTsumo={handleTsumo}
          onQuit={endMatch}
          animateDiscards={speedMs >= 1000}
        />
      </div>
      {showClaimOverlay && (
        <ClaimOverlay
          claims={humanClaims}
          lastDiscardTile={gameState.lastDiscard!.tile}
          onClaim={handleClaim}
          onSkip={handleSkipClaim}
        />
      )}
    </div>
  );
}
