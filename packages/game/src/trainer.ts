import {
  indexToTile, tileKey,
  type Wind, WINDS,
} from '@mahjongkaki/engine';
import { shanten, tenpaiWaits, ukeire, shantenWithMelds, type UkeireResult } from './shanten.js';

export interface EfficiencyDrill {
  hand: number[];
  shantenValue: number;
  optimalDiscard: number;
  optimalAcceptance: number;
  allCandidates: UkeireResult[];
}

export interface WaitsDrill {
  hand: number[];
  correctWaits: number[];
}

export interface DefenseDrill {
  hand: number[];
  opponentDiscards: number[][];
  safestTiles: number[];
  tileRanking: { tile: number; safety: number }[];
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function randomHand(tileCount: number): number[] {
  const pool: number[] = [];
  for (let i = 0; i < 34; i++) {
    for (let copy = 0; copy < 4; copy++) pool.push(i);
  }
  const shuffled = shuffleArray(pool);
  return shuffled.slice(0, tileCount);
}

export function generateEfficiencyDrill(targetShanten: 1 | 2 = 1, maxAttempts = 500): EfficiencyDrill | null {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const hand = randomHand(14);
    const s = shanten(hand);
    if (s !== targetShanten) continue;

    const candidates = ukeire(hand);
    if (candidates.length === 0 || candidates[0].totalAcceptance === 0) continue;

    return {
      hand,
      shantenValue: s,
      optimalDiscard: candidates[0].tileIndex,
      optimalAcceptance: candidates[0].totalAcceptance,
      allCandidates: candidates,
    };
  }
  return null;
}

function buildWinningHand(): number[] | null {
  const counts = new Array(34).fill(0);
  const tiles: number[] = [];

  function addTile(t: number): boolean {
    if (counts[t] >= 4) return false;
    counts[t]++;
    tiles.push(t);
    return true;
  }

  for (let m = 0; m < 4; m++) {
    const meldType = Math.random() < 0.5 ? 'chow' : 'pung';
    for (let retry = 0; retry < 20; retry++) {
      if (meldType === 'chow') {
        const suitBase = Math.floor(Math.random() * 3) * 9;
        const start = Math.floor(Math.random() * 7);
        const a = suitBase + start, b = a + 1, c = a + 2;
        if (counts[a] < 4 && counts[b] < 4 && counts[c] < 4) {
          addTile(a); addTile(b); addTile(c);
          break;
        }
      } else {
        const t = Math.floor(Math.random() * 34);
        if (counts[t] <= 1) {
          addTile(t); addTile(t); addTile(t);
          break;
        }
      }
    }
  }

  if (tiles.length < 12) return null;

  for (let retry = 0; retry < 20; retry++) {
    const t = Math.floor(Math.random() * 34);
    if (counts[t] <= 2) {
      addTile(t); addTile(t);
      break;
    }
  }

  if (tiles.length < 14) return null;
  return shanten(tiles) === -1 ? tiles : null;
}

export function generateWaitsDrill(maxAttempts = 200): WaitsDrill | null {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const hand14 = buildWinningHand();
    if (!hand14) continue;

    const removeIdx = Math.floor(Math.random() * 14);
    const hand13 = [...hand14.slice(0, removeIdx), ...hand14.slice(removeIdx + 1)];

    if (shanten(hand13) !== 0) continue;

    const waits = tenpaiWaits(hand13);
    if (waits.length === 0) continue;

    return { hand: hand13, correctWaits: waits };
  }
  return null;
}

