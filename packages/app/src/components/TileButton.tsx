import type { PlayTile } from '@mahjongkaki/engine';
import { tileToIndex } from '@mahjongkaki/engine';
import { TileFace } from './game/TileFace';

interface TileButtonProps {
  tile: PlayTile;
  onSelect: (tile: PlayTile) => void;
  size?: 'sm' | 'md';
}

// Ivory-bone picker tile — same painted faces + carved bevel as the play
// board, so the calculator and the game speak one premium tile language.
export function TileButton({ tile, onSelect, size = 'md' }: TileButtonProps) {
  const sizeClass = size === 'sm' ? 'w-9 h-12' : 'w-11 h-14';
  return (
    <button
      type="button"
      onClick={() => onSelect(tile)}
      aria-label={`${tile.kind === 'suit' ? `${tile.value} ${tile.suit}` : tile.kind === 'wind' ? `${tile.wind} wind` : `${tile.dragon} dragon`}`}
      style={{ backgroundImage: 'linear-gradient(to bottom, #FBF4E4 0%, #F1E7D2 55%, #E4D2AC 100%)' }}
      className={`${sizeClass} relative rounded-[7px] flex items-center justify-center overflow-hidden tile-sheen
        border border-[#C6AE84] shadow-tile transition-transform duration-100 will-change-transform
        active:[transform:perspective(560px)_rotateX(24deg)_scale(0.94)]`}
    >
      <TileFace index={tileToIndex(tile)} size={size} />
    </button>
  );
}
