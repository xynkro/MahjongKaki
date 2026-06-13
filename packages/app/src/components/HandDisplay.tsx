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
      <div className="empty-state">
        <div className="text-3xl opacity-60 mb-1">🀄</div>
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
              aria-label={`Remove ${meldLabel(meld.type)}`}
              onClick={() => onRemoveMeld(i)}
              className="flex items-center gap-0.5 bg-slate-800 rounded-lg pl-2 pr-1.5 py-1.5 border border-slate-700
                active:bg-red-900/30 active:border-red-700 transition-colors group"
            >
              <span className="text-[12px] text-slate-500 mr-1 uppercase">
                {meldLabel(meld.type)}
                {meld.type !== 'eyes' && (meld.exposed ? '' : '*')}
              </span>
              {meld.tiles.map((tile, j) => (
                <span key={j} className={`text-sm font-bold ${tileColor(tile)}`}>
                  {tileLabel(tile)}
                </span>
              ))}
              <span className="ml-1.5 grid place-items-center w-4 h-4 rounded-full bg-slate-700 text-slate-400 text-[11px] leading-none group-active:bg-red-700 group-active:text-white">
                ×
              </span>
            </button>
          ))}
        </div>
      )}

      {melds.length > 0 && (
        <p className="text-[11px] text-slate-500">Tap a meld to remove it.</p>
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
