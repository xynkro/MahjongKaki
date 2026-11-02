// Plain-English wording for trainer drills, so visible copy never shows
// engine jargon (shanten, tenpai, acceptance) or raw tile codes.

const NUM_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six'];

/** Distance from a ready hand, from an engine shanten number (0 = ready). */
export function readyDistance(shanten: number): string {
  if (shanten <= 0) return 'ready, one tile from winning';
  const n = NUM_WORDS[shanten] ?? String(shanten);
  return `${n} ${shanten === 1 ? 'tile' : 'tiles'} from ready`;
}

/** "9 winning tiles" / "1 winning tile". */
export function winningTiles(n: number): string {
  return `${n} winning ${n === 1 ? 'tile' : 'tiles'}`;
}
