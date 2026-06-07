import { indexToTile, tileKey, type PlayTile } from '@mahjongkaki/engine';

const TILE_LABELS: Record<string, string> = {};
function getTileLabel(idx: number): { short: string; suit: string } {
  const tile = indexToTile(idx);
  if (tile.kind === 'suit') {
    const suitChar = tile.suit === 'bamboo' ? '🀇' : tile.suit === 'character' ? '🀙' : '🀝';
    return { short: `${tile.value}`, suit: tile.suit[0].toUpperCase() };
  }
  if (tile.kind === 'wind') {
    const map = { east: '東', south: '南', west: '西', north: '北' };
    return { short: map[tile.wind], suit: 'W' };
  }
  const map = { red: '中', green: '發', white: '　' };
  return { short: map[tile.dragon], suit: 'D' };
}

const SUIT_COLORS: Record<string, string> = {
  B: 'text-emerald-400',
  C: 'text-red-400',
  D: 'text-blue-400',
  W: 'text-yellow-400',
};

interface TileRowProps {
  tiles: number[];
  onTileClick?: (tile: number, index: number) => void;
  selectedTiles?: Set<number>;
  highlightTiles?: Set<number>;
  size?: 'sm' | 'md';
  sortTiles?: boolean;
}

export function TileRow({
  tiles,
  onTileClick,
  selectedTiles,
  highlightTiles,
  size = 'md',
  sortTiles = true,
}: TileRowProps) {
  const displayTiles = sortTiles ? [...tiles].sort((a, b) => a - b) : tiles;

  const sizeClass = size === 'sm'
    ? 'w-7 h-10 text-xs'
    : 'w-9 h-12 text-sm';

  return (
    <div className="flex flex-wrap gap-0.5">
      {displayTiles.map((tile, i) => {
        const label = getTileLabel(tile);
        const isSelected = selectedTiles?.has(i);
        const isHighlight = highlightTiles?.has(tile);

        return (
          <button
            key={i}
            type="button"
            onClick={() => onTileClick?.(tile, i)}
            className={`${sizeClass} rounded-md flex flex-col items-center justify-center font-bold border transition-all
              ${isSelected
                ? 'bg-emerald-600 border-emerald-400 -translate-y-1'
                : isHighlight
                  ? 'bg-amber-900/50 border-amber-500/50'
                  : 'bg-slate-100 border-slate-300'
              }
              ${onTileClick ? 'active:scale-95 cursor-pointer' : 'cursor-default'}
            `}
          >
            <span className={`leading-none ${isSelected ? 'text-white' : SUIT_COLORS[label.suit] ?? 'text-slate-800'}`}>
              {label.short}
            </span>
            <span className={`text-[8px] leading-none mt-0.5 ${isSelected ? 'text-emerald-200' : 'text-slate-500'}`}>
              {label.suit}
            </span>
          </button>
        );
      })}
    </div>
  );
}
