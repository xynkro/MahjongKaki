import type { Hand, WinContext, TaiElement, ScoringResult, PlayTile, Meld, Suit } from './types.js';
import type { RulesConfig } from './rules.js';
import { DEFAULT_RULES } from './rules.js';
import {
  FLOWER_WIND_MAP, SEASON_WIND_MAP, DRAGONS, WINDS,
  isHonour, isTerminal, isTerminalOrHonour, getMeldSuit,
} from './tiles.js';

function isConcealedHand(hand: Hand): boolean {
  return hand.melds.every(m => !m.exposed || m.type === 'kong');
}

function allMeldsArePungs(hand: Hand): boolean {
  return hand.melds
    .filter(m => m.type !== 'eyes')
    .every(m => m.type === 'pung' || m.type === 'kong');
}

function allMeldsAreChows(hand: Hand): boolean {
  return hand.melds
    .filter(m => m.type !== 'eyes')
    .every(m => m.type === 'chow');
}

function getHandSuits(hand: Hand): Set<Suit> {
  const suits = new Set<Suit>();
  for (const meld of hand.melds) {
    const s = getMeldSuit(meld);
    if (s) suits.add(s);
  }
  return suits;
}

function hasHonourTiles(hand: Hand): boolean {
  return hand.melds.some(m => m.tiles.some(t => isHonour(t)));
}

function allTilesAreHonours(hand: Hand): boolean {
  return hand.melds.every(m => m.tiles.every(t => isHonour(t)));
}

function allTilesAreTerminals(hand: Hand): boolean {
  return hand.melds.every(m => m.tiles.every(t => isTerminal(t)));
}

function allTilesAreTerminalsOrHonours(hand: Hand): boolean {
  return hand.melds.every(m => m.tiles.every(t => isTerminalOrHonour(t)));
}

function countDragonPungs(hand: Hand): number {
  return hand.melds.filter(m =>
    (m.type === 'pung' || m.type === 'kong') &&
    m.tiles[0].kind === 'dragon'
  ).length;
}

function hasDragonPair(hand: Hand): boolean {
  return hand.melds.some(m =>
    m.type === 'eyes' && m.tiles[0].kind === 'dragon'
  );
}

function countWindPungs(hand: Hand): number {
  return hand.melds.filter(m =>
    (m.type === 'pung' || m.type === 'kong') &&
    m.tiles[0].kind === 'wind'
  ).length;
}

function hasWindPair(hand: Hand): boolean {
  return hand.melds.some(m =>
    m.type === 'eyes' && m.tiles[0].kind === 'wind'
  );
}

function isThirteenOrphans(hand: Hand): boolean {
  if (hand.melds.length !== 13) return false;
  // Special hand: one of each terminal + honour + one pair
  // Represented as 13 single tiles + 1 pair in some implementations
  // For simplicity, we check via a flag or special meld structure
  // The caller should set this up as a special case
  return false;
}

