import type { FlowerTile, SeasonTile, AnimalTile, FlowerName, SeasonName, AnimalName } from '@mahjongkaki/engine';
import { flower, season, animal } from '@mahjongkaki/engine';
import { FLOWER_LABELS, SEASON_LABELS, ANIMAL_LABELS } from '../lib/tile-labels';
import { haptics } from '../lib/haptics';

interface BonusTilesProps {
  flowers: FlowerTile[];
  seasons: SeasonTile[];
  animals: AnimalTile[];
  onToggleFlower: (tile: FlowerTile) => void;
  onToggleSeason: (tile: SeasonTile) => void;
  onToggleAnimal: (tile: AnimalTile) => void;
}

const FLOWERS: FlowerName[] = ['plum', 'orchid', 'chrysanthemum', 'bamboo_flower'];
const SEASONS: SeasonName[] = ['spring', 'summer', 'autumn', 'winter'];
const ANIMALS: AnimalName[] = ['cat', 'rat', 'rooster', 'centipede'];

export function BonusTiles({
  flowers, seasons, animals,
  onToggleFlower, onToggleSeason, onToggleAnimal,
}: BonusTilesProps) {
  return (
    <div className="space-y-2">
      <h3 className="section-title">Bonus Tiles</h3>
      <div className="space-y-1.5">
        <Row label="Flowers">
          {FLOWERS.map((f) => {
            const active = flowers.some(x => x.flower === f);
            return (
              <ToggleChip
                key={f}
                label={FLOWER_LABELS[f]}
                sublabel={f === 'bamboo_flower' ? 'bamboo' : f}
                active={active}
                color="amber"
                onClick={() => { haptics.select(); onToggleFlower(flower(f)); }}
              />
            );
          })}
        </Row>
        <Row label="Seasons">
          {SEASONS.map((s) => {
            const active = seasons.some(x => x.season === s);
            return (
              <ToggleChip
                key={s}
                label={SEASON_LABELS[s]}
                sublabel={s}
                active={active}
                color="emerald"
                onClick={() => { haptics.select(); onToggleSeason(season(s)); }}
              />
            );
          })}
        </Row>
        <Row label="Animals">
          {ANIMALS.map((a) => {
            const active = animals.some(x => x.animal === a);
            return (
              <ToggleChip
                key={a}
                label={ANIMAL_LABELS[a]}
                sublabel={a}
                active={active}
                color="yellow"
                onClick={() => { haptics.select(); onToggleAnimal(animal(a)); }}
              />
            );
          })}
        </Row>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[12px] text-slate-500 w-14 shrink-0">{label}</span>
      <div className="flex gap-1">{children}</div>
    </div>
  );
}

function ToggleChip({
  label, sublabel, active, color, onClick,
}: {
  label: string; sublabel: string; active: boolean; color: 'amber' | 'emerald' | 'yellow'; onClick: () => void;
}) {
  // Inactive chips read as tappable (premium dark gradient); active lights up on-brand.
  const inactive = 'bg-gradient-to-b from-[#2c2820] to-[#241f18] text-slate-200 border-[#3a3328] active:brightness-110';
  const colors = {
    amber: active ? 'bg-gradient-to-b from-amber-600 to-amber-800 text-amber-50 border-amber-300/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_0_12px_rgba(201,162,75,0.45)]' : inactive,
    emerald: active ? 'bg-gradient-to-b from-emerald-600 to-emerald-800 text-emerald-50 border-emerald-300/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_0_12px_rgba(63,182,131,0.4)]' : inactive,
    yellow: active ? 'bg-gradient-to-b from-yellow-600 to-yellow-800 text-yellow-50 border-yellow-300/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_0_12px_rgba(205,170,82,0.45)]' : inactive,
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center px-2.5 py-1.5 rounded-md border text-xs transition-all ${colors[color]}`}
    >
      <span className="font-bold text-base leading-none">{label}</span>
      <span className="text-[11px] leading-tight opacity-75 mt-0.5">{sublabel}</span>
    </button>
  );
}