export function generateDefenseDrill(maxAttempts = 200): DefenseDrill | null {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const hand = randomHand(13);

    const opponentDiscards: number[][] = [];
    for (let p = 0; p < 3; p++) {
      const count = 3 + Math.floor(Math.random() * 6);
      const pond: number[] = [];
      for (let t = 0; t < count; t++) {
        pond.push(Math.floor(Math.random() * 34));
      }
      opponentDiscards.push(pond);
    }

    const allDiscarded = opponentDiscards.flat();
    const ranking: { tile: number; safety: number }[] = [];
    const seen = new Set<number>();

    for (const tile of hand) {
      if (seen.has(tile)) continue;
      seen.add(tile);

      let safety = 0;

      // Genbutsu
      for (const pond of opponentDiscards) {
        if (pond.includes(tile)) safety += 0.25;
      }

      // Kabe
      const totalVisible = hand.filter(t => t === tile).length +
        allDiscarded.filter(t => t === tile).length;
      if (totalVisible >= 4) safety = 1.0;

      // Terminal/honour bonus
      const pt = indexToTile(tile);
      if (pt.kind === 'wind' || pt.kind === 'dragon') safety += 0.1;
      if (pt.kind === 'suit' && (pt.value === 1 || pt.value === 9)) safety += 0.08;

      ranking.push({ tile, safety: Math.min(1, safety) });
    }

    ranking.sort((a, b) => b.safety - a.safety);

    if (ranking.length < 2) continue;
    if (ranking[0].safety === ranking[ranking.length - 1].safety) continue;

    return {
      hand,
      opponentDiscards,
      safestTiles: ranking.filter(r => r.safety === ranking[0].safety).map(r => r.tile),
      tileRanking: ranking,
    };
  }
  return null;
}

export function gradeEfficiency(drill: EfficiencyDrill, chosenDiscard: number): {
  isOptimal: boolean;
  acceptance: number;
  optimalAcceptance: number;
  ratio: number;
} {
  const chosen = drill.allCandidates.find(c => c.tileIndex === chosenDiscard);
  const acceptance = chosen?.totalAcceptance ?? 0;

  return {
    isOptimal: chosenDiscard === drill.optimalDiscard,
    acceptance,
    optimalAcceptance: drill.optimalAcceptance,
    ratio: drill.optimalAcceptance > 0 ? acceptance / drill.optimalAcceptance : 0,
  };
}

export function gradeWaits(drill: WaitsDrill, selectedWaits: number[]): {
  correct: number[];
  missed: number[];
  wrong: number[];
  score: number;
} {
  const correctSet = new Set(drill.correctWaits);
  const selectedSet = new Set(selectedWaits);

  const correct = selectedWaits.filter(w => correctSet.has(w));
  const missed = drill.correctWaits.filter(w => !selectedSet.has(w));
  const wrong = selectedWaits.filter(w => !correctSet.has(w));

  const score = wrong.length > 0 ? 0 :
    correct.length / drill.correctWaits.length;

  return { correct, missed, wrong, score };
}

export function gradeDefense(drill: DefenseDrill, chosenTile: number): {
  isOptimal: boolean;
  safety: number;
  bestSafety: number;
} {
  const chosen = drill.tileRanking.find(r => r.tile === chosenTile);
  const safety = chosen?.safety ?? 0;

  return {
    isOptimal: drill.safestTiles.includes(chosenTile),
    safety,
    bestSafety: drill.tileRanking[0].safety,
  };
}

// ============================================================
// Strategy drills: call (eat-or-pass), push/fold, hand direction,
// discard reading. These teach the judgement layer of mahjong.
//
// Grading philosophy: mahjong has no single "pro move", so each drill
// computes a transparent RECOMMENDATION grounded in shanten/ukeire and
// the engine's actual tai values, and explains WHY. The user's answer
// is graded against that recommendation (like a blackjack basic-strategy
// chart), with the reasoning always shown.
// ============================================================

// Engine tai values for the relevant scoring patterns (mirror scoring.ts).
const TAI = { allChows: 1, allPungs: 2, halfFlush: 2, fullFlush: 4, honourPung: 1 } as const;
const DRAGON_INDICES = [31, 32, 33];

function windIndex(w: Wind): number {
  return 27 + WINDS.indexOf(w);
}

function counts34(hand: number[]): number[] {
  const c = new Array(34).fill(0);
  for (const t of hand) c[t]++;
  return c;
}

interface SuitSpread {
  bamboo: number; character: number; dot: number; honours: number;
  dominant: 0 | 1 | 2; dominantCount: number;
}
function suitSpread(c: number[]): SuitSpread {
  const s = [0, 0, 0];
  let h = 0;
  for (let i = 0; i < 34; i++) {
    if (i < 27) s[Math.floor(i / 9)] += c[i];
    else h += c[i];
  }
  let dom: 0 | 1 | 2 = 0;
  if (s[1] > s[dom]) dom = 1;
  if (s[2] > s[dom]) dom = 2;
  return { bamboo: s[0], character: s[1], dot: s[2], honours: h, dominant: dom, dominantCount: s[dom] };
}

