import { type StakeConfig, type Wind, WINDS, calculatePayout, FLOWER_WIND_MAP, SEASON_WIND_MAP } from '@mahjongkaki/engine';
import type { GameState } from './game-state.js';
import { scoreWinForSeat, seatWindForSeat } from './score.js';

export type SeatTotals = [number, number, number, number];

export interface MatchProgress {
  dealerSeat: number;
  prevailingWind: Wind;
  handNo: number;        // 1-based
  dealerStreak: number;  // consecutive dealer holds
  totals: SeatTotals;    // cumulative delta per seat
}

/** A payment every other player makes to `seat` the moment something is collected (Singapore
 *  "instant payments"), in units of the stake's base: each of the three others pays `units` × base. */
export interface InstantPayment { seat: number; reason: string; units: number }

// App defaults; tables vary, and the lesson says so. An exposed kong, a bite or a seat flower pair
// is 2 units; a concealed kong or a full set of four is 4. Not modelled: some tables double a bite
// or pair that was already in the starting hand.
const UNIT = { bite: 2, flowerPair: 2, set: 4, exposedKong: 2, concealedKong: 4 } as const;

/** Every instant payment earned in this hand, worked out from the bonus tiles and kongs on the table.
 *  Bonus tiles never leave a player and the game has no kong robbing, so the finished hand holds the
 *  whole record. Paid whether or not anyone wins. */
export function instantPayments(state: GameState): InstantPayment[] {
  const out: InstantPayment[] = [];
  const r = state.rules;
  for (let seat = 0; seat < 4; seat++) {
    const bonus = state.flowers[seat] ?? [];
    if (r.instantFlowerPayments) {
      const animals = new Set(bonus.flatMap(b => (b.kind === 'animal' ? [b.animal] : [])));
      if (r.animalsEnabled) {
        if (animals.has('cat') && animals.has('rat')) out.push({ seat, reason: 'Cat catches rat', units: UNIT.bite });
        if (animals.has('rooster') && animals.has('centipede')) out.push({ seat, reason: 'Rooster catches centipede', units: UNIT.bite });
        if (animals.size === 4) out.push({ seat, reason: 'All four animals', units: UNIT.set });
      }
      const wind: Wind = seatWindForSeat(seat, state.dealerSeat);
      const ownFlower = bonus.some(b => b.kind === 'flower' && FLOWER_WIND_MAP[b.flower] === wind);
      const ownSeason = bonus.some(b => b.kind === 'season' && SEASON_WIND_MAP[b.season] === wind);
      if (ownFlower && ownSeason) out.push({ seat, reason: 'Both your seat flowers', units: UNIT.flowerPair });
      if (bonus.filter(b => b.kind === 'flower').length === 4) out.push({ seat, reason: 'All four blue flowers', units: UNIT.set });
      if (bonus.filter(b => b.kind === 'season').length === 4) out.push({ seat, reason: 'All four red flowers', units: UNIT.set });
    }
    if (r.instantKongPayments) {
      for (const m of state.melds[seat] ?? []) {
        if (m.type !== 'kong') continue;
        out.push(m.exposed
          ? { seat, reason: 'Kong', units: UNIT.exposedKong }
          : { seat, reason: 'Concealed kong', units: UNIT.concealedKong });
      }
    }
  }
  return out;
}

// What each seat won or lost on a finished hand: the win payout (none on a draw or an invalid win)
// plus every instant payment.
export function handNet(state: GameState, stake: StakeConfig): SeatTotals {
  const deltas: SeatTotals = [0, 0, 0, 0];
  for (const p of instantPayments(state)) {
    const amount = p.units * stake.base;
    for (let i = 0; i < 4; i++) deltas[i] += i === p.seat ? amount * 3 : -amount;
  }
  if (state.winner === null) return deltas;
  const scoring = scoreWinForSeat(state, state.winner);
  if (!scoring || !scoring.isValid) return deltas;
  const names: [string, string, string, string] = ['0', '1', '2', '3'];
  const shooterIndex =
    state.winType === 'discard' && state.lastDiscard ? state.lastDiscard.player : undefined;
  const payout = calculatePayout({
    scoring, stake, winnerIndex: state.winner, shooterIndex, playerNames: names,
    rules: state.rules,
  });
  for (let i = 0; i < 4; i++) deltas[i] += payout.netPerPlayer[String(i)] ?? 0;
  return deltas;
}

// Advance dealer + prevailing wind after a hand (SG: dealer keeps on win/draw, else rotates;
// prevailing wind advances when the dealer button completes a full cycle back to seat 0).
export function advanceProgress<T extends MatchProgress>(m: T, deltas: SeatTotals, winner: number | null): T {
  const totals = m.totals.map((t, i) => t + deltas[i]) as SeatTotals;
  const dealerStays = winner === null || winner === m.dealerSeat;

  if (dealerStays) {
    return { ...m, totals, dealerStreak: m.dealerStreak + 1, handNo: m.handNo + 1 };
  }
  const dealerSeat = (m.dealerSeat + 1) % 4;
  let prevailingWind = m.prevailingWind;
  if (dealerSeat === 0) {
    prevailingWind = WINDS[(WINDS.indexOf(m.prevailingWind) + 1) % 4];
  }
  return { ...m, totals, dealerSeat, prevailingWind, dealerStreak: 0, handNo: m.handNo + 1 };
}
