import { TileFace } from './TileFace';

interface TileRowProps {
  tiles: number[];
  onTileClick?: (tile: number, index: number) => void;
  selectedTiles?: Set<number>;
  highlightTiles?: Set<number>;
  size?: 'sm' | 'md';
  sortTiles?: boolean;
  /** Stagger the entrance like a deal. Default true. */
  animateEntrance?: boolean;
  /** Tile value just drawn — plays a one-shot settle on matching tile(s). */
  drawnTile?: number;
}

export function TileRow({
  tiles,
  onTileClick,
  selectedTiles,
  highlightTiles,
  size = 'md',
  sortTiles = true,
  animateEntrance = true,
  drawnTile,
}: TileRowProps) {
  const displayTiles = sortTiles ? [...tiles].sort((a, b) => a - b) : tiles;
  const sizeClass = size === 'sm' ? 'w-9 h-12' : 'w-12 h-16';

  return (
    <div className="flex flex-wrap gap-1">
      {displayTiles.map((tile, i) => {
        const isSelected = selectedTiles?.has(i);
        const isHighlight = highlightTiles?.has(tile);

        return (
          <button
            key={i}
            type="button"
            onClick={() => onTileClick?.(tile, i)}
            style={{
              backgroundImage: 'linear-gradient(to bottom, #FBF4E4 0%, #F1E7D2 55%, #E4D2AC 100%)',
              animationDelay: animateEntrance ? `${Math.min(i, 14) * 32}ms` : undefined,
            }}
            className={`${sizeClass} relative rounded-[7px] flex items-center justify-center overflow-hidden tile-sheen
              border border-[#C6AE84] shadow-tile transition-transform duration-150 ease-out will-change-transform
              ${animateEntrance ? 'anim-tile' : ''}
              ${drawnTile !== undefined && tile === drawnTile ? 'anim-draw' : ''}
              ${isSelected ? '-translate-y-1.5 ring-2 ring-amber-400 shadow-tile-up' : ''}
              ${isHighlight ? 'ring-2 ring-amber-400/70' : ''}
              ${onTileClick ? 'cursor-pointer active:[transform:perspective(560px)_rotateX(24deg)_scale(0.94)]' : 'cursor-default'}
            `}
          >
            <TileFace index={tile} size={size} />
          </button>
        );
      })}
    </div>
  );
}
