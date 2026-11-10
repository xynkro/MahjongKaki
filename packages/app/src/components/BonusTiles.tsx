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
                sublabel={f === 'bamboo_flower' ? 'bamboo' : f === 'chrysanthemum' ? 'chrysanth.' : f} // full word can't fit a 4-up chip at 320-375px
                ariaLabel={f === 'chrysanthemum' ? 'chrysanthemum' : undefined}
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
    <div>
      <span className="text-[12px] text-slate-500 block mb-1">{label}</span>
      <div className="grid grid-cols-4 gap-1">{children}</div>
    </div>
  );
}

function ToggleChip({
  label, sublabel, ariaLabel, active, color, onClick,
}: {
  label: string; sublabel: string; ariaLabel?: string; active: boolean; color: 'amber' | 'emerald' | 'yellow'; onClick: () => void;
}) {
  // Theme tokens, so the chips read in Jade Night and Daylight alike. Active = the accent colour.
  void color;
  const cls = active ? 'bg-accent text-accent-ink border-accent' : 'bg-surface-2 text-ink border-line active:brightness-110';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`flex flex-col items-center justify-center min-h-[44px] min-w-0 px-1 py-1.5 rounded-md border text-xs transition-all ${cls}`}
    >
      <span className="font-bold text-base leading-none">{label}</span>
      <span className="text-[11px] leading-tight opacity-75 mt-0.5">{sublabel}</span>
    </button>
  );
}
