import { type Claim } from '@mahjongkaki/game';
import { TileRow } from './TileRow';
import { haptics } from '../../lib/haptics';

interface ClaimOverlayProps {
  claims: Claim[];
  lastDiscardTile: number;
  onClaim: (claim: Claim) => void;
  onSkip: () => void;
  /** Coach advice for this decision (Play vs AI only). pick = index into claims, or null for Skip. */
  tip?: { pick: number | null; text: string } | null;
}

const LABEL: Record<string, string> = { win: 'Hu! (win)', kong: 'Kong', pung: 'Pung', chow: 'Chow' };

export function ClaimOverlay({ claims, lastDiscardTile, onClaim, onSkip, tip }: ClaimOverlayProps) {
  const ring = 'ring-2 ring-offset-2 ring-offset-[color:var(--surface)] ring-accent';
  return (
    <div className="anim-pop bg-surface border-t border-line p-4 pb-safe">
      <div className="flex items-center justify-center gap-2 mb-3">
        <span className="text-ink text-[15px] font-semibold">Take this tile?</span>
        <TileRow tiles={[lastDiscardTile]} size="lg" sortTiles={false} animateEntrance={false} />
      </div>
      {tip && (
        <p className="text-[13px] leading-snug text-ink text-center mb-3 max-w-sm mx-auto" role="status">
          <span className="font-semibold text-accent">Coach: </span>{tip.text}
        </p>
      )}
      <div className="flex gap-2 justify-center flex-wrap">
        {claims.map((claim, i) => (
          <button
            key={`${claim.claimType}-${i}`}
            onClick={() => { haptics.select(); onClaim(claim); }}
            className={`min-h-[44px] px-5 rounded-xl font-semibold text-[15px] active:scale-95 btn-primary ${tip?.pick === i ? ring : ''}`}
          >
            {LABEL[claim.claimType] ?? claim.claimType}
          </button>
        ))}
        <button
          onClick={() => { haptics.tap(); onSkip(); }}
          className={`min-h-[44px] px-5 btn-ghost rounded-xl text-[15px] active:scale-95 ${tip && tip.pick === null ? ring : ''}`}
        >
          Skip
        </button>
      </div>
    </div>
  );
}
