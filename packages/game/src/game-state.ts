import {
  type PlayTile, type BonusTile, type Meld, type Wind,
  tileToIndex, indexToTile, suit, pung, kong, chow, eyes,
  WINDS, DEFAULT_RULES, type RulesConfig,
} from '@mahjongkaki/engine';
import { createWallTiles, shuffleWall, dealInitial, drawFromWall, drawFromDeadWall, type WallTile } from './wall.js';
import { canWin } from './win-detect.js';
import { getAvailableClaims, resolveClaims, type Claim } from './claims.js';
import { canDeclareTsumo } from './score.js';

export type GamePhase = 'draw' | 'discard' | 'claim' | 'finished';

export interface GameState {
  wall: WallTile[];
  deadWall: WallTile[];
  hands: number[][];
  melds: Meld[][];
  discards: number[][];
  flowers: BonusTile[][];
  currentPlayer: number;
  humanSeat: number;
  phase: GamePhase;
  prevailingWind: Wind;
  dealerSeat: number;
  roundNumber: number;
  winner: number | null;
  winType: 'zimo' | 'discard' | null;
  lastDiscard: { tile: number; player: number } | null;
  pendingClaims: Claim[];
  turnCount: number;
  // Chronological log of tiles currently in the central discard pool (most recent last).
  discardLog: { tile: number; player: number }[];
  // The most recent tile drawn into a hand (for the draw cue). Null until first draw.
  lastDraw: { player: number; tile: number } | null;
  // House rules in force for this game (scoring + payout), snapshotted at createGame.
  rules: RulesConfig;
}

export type GameAction =
  | { type: 'draw' }
  | { type: 'discard'; tile: number }
  | { type: 'claim'; claimType: 'chow' | 'pung' | 'kong' | 'win'; player: number; tilesFromHand: number[] }
  | { type: 'skip_claim' }
  | { type: 'declare_kong'; tile: number }
  | { type: 'auto_draw' };

export function createGame(humanSeat: number = 0, dealerSeat: number = 0, prevailingWind: Wind = 'east', rules: RulesConfig = DEFAULT_RULES): GameState {
  const wall = shuffleWall(createWallTiles());
  const deal = dealInitial(wall, dealerSeat);

  return {
    wall: deal.remainingWall,
    deadWall: deal.deadWall,
    hands: deal.hands.map(h => h.hand),
    melds: [[], [], [], []],
    discards: [[], [], [], []],
    flowers: deal.hands.map(h => h.bonusTiles),
    currentPlayer: dealerSeat,
    humanSeat,
    phase: 'discard',
    prevailingWind,
    dealerSeat,
    roundNumber: 1,
    winner: null,
    winType: null,
    lastDiscard: null,
    pendingClaims: [],
    turnCount: 0,
    discardLog: [],
    lastDraw: null,
    rules,
  };
}

