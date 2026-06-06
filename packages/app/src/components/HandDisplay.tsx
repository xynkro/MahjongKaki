import type { Meld, FlowerTile, SeasonTile, AnimalTile } from '@mahjongkaki/engine';
import { tileLabel, tileColor, meldLabel, FLOWER_LABELS, SEASON_LABELS, ANIMAL_LABELS } from '../lib/tile-labels';

interface HandDisplayProps {
  melds: Meld[];
  flowers: FlowerTile[];
  seasons: SeasonTile[];
  animals: AnimalTile[];
  onRemoveMeld: (index: number) => void;
}

export function HandDisplay({ melds, flowers, seasons, animals, onRemoveMeld }: HandDisplayProps) {
  if (melds.length === 0 && flowers.length === 0 && seasons.length === 0 && animals.length === 0) {
    return (
      <div className="text-center py-6 text-slate-500 text-sm">
        Tap + to add melds to the hand
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {melds.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {melds.map((meld, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onRemoveMeld(i)}
              className="flex items-center gap-0.5 bg-slate-800 rounded-lg px-2 py-1.5 border border-slate-700
                active:bg-red-900/30 active:border-red-700 transition-colors group"
            >
              <span className="text-[10px] text-slate-500 mr-1 uppercase">
                {meldLabel(meld.type)}
                {meld.type !== 'eyes' && (meld.exposed ? '' : '*')}
              </span>
              {meld.tiles.map((tile, j) => (
                <span key={j} className={`text-sm font-bold ${tileColor(tile)}`}>
                  {tileLabel(tile)}
                </span>
              ))}
            </button>
          ))}
        </div>
      )}

      {(flowers.length > 0 || seasons.length > 0 || animals.length > 0) && (
        <div className="flex flex-wrap gap-1">
          {flowers.map((f) => (
            <span key={f.flower} className="text-xs bg-pink-900/40 text-pink-300 px-2 py-0.5 rounded">
              {FLOWER_LABELS[f.flower]}
            </span>
          ))}
          {seasons.map((s) => (
            <span key={s.season} className="text-xs bg-cyan-900/40 text-cyan-300 px-2 py-0.5 rounded">
              {SEASON_LABELS[s.season]}
            </span>
          ))}
          {animals.map((a) => (
            <span key={a.animal} className="text-xs bg-yellow-900/40 text-yellow-300 px-2 py-0.5 rounded">
              {ANIMAL_LABELS[a.animal]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