function tripletsAndPairs(c: number[]): { triplets: number; pairs: number } {
  let triplets = 0, pairs = 0;
  for (let i = 0; i < 34; i++) {
    if (c[i] >= 3) triplets++;
    else if (c[i] === 2) pairs++;
  }
  return { triplets, pairs };
}

// Count suit tiles that have a neighbour within +/-2 in the same suit (sequence potential).
function connectedSuitTiles(c: number[]): number {
  let n = 0;
  for (let i = 0; i < 27; i++) {
    if (c[i] === 0) continue;
    const v = i % 9;
    const hasNeighbour =
      (v >= 1 && c[i - 1] > 0) || (v <= 7 && c[i + 1] > 0) ||
      (v >= 2 && c[i - 2] > 0) || (v <= 6 && c[i + 2] > 0);
    if (hasNeighbour) n += c[i];
  }
  return n;
}

interface ValueSignal { label: string; tai: number; }

// Estimate the guaranteed-ish tai floor of a hand if it finishes as an OPEN hand.
// Only counts near-certain scoring paths; a generic mixed hand returns 0 (the
// Singapore "no tai, cannot win" trap).
function openValueFloor(hand: number[], seatWind: Wind, prevailingWind: Wind): { floor: number; signals: ValueSignal[] } {
  const c = counts34(hand);
  const sp = suitSpread(c);
  const { triplets } = tripletsAndPairs(c);
  const signals: ValueSignal[] = [];

  if (sp.dominantCount >= 9) {
    if (sp.honours === 0) signals.push({ label: 'full flush (清一色)', tai: TAI.fullFlush });
    else signals.push({ label: 'half flush (混一色)', tai: TAI.halfFlush });
  }
  for (const di of DRAGON_INDICES) if (c[di] >= 3) signals.push({ label: 'dragon pung', tai: TAI.honourPung });
  const sw = windIndex(seatWind), pw = windIndex(prevailingWind);
  if (c[sw] >= 3) signals.push({ label: 'seat-wind pung', tai: TAI.honourPung });
  if (pw !== sw && c[pw] >= 3) signals.push({ label: 'prevailing-wind pung', tai: TAI.honourPung });
  if (triplets >= 3) signals.push({ label: 'all pungs (对对胡)', tai: TAI.allPungs });
  if (sp.honours === 0 && triplets === 0 && connectedSuitTiles(c) >= 8) {
    signals.push({ label: 'all chows (平胡)', tai: TAI.allChows });
  }

  const floor = signals.reduce((m, s) => Math.max(m, s.tai), 0);
  return { floor, signals };
}

// --- Drill 1: Eat-or-pass (the call decision) ---

export type CallKind = 'pung' | 'chow';

export interface CallDrill {
  hand: number[];
  discardTile: number;
  callKind: CallKind;
  meldTiles: number[];
  seatWind: Wind;
  prevailingWind: Wind;
  shantenBefore: number;
  shantenAfterCall: number;
  recommendation: 'call' | 'pass';
  reasons: string[];
}

export interface CallGrade {
  correct: boolean;
  recommendation: 'call' | 'pass';
  reasons: string[];
  shantenBefore: number;
  shantenAfterCall: number;
}

function findCall(hand: number[]): { kind: CallKind; discardTile: number; used: number[] } | null {
  const c = counts34(hand);

  const pons: number[] = [];
  for (let i = 33; i >= 27; i--) if (c[i] === 2) pons.push(i); // honours first (value calls)
  for (let i = 0; i < 27; i++) if (c[i] === 2) pons.push(i);

  // Prefer a pon ~60% of the time so value calls show up; otherwise look for a chow.
  if (pons.length && Math.random() < 0.6) {
    const t = pons[0];
    return { kind: 'pung', discardTile: t, used: [t, t] };
  }

  const partials: { discard: number; used: number[] }[] = [];
  for (let i = 0; i < 27; i++) {
    const v = i % 9;
    if (c[i] === 0) continue;
    if (v <= 7 && c[i + 1] > 0) {
      if (v <= 6) partials.push({ discard: i + 2, used: [i, i + 1] });
      if (v >= 1) partials.push({ discard: i - 1, used: [i, i + 1] });
    }
    if (v <= 6 && c[i + 2] > 0) partials.push({ discard: i + 1, used: [i, i + 2] });
  }
  if (partials.length) {
    const p = partials[Math.floor(Math.random() * partials.length)];
    return { kind: 'chow', discardTile: p.discard, used: p.used };
  }

  if (pons.length) {
    const t = pons[0];
    return { kind: 'pung', discardTile: t, used: [t, t] };
  }
  return null;
}

