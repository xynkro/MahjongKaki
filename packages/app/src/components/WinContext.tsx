import type { Wind } from '@mahjongkaki/engine';
import { WIND_LABEL, WIND_OPTIONS } from '../lib/tile-labels';

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
    <div className="space-y-3">
      <div className="text-xs text-slate-400 font-medium">Win Context</div>

      <div className="grid grid-cols-2 gap-3">
        <WindSelect label="Seat Wind" value={props.seatWind} onChange={props.onSeatWind} />
        <WindSelect label="Round Wind" value={props.prevailingWind} onChange={props.onPrevailingWind} />
      </div>

      <div className="flex gap-2">
        <TogglePill label="Discard" active={props.winType === 'discard'} onClick={() => props.onWinType('discard')} />
        <TogglePill label="Self-Draw" active={props.winType === 'zimo'} onClick={() => props.onWinType('zimo')} />
      </div>

      <div className="flex flex-wrap gap-2">
        <FlagChip label="Kong Replace" active={props.isKongReplacement} onClick={() => props.onKongReplacement(!props.isKongReplacement)} />
        <FlagChip label="Last Tile" active={props.isLastTile} onClick={() => props.onLastTile(!props.isLastTile)} />
        <FlagChip label="Rob Kong" active={props.isRobbingKong} onClick={() => props.onRobbingKong(!props.isRobbingKong)} />
      </div>
    </div>
  );
}

function WindSelect({ label, value, onChange }: { label: string; value: Wind; onChange: (w: Wind) => void }) {
  return (
    <div>
      <div className="text-[10px] text-slate-500 mb-1">{label}</div>
      <div className="flex gap-1">
        {WIND_OPTIONS.map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => onChange(w)}
            className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-colors ${
              value === w
                ? 'bg-slate-600 text-white'
                : 'bg-slate-800 text-slate-500'
            }`}
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
      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
        active
          ? 'bg-emerald-700 text-emerald-100 border border-emerald-500'
          : 'bg-slate-800 text-slate-400 border border-slate-700'
      }`}
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
      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
        active
          ? 'bg-violet-800 text-violet-200 border-violet-500'
          : 'bg-slate-800 text-slate-500 border-slate-700'
      }`}
    >
      {label}
    </button>
  );
}
