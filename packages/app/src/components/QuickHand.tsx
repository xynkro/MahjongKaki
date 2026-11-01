import { useState } from 'react';
import type { PlayTile } from '@mahjongkaki/engine';
import { tileToIndex } from '@mahjongkaki/engine';
import { TileKeyboard } from './TileKeyboard';
import { tileLabel, tileColor } from '../lib/tile-labels';
import { haptics } from '../lib/haptics';

const HAND_SIZE = 14;
const MAX_OF_EACH = 4;

interface QuickHandProps {
  /** Try to read the tiles as a hand. Returns false if they don't form 4 sets + a pair. */
  onDetect: (tiles: number[], concealed: boolean) => boolean;
  onCancel: () => void;
}

export function QuickHand({ onDetect, onCancel }: QuickHandProps) {
  const [tiles, setTiles] = useState<PlayTile[]>([]);
  const [concealed, setConcealed] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const sorted = [...tiles].sort((a, b) => tileToIndex(a) - tileToIndex(b));
  const remaining = HAND_SIZE - tiles.length;

  function addTile(tile: PlayTile) {
    const idx = tileToIndex(tile);
    if (tiles.length >= HAND_SIZE) {
      setMessage('That\'s all 14. Tap a tile above to take it out.');
      return;
    }
    if (tiles.filter(t => tileToIndex(t) === idx).length >= MAX_OF_EACH) {
      setMessage('There are only 4 of each tile.');
      return;
    }
    haptics.tap();
    setMessage(null);
    setTiles(prev => [...prev, tile]);
  }

  function removeTile(idx: number) {
    haptics.tap();
    setMessage(null);
    setTiles(prev => {
      const at = prev.findIndex(t => tileToIndex(t) === idx);
      return prev.filter((_, i) => i !== at);
    });
  }

  function detect() {
    if (!onDetect(tiles.map(tileToIndex), concealed)) {
      setMessage('These tiles don\'t split into 4 sets + a pair. Check for a mistyped tile.');
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-300">
          Tap all 14 tiles, in any order
          <span className="ml-1.5 font-mono text-amber-300" aria-live="polite">{tiles.length}/{HAND_SIZE}</span>
        </p>
        <button type="button" onClick={onCancel} className="text-xs text-slate-400 px-2 py-1">
          Cancel
        </button>
      </div>

      {sorted.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {sorted.map((tile, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Remove ${tileLabel(tile)}`}
              onClick={() => removeTile(tileToIndex(tile))}
              className={`min-w-[28px] px-1 py-1 text-sm font-bold rounded bg-slate-800 border border-slate-700 active:bg-red-900/30 active:border-red-700 ${tileColor(tile)}`}
            >
              {tileLabel(tile)}
            </button>
          ))}
        </div>
      )}

      <TileKeyboard onSelect={addTile} />

      <label className="flex items-start gap-2 text-xs text-slate-300">
        <input
          type="checkbox"
          checked={concealed}
          onChange={(e) => { haptics.select(); setConcealed(e.target.checked); }}
          className="mt-0.5 accent-emerald-500"
        />
        <span>
          Whole hand was concealed
          <span className="block text-[11px] text-slate-500">
            Tiles can't show what you melded, so leave this off if any set was exposed. It adds tai.
          </span>
        </span>
      </label>

      {message && (
        <div className="text-xs text-amber-200 bg-amber-900/20 border border-amber-500/20 px-2 py-1.5 rounded" role="status">
          {message}
        </div>
      )}

      <button
        type="button"
        disabled={remaining > 0}
        onClick={detect}
        className={`w-full min-h-[44px] rounded-xl text-sm font-semibold ${
          remaining > 0 ? 'bg-slate-800 text-slate-500' : 'btn-gold'
        }`}
      >
        {remaining > 0 ? `${remaining} more tile${remaining > 1 ? 's' : ''} to go` : 'Score this hand'}
      </button>

      <p className="text-[11px] text-slate-500">
        Have a kong? Use + Add instead. A kong can't be told apart from 14 tiles.
      </p>
    </div>
  );
}