export function generateCallDrill(maxAttempts = 400): CallDrill | null {
  for (let a = 0; a < maxAttempts; a++) {
    const hand = randomHand(13);
    const call = findCall(hand);
    if (!call) continue;

    const shantenBefore = shanten(hand);
    if (shantenBefore < 1 || shantenBefore > 4) continue; // keep it mid-game

    const concealedAfter = [...hand];
    for (const u of call.used) {
      const idx = concealedAfter.indexOf(u);
      if (idx >= 0) concealedAfter.splice(idx, 1);
    }
    const shantenAfterCall = shantenWithMelds(concealedAfter, 1);

    const seatWind = WINDS[Math.floor(Math.random() * 4)];
    const prevailingWind = WINDS[Math.floor(Math.random() * 4)];
    const { floor, signals } = openValueFloor(hand, seatWind, prevailingWind);

    const advances = shantenAfterCall < shantenBefore;
    let recommendation: 'call' | 'pass';
    const reasons: string[] = [];

    if (!advances) {
      recommendation = 'pass';
      reasons.push(`Calling doesn't bring you closer to tenpai (${shantenBefore}→${shantenAfterCall} shanten).`);
      reasons.push('Calling for no speed gain just exposes your hand and weakens your defence for nothing.');
    } else if (floor >= 1) {
      recommendation = 'call';
      reasons.push(`Calling advances you from ${shantenBefore} to ${shantenAfterCall} shanten.`);
      reasons.push(`You keep a scoring path: ${signals.map(s => s.label).join(', ')}.`);
    } else {
      recommendation = 'pass';
      reasons.push(`Calling would speed you up (${shantenBefore}→${shantenAfterCall}) — but look at the value.`);
      reasons.push('Opened, this hand has no guaranteed tai. In Singapore mahjong a 0-tai hand cannot win — the classic "no tai" trap.');
    }

    const meldTiles = [...call.used, call.discardTile].sort((x, y) => x - y);
    return {
      hand, discardTile: call.discardTile, callKind: call.kind, meldTiles,
      seatWind, prevailingWind, shantenBefore, shantenAfterCall, recommendation, reasons,
    };
  }
  return null;
}

export function gradeCall(drill: CallDrill, choice: 'call' | 'pass'): CallGrade {
  return {
    correct: choice === drill.recommendation,
    recommendation: drill.recommendation,
    reasons: drill.reasons,
    shantenBefore: drill.shantenBefore,
    shantenAfterCall: drill.shantenAfterCall,
  };
}

// --- Drill 2: Push or fold ---

export type PushFoldChoice = 'push' | 'fold' | 'sidestep';

export interface PushFoldDrill {
  hand: number[];
  opponentDiscards: number[];
  opponentExposed: number[];
  threatLevel: 'low' | 'high';
  yourShanten: number;
  recommendation: PushFoldChoice;
  reasons: string[];
  safeTiles: number[];
}

export interface PushFoldGrade {
  correct: boolean;
  recommendation: PushFoldChoice;
  reasons: string[];
}

function randomPond(len: number): number[] {
  const pond: number[] = [];
  for (let i = 0; i < len; i++) pond.push(Math.floor(Math.random() * 34));
  return pond;
}

