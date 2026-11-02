import { describe, expect, it } from 'vitest';
import { pickClaim } from '../src/claims';

describe('pickClaim', () => {
  it('ranks win over kong and pung over chow', () => {
    const c = pickClaim([
      { player: 1, claimType: 'chow' as const },
      { player: 2, claimType: 'pung' as const },
    ], 0);
    expect(c!.claimType).toBe('pung');
    expect(pickClaim([
      { player: 2, claimType: 'kong' as const },
      { player: 3, claimType: 'win' as const },
    ], 0)!.claimType).toBe('win');
  });

  it('gives a double win to the next player in turn after the discarder, not the lowest seat', () => {
    const both = [{ player: 0, claimType: 'win' as const }, { player: 2, claimType: 'win' as const }];
    expect(pickClaim(both, 1)!.player).toBe(2);
    expect(pickClaim(both, 3)!.player).toBe(0);
  });

  it('is null with no claims', () => {
    expect(pickClaim([], 0)).toBeNull();
  });
});
