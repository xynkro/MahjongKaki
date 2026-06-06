import { useState } from 'react';
import type { PlayTile, Meld, Suit } from '@mahjongkaki/engine';
import { pung, kong, chow, eyes } from '@mahjongkaki/engine';
import { TileKeyboard } from './TileKeyboard';
import { tileLabel, tileColor } from '../lib/tile-labels';

type MeldType = 'chow' | 'pung' | 'kong' | 'eyes';

interface MeldBuilderProps {
  onAdd: (meld: Meld) => void;
  onCancel: () => void;
  hasEyes: boolean;
  setCount: number;
}

export function MeldBuilder({ onAdd, onCancel, hasEyes, setCount }: MeldBuilderProps) {
  const [meldType, setMeldType] = useState<MeldType>('pung');
  const [exposed, setExposed] = useState(true);

  function handleTileSelect(tile: PlayTile) {
    switch (meldType) {
      case 'pung':
        onAdd(pung(tile, exposed));
        break;
      case 'kong':
        onAdd(kong(tile, exposed));
        break;
      case 'eyes':
        onAdd(eyes(tile));
        break;
      case 'chow': {
        if (tile.kind !== 'suit') return;
        if (tile.value > 7) return;
        onAdd(chow(tile.suit as Suit, tile.value as 1|2|3|4|5|6|7, exposed));
        break;
      }
    }
  }

  const types: { key: MeldType; label: string; disabled: boolean }[] = [
    { key: 'chow', label: 'Chow', disabled: setCount >= 4 },
    { key: 'pung', label: 'Pung', disabled: setCount >= 4 },
    { key: 'kong', label: 'Kong', disabled: setCount >= 4 },
    { key: 'eyes', label: 'Eyes', disabled: hasEyes },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {types.map(({ key, label, disabled }) => (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => setMeldType(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                ${meldType === key
                  ? 'bg-emerald-600 text-white'
                  : disabled
                    ? 'bg-slate-800 text-slate-600'
                    : 'bg-slate-700 text-slate-300 active:bg-slate-600'
                }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-slate-400 px-2 py-1"
        >
          Cancel
        </button>
      </div>

      {meldType !== 'eyes' && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExposed(!exposed)}
            className={`px-3 py-1 text-xs rounded-md ${
              exposed ? 'bg-amber-700 text-amber-100' : 'bg-slate-700 text-slate-300'
            }`}
          >
            {exposed ? 'Exposed' : 'Concealed'}
          </button>
          <span className="text-xs text-slate-500">
            {meldType === 'chow' ? 'Tap starting tile (1-7 only)' : 'Tap any tile'}
          </span>
        </div>
      )}

      <TileKeyboard onSelect={handleTileSelect} />
    </div>
  );
}
