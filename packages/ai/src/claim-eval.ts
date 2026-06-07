import type { Meld } from '@mahjongkaki/engine';
import type { Claim } from '@mahjongkaki/game';
import type { AiProfile } from './archetypes.js';

export function shouldClaim(
  claim: Claim,
  hand: number[],
  melds: Meld[],
  profile: AiProfile,
): boolean {
  if (claim.claimType === 'win') return true;

  if (Math.random() > profile.claimRate) return false;

  if (claim.claimType === 'kong') return true;

  const exposedMelds = melds.filter(m => m.exposed).length;
  if (claim.claimType === 'pung' || claim.claimType === 'chow') {
    if (exposedMelds >= 3 && Math.random() < profile.concealedPreference) {
      return false;
    }
  }

  return true;
}
