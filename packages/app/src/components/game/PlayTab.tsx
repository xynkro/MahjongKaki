import { useState, useEffect, useRef } from 'react';
import {
  type GameState,
  type GameAction,
  type Claim,
  createGame,
  applyAction,
  getAvailableActions,
} from '@mahjongkaki/game';
import { type AiProfile, ALL_PROFILES, aiDecide } from '@mahjongkaki/ai';
import { GameSetup, type SpeedSetting } from './GameSetup';
import { GameBoard } from './GameBoard';
import { ClaimOverlay } from './ClaimOverlay';
import { RoundResult } from './RoundResult';
import { db } from '../../lib/db';

const SPEED_MS: Record<SpeedSetting, number> = {
  slow: 2000,
  normal: 1000,
  fast: 400,
  instant: 50,
};

type PlayView = 'setup' | 'playing' | 'result';

export function PlayTab() {
  const [view, setView] = useState<PlayView>('setup');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [profile, setProfile] = useState<AiProfile>(ALL_PROFILES[1]);
  const [speedMs, setSpeedMs] = useState(SPEED_MS.normal);
  const [speedSetting, setSpeedSetting] = useState<SpeedSetting>('normal');
  const [resumeChecked, setResumeChecked] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Persistence (gameSaves) ---
  const saveIdRef = useRef<number | null>(null);
  const latestRef = useRef<{ gs: GameState | null; difficulty: AiProfile['difficulty']; speed: SpeedSetting; view: PlayView }>({
    gs: null, difficulty: 'medium', speed: 'normal', view: 'setup',
  });
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function persistSave(gs: GameState, difficulty: AiProfile['difficulty'], speed: SpeedSetting) {
    try {
      const payload = { state: JSON.stringify(gs), difficulty, speed, isActive: 1 as const, updatedAt: Date.now() };
      if (saveIdRef.current != null) {
        await db.gameSaves.update(saveIdRef.current, payload);
      } else {
        await db.gameSaves.where('isActive').equals(1).modify({ isActive: 0 });
        saveIdRef.current = await db.gameSaves.add({ ...payload, createdAt: Date.now() });
      }
    } catch {
      /* persistence is best-effort */
    }
  }

  function flushSave() {
    const { gs, difficulty, speed, view: v } = latestRef.current;
    if (v === 'playing' && gs && gs.phase !== 'finished') void persistSave(gs, difficulty, speed);
  }

  async function endSave() {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    const id = saveIdRef.current;
    saveIdRef.current = null;
    if (id != null) {
      try { await db.gameSaves.delete(id); } catch { /* ignore */ }
    }
  }

  // Resume an in-progress game on mount (tab switch or refresh).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const save = await db.gameSaves.where('isActive').equals(1).last();
        if (!cancelled && save) {
          const gs = JSON.parse(save.state) as GameState;
          if (gs && Array.isArray(gs.hands) && gs.phase && gs.phase !== 'finished') {
            const p = ALL_PROFILES.find(pr => pr.difficulty === save.difficulty) ?? ALL_PROFILES[1];
            const ss = (save.speed in SPEED_MS ? save.speed : 'normal') as SpeedSetting;
            saveIdRef.current = save.id ?? null;
            setProfile(p);
            setSpeedMs(SPEED_MS[ss]);
            setSpeedSetting(ss);
            setGameState(gs);
            setView('playing');
          } else if (save.id != null) {
            await db.gameSaves.delete(save.id);
          }
        }
      } catch {
        /* corrupt/unavailable save — start fresh */
      }
      if (!cancelled) setResumeChecked(true);
    })();
    return () => { cancelled = true; };
  }, []);

  // Keep the latest state mirrored + autosave (debounced) while playing.
  useEffect(() => {
    latestRef.current = { gs: gameState, difficulty: profile.difficulty, speed: speedSetting, view };
    if (view === 'playing' && gameState && gameState.phase !== 'finished') {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(flushSave, 400);
    }
  }, [gameState, view, profile, speedSetting]);

  // Flush the latest state when the page is hidden/backgrounded, and on unmount.
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') flushSave(); };
    window.addEventListener('pagehide', flushSave);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('pagehide', flushSave);
      document.removeEventListener('visibilitychange', onHide);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      flushSave();
    };
  }, []);

  async function handleStart(config: {
    difficulty: AiProfile['difficulty'];
    speed: SpeedSetting;
    humanSeat: number;
  }) {
    await endSave();
    const p = ALL_PROFILES.find(pr => pr.difficulty === config.difficulty) ?? ALL_PROFILES[1];
    const gs = createGame(config.humanSeat, 0, 'east');
    setProfile(p);
    setSpeedMs(SPEED_MS[config.speed]);
    setSpeedSetting(config.speed);
    setGameState(gs);
    setView('playing');
    void persistSave(gs, config.difficulty, config.speed);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!gameState || view !== 'playing') return;
    if (timerRef.current) clearTimeout(timerRef.current);

    if (gameState.phase === 'finished') {
      void endSave();
      setView('result');
      return;
    }

    const isHumanTurn = gameState.currentPlayer === gameState.humanSeat;

    if (gameState.phase === 'draw') {
      const delay = isHumanTurn ? 100 : speedMs;
      timerRef.current = setTimeout(() => {
        setGameState(prev =>
          prev ? applyAction(prev, { type: 'auto_draw' }) : prev,
        );
      }, delay);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }

    if (gameState.phase === 'discard' && !isHumanTurn) {
      timerRef.current = setTimeout(() => {
        setGameState(prev => {
          if (!prev) return prev;
          const action = aiDecide(prev, prev.currentPlayer, profile);
          return applyAction(prev, action);
        });
      }, speedMs);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }

    if (gameState.phase === 'claim') {
      const humanClaims = gameState.pendingClaims.filter(
        c => c.player === gameState.humanSeat,
      );
      if (humanClaims.length === 0) {
        timerRef.current = setTimeout(() => {
          resolveAiClaims();
        }, speedMs);
        return () => {
          if (timerRef.current) clearTimeout(timerRef.current);
        };
      }
    }
  }, [gameState, view, speedMs, profile]);

  function resolveAiClaims() {
    setGameState(prev => {
      if (!prev) return prev;

      const accepted: GameAction[] = [];
      for (let seat = 0; seat < 4; seat++) {
        if (seat === prev.humanSeat) continue;
        const action = aiDecide(prev, seat, profile);
        if (action.type === 'claim') accepted.push(action);
      }

      if (accepted.length === 0) {
        return applyAction(prev, { type: 'skip_claim' });
      }

      const pri: Record<string, number> = {
        win: 0,
        kong: 1,
        pung: 1,
        chow: 2,
      };
      accepted.sort((a, b) => {
        if (a.type !== 'claim' || b.type !== 'claim') return 0;
        return (pri[a.claimType] ?? 9) - (pri[b.claimType] ?? 9);
      });

      return applyAction(prev, accepted[0]);
    });
  }

  function handleDiscard(tile: number) {
    setGameState(prev =>
      prev ? applyAction(prev, { type: 'discard', tile }) : prev,
    );
  }

  function handleDeclareKong(tile: number) {
    setGameState(prev =>
      prev ? applyAction(prev, { type: 'declare_kong', tile }) : prev,
    );
  }

  function handleTsumo() {
    setGameState(prev => {
      if (!prev) return prev;
      return applyAction(prev, {
        type: 'claim',
        claimType: 'win',
        player: prev.humanSeat,
        tilesFromHand: [],
      });
    });
  }

  function handleClaim(claim: Claim) {
    setGameState(prev => {
      if (!prev) return prev;

      const humanAction: GameAction = {
        type: 'claim',
        claimType: claim.claimType,
        player: claim.player,
        tilesFromHand: claim.tilesFromHand,
      };

      const allAccepted: GameAction[] = [humanAction];
      for (let seat = 0; seat < 4; seat++) {
        if (seat === prev.humanSeat) continue;
        const action = aiDecide(prev, seat, profile);
        if (action.type === 'claim') allAccepted.push(action);
      }

      const pri: Record<string, number> = {
        win: 0,
        kong: 1,
        pung: 1,
        chow: 2,
      };
      allAccepted.sort((a, b) => {
        if (a.type !== 'claim' || b.type !== 'claim') return 0;
        return (pri[a.claimType] ?? 9) - (pri[b.claimType] ?? 9);
      });

      return applyAction(prev, allAccepted[0]);
    });
  }

  function handleSkipClaim() {
    resolveAiClaims();
  }

  function handleQuit() {
    void endSave();
    setView('setup');
  }

  if (!resumeChecked) {
    return <div className="h-full flex items-center justify-center text-slate-500 text-sm">Loading…</div>;
  }

  if (view === 'setup') {
    return <GameSetup onStart={handleStart} />;
  }

  if (view === 'result' && gameState) {
    return (
      <RoundResult
        state={gameState}
        onPlayAgain={() => {
          const gs = createGame(gameState.humanSeat, 0, 'east');
          setGameState(gs);
          setView('playing');
          void persistSave(gs, profile.difficulty, speedSetting);
        }}
        onBackToSetup={() => { void endSave(); setView('setup'); }}
      />
    );
  }

  if (!gameState) return null;

  const humanActions = getAvailableActions(gameState, gameState.humanSeat);
  const humanClaims =
    gameState.phase === 'claim'
      ? gameState.pendingClaims.filter(c => c.player === gameState.humanSeat)
      : [];
  const showClaimOverlay =
    gameState.phase === 'claim' &&
    humanClaims.length > 0 &&
    gameState.lastDiscard !== null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <GameBoard
          state={gameState}
          availableActions={humanActions}
          onDiscard={handleDiscard}
          onDeclareKong={handleDeclareKong}
          onTsumo={handleTsumo}
          onQuit={handleQuit}
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
