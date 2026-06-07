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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleStart(config: {
    difficulty: AiProfile['difficulty'];
    speed: SpeedSetting;
    humanSeat: number;
  }) {
    const p =
      ALL_PROFILES.find(pr => pr.difficulty === config.difficulty) ??
      ALL_PROFILES[1];
    setProfile(p);
    setSpeedMs(SPEED_MS[config.speed]);
    setGameState(createGame(config.humanSeat, 0, 'east'));
    setView('playing');
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

  if (view === 'setup') {
    return <GameSetup onStart={handleStart} />;
  }

  if (view === 'result' && gameState) {
    return (
      <RoundResult
        state={gameState}
        onPlayAgain={() => {
          setGameState(createGame(gameState.humanSeat, 0, 'east'));
          setView('playing');
        }}
        onBackToSetup={() => setView('setup')}
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
          onQuit={() => setView('setup')}
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
