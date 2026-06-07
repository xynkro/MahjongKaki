import { type Claim } from '@mahjongkaki/game';
import { indexToTile } from '@mahjongkaki/engine';

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

function tileName(idx: number): string {
  const t = indexToTile(idx);
  if (t.kind === 'suit') return `${t.value} ${t.suit[0].toUpperCase()}`;
  if (t.kind === 'wind') return t.wind;
  return t.dragon;
}

export function ClaimOverlay({ claims, lastDiscardTile, onClaim, onSkip }: ClaimOverlayProps) {
  return (
    <div className="bg-slate-800 border-t border-slate-600 p-4 pb-safe">
      <p className="text-center text-slate-400 text-xs mb-2">
        Claim: {tileName(lastDiscardTile)}
      </p>
      <div className="flex gap-2 justify-center">
        {claims.map((claim, i) => (
          <button
            key={`${claim.claimType}-${i}`}
            onClick={() => onClaim(claim)}
            className={`px-5 py-2.5 text-white rounded-lg font-semibold text-sm ${CLAIM_COLORS[claim.claimType]}`}
          >
            {claim.claimType === 'win' ? 'Hu!' : claim.claimType.charAt(0).toUpperCase() + claim.claimType.slice(1)}
          </button>
        ))}
        <button
          onClick={onSkip}
          className="px-5 py-2.5 bg-slate-700 text-slate-300 rounded-lg text-sm"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
