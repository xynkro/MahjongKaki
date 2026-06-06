import type { PlayTile } from '@mahjongkaki/engine';
import { tileLabel, tileColor } from '../lib/tile-labels';

interface TileButtonProps {
  tile: PlayTile;
  onSelect: (tile: PlayTile) => void;
  size?: 'sm' | 'md';
}

export function TileButton({ tile, onSelect, size = 'md' }: TileButtonProps) {
  const px = size === 'sm' ? 'w-9 h-11 text-sm' : 'w-11 h-14 text-base';
  return (
    <button
      type="button"
      onClick={() => onSelect(tile)}
      className={`${px} rounded-md bg-slate-700 border border-slate-600 font-bold
        active:bg-slate-500 transition-colors flex items-center justify-center
        ${tileColor(tile)}`}
    >
      {tileLabel(tile)}
    </button>
  );
}