export function applyAction(state: GameState, action: GameAction): GameState {
  const s = cloneState(state);

  switch (action.type) {
    case 'draw':
    case 'auto_draw': {
      if (s.phase !== 'draw') return s;

      const result = drawFromWall(s.wall, s.deadWall);
      if (!result) {
        s.phase = 'finished';
        return s;
      }

      s.hands[s.currentPlayer].push(result.tile);
      s.flowers[s.currentPlayer].push(...result.bonusTiles);
      s.lastDraw = { player: s.currentPlayer, tile: result.tile };
      s.phase = 'discard';
      s.turnCount++;

      if (canWin(s.hands[s.currentPlayer], s.melds[s.currentPlayer])) {
        // player can declare tsumo, but doesn't auto-win
      }

      return s;
    }

    case 'discard': {
      if (s.phase !== 'discard') return s;

      const hand = s.hands[s.currentPlayer];
      const idx = hand.indexOf(action.tile);
      if (idx === -1) return s;

      hand.splice(idx, 1);
      s.discards[s.currentPlayer].push(action.tile);
      s.lastDiscard = { tile: action.tile, player: s.currentPlayer };
      s.discardLog.push({ tile: action.tile, player: s.currentPlayer });

      const claims = getAvailableClaims(
        s.hands, s.melds, action.tile, s.currentPlayer, [0, 1, 2, 3],
        { flowers: s.flowers, dealerSeat: s.dealerSeat, prevailingWind: s.prevailingWind },
      );

      if (claims.length > 0) {
        s.pendingClaims = claims;
        s.phase = 'claim';
      } else {
        s.currentPlayer = (s.currentPlayer + 1) % 4;
        s.phase = 'draw';
      }

      return s;
    }

    case 'claim': {
      // Tsumo (self-drawn win) during discard phase
      if (s.phase === 'discard' && action.claimType === 'win' && action.player === s.currentPlayer) {
        s.winner = action.player;
        s.winType = 'zimo';
        s.phase = 'finished';
        return s;
      }

      if (s.phase !== 'claim' || !s.lastDiscard) return s;

      // The claimed discard leaves the central pool.
      if (s.discardLog.length) s.discardLog.pop();

      const discardTile = s.lastDiscard.tile;
      const discardPlayer = s.lastDiscard.player;
      const claimPlayer = action.player;

      // Remove discard from discard pile
      const discardPile = s.discards[discardPlayer];
      const discardIdx = discardPile.lastIndexOf(discardTile);
      if (discardIdx !== -1) discardPile.splice(discardIdx, 1);

      if (action.claimType === 'win') {
        s.hands[claimPlayer].push(discardTile);
        s.winner = claimPlayer;
        s.winType = 'discard';
        s.phase = 'finished';
        return s;
      }

      // Remove tiles from claimer's hand
      for (const t of action.tilesFromHand) {
        const handIdx = s.hands[claimPlayer].indexOf(t);
        if (handIdx !== -1) s.hands[claimPlayer].splice(handIdx, 1);
      }

      const allTiles = [discardTile, ...action.tilesFromHand].sort((a, b) => a - b);

      if (action.claimType === 'kong') {
        const tile = indexToTile(discardTile);
        s.melds[claimPlayer].push(kong(tile, true));

        const replacement = drawFromDeadWall(s.deadWall);
        if (replacement) {
          s.hands[claimPlayer].push(replacement.tile);
          s.flowers[claimPlayer].push(...replacement.bonusTiles);
          s.lastDraw = { player: claimPlayer, tile: replacement.tile };
        }
        s.currentPlayer = claimPlayer;
        s.phase = 'discard';
      } else if (action.claimType === 'pung') {
        const tile = indexToTile(discardTile);
        s.melds[claimPlayer].push(pung(tile, true));
        s.currentPlayer = claimPlayer;
        s.phase = 'discard';
      } else if (action.claimType === 'chow') {
        const sorted = allTiles;
        const suitIdx = Math.floor(sorted[0] / 9) * 9;
        const startVal = (sorted[0] - suitIdx + 1) as 1|2|3|4|5|6|7;
        const suitName = sorted[0] < 9 ? 'bamboo' : sorted[0] < 18 ? 'character' : 'dot';
        s.melds[claimPlayer].push(chow(suitName as any, startVal, true));
        s.currentPlayer = claimPlayer;
        s.phase = 'discard';
      }

      s.pendingClaims = [];
      s.lastDiscard = null;
      return s;
    }

    case 'skip_claim': {
      if (s.phase !== 'claim') return s;
      s.pendingClaims = [];
      s.currentPlayer = (s.lastDiscard!.player + 1) % 4;
      s.phase = 'draw';
      s.lastDiscard = null;
      return s;
    }

    case 'declare_kong': {
      if (s.phase !== 'discard') return s;

      const hand = s.hands[s.currentPlayer];
      const count = hand.filter(t => t === action.tile).length;

      // Concealed kong: 4 in hand
      if (count >= 4) {
        s.hands[s.currentPlayer] = hand.filter(t => t !== action.tile);
        const tile = indexToTile(action.tile);
        s.melds[s.currentPlayer].push(kong(tile, false));

        const replacement = drawFromDeadWall(s.deadWall);
        if (replacement) {
          s.hands[s.currentPlayer].push(replacement.tile);
          s.flowers[s.currentPlayer].push(...replacement.bonusTiles);
          s.lastDraw = { player: s.currentPlayer, tile: replacement.tile };
        }
        return s;
      }

      // Promoted kong: have 1 in hand + existing pung meld
      const pungMeldIdx = s.melds[s.currentPlayer].findIndex(
        m => m.type === 'pung' && tileToIndex(m.tiles[0]) === action.tile
      );
      if (pungMeldIdx !== -1 && count >= 1) {
        const handIdx = hand.indexOf(action.tile);
        hand.splice(handIdx, 1);
        const tile = indexToTile(action.tile);
        s.melds[s.currentPlayer][pungMeldIdx] = kong(tile, true);

        const replacement = drawFromDeadWall(s.deadWall);
        if (replacement) {
          s.hands[s.currentPlayer].push(replacement.tile);
          s.flowers[s.currentPlayer].push(...replacement.bonusTiles);
          s.lastDraw = { player: s.currentPlayer, tile: replacement.tile };
        }
        return s;
      }

      return s;
    }
  }

  return s;
}

export function getAvailableActions(state: GameState, player: number): GameAction[] {
  const actions: GameAction[] = [];

  if (state.phase === 'draw' && player === state.currentPlayer) {
    actions.push({ type: 'draw' });
  }

  if (state.phase === 'discard' && player === state.currentPlayer) {
    const hand = state.hands[player];
    const seen = new Set<number>();
    for (const tile of hand) {
      if (!seen.has(tile)) {
        seen.add(tile);
        actions.push({ type: 'discard', tile });
      }
    }

    // Check for kong declarations
    const counts = new Map<number, number>();
    for (const t of hand) counts.set(t, (counts.get(t) ?? 0) + 1);

    for (const [tile, count] of counts) {
      if (count >= 4) {
        actions.push({ type: 'declare_kong', tile });
      }
    }

    // Promoted kong
    for (const meld of state.melds[player]) {
      if (meld.type === 'pung') {
        const meldTile = tileToIndex(meld.tiles[0]);
        if (hand.includes(meldTile)) {
          actions.push({ type: 'declare_kong', tile: meldTile });
        }
      }
    }

    // Self-draw win (tsumo) — must also meet the minimum-tai rule
    if (canDeclareTsumo(state, player)) {
      actions.push({ type: 'claim', claimType: 'win', player, tilesFromHand: [] });
    }
  }

  if (state.phase === 'claim') {
    const playerClaims = state.pendingClaims.filter(c => c.player === player);
    for (const c of playerClaims) {
      actions.push({
        type: 'claim',
        claimType: c.claimType,
        player,
        tilesFromHand: c.tilesFromHand,
      });
    }
    actions.push({ type: 'skip_claim' });
  }

  return actions;
}

function cloneState(state: GameState): GameState {
  return {
    ...state,
    wall: [...state.wall],
    deadWall: [...state.deadWall],
    hands: state.hands.map(h => [...h]),
    melds: state.melds.map(m => [...m]),
    discards: state.discards.map(d => [...d]),
    flowers: state.flowers.map(f => [...f]),
    pendingClaims: [...state.pendingClaims],
    discardLog: [...state.discardLog],
  };
}
