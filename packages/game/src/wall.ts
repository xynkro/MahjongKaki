import {
  tileToIndex, indexToTile, allPlayTiles,
  flower, season, animal,
  type PlayTile, type BonusTile, type Tile, type Wind,
} from '@mahjongkaki/engine';

export interface WallTile {
  index: number;
  tile: Tile;
  isBonus: boolean;
}

const FLOWER_SEASON_BONUS: BonusTile[] = [
  flower('plum'), flower('orchid'), flower('chrysanthemum'), flower('bamboo_flower'),
  season('spring'), season('summer'), season('autumn'), season('winter'),
];

const ANIMAL_BONUS: BonusTile[] = [
  animal('cat'), animal('rat'), animal('rooster'), animal('centipede'),
];

export function createWallTiles(opts: { animals?: boolean } = {}): WallTile[] {
  const { animals = true } = opts;
  const tiles: WallTile[] = [];
  let idx = 0;

  for (const pt of allPlayTiles()) {
    for (let copy = 0; copy < 4; copy++) {
      tiles.push({ index: idx++, tile: pt, isBonus: false });
    }
  }

  const bonus = animals ? [...FLOWER_SEASON_BONUS, ...ANIMAL_BONUS] : FLOWER_SEASON_BONUS;
  for (const bt of bonus) {
    tiles.push({ index: idx++, tile: bt, isBonus: true });
  }

  return tiles;
}

export function shuffleWall(tiles: WallTile[]): WallTile[] {
  const arr = [...tiles];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export interface DealtHand {
  hand: number[];
  bonusTiles: BonusTile[];
}

export interface DealResult {
  hands: DealtHand[];
  remainingWall: WallTile[];
  deadWall: WallTile[];
}

export function dealInitial(shuffledWall: WallTile[], dealerSeat: number): DealResult {
  const wall = [...shuffledWall];
  const hands: DealtHand[] = [
    { hand: [], bonusTiles: [] },
    { hand: [], bonusTiles: [] },
    { hand: [], bonusTiles: [] },
    { hand: [], bonusTiles: [] },
  ];

  const deadWall = wall.splice(wall.length - 16, 16);

  for (let round = 0; round < 3; round++) {
    for (let seat = 0; seat < 4; seat++) {
      const p = (dealerSeat + seat) % 4;
      for (let t = 0; t < 4; t++) {
        drawTileForPlayer(wall, deadWall, hands[p]);
      }
    }
  }

  for (let seat = 0; seat < 4; seat++) {
    const p = (dealerSeat + seat) % 4;
    drawTileForPlayer(wall, deadWall, hands[p]);
  }

  drawTileForPlayer(wall, deadWall, hands[dealerSeat]);

  return { hands, remainingWall: wall, deadWall };
}

function drawTileForPlayer(wall: WallTile[], deadWall: WallTile[], dealt: DealtHand): void {
  while (wall.length > 0) {
    const wt = wall.shift()!;
    if (wt.isBonus) {
      dealt.bonusTiles.push(wt.tile as BonusTile);
      const replacement = deadWall.shift();
      if (replacement) {
        wall.push(replacement);
      }
      continue;
    }
    dealt.hand.push(tileToIndex(wt.tile as PlayTile));
    return;
  }
}

export function drawFromWall(
  wall: WallTile[],
  deadWall: WallTile[],
): { tile: number; bonusTiles: BonusTile[] } | null {
  const bonusTiles: BonusTile[] = [];

  while (wall.length > 0) {
    const wt = wall.shift()!;
    if (wt.isBonus) {
      bonusTiles.push(wt.tile as BonusTile);
      const replacement = deadWall.shift();
      if (replacement) {
        wall.push(replacement);
      }
      continue;
    }
    return { tile: tileToIndex(wt.tile as PlayTile), bonusTiles };
  }

  return null;
}

export function drawFromDeadWall(
  deadWall: WallTile[],
): { tile: number; bonusTiles: BonusTile[] } | null {
  const bonusTiles: BonusTile[] = [];

  while (deadWall.length > 0) {
    const wt = deadWall.shift()!;
    if (wt.isBonus) {
      bonusTiles.push(wt.tile as BonusTile);
      continue;
    }
    return { tile: tileToIndex(wt.tile as PlayTile), bonusTiles };
  }

  return null;
}