export function generatePushFoldDrill(maxAttempts = 500): PushFoldDrill | null {
  const DRAGON_PUNG = [31, 31, 31]; // exposed red-dragon pung = visible danger

  for (let a = 0; a < maxAttempts; a++) {
    const hand = randomHand(13);
    const yourShanten = shanten(hand);

    // Tenpai → race, push.
    if (yourShanten === 0) {
      const pond = randomPond(8);
      const safe = [...new Set(hand.filter(t => pond.includes(t)))];
      return {
        hand, opponentDiscards: pond, opponentExposed: DRAGON_PUNG, threatLevel: 'high', yourShanten,
        recommendation: 'push',
        reasons: [
          'You are already tenpai — one tile away from winning.',
          'In a tenpai-vs-tenpai race you almost always push your ready hand rather than fold it.',
        ],
        safeTiles: safe,
      };
    }

    const roll = Math.random();

    if (roll < 0.34) {
      // Low threat → push.
      const pond = randomPond(4);
      const safe = [...new Set(hand.filter(t => pond.includes(t)))];
      return {
        hand, opponentDiscards: pond, opponentExposed: [], threatLevel: 'low', yourShanten,
        recommendation: 'push',
        reasons: [
          'No strong threat: short discard pond, no exposed value melds.',
          'When nobody looks close, keep building your own hand — defending now wastes tempo.',
        ],
        safeTiles: safe,
      };
    }

    if (roll < 0.67) {
      // Fold: far from tenpai, opponent dangerous, safe tiles available.
      if (yourShanten < 2) continue;
      const pond = randomPond(11);
      const distinct = [...new Set(hand)];
      pond.push(distinct[0]);
      if (distinct[1] !== undefined) pond.push(distinct[1]);
      const safe = [...new Set(hand.filter(t => pond.includes(t)))];
      if (safe.length < 2) continue;
      return {
        hand, opponentDiscards: pond, opponentExposed: DRAGON_PUNG, threatLevel: 'high', yourShanten,
        recommendation: 'fold',
        reasons: [
          `Opponent looks tenpai (exposed dragon pung + ${pond.length} discards) and you are still ${yourShanten} shanten away.`,
          'Too far to win the race; dealing in is the worst outcome. Fold out on safe tiles (betaori).',
          `You hold safe tiles to fold with: ${safe.map(t => tileKey(indexToTile(t))).join(', ')}.`,
        ],
        safeTiles: safe,
      };
    }

    // Sidestep: 1-shanten, dangerous opponent, but you have safe tiles to throw.
    if (yourShanten !== 1) continue;
    const pond = randomPond(10);
    const distinct = [...new Set(hand)];
    pond.push(distinct[0]);
    const safe = [...new Set(hand.filter(t => pond.includes(t)))];
    if (safe.length < 1) continue;
    return {
      hand, opponentDiscards: pond, opponentExposed: DRAGON_PUNG, threatLevel: 'high', yourShanten,
      recommendation: 'sidestep',
      reasons: [
        'Opponent looks tenpai, but you are only 1 shanten — close enough to keep trying.',
        'Sidestep (mawashi): discard your safe tiles while still pushing toward tenpai, instead of fully folding.',
        `Safe tiles available: ${safe.map(t => tileKey(indexToTile(t))).join(', ')}.`,
      ],
      safeTiles: safe,
    };
  }
  return null;
}

export function gradePushFold(drill: PushFoldDrill, choice: PushFoldChoice): PushFoldGrade {
  return { correct: choice === drill.recommendation, recommendation: drill.recommendation, reasons: drill.reasons };
}

// --- Drill 3: Hand direction (what to aim for) ---

export interface DirectionOption {
  key: string;
  label: string;
  tai: number;
  feasibility: number;
  score: number;
}

export interface DirectionDrill {
  hand: number[];
  options: DirectionOption[];
  recommendation: string;
  reasons: string[];
}

export interface DirectionGrade {
  correct: boolean;
  recommendation: string;
  recommendedLabel: string;
  options: DirectionOption[];
  reasons: string[];
}

function directionOptions(hand: number[]): DirectionOption[] {
  const c = counts34(hand);
  const sp = suitSpread(c);
  const { triplets, pairs } = tripletsAndPairs(c);
  const connected = connectedSuitTiles(c);
  const clamp = (x: number) => Math.max(0, Math.min(1, x));

  const feasFull = clamp(sp.dominantCount / 13);
  const feasHalf = clamp((sp.dominantCount + sp.honours) / 13);
  const feasPungs = clamp((triplets * 1.2 + pairs * 0.6) / 4);
  const feasChows = clamp((connected - triplets * 2) / 12) * (sp.honours === 0 ? 1 : 0.6);

  const opts: DirectionOption[] = [
    { key: 'full_flush', label: 'Full Flush (清一色)', tai: TAI.fullFlush, feasibility: feasFull, score: TAI.fullFlush * feasFull * feasFull },
    { key: 'half_flush', label: 'Half Flush (混一色)', tai: TAI.halfFlush, feasibility: feasHalf, score: TAI.halfFlush * feasHalf * feasHalf },
    { key: 'all_pungs', label: 'All Pungs (对对胡)', tai: TAI.allPungs, feasibility: feasPungs, score: TAI.allPungs * feasPungs },
    { key: 'all_chows', label: 'All Chows (平胡)', tai: TAI.allChows, feasibility: feasChows, score: TAI.allChows * feasChows },
    { key: 'flexible', label: 'Stay Flexible', tai: 1, feasibility: 0.5, score: 0.55 },
  ];
  return opts.sort((a, b) => b.score - a.score);
}

