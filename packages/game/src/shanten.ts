// Shanten calculator for Singapore mahjong.
// Uses count-array decomposition over 34 tile indices.
// Supports regular hands, seven pairs, and thirteen orphans.

import { tileToIndex, indexToTile, allPlayTiles, type PlayTile } from '@mahjongkaki/engine';

function tileCounts(tiles: number[]): number[] {
  const c = new Array(34).fill(0);
  for (const t of tiles) c[t]++;
  return c;
}

let bestShanten = 8;

function regularShantenSearch(
  counts: number[],
  melds: number,
  partials: number,
  hasPair: boolean,
  pos: number,
): void {
  const sh = 2 * (4 - melds) - partials - (hasPair ? 1 : 0);
  if (sh < bestShanten) bestShanten = sh;

  if (melds + partials >= 4) {
    if (!hasPair) {
      for (let i = pos; i < 34; i++) {
        if (counts[i] >= 2) {
          if (sh - 1 < bestShanten) bestShanten = sh - 1;
          break;
        }
      }
    }
    return;
  }

  for (let i = pos; i < 34; i++) {
    if (counts[i] === 0) continue;

    // Try pair (eyes)
    if (!hasPair && counts[i] >= 2) {
      counts[i] -= 2;
      regularShantenSearch(counts, melds, partials, true, i);
      counts[i] += 2;
    }

    // Try pung (complete meld)
    if (counts[i] >= 3) {
      counts[i] -= 3;
      regularShantenSearch(counts, melds + 1, partials, hasPair, i);
      counts[i] += 3;
    }

    // Try chow (suit tiles only)
    if (i < 27 && (i % 9) <= 6 && counts[i + 1] > 0 && counts[i + 2] > 0) {
      counts[i]--;
      counts[i + 1]--;
      counts[i + 2]--;
      regularShantenSearch(counts, melds + 1, partials, hasPair, i);
      counts[i]++;
      counts[i + 1]++;
      counts[i + 2]++;
    }

    // Partial melds (need 1 more tile)
    // Pair as partial pung
    if (counts[i] >= 2) {
      counts[i] -= 2;
      regularShantenSearch(counts, melds, partials + 1, hasPair, i);
      counts[i] += 2;
    }

    // Adjacent pair (partial chow)
    if (i < 27 && (i % 9) <= 7 && counts[i + 1] > 0) {
      counts[i]--;
      counts[i + 1]--;
      regularShantenSearch(counts, melds, partials + 1, hasPair, i);
      counts[i]++;
      counts[i + 1]++;
    }

    // Gap pair (partial chow with gap)
    if (i < 27 && (i % 9) <= 6 && counts[i + 2] > 0) {
      counts[i]--;
      counts[i + 2]--;
      regularShantenSearch(counts, melds, partials + 1, hasPair, i);
      counts[i]++;
      counts[i + 2]++;
    }

    break;
  }
}

function regularShanten(counts: number[]): number {
  bestShanten = 8;
  regularShantenSearch(counts, 0, 0, false, 0);
  return bestShanten;
}

function sevenPairsShanten(counts: number[]): number {
  let pairs = 0;
  let kinds = 0;
  for (let i = 0; i < 34; i++) {
    if (counts[i] > 0) kinds++;
    if (counts[i] >= 2) pairs++;
  }
  return 6 - pairs + Math.max(0, 7 - kinds);
}

const ORPHAN_INDICES = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];

function thirteenOrphansShanten(counts: number[]): number {
  let kinds = 0;
  let hasPair = false;
  for (const i of ORPHAN_INDICES) {
    if (counts[i] > 0) {
      kinds++;
      if (counts[i] >= 2) hasPair = true;
    }
  }
  return 13 - kinds - (hasPair ? 1 : 0);
}

export function shanten(tiles: number[]): number {
  const counts = tileCounts(tiles);

  let best = regularShanten([...counts]);

  if (tiles.length === 13) {
    best = Math.min(best, sevenPairsShanten(counts));
    best = Math.min(best, thirteenOrphansShanten(counts));
  }

  if (tiles.length === 14) {
    best = Math.min(best, sevenPairsShanten(counts));
    best = Math.min(best, thirteenOrphansShanten(counts));
  }

  return best;
}

// Shanten of a hand that already has some completed (e.g. called/exposed) melds.
// `tiles` are the concealed tiles only; `completedMelds` is how many melds are
// already locked. Used to judge whether claiming a discard actually advances a hand.
export function shantenWithMelds(tiles: number[], completedMelds: number): number {
  const counts = tileCounts(tiles);
  bestShanten = 8;
  regularShantenSearch(counts, completedMelds, 0, false, 0);
  return bestShanten;
}

export function tenpaiWaits(tiles: number[]): number[] {
  if (shanten(tiles) !== 0) return [];

  const waits: number[] = [];
  const counts = tileCounts(tiles);

  for (let i = 0; i < 34; i++) {
    if (counts[i] >= 4) continue;
    const test = [...tiles, i];
    if (shanten(test) === -1) {
      waits.push(i);
    }
  }

  return waits;
}

export interface UkeireResult {
  tileIndex: number;
  remainingTiles: number;
  waits: number[];
  totalAcceptance: number;
}

export function ukeire(tiles: number[], visibleCounts?: number[]): UkeireResult[] {
  if (tiles.length < 2) return [];

  const handCounts = tileCounts(tiles);
  const visible = visibleCounts ?? [...handCounts];
  const currentShanten = shanten(tiles);
  const results: UkeireResult[] = [];

  const seen = new Set<number>();
  for (const discard of tiles) {
    if (seen.has(discard)) continue;
    seen.add(discard);

    const firstIdx = tiles.indexOf(discard);
    const afterDiscard = [...tiles.slice(0, firstIdx), ...tiles.slice(firstIdx + 1)];

    const waits: number[] = [];
    let total = 0;

    for (let i = 0; i < 34; i++) {
      if (visible[i] >= 4) continue;
      const test = [...afterDiscard, i];
      if (shanten(test) < currentShanten) {
        waits.push(i);
        total += 4 - visible[i];
      }
    }

    results.push({
      tileIndex: discard,
      remainingTiles: total,
      waits,
      totalAcceptance: total,
    });
  }

  results.sort((a, b) => b.totalAcceptance - a.totalAcceptance);
  return results;
}
