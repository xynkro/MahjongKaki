import type { PlayTile, Suit } from '@mahjongkaki/engine';
import { suit, wind, dragon } from '@mahjongkaki/engine';
import { TileButton } from './TileButton';

const SUITS: Suit[] = ['bamboo', 'character', 'dot'];
const VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

interface TileKeyboardProps {
  onSelect: (tile: PlayTile) => void;
}

export function TileKeyboard({ onSelect }: TileKeyboardProps) {
  return (
    <div className="space-y-2">
      {SUITS.map((s) => (
        <div key={s} className="flex gap-1 justify-center">
          {VALUES.map((v) => (
            <TileButton key={`${s}-${v}`} tile={suit(s, v)} onSelect={onSelect} size="sm" />
          ))}
        </div>
      ))}
      <div className="flex gap-1 justify-center">
        {(['east', 'south', 'west', 'north'] as const).map((w) => (
          <TileButton key={w} tile={wind(w)} onSelect={onSelect} size="sm" />
        ))}
        <div className="w-2" />
        {(['red', 'green', 'white'] as const).map((d) => (
          <TileButton key={d} tile={dragon(d)} onSelect={onSelect} size="sm" />
        ))}
      </div>
    </div>
  );
}
