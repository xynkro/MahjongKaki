import { type Claim } from '@mahjongkaki/game';
import { TileRow } from './TileRow';
import { haptics } from '../../lib/haptics';

interface ClaimOverlayProps {
  claims: Claim[];
  lastDiscardTile: number;
  onClaim: (claim: Claim) => void;
  onSkip: () => void;
}

const CLAIM_COLORS: Record<string, string> = {
  win: 'bg-red-600 active:bg-red-500',
  kong: 'bg-amber-600 active:bg-amber-500',
  pung: 'bg-emerald-600 active:bg-emerald-500',
  chow: 'bg-blue-600 active:bg-blue-500',
};

export function ClaimOverlay({ claims, lastDiscardTile, onClaim, onSkip }: ClaimOverlayProps) {
  return (
    <div className="anim-pop bg-slate-900/95 border-t border-amber-400/20 p-4 pb-safe backdrop-blur">
      <div className="flex items-center justify-center gap-2 mb-3">
        <span className="text-slate-400 text-xs">Claim this tile?</span>
        <TileRow tiles={[lastDiscardTile]} size="sm" sortTiles={false} animateEntrance={false} />
      </div>
      <div className="flex gap-2 justify-center">
        {claims.map((claim, i) => (
          <button
            key={`${claim.claimType}-${i}`}
            onClick={() => { claim.claimType === 'win' ? haptics.success() : haptics.select(); onClaim(claim); }}
            className={`px-5 py-2.5 text-white rounded-lg font-semibold text-sm active:scale-95 ${CLAIM_COLORS[claim.claimType]}`}
          >
            {claim.claimType === 'win' ? 'Hu!' : claim.claimType.charAt(0).toUpperCase() + claim.claimType.slice(1)}
          </button>
        ))}
        <button
          onClick={() => { haptics.tap(); onSkip(); }}
          className="px-5 py-2.5 bg-slate-700 text-slate-300 rounded-lg text-sm active:scale-95"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
