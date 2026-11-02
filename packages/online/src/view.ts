// What one seat is allowed to see. Everything a phone receives goes through here:
// other hands become blanks and the wall becomes a count, so reading the network
// traffic can't reveal a tile that wouldn't be visible at a real table.

import { type GameAction, type GameState, getAvailableActions } from '@mahjongkaki/game';
import { type Table, type Stage, awaited } from './table.js';

export const HIDDEN_TILE = -1;

export type GameView = Omit<GameState, 'wall' | 'deadWall'> & { wallCount: number };

export interface FrameView {
  seq: number;
  game: GameView;
  actions: GameAction[];
}

export interface PlayerView { name: string; isAi: boolean; away: boolean; ready: boolean; isHost: boolean }

export interface SeatView {
  seat: number;
  stage: Stage;
  players: PlayerView[];
  frames: FrameView[];       // replay in order, the last one is current
  deadline: number | null;
  serverNow: number;
  deltas: Table['deltas'];
  progress: Table['progress'];
  waitingOn: number[];       // seats the game is waiting for
}

export function redactGame(game: GameState, seat: number): GameView {
  const { wall, deadWall, ...open } = game;
  const revealed = game.phase === 'finished' ? game.winner : null;
  return {
    ...open,
    humanSeat: seat,
    wallCount: wall.length,
    hands: game.hands.map((h, s) => (s === seat || s === revealed ? h : h.map(() => HIDDEN_TILE))),
    pendingClaims: game.pendingClaims.filter(c => c.player === seat),
    lastDraw: game.lastDraw && game.lastDraw.player !== seat
      ? { player: game.lastDraw.player, tile: HIDDEN_TILE }
      : game.lastDraw,
  };
}

function frameFor(table: Table, game: GameState, seat: number, seq: number, isCurrent: boolean): FrameView {
  // Only the current frame is actionable; a vote already in removes the claim prompt.
  const voted = game.phase === 'claim' && seat in table.votes;
  const view = redactGame(game, seat);
  // getAvailableActions offers everyone a skip during a claim; only claimants have anything to skip.
  const hasDecision = game.phase !== 'claim' || view.pendingClaims.length > 0;
  return {
    seq,
    game: voted ? { ...view, pendingClaims: [] } : view,
    actions: isCurrent && !voted && hasDecision && table.stage === 'playing' ? getAvailableActions(game, seat) : [],
  };
}

export function viewFor(table: Table, frames: GameState[], seat: number, now: number): SeatView {
  const first = table.seq - frames.length + 1;
  const list = frames.map((g, i) => frameFor(table, g, seat, first + i, i === frames.length - 1));
  // No new frame (someone else voted, a seat changed hands): restate the current one.
  if (list.length === 0 && table.game) list.push(frameFor(table, table.game, seat, table.seq, true));
  return {
    seat,
    stage: table.stage,
    players: table.players.map(p => ({
      name: p.name, isAi: p.uid === null, away: p.away, ready: p.ready, isHost: p.uid === table.hostUid,
    })),
    frames: list,
    deadline: table.deadline,
    serverNow: now,
    deltas: table.deltas,
    progress: table.progress,
    waitingOn: awaited(table),
  };
}