export function generateDirectionDrill(maxAttempts = 400): DirectionDrill | null {
  for (let a = 0; a < maxAttempts; a++) {
    const hand = randomHand(13);
    const options = directionOptions(hand);
    const [top, second] = options;
    if (top.score - second.score < 0.18) continue; // require a clear winner

    const reasons = [
      `Best target: ${top.label} — the highest expected value × feasibility from these tiles.`,
      `It weighs the tai (${top.tai}) against how much of your hand already fits it (${Math.round(top.feasibility * 100)}%).`,
    ];
    return { hand, options, recommendation: top.key, reasons };
  }
  return null;
}

export function gradeDirection(drill: DirectionDrill, choiceKey: string): DirectionGrade {
  const rec = drill.options.find(o => o.key === drill.recommendation)!;
  return {
    correct: choiceKey === drill.recommendation,
    recommendation: drill.recommendation,
    recommendedLabel: rec.label,
    options: drill.options,
    reasons: drill.reasons,
  };
}

// --- Drill 4: Discard reading (read what an opponent is collecting) ---

export type ReadingSuit = 'bamboo' | 'character' | 'dot' | 'honours';

export interface ReadingDrill {
  opponentDiscards: number[];
  options: { key: ReadingSuit; label: string }[];
  answer: ReadingSuit;
  reasons: string[];
}

export interface ReadingGrade {
  correct: boolean;
  answer: ReadingSuit;
  answerLabel: string;
  reasons: string[];
}

const READING_OPTIONS: { key: ReadingSuit; label: string }[] = [
  { key: 'bamboo', label: 'Bamboo (索)' },
  { key: 'character', label: 'Character (萬)' },
  { key: 'dot', label: 'Dot (筒)' },
  { key: 'honours', label: 'Honours' },
];
const READING_SUITS: ReadingSuit[] = ['bamboo', 'character', 'dot'];

export function generateReadingDrill(maxAttempts = 200): ReadingDrill | null {
  for (let a = 0; a < maxAttempts; a++) {
    const targetIdx = Math.floor(Math.random() * 3); // suit the opponent is collecting
    const base = targetIdx * 9;
    const pondLen = 8 + Math.floor(Math.random() * 4);
    const pond: number[] = [];

    for (let i = 0; i < pondLen; i++) {
      if (Math.random() < 0.85) {
        const other = (targetIdx + 1 + Math.floor(Math.random() * 2)) % 3; // a non-target suit
        pond.push(other * 9 + Math.floor(Math.random() * 9));
      } else {
        pond.push(27 + Math.floor(Math.random() * 7)); // an honour
      }
    }

    // Opponent never discards the suit they are collecting.
    if (pond.some(t => t >= base && t < base + 9)) continue;
    // Both off-suits should appear so the read is "they're keeping the third suit".
    const offSuits = [0, 1, 2].filter(s => s !== targetIdx);
    const offRepresented = offSuits.every(s => pond.some(t => t >= s * 9 && t < s * 9 + 9));
    if (!offRepresented) continue;

    const target = READING_SUITS[targetIdx];
    const reasons = [
      `The opponent has discarded other suits and honours but ZERO ${target} tiles.`,
      `Players throw away what they are not using — so they are almost certainly collecting ${target}. Hold your ${target} tiles back.`,
    ];
    return { opponentDiscards: pond, options: READING_OPTIONS, answer: target, reasons };
  }
  return null;
}

export function gradeReading(drill: ReadingDrill, choice: ReadingSuit): ReadingGrade {
  const opt = drill.options.find(o => o.key === drill.answer)!;
  return { correct: choice === drill.answer, answer: drill.answer, answerLabel: opt.label, reasons: drill.reasons };
}
