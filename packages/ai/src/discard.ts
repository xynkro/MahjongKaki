import { tileToIndex, indexToTile, isTerminalOrHonour, type Meld } from '@mahjongkaki/engine';
import { shanten, ukeire, type UkeireResult } from '@mahjongkaki/game';
import type { AiProfile } from './archetypes.js';

export interface DiscardCandidate {
  tile: number;
  shantenAfter: number;
  acceptance: number;
  safetyScore: number;
  combinedScore: number;
}

export function evaluateDiscards(
  hand: number[],
  melds: Meld[],
  discardPonds: number[][],
  profile: AiProfile,
): DiscardCandidate[] {
  const currentShanten = shanten(hand);
  const ukeireResults = ukeire(hand);
  const ukeireMap = new Map<number, UkeireResult>();
  for (const r of ukeireResults) ukeireMap.set(r.tileIndex, r);

  const allDiscards = new Map<number, number>();
  for (const pond of discardPonds) {
    for (const t of pond) allDiscards.set(t, (allDiscards.get(t) ?? 0) + 1);
  }

  const candidates: DiscardCandidate[] = [];
  const seen = new Set<number>();

  for (const tile of hand) {
    if (seen.has(tile)) continue;
    seen.add(tile);

    const ur = ukeireMap.get(tile);
    const firstIdx = hand.indexOf(tile);
    const afterDiscard = [...hand.slice(0, firstIdx), ...hand.slice(firstIdx + 1)];
    const shantenAfter = shanten(afterDiscard);
    const acceptance = ur?.totalAcceptance ?? 0;

    const safety = tileSafety(tile, discardPonds, hand);

    const effWeight = profile.efficiencySkill;
    const defWeight = profile.defenseSensitivity;

    let effScore = 0;
    if (shantenAfter <= currentShanten) {
      effScore = acceptance / 40;
    }

    const combinedScore =
      effScore * effWeight * (1 - defWeight * 0.5) +
      safety * defWeight * 0.5;

    candidates.push({
      tile,
      shantenAfter,
      acceptance,
      safetyScore: safety,
      combinedScore,
    });
  }

  candidates.sort((a, b) => {
    if (a.shantenAfter !== b.shantenAfter) return a.shantenAfter - b.shantenAfter;
    return b.combinedScore - a.combinedScore;
  });

  return candidates;
}

function tileSafety(tile: number, discardPonds: number[][], hand: number[]): number {
  let safety = 0;

  // Genbutsu: tile already discarded by opponents (100% safe against that player)
  for (const pond of discardPonds) {
    if (pond.includes(tile)) safety += 0.25;
  }

  // Kabe: all 4 copies visible (in hand + discards)
  const totalVisible = hand.filter(t => t === tile).length +
    discardPonds.flat().filter(t => t === tile).length;
  if (totalVisible >= 4) safety = 1.0;

  // Terminal/honour tiles are generally safer early
  const pt = indexToTile(tile);
  if (isTerminalOrHonour(pt)) safety += 0.1;

  // Suji safety (simplified)
  if (tile < 27) {
    const val = tile % 9;
    if (val === 0 || val === 8) safety += 0.05;
    if (val === 1 || val === 7) safety += 0.03;
  }

  return Math.min(1, safety);
}

export function pickDiscard(
  hand: number[],
  melds: Meld[],
  discardPonds: number[][],
  profile: AiProfile,
): number {
  const candidates = evaluateDiscards(hand, melds, discardPonds, profile);
  if (candidates.length === 0) return hand[0];

  if (Math.random() < profile.efficiencySkill) {
    return candidates[0].tile;
  }

  const reasonable = candidates.filter(c => c.shantenAfter <= candidates[0].shantenAfter + 1);
  return reasonable[Math.floor(Math.random() * reasonable.length)].tile;
}
