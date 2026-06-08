import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { TileFace } from './TileFace';

interface TileRowProps {
  tiles: number[];
  onTileClick?: (tile: number, index: number) => void;
  /** Drag a tile up past the threshold and release to "throw" (discard) it. */
  onThrow?: (tile: number, index: number) => void;
  selectedTiles?: Set<number>;
  highlightTiles?: Set<number>;
  size?: 'sm' | 'md';
  sortTiles?: boolean;
  /** Stagger the entrance like a deal. Default true. */
  animateEntrance?: boolean;
  /** Tile value just drawn — plays a one-shot settle on matching tile(s). */
  drawnTile?: number;
}

const THROW_DISTANCE = 52; // px dragged up to commit a discard

export function TileRow({
  tiles,
  onTileClick,
  onThrow,
  selectedTiles,
  highlightTiles,
  size = 'md',
  sortTiles = true,
  animateEntrance = true,
  drawnTile,
}: TileRowProps) {
  const displayTiles = sortTiles ? [...tiles].sort((a, b) => a - b) : tiles;
  const sizeClass = size === 'sm' ? 'w-9 h-12' : 'w-12 h-16';

  const start = useRef<{ idx: number; x: number; y: number; moved: boolean; dy: number } | null>(null);
  const [drag, setDrag] = useState<{ idx: number; dx: number; dy: number } | null>(null);

  return (
    <div className="flex flex-wrap gap-1">
      {displayTiles.map((tile, i) => {
        const isSelected = selectedTiles?.has(i);
        const isHighlight = highlightTiles?.has(tile);
        const dragging = drag?.idx === i;
        const willThrow = dragging && drag!.dy < -THROW_DISTANCE;

        const handlers = onThrow
          ? {
              onPointerDown: (e: ReactPointerEvent) => {
                (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
                start.current = { idx: i, x: e.clientX, y: e.clientY, moved: false, dy: 0 };
              },
              onPointerMove: (e: ReactPointerEvent) => {
                const s = start.current;
                if (!s || s.idx !== i) return;
                const dx = e.clientX - s.x;
                const dy = e.clientY - s.y;
                s.dy = dy; // ref = source of truth for the release check
                if (Math.abs(dx) > 4 || Math.abs(dy) > 4) s.moved = true;
                setDrag({ idx: i, dx: dx * 0.4, dy: Math.min(8, dy) });
              },
              onPointerUp: () => {
                const s = start.current;
                start.current = null;
                setDrag(null);
                if (!s || s.idx !== i) return;
                if (s.dy < -THROW_DISTANCE) onThrow(tile, i);
                else if (!s.moved) onTileClick?.(tile, i);
              },
              onPointerCancel: () => { start.current = null; setDrag(null); },
            }
          : { onClick: () => onTileClick?.(tile, i) };

        return (
          <button
            key={i}
            type="button"
            {...handlers}
            style={{
              backgroundImage: 'linear-gradient(to bottom, #FBF4E4 0%, #F1E7D2 55%, #E4D2AC 100%)',
              animationDelay: animateEntrance ? `${Math.min(i, 14) * 32}ms` : undefined,
              touchAction: onThrow ? 'none' : undefined,
              ...(dragging
                ? { transform: `translate(${drag!.dx}px, ${drag!.dy}px) scale(1.06)`, transition: 'none', zIndex: 20 }
                : null),
            }}
            className={`${sizeClass} relative rounded-[7px] flex items-center justify-center overflow-hidden tile-sheen
              border border-[#C6AE84] shadow-tile will-change-transform ${dragging ? '' : 'transition-transform duration-150 ease-out'}
              ${animateEntrance ? 'anim-tile' : ''}
              ${drawnTile !== undefined && tile === drawnTile ? 'anim-draw' : ''}
              ${willThrow ? 'ring-2 ring-emerald-400 shadow-tile-up' : isSelected ? '-translate-y-1.5 ring-2 ring-amber-400 shadow-tile-up' : ''}
              ${isHighlight ? 'ring-2 ring-amber-400/70' : ''}
              ${onThrow ? 'cursor-grab' : onTileClick ? 'cursor-pointer active:[transform:perspective(560px)_rotateX(24deg)_scale(0.94)]' : 'cursor-default'}
            `}
          >
            <TileFace index={tile} size={size} />
          </button>
        );
      })}
    </div>
  );
}
