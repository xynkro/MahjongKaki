// The server-side rules of an online table: who is seated, whose decision the
// game is waiting on, and what happens when that decision comes in or times out.
// Pure (the clock is passed in), so a whole match can be played in a unit test.
// Points only: this module has no notion of money, and never should.

import {
  type ClaimAction, type GameAction, type GameState, type MatchProgress, type SeatTotals,
  advanceProgress, applyAction, createGame, getAvailableActions, handNet, pickClaim,
} from '@mahjongkaki/game';
import { type RulesConfig, type StakeConfig } from '@mahjongkaki/engine';
import { ALL_PROFILES, aiDecide } from '@mahjongkaki/ai';

export const TURN_MS = 30_000;
export const CLAIM_MS = 15_000;
export const RESULT_MS = 45_000;
// How long a client shows each frame; the turn clock starts after the replay.
export const FRAME_MS = 900;
const MAX_FRAMES = 24;

export const POINTS: StakeConfig = { label: 'points', base: 1, doubled: 2 };

export interface Player {
  uid: string | null;    // null = AI seat
  name: string;
  away: boolean;         // missed a deadline: AI plays this seat until they return
  ready: boolean;        // tapped Next hand on the result screen
}

export type Stage = 'lobby' | 'playing' | 'result' | 'over';

export interface Table {
  stage: Stage;
  players: Player[];     // always 4, seat-indexed
  hostUid: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  rules: RulesConfig;
  progress: MatchProgress;
  game: GameState | null;
  // Decisions already in for the current claim window. null = passed.
  votes: Record<number, ClaimAction | null>;
  deltas: SeatTotals | null;
  deadline: number | null;
  seq: number;           // last frame number issued
}

export type TableResult = { table: Table; frames: GameState[] };

const AI_NAMES = ['AI Hock', 'AI Mei', 'AI Tan', 'AI Lan'];

function aiSeat(seat: number): Player {
  return { uid: null, name: AI_NAMES[seat], away: false, ready: false };
}

const isLive = (p: Player) => p.uid !== null && !p.away;

export function newTable(hostUid: string, hostName: string, rules: RulesConfig, difficulty: Table['difficulty'] = 'medium'): Table {
  return {
    stage: 'lobby',
    players: [{ uid: hostUid, name: hostName, away: false, ready: false }, aiSeat(1), aiSeat(2), aiSeat(3)],
    hostUid,
    difficulty,
    rules,
    progress: { dealerSeat: 0, prevailingWind: 'east', handNo: 1, dealerStreak: 0, totals: [0, 0, 0, 0] },
    game: null,
    votes: {},
    deltas: null,
    deadline: null,
    seq: 0,
  };
}

export function seatOf(table: Table, uid: string): number {
  return table.players.findIndex(p => p.uid === uid);
}

export function humans(table: Table): Player[] {
  return table.players.filter(p => p.uid !== null);
}

// Seat a player in the lobby. Returns their seat, or null if the room can't take them.
export function join(table: Table, uid: string, name: string): { table: Table; seat: number } | null {
  const existing = seatOf(table, uid);
  if (existing !== -1) {
    if (table.stage !== 'lobby') return { table, seat: existing };
    const players = table.players.map((p, i) => (i === existing ? { ...p, name } : p));
    return { table: { ...table, players }, seat: existing };
  }
  if (table.stage !== 'lobby') return null;
  const seat = table.players.findIndex(p => p.uid === null);
  if (seat === -1) return null;
  const players = table.players.map((p, i) => (i === seat ? { uid, name, away: false, ready: false } : p));
  return { table: { ...table, players }, seat };
}

function dealHand(table: Table, now: number): TableResult {
  const { dealerSeat, prevailingWind, handNo } = table.progress;
  const game = createGame(0, dealerSeat, prevailingWind, table.rules);
  game.roundNumber = handNo;
  const players = table.players.map(p => ({ ...p, ready: false }));
  return settle({ ...table, stage: 'playing', players, game, votes: {}, deltas: null }, now, [game]);
}

export function startMatch(table: Table, now: number): TableResult {
  return dealHand(table, now);
}

function profileOf(table: Table) {
  return ALL_PROFILES.find(p => p.difficulty === table.difficulty) ?? ALL_PROFILES[1];
}

// Run the game forward until it needs a live human, collecting a frame for
// everything the table should see happen. This is the only place the game moves.
function settle(start: Table, now: number, framesIn: GameState[] = []): TableResult {
  let table = start;
  const frames = [...framesIn];
  const profile = profileOf(table);

  const finishWith = (game: GameState): Table => {
    const deltas = handNet(game, POINTS);
    return {
      ...table,
      game,
      stage: 'result',
      deltas,
      votes: {},
      progress: advanceProgress(table.progress, deltas, game.winner),
    };
  };

  for (let guard = 0; guard < 2000; guard++) {
    const game = table.game!;

    if (game.phase === 'finished') {
      table = finishWith(game);
      break;
    }

    if (game.phase === 'draw') {
      const next = applyAction(game, { type: 'auto_draw' });
      // A draw is only worth a frame for a human about to decide; the AI's draw merges into its discard.
      if (next.phase === 'finished' || isLive(table.players[game.currentPlayer])) frames.push(next);
      table = { ...table, game: next };
      continue;
    }

    if (game.phase === 'discard') {
      if (isLive(table.players[game.currentPlayer])) break;
      const next = applyAction(game, aiDecide(game, game.currentPlayer, profile));
      frames.push(next);
      table = { ...table, game: next };
      continue;
    }

    // Claim window: AI and away seats decide now; live humans get the clock.
    const votes = { ...table.votes };
    const claimants = [...new Set(game.pendingClaims.map(c => c.player))];
    for (const seat of claimants) {
      if (seat in votes || isLive(table.players[seat])) continue;
      const action = aiDecide(game, seat, profile);
      votes[seat] = action.type === 'claim' ? action : null;
    }
    table = { ...table, votes };
    if (claimants.some(seat => !(seat in votes))) break;

    const taken = claimants.flatMap(seat => votes[seat] ?? []);
    const winner = pickClaim(taken, game.lastDiscard!.player);
    const next = applyAction(game, winner ?? { type: 'skip_claim' });
    if (winner) frames.push(next); // a pass changes nothing anyone can see
    table = { ...table, game: next, votes: {} };
  }

  return finalise(table, frames, now);
}

