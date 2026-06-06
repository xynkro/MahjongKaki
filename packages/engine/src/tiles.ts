import type {
  Suit, Wind, Dragon, FlowerName, SeasonName, AnimalName,
  SuitTile, WindTile, DragonTile, FlowerTile, SeasonTile, AnimalTile,
  PlayTile, Meld,
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
