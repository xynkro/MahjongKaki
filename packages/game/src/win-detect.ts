import { type PlayTile, type Meld, tileToIndex, indexToTile } from '@mahjongkaki/engine';
import { shanten } from './shanten.js';

export function canWin(handIndices: number[], melds: Meld[]): boolean {
  const totalMelds = melds.length;
  const neededFromHand = 4 - totalMelds;

  if (handIndices.length !== neededFromHand * 3 + 2) return false;

  if (totalMelds === 0) {
    return shanten(handIndices) === -1;
  }

  return canDecompose(handIndices, neededFromHand);
}

function canDecompose(handIndices: number[], targetMelds: number): boolean {
  const counts = new Array(34).fill(0);
  for (const t of handIndices) counts[t]++;

  for (let pair = 0; pair < 34; pair++) {
    if (counts[pair] < 2) continue;
    counts[pair] -= 2;
    if (extractNMelds(counts, 0, targetMelds)) {
      counts[pair] += 2;
      return true;
    }
    counts[pair] += 2;
  }
  return false;
}

function extractNMelds(counts: number[], pos: number, remaining: number): boolean {
  if (remaining === 0) {
    return counts.every(c => c === 0);
  }

  while (pos < 34 && counts[pos] === 0) pos++;
  if (pos >= 34) return false;

  if (counts[pos] >= 3) {
    counts[pos] -= 3;
    if (extractNMelds(counts, pos, remaining - 1)) { counts[pos] += 3; return true; }
    counts[pos] += 3;
  }

  if (pos < 27 && (pos % 9) <= 6 && counts[pos + 1] > 0 && counts[pos + 2] > 0) {
    counts[pos]--;
    counts[pos + 1]--;
    counts[pos + 2]--;
    if (extractNMelds(counts, pos, remaining - 1)) { counts[pos]++; counts[pos + 1]++; counts[pos + 2]++; return true; }
    counts[pos]++;
    counts[pos + 1]++;
    counts[pos + 2]++;
  }

  return false;
}

export function isThirteenOrphans(handIndices: number[]): boolean {
  if (handIndices.length !== 14) return false;

  const ORPHANS = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];
  const counts = new Array(34).fill(0);
  for (const t of handIndices) counts[t]++;

  let hasPair = false;
  for (const i of ORPHANS) {
    if (counts[i] === 0) return false;
    if (counts[i] === 2) hasPair = true;
  }
  return hasPair;
}

export function isSevenPairs(handIndices: number[]): boolean {
  if (handIndices.length !== 14) return false;

  const counts = new Array(34).fill(0);
  for (const t of handIndices) counts[t]++;

  let pairs = 0;
  for (let i = 0; i < 34; i++) {
    if (counts[i] === 2) pairs++;
    else if (counts[i] !== 0) return false;
  }
  return pairs === 7;
}

export interface WinDecomposition {
  melds: { type: 'chow' | 'pung'; tiles: number[] }[];
  pair: number;
}

export function decomposeWinningHand(handIndices: number[]): WinDecomposition[] {
  const counts = new Array(34).fill(0);
  for (const t of handIndices) counts[t]++;

  const results: WinDecomposition[] = [];

  for (let pair = 0; pair < 34; pair++) {
    if (counts[pair] < 2) continue;
    counts[pair] -= 2;

    const melds: { type: 'chow' | 'pung'; tiles: number[] }[] = [];
    if (extractMelds(counts, 0, melds)) {
      results.push({ melds: [...melds], pair });
    }

    counts[pair] += 2;
  }

  return results;
}

function extractMelds(
  counts: number[],
  pos: number,
  melds: { type: 'chow' | 'pung'; tiles: number[] }[],
): boolean {
  while (pos < 34 && counts[pos] === 0) pos++;
  if (pos >= 34) return true;

  if (counts[pos] >= 3) {
    counts[pos] -= 3;
    melds.push({ type: 'pung', tiles: [pos, pos, pos] });
    if (extractMelds(counts, pos, melds)) return true;
    melds.pop();
    counts[pos] += 3;
  }

  if (pos < 27 && (pos % 9) <= 6 && counts[pos + 1] > 0 && counts[pos + 2] > 0) {
    counts[pos]--;
    counts[pos + 1]--;
    counts[pos + 2]--;
    melds.push({ type: 'chow', tiles: [pos, pos + 1, pos + 2] });
    if (extractMelds(counts, pos, melds)) return true;
    melds.pop();
    counts[pos]++;
    counts[pos + 1]++;
    counts[pos + 2]++;
  }

  return false;
}