function finalise(table: Table, frames: GameState[], now: number): TableResult {
  const kept = frames.slice(-MAX_FRAMES);
  const replay = kept.length * FRAME_MS;
  let deadline: number | null = null;
  if (table.stage === 'result') deadline = now + replay + RESULT_MS;
  else if (table.stage === 'playing') deadline = now + replay + (table.game!.phase === 'claim' ? CLAIM_MS : TURN_MS);
  return { table: { ...table, deadline, seq: table.seq + kept.length }, frames: kept };
}

// Live seats the game is currently waiting on.
export function awaited(table: Table): number[] {
  const game = table.game;
  if (table.stage !== 'playing' || !game) return [];
  if (game.phase === 'discard') return isLive(table.players[game.currentPlayer]) ? [game.currentPlayer] : [];
  if (game.phase === 'claim') {
    const seats = [...new Set(game.pendingClaims.map(c => c.player))];
    return seats.filter(s => isLive(table.players[s]) && !(s in table.votes));
  }
  return [];
}

function sameAction(a: GameAction, b: GameAction): boolean {
  const canon = (x: GameAction) => JSON.stringify(Object.entries(x).sort(([k], [l]) => k.localeCompare(l)));
  return canon(a) === canon(b);
}

// A player's move. Anything not currently legal for that seat is ignored, never
// applied: late taps and forged requests both land here.
export function act(table: Table, uid: string, action: GameAction, now: number): TableResult | null {
  const seat = seatOf(table, uid);
  const game = table.game;
  if (seat === -1 || table.stage !== 'playing' || !game) return null;
  if (!getAvailableActions(game, seat).some(a => sameAction(a, action))) return null;

  const players = table.players.map((p, i) => (i === seat ? { ...p, away: false } : p));
  const back = { ...table, players };

  if (game.phase === 'claim') {
    if (seat in table.votes) return null;
    if (!game.pendingClaims.some(c => c.player === seat)) return null;
    const vote = action.type === 'claim' ? action : null;
    return settle({ ...back, votes: { ...table.votes, [seat]: vote } }, now);
  }
  if (game.phase === 'discard' && game.currentPlayer === seat) {
    const next = applyAction(game, action);
    return settle({ ...back, game: next }, now, [next]);
  }
  return null;
}

// Anyone's phone may call this once a deadline passes. Whoever was being waited
// on goes away (the AI covers them); a finished result screen moves on.
export function tick(table: Table, now: number): TableResult | null {
  if (table.deadline === null || now < table.deadline) return null;
  if (table.stage === 'result') return dealHand(table, now);
  if (table.stage !== 'playing') return null;
  const late = awaited(table);
  const players = table.players.map((p, i) => (late.includes(i) ? { ...p, away: true } : p));
  return settle({ ...table, players }, now);
}

export function ready(table: Table, uid: string, now: number): TableResult | null {
  const seat = seatOf(table, uid);
  if (seat === -1 || table.stage !== 'result') return null;
  const players = table.players.map((p, i) => (i === seat ? { ...p, ready: true, away: false } : p));
  const next = { ...table, players };
  if (players.every(p => !isLive(p) || p.ready)) return dealHand(next, now);
  return { table: next, frames: [] };
}

export function setBack(table: Table, uid: string): Table | null {
  const seat = seatOf(table, uid);
  if (seat === -1 || !table.players[seat].away) return null;
  return { ...table, players: table.players.map((p, i) => (i === seat ? { ...p, away: false } : p)) };
}

// The seat goes to the AI for good. With nobody left the room is finished.
export function leave(table: Table, uid: string, now: number): TableResult | null {
  const seat = seatOf(table, uid);
  if (seat === -1) return null;
  const players = table.players.map((p, i) => (i === seat ? aiSeat(i) : p));
  const remaining = players.filter(p => p.uid !== null);
  const hostUid = table.hostUid === uid ? remaining[0]?.uid ?? '' : table.hostUid;
  const next = { ...table, players, hostUid };
  if (remaining.length === 0) return { table: { ...next, stage: 'over', deadline: null }, frames: [] };
  if (table.stage === 'playing') return settle(next, now);
  if (table.stage === 'result' && players.every(p => !isLive(p) || p.ready)) return dealHand(next, now);
  return { table: next, frames: [] };
}

export function endMatch(table: Table, uid: string): Table | null {
  if (table.hostUid !== uid || table.stage === 'over' || table.stage === 'lobby') return null;
  return { ...table, stage: 'over', deadline: null };
}