export function scoreTaiElements(
  hand: Hand,
  ctx: WinContext,
  rules: RulesConfig = DEFAULT_RULES,
): TaiElement[] {
  const elements: TaiElement[] = [];

  // --- Bonus tiles ---
  const seatWind = ctx.seatWind;

  if (rules.anyFlowerScores) {
    for (const f of hand.flowers) {
      elements.push({
        id: `flower_${f.flower}`,
        name: `Flower: ${f.flower}`,
        nameZh: '花',
        tai: 1,
        description: `Flower tile ${f.flower}`,
      });
    }
    for (const s of hand.seasons) {
      elements.push({
        id: `season_${s.season}`,
        name: `Season: ${s.season}`,
        nameZh: '花',
        tai: 1,
        description: `Season tile ${s.season}`,
      });
    }
  } else {
    for (const f of hand.flowers) {
      if (FLOWER_WIND_MAP[f.flower] === seatWind) {
        elements.push({
          id: `flower_matched_${f.flower}`,
          name: `Seat Flower: ${f.flower}`,
          nameZh: '正花',
          tai: 1,
          description: `Matched flower for ${seatWind} seat`,
        });
      }
    }
    for (const s of hand.seasons) {
      if (SEASON_WIND_MAP[s.season] === seatWind) {
        elements.push({
          id: `season_matched_${s.season}`,
          name: `Seat Season: ${s.season}`,
          nameZh: '正花',
          tai: 1,
          description: `Matched season for ${seatWind} seat`,
        });
      }
    }
  }

  if (hand.flowers.length === 4) {
    elements.push({
      id: 'flower_set',
      name: 'Complete Flower Set',
      nameZh: '一台花',
      tai: 1,
      description: 'All four flowers collected',
    });
  }

  if (hand.seasons.length === 4) {
    elements.push({
      id: 'season_set',
      name: 'Complete Season Set',
      nameZh: '一台花',
      tai: 1,
      description: 'All four seasons collected',
    });
  }

  if (rules.animalsEnabled) {
    for (const a of hand.animals) {
      elements.push({
        id: `animal_${a.animal}`,
        name: `Animal: ${a.animal}`,
        nameZh: '动物',
        tai: 1,
        description: `Animal tile ${a.animal}`,
      });
    }
    if (hand.animals.length === 4) {
      elements.push({
        id: 'animal_set',
        name: 'Complete Animal Set',
        nameZh: '动物全',
        tai: 1,
        description: 'All four animals collected',
      });
    }
  }

  const totalBonusTiles = hand.flowers.length + hand.seasons.length + hand.animals.length;
  if (rules.noFlowerBonus && totalBonusTiles === 0) {
    elements.push({
      id: 'no_flowers',
      name: 'No Flowers',
      nameZh: '无花',
      tai: 1,
      description: 'No bonus tiles drawn',
    });
  }

  // --- Per-set bonuses ---
  for (const meld of hand.melds) {
    if (meld.type !== 'pung' && meld.type !== 'kong') continue;
    const tile = meld.tiles[0];

    if (tile.kind === 'dragon') {
      elements.push({
        id: `dragon_pung_${tile.dragon}`,
        name: `Dragon Pung: ${tile.dragon}`,
        nameZh: `${tile.dragon === 'red' ? '中' : tile.dragon === 'green' ? '发' : '白'}刻`,
        tai: 1,
        description: `Pung/Kong of ${tile.dragon} dragon`,
      });
    }

    if (tile.kind === 'wind') {
      if (tile.wind === ctx.seatWind) {
        elements.push({
          id: `seat_wind_pung`,
          name: `Seat Wind Pung: ${tile.wind}`,
          nameZh: '门风刻',
          tai: 1,
          description: `Pung/Kong of seat wind ${tile.wind}`,
        });
      }
      if (tile.wind === ctx.prevailingWind) {
        elements.push({
          id: `prevailing_wind_pung`,
          name: `Prevailing Wind Pung: ${tile.wind}`,
          nameZh: '圈风刻',
          tai: 1,
          description: `Pung/Kong of prevailing wind ${tile.wind}`,
        });
      }
    }
  }

  // Small Three Dragons: 2 dragon pungs + dragon pair
  const dragonPungCount = countDragonPungs(hand);
  if (dragonPungCount === 2 && hasDragonPair(hand)) {
    elements.push({
      id: 'small_three_dragons',
      name: 'Small Three Dragons',
      nameZh: '小三元',
      tai: 1,
      description: 'Two dragon pungs and a dragon pair',
    });
  }

  // --- Hand shape tai (these STACK) ---
  const suits = getHandSuits(hand);
  const hasHonours = hasHonourTiles(hand);
  const nonEyeMelds = hand.melds.filter(m => m.type !== 'eyes');

  // All Chows (Ping Hu)
  if (allMeldsAreChows(hand)) {
    elements.push({
      id: 'all_chows',
      name: 'All Chows',
      nameZh: '平胡',
      tai: 1,
      description: 'All sets are sequences (chows)',
    });
  }

  // All Pungs
  if (allMeldsArePungs(hand)) {
    elements.push({
      id: 'all_pungs',
      name: 'All Pungs',
      nameZh: '对对胡',
      tai: 2,
      description: 'All sets are triplets or quads',
    });
  }

  // Half Flush
  if (suits.size === 1 && hasHonours) {
    elements.push({
      id: 'half_flush',
      name: 'Half Flush',
      nameZh: '混一色',
      tai: 2,
      description: 'One suit plus honour tiles',
    });
  }

  // Full Flush
  if (suits.size === 1 && !hasHonours) {
    elements.push({
      id: 'full_flush',
      name: 'Full Flush',
      nameZh: '清一色',
      tai: 4,
      description: 'Single suit only, no honours',
    });
  }

  // Half Terminals
  if (allTilesAreTerminalsOrHonours(hand) && hasHonours && !allTilesAreHonours(hand)) {
    elements.push({
      id: 'half_terminals',
      name: 'Half Terminals',
      nameZh: '混么九',
      tai: 2,
      description: 'Only terminals (1s, 9s) and honours',
    });
  }

  // Ping Wu: all chow + concealed + no bonus tiles
  if (allMeldsAreChows(hand) && isConcealedHand(hand) && totalBonusTiles === 0) {
    // Remove the all_chows element since Ping Wu supersedes it
    const idx = elements.findIndex(e => e.id === 'all_chows');
    if (idx !== -1) elements.splice(idx, 1);
    elements.push({
      id: 'ping_wu',
      name: 'Ping Wu',
      nameZh: '平湖',
      tai: rules.pingWuTai,
      description: 'All chows, concealed, no bonus tiles',
    });
  }

  // Concealed hand bonus (separate from Ping Wu)
  if (isConcealedHand(hand) && rules.concealedHandTai > 0) {
    // Don't double-count if Ping Wu already awarded
    const hasPingWu = elements.some(e => e.id === 'ping_wu');
    if (!hasPingWu) {
      elements.push({
        id: 'concealed_hand',
        name: 'Concealed Hand',
        nameZh: '门清',
        tai: rules.concealedHandTai,
        description: 'No exposed melds',
      });
    }
  }

  // --- Limit hands ---
  // All Honours
  if (allTilesAreHonours(hand)) {
    elements.push({
      id: 'all_honours',
      name: 'All Honours',
      nameZh: '字一色',
      tai: rules.taiCap ?? 13,
      description: 'Only honour tiles (winds and dragons)',
    });
  }

  // All Terminals
  if (allTilesAreTerminals(hand)) {
    elements.push({
      id: 'all_terminals',
      name: 'All Terminals',
      nameZh: '清么九',
      tai: rules.taiCap ?? 13,
      description: 'Only terminal tiles (1s and 9s)',
    });
  }

  // Big Three Dragons
  if (dragonPungCount === 3) {
    elements.push({
      id: 'big_three_dragons',
      name: 'Big Three Dragons',
      nameZh: '大三元',
      tai: rules.taiCap ?? 13,
      description: 'Pungs/Kongs of all three dragons',
    });
  }

  // Big Four Winds
  if (countWindPungs(hand) === 4) {
    elements.push({
      id: 'big_four_winds',
      name: 'Big Four Winds',
      nameZh: '大四喜',
      tai: rules.taiCap ?? 13,
      description: 'Pungs/Kongs of all four winds',
    });
  }

  // Small Four Winds: 3 wind pungs + wind pair
  if (countWindPungs(hand) === 3 && hasWindPair(hand)) {
    elements.push({
      id: 'small_four_winds',
      name: 'Small Four Winds',
      nameZh: '小四喜',
      tai: rules.taiCap ?? 13,
      description: 'Three wind pungs and a wind pair',
    });
  }

  // --- Win circumstance ---
  if (rules.zimoAsTai && ctx.winType === 'zimo') {
    elements.push({
      id: 'zimo',
      name: 'Self-Draw',
      nameZh: '自摸',
      tai: 1,
      description: 'Won by drawing the winning tile',
    });
  }

  if (ctx.isKongReplacement) {
    elements.push({
      id: 'kong_replacement',
      name: 'Kong Replacement Win',
      nameZh: '杠上开花',
      tai: 1,
      description: 'Won on replacement tile after declaring a kong',
    });
  }

  if (ctx.isLastTile) {
    elements.push({
      id: 'last_tile',
      name: 'Last Tile Win',
      nameZh: '海底捞月',
      tai: 1,
      description: 'Won on the last tile from the wall',
    });
  }

  if (ctx.isRobbingKong) {
    elements.push({
      id: 'robbing_kong',
      name: 'Robbing the Kong',
      nameZh: '抢杠',
      tai: 1,
      description: 'Won by taking a tile from an opponent\'s kong declaration',
    });
  }

  return elements;
}

export function scoreHand(
  hand: Hand,
  ctx: WinContext,
  rules: RulesConfig = DEFAULT_RULES,
): ScoringResult {
  const elements = scoreTaiElements(hand, ctx, rules);
  const totalTai = elements.reduce((sum, e) => sum + e.tai, 0);

  const cappedTai = rules.taiCap !== null
    ? Math.min(totalTai, rules.taiCap)
    : totalTai;

  const isValid = cappedTai >= rules.minTai;

  return {
    elements,
    totalTai,
    cappedTai,
    isValid,
    invalidReason: isValid
      ? undefined
      : `Only ${totalTai} tai — your table needs at least ${rules.minTai} to win.`,
  };
}
