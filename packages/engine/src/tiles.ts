import type {
  Suit, Wind, Dragon, FlowerName, SeasonName, AnimalName,
  SuitTile, WindTile, DragonTile, FlowerTile, SeasonTile, AnimalTile,
  PlayTile, BonusTile, Meld,
} from './types.js';

export const WINDS: Wind[] = ['east', 'south', 'west', 'north'];
export const DRAGONS: Dragon[] = ['red', 'green', 'white'];
export const SUITS: Suit[] = ['bamboo', 'character', 'dot'];

export const FLOWER_WIND_MAP: Record<FlowerName, Wind> = {
  plum: 'east',
  orchid: 'south',
  chrysanthemum: 'west',
  bamboo_flower: 'north',
};

export const SEASON_WIND_MAP: Record<SeasonName, Wind> = {
  spring: 'east',
  summer: 'south',
  autumn: 'west',
  winter: 'north',
};

export const ANIMAL_PAIRS: [AnimalName, AnimalName][] = [
  ['cat', 'rat'],
  ['rooster', 'centipede'],
];

export function suit(s: Suit, v: 1|2|3|4|5|6|7|8|9): SuitTile {
  return { kind: 'suit', suit: s, value: v };
}

export function wind(w: Wind): WindTile {
  return { kind: 'wind', wind: w };
}

export function dragon(d: Dragon): DragonTile {
  return { kind: 'dragon', dragon: d };
}

export function flower(f: FlowerName): FlowerTile {
  return { kind: 'flower', flower: f };
}

export function season(s: SeasonName): SeasonTile {
  return { kind: 'season', season: s };
}

export function animal(a: AnimalName): AnimalTile {
  return { kind: 'animal', animal: a };
}

export function pung(tile: PlayTile, exposed = true): Meld {
  return { type: 'pung', tiles: [tile, tile, tile], exposed };
}

export function kong(tile: PlayTile, exposed = true): Meld {
  return { type: 'kong', tiles: [tile, tile, tile, tile], exposed };
}

export function chow(s: Suit, start: 1|2|3|4|5|6|7, exposed = true): Meld {
  const v1 = start as 1|2|3|4|5|6|7|8|9;
  const v2 = (start + 1) as 1|2|3|4|5|6|7|8|9;
  const v3 = (start + 2) as 1|2|3|4|5|6|7|8|9;
  return {
    type: 'chow',
    tiles: [suit(s, v1), suit(s, v2), suit(s, v3)],
    exposed,
  };
}

export function eyes(tile: PlayTile): Meld {
  return { type: 'eyes', tiles: [tile, tile], exposed: false };
}

export function tilesEqual(a: PlayTile, b: PlayTile): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'suit' && b.kind === 'suit') {
    return a.suit === b.suit && a.value === b.value;
  }
  if (a.kind === 'wind' && b.kind === 'wind') {
    return a.wind === b.wind;
  }
  if (a.kind === 'dragon' && b.kind === 'dragon') {
    return a.dragon === b.dragon;
  }
  return false;
}

export function isTerminal(tile: PlayTile): boolean {
  return tile.kind === 'suit' && (tile.value === 1 || tile.value === 9);
}

export function isHonour(tile: PlayTile): boolean {
  return tile.kind === 'wind' || tile.kind === 'dragon';
}

export function isTerminalOrHonour(tile: PlayTile): boolean {
  return isTerminal(tile) || isHonour(tile);
}

export function getMeldSuit(meld: Meld): Suit | null {
  const first = meld.tiles[0];
  return first.kind === 'suit' ? first.suit : null;
}

export function getMeldRepresentativeTile(meld: Meld): PlayTile {
  return meld.tiles[0];
}

// --- Tile Index Utilities ---
// 34 play-tile indices:
//   0-8   = bamboo 1-9
//   9-17  = character 1-9
//   18-26 = dot 1-9
//   27-30 = east/south/west/north
//   31-33 = red/green/white

const SUIT_OFFSET: Record<Suit, number> = { bamboo: 0, character: 9, dot: 18 };
const WIND_OFFSET: Record<Wind, number> = { east: 27, south: 28, west: 29, north: 30 };
const DRAGON_OFFSET: Record<Dragon, number> = { red: 31, green: 32, white: 33 };

export function tileToIndex(tile: PlayTile): number {
  if (tile.kind === 'suit') return SUIT_OFFSET[tile.suit] + tile.value - 1;
  if (tile.kind === 'wind') return WIND_OFFSET[tile.wind];
  return DRAGON_OFFSET[tile.dragon];
}

export function indexToTile(index: number): PlayTile {
  if (index < 9) return { kind: 'suit', suit: 'bamboo', value: (index + 1) as SuitTile['value'] };
  if (index < 18) return { kind: 'suit', suit: 'character', value: (index - 8) as SuitTile['value'] };
  if (index < 27) return { kind: 'suit', suit: 'dot', value: (index - 17) as SuitTile['value'] };
  if (index < 31) return { kind: 'wind', wind: WINDS[index - 27] };
  return { kind: 'dragon', dragon: DRAGONS[index - 31] };
}

export function tileKey(tile: PlayTile): string {
  if (tile.kind === 'suit') return `${tile.suit[0]}${tile.value}`;
  if (tile.kind === 'wind') return `w${tile.wind[0]}`;
  return `d${tile.dragon[0]}`;
}

export function allPlayTiles(): PlayTile[] {
  const tiles: PlayTile[] = [];
  for (let i = 0; i < 34; i++) tiles.push(indexToTile(i));
  return tiles;
}

export function bonusTileKey(tile: BonusTile): string {
  if (tile.kind === 'flower') return `f_${tile.flower}`;
  if (tile.kind === 'season') return `s_${tile.season}`;
  return `a_${tile.animal}`;
}
