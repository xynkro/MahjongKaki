import type { Wind } from '@mahjongkaki/engine';
import { WIND_LABEL, WIND_OPTIONS } from '../lib/tile-labels';
import { haptics } from '../lib/haptics';

interface WinContextProps {
  seatWind: Wind;
  prevailingWind: Wind;
  winType: 'zimo' | 'discard';
  isKongReplacement: boolean;
  isLastTile: boolean;
  isRobbingKong: boolean;
  onSeatWind: (w: Wind) => void;
  onPrevailingWind: (w: Wind) => void;
  onWinType: (t: 'zimo' | 'discard') => void;
  onKongReplacement: (v: boolean) => void;
  onLastTile: (v: boolean) => void;
  onRobbingKong: (v: boolean) => void;
}

export function WinContextPanel(props: WinContextProps) {
  return (
    <div className="card p-4 space-y-3">
      <h3 className="section-title">Win Context</h3>

      <div className="grid grid-cols-2 gap-3">
        <WindSelect label="Seat Wind" value={props.seatWind} onChange={props.onSeatWind} />
        <WindSelect label="Round Wind" value={props.prevailingWind} onChange={props.onPrevailingWind} />
      </div>

      <div className="flex gap-2">
        <TogglePill label="Discard" active={props.winType === 'discard'} onClick={() => { haptics.select(); props.onWinType('discard'); }} />
        <TogglePill label="Self-Draw" active={props.winType === 'zimo'} onClick={() => { haptics.select(); props.onWinType('zimo'); }} />
      </div>

      <div className="flex flex-wrap gap-2">
        <FlagChip label="Kong Replace" active={props.isKongReplacement} onClick={() => { haptics.select(); props.onKongReplacement(!props.isKongReplacement); }} />
        <FlagChip label="Last Tile" active={props.isLastTile} onClick={() => { haptics.select(); props.onLastTile(!props.isLastTile); }} />
        <FlagChip label="Rob Kong" active={props.isRobbingKong} onClick={() => { haptics.select(); props.onRobbingKong(!props.isRobbingKong); }} />
      </div>
    </div>
  );
}

function WindSelect({ label, value, onChange }: { label: string; value: Wind; onChange: (w: Wind) => void }) {
  return (
    <div>
      <h3 className="section-title mb-1">{label}</h3>
      <div className="flex gap-1">
        {WIND_OPTIONS.map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => { haptics.select(); onChange(w); }}
            className={`seg flex-1 py-1.5 text-sm font-bold ${value === w ? 'seg-gold' : 'seg-off'}`}
          >
            {WIND_LABEL[w]}
          </button>
        ))}
      </div>
    </div>
  );
}

function TogglePill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`seg flex-1 py-2 text-sm ${active ? 'seg-on' : 'seg-off'}`}
    >
      {label}
    </button>
  );
}

function FlagChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`seg !rounded-full px-3 py-1 text-xs ${active ? 'seg-gold' : 'seg-off'}`}
    >
      {label}
    </button>
  );
}
