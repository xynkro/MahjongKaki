import type { Hand, WinContext, ScoringResult } from '@mahjongkaki/engine';

export interface AiAgent {
  suggestWinningHands(tiles: Hand['melds']): Hand[];
  validateScoring(hand: Hand, ctx: WinContext, result: ScoringResult): string[];
}
