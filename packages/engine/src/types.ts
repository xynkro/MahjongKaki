export type Suit = 'bamboo' | 'character' | 'dot';
export type Wind = 'east' | 'south' | 'west' | 'north';
export type Dragon = 'red' | 'green' | 'white';

export type FlowerName = 'plum' | 'orchid' | 'chrysanthemum' | 'bamboo_flower';
export type SeasonName = 'spring' | 'summer' | 'autumn' | 'winter';
export type AnimalName = 'cat' | 'rat' | 'rooster' | 'centipede';

export type SuitTile = { kind: 'suit'; suit: Suit; value: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 };
export type WindTile = { kind: 'wind'; wind: Wind };
export type DragonTile = { kind: 'dragon'; dragon: Dragon };
export type FlowerTile = { kind: 'flower'; flower: FlowerName };
export type SeasonTile = { kind: 'season'; season: SeasonName };
export type AnimalTile = { kind: 'animal'; animal: AnimalName };

export type PlayTile = SuitTile | WindTile | DragonTile;
export type BonusTile = FlowerTile | SeasonTile | AnimalTile;
export type Tile = PlayTile | BonusTile;

export type MeldType = 'chow' | 'pung' | 'kong' | 'pair' | 'eyes';

export interface Meld {
  type: MeldType;
  tiles: PlayTile[];
  exposed: boolean;
}

export interface Hand {
  melds: Meld[];
  flowers: FlowerTile[];
  seasons: SeasonTile[];
  animals: AnimalTile[];
}

export type WinType = 'zimo' | 'discard';

export interface WinContext {
  seatWind: Wind;
  prevailingWind: Wind;
  winType: WinType;
  winTile: PlayTile;
  isKongReplacement: boolean;
  isLastTile: boolean;
  isRobbingKong: boolean;
}

export interface TaiElement {
  id: string;
  name: string;
  nameZh: string;
  tai: number;
  description: string;
}

export interface ScoringResult {
  elements: TaiElement[];
  totalTai: number;
  cappedTai: number;
  isValid: boolean;
  invalidReason?: string;
}

export type ShooterMode = 'standard' | 'halfShooter' | 'shooterPaysAll';

export interface PlayerPayout {
  playerIndex: number;
  name: string;
  amount: number;
}

export interface PayoutResult {
  winner: string;
  winnerIndex: number;
  payments: PlayerPayout[];
  netPerPlayer: Record<string, number>;
}

export interface StakeConfig {
  label: string;
  base: number;
  doubled: number;
}

export const STAKE_PRESETS: StakeConfig[] = [
  { label: '10/20¢', base: 0.10, doubled: 0.20 },
  { label: '20/40¢', base: 0.20, doubled: 0.40 },
  { label: '30/60¢', base: 0.30, doubled: 0.60 },
  { label: '50¢/$1', base: 0.50, doubled: 1.00 },
  { label: '$1/$2', base: 1.00, doubled: 2.00 },
  { label: '$3/$6', base: 3.00, doubled: 6.00 },
];
