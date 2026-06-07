import { indexToTile } from '@mahjongkaki/engine';

function getTileLabel(idx: number): { short: string; suit: string } {
  const tile = indexToTile(idx);
  if (tile.kind === 'suit') {
    return { short: `${tile.value}`, suit: tile.suit[0].toUpperCase() };
  }
  if (tile.kind === 'wind') {
    const map = { east: '東', south: '南', west: '西', north: '北' };
    return { short: map[tile.wind], suit: 'W' };
  }
  const map = { red: '中', green: '發', white: '　' };
  return { short: map[tile.dragon], suit: 'D' };
}

// Suit ink colours: 索 jade · 萬 vermilion · 筒 indigo · winds brass-gold
const SUIT_COLORS: Record<string, string> = {
  B: 'text-emerald-700',
  C: 'text-red-600',
  D: 'text-blue-600',
  W: 'text-yellow-700',
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

  const sizeClass = size === 'sm' ? 'w-7 h-10 text-xs' : 'w-9 h-12 text-base';

  return (
    <div className="flex flex-wrap gap-1">
      {displayTiles.map((tile, i) => {
        const label = getTileLabel(tile);
        const isSelected = selectedTiles?.has(i);
        const isHighlight = highlightTiles?.has(tile);

        return (
          <button
            key={i}
            type="button"
            onClick={() => onTileClick?.(tile, i)}
            style={{
              backgroundImage: 'linear-gradient(to bottom, #FBF4E4 0%, #F1E7D2 55%, #E4D2AC 100%)',
            }}
            className={`${sizeClass} relative rounded-[7px] flex flex-col items-center justify-center font-bold
              border border-[#C6AE84] shadow-tile transition-all duration-100
              ${isSelected ? '-translate-y-1.5 ring-2 ring-amber-400 shadow-tile-up' : ''}
              ${isHighlight ? 'ring-2 ring-amber-400/70' : ''}
              ${onTileClick ? 'active:translate-y-0 active:scale-95 cursor-pointer' : 'cursor-default'}
            `}
          >
            <span className={`leading-none ${SUIT_COLORS[label.suit] ?? 'text-slate-900'}`}>
              {label.short}
            </span>
            <span className="text-[7px] font-semibold leading-none mt-0.5 tracking-wide text-[#9A8A6A]">
              {label.suit}
            </span>
          </button>
        );
      })}
    </div>
  );
}
