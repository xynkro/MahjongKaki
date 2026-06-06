import type { PlayTile, Suit, Wind, Dragon, FlowerName, SeasonName, AnimalName } from '@mahjongkaki/engine';

const SUIT_EMOJI: Record<Suit, string> = {
  bamboo: '🎋',
  character: '字',
  dot: '🔴',
};

const SUIT_SHORT: Record<Suit, string> = {
  bamboo: 'B',
  character: 'C',
  dot: 'D',
};

const WIND_LABEL: Record<Wind, string> = {
  east: '東',
  south: '南',
  west: '西',
  north: '北',
};

const DRAGON_LABEL: Record<Dragon, string> = {
  red: '中',
  green: '發',
  white: '白',
};

const DRAGON_COLOR: Record<Dragon, string> = {
  red: 'text-red-400',
  green: 'text-emerald-400',
  white: 'text-slate-300',
};

export function tileLabel(tile: PlayTile): string {
  switch (tile.kind) {
    case 'suit':
      return `${tile.value}${SUIT_SHORT[tile.suit]}`;
    case 'wind':
      return WIND_LABEL[tile.wind];
    case 'dragon':
      return DRAGON_LABEL[tile.dragon];
  }
}

export function tileLabelLong(tile: PlayTile): string {
  switch (tile.kind) {
    case 'suit':
      return `${tile.value} of ${tile.suit}`;
    case 'wind':
      return `${tile.wind} wind`;
    case 'dragon':
      return `${tile.dragon} dragon`;
  }
}

export function tileColor(tile: PlayTile): string {
  switch (tile.kind) {
    case 'suit':
      return tile.suit === 'bamboo' ? 'text-emerald-400'
        : tile.suit === 'character' ? 'text-blue-400'
        : 'text-amber-400';
    case 'wind':
      return 'text-slate-200';
    case 'dragon':
      return DRAGON_COLOR[tile.dragon];
  }
}

export function meldLabel(type: string): string {
  switch (type) {
    case 'chow': return 'Chow';
    case 'pung': return 'Pung';
    case 'kong': return 'Kong';
    case 'eyes': return 'Eyes';
    default: return type;
  }
}

export const FLOWER_LABELS: Record<FlowerName, string> = {
  plum: '梅',
  orchid: '蘭',
  chrysanthemum: '菊',
  bamboo_flower: '竹',
};

export const SEASON_LABELS: Record<SeasonName, string> = {
  spring: '春',
  summer: '夏',
  autumn: '秋',
  winter: '冬',
};

export const ANIMAL_LABELS: Record<AnimalName, string> = {
  cat: '猫',
  rat: '鼠',
  rooster: '雞',
  centipede: '蜈',
};

export const WIND_OPTIONS: Wind[] = ['east', 'south', 'west', 'north'];

export { WIND_LABEL, SUIT_SHORT };
